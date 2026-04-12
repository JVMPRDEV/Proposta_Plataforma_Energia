// ============================================================
// Config Store — estado editável por tenant
// Mantém bancos, usuários, regras financeiras, integrações e tema
// com persistência em localStorage.
// ============================================================

(function() {
  const KEY = 'proto_config_v2';

  // ============================================================
  // Registry de endpoints (granular, fixo — espelha a API real)
  // ============================================================
  const MODULOS_API = [
    { mod: 'Dashboard',     ops: [['read', 'GET', 'Visualizar dashboard']] },
    { mod: 'Clientes',      ops: [
      ['read',   'GET',    'Listar clientes'],
      ['detail', 'GET',    'Ver detalhes do cliente'],
      ['create', 'POST',   'Cadastrar cliente'],
      ['update', 'PUT',    'Editar cliente'],
      ['delete', 'DELETE', 'Excluir cliente']
    ]},
    { mod: 'UCs',           ops: [
      ['read',   'GET',    'Listar unidades consumidoras'],
      ['create', 'POST',   'Vincular UC'],
      ['update', 'PUT',    'Editar UC'],
      ['delete', 'DELETE', 'Desvincular UC']
    ]},
    { mod: 'Contratos',     ops: [
      ['read',     'GET',    'Listar contratos'],
      ['create',   'POST',   'Criar contrato'],
      ['update',   'PUT',    'Editar contrato'],
      ['encerrar', 'PATCH',  'Encerrar contrato'],
      ['renovar',  'PATCH',  'Renovar contrato'],
      ['delete',   'DELETE', 'Excluir contrato']
    ]},
    { mod: 'Geração',       ops: [
      ['read',    'GET',    'Listar usinas'],
      ['create',  'POST',   'Cadastrar usina'],
      ['update',  'PUT',    'Editar usina'],
      ['delete',  'DELETE', 'Excluir usina'],
      ['leitura', 'POST',   'Registrar leitura manual']
    ]},
    { mod: 'Créditos',      ops: [
      ['read',    'GET',    'Visualizar engine de créditos'],
      ['simular', 'POST',   'Executar simulação'],
      ['salvar',  'PUT',    'Salvar configuração de rateio']
    ]},
    { mod: 'Faturamento',   ops: [
      ['read',         'GET',    'Listar faturas'],
      ['create',       'POST',   'Gerar fatura individual'],
      ['gerar_lote',   'POST',   'Gerar faturas em lote'],
      ['preview',      'GET',    'Visualizar preview da fatura'],
      ['enviar',       'POST',   'Enviar fatura ao cliente'],
      ['marcar_paga',  'PATCH',  'Marcar fatura como paga'],
      ['cancelar',     'DELETE', 'Cancelar fatura']
    ]},
    { mod: 'Cobrança',      ops: [
      ['read',         'GET',    'Listar cobranças'],
      ['baixa_manual', 'POST',   'Baixa manual de boleto'],
      ['reemitir',     'POST',   'Reemitir boleto'],
      ['webhook_log',  'GET',    'Ver logs de webhook']
    ]},
    { mod: 'WhatsApp',      ops: [
      ['read',           'GET',  'Ver mensagens'],
      ['enviar',         'POST', 'Enviar mensagem manual'],
      ['templates_read', 'GET',  'Listar templates'],
      ['templates_crud', 'POST', 'Gerenciar templates']
    ]},
    { mod: 'Relatórios',    ops: [
      ['read',     'GET',  'Visualizar relatórios'],
      ['exportar', 'POST', 'Exportar CSV/PDF']
    ]},
    { mod: 'Configurações', ops: [
      ['ver',              'GET', 'Ver configurações'],
      ['bancos_crud',      'PUT', 'Gerenciar bancos emissores'],
      ['usuarios_crud',    'PUT', 'Gerenciar usuários'],
      ['regras_edit',      'PUT', 'Editar regras financeiras'],
      ['integracoes_crud', 'PUT', 'Gerenciar integrações'],
      ['tema_edit',        'PUT', 'Customizar identidade visual']
    ]},
    { mod: 'Permissões',    ops: [
      ['ver',          'GET',    'Ver perfis e permissões'],
      ['perfis_create','POST',   'Criar perfil de acesso'],
      ['perfis_update','PUT',    'Editar perfil de acesso'],
      ['perfis_delete','DELETE', 'Excluir perfil de acesso']
    ]}
  ];

  function buildEndpoints() {
    const list = [];
    MODULOS_API.forEach(m => {
      m.ops.forEach(([op, metodo, descricao]) => {
        const slug = m.mod.toLowerCase().replace(/[^a-z]/g, '');
        list.push({
          id: slug + '.' + op,
          modulo: m.mod,
          operacao: op,
          metodo,
          descricao,
          path: '/api/' + slug + (op === 'read' ? '' : '/' + op)
        });
      });
    });
    return list;
  }
  window.ENDPOINTS = buildEndpoints();
  window.ENDPOINTS_BY_MODULO = (function() {
    const m = {};
    window.ENDPOINTS.forEach(e => { (m[e.modulo] = m[e.modulo] || []).push(e); });
    return m;
  })();

  function loadAll() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch { return {}; }
  }
  function saveAll(all) { localStorage.setItem(KEY, JSON.stringify(all)); }

  // Seeds a partir do tenant estático quando ainda não há estado salvo
  function seedPerfis() {
    const all = window.ENDPOINTS.map(e => e.id);
    const onlyRead = all.filter(id => id.endsWith('.read') || id.endsWith('.detail') || id.endsWith('.ver'));
    const financeiro = all.filter(id =>
      id.startsWith('clientes.') && (id.endsWith('.read') || id.endsWith('.detail')) ||
      id.startsWith('faturamento.') ||
      id.startsWith('cobranca.') ||
      id.startsWith('relatorios.') ||
      id === 'dashboard.read'
    );
    const operador = all.filter(id =>
      id.startsWith('clientes.') ||
      id.startsWith('ucs.') ||
      id.startsWith('contratos.') ||
      id.startsWith('geracao.') ||
      id.startsWith('creditos.') ||
      id === 'dashboard.read'
    );
    return [
      { id: 'p-admin',  nome: 'Administrador',   descricao: 'Acesso total a todos os módulos do tenant', permissoes: all,        sistema: true },
      { id: 'p-fin',    nome: 'Financeiro',      descricao: 'Faturamento, cobrança e relatórios',         permissoes: financeiro },
      { id: 'p-ope',    nome: 'Operador',        descricao: 'Operação diária — clientes, UCs, contratos, geração', permissoes: operador },
      { id: 'p-read',   nome: 'Somente leitura', descricao: 'Visualização de todos os módulos sem ações de escrita', permissoes: onlyRead }
    ];
  }

  function seed(tenantId) {
    const t = window.getTenant(tenantId);
    const usuariosSeed = t.usuarioUnico
      ? [{ id: 'u-1', nome: 'Pedro Esquivel', email: 'pedro@esqenergia.com.br', perfilId: 'p-admin', status: 'ativo', telefone: '(71) 99999-0001', cargo: 'Sócio-fundador', ultimoAcesso: '10/04/2026 14:32' }]
      : [
          { id: 'u-1', nome: 'Demo Admin',    email: 'admin@' + t.id + '.com.br',      perfilId: 'p-admin', status: 'ativo',  telefone: '(71) 99999-0001', cargo: 'Administrador',  ultimoAcesso: '10/04/2026 14:32' },
          { id: 'u-2', nome: 'Carlos Santos', email: 'financeiro@' + t.id + '.com.br', perfilId: 'p-fin',   status: 'ativo',  telefone: '(71) 99999-0002', cargo: 'Analista Financeiro', ultimoAcesso: '09/04/2026 18:11' },
          { id: 'u-3', nome: 'Maria Silva',   email: 'operacao@' + t.id + '.com.br',   perfilId: 'p-ope',   status: 'ativo',  telefone: '(71) 99999-0003', cargo: 'Operadora', ultimoAcesso: '10/04/2026 09:48' },
          { id: 'u-4', nome: 'Pedro Lima',    email: 'leitura@' + t.id + '.com.br',    perfilId: 'p-read',  status: 'inativo', telefone: '(71) 99999-0004', cargo: 'Auditor', ultimoAcesso: '02/03/2026 10:15' }
        ];
    return {
      bancos: JSON.parse(JSON.stringify(t.bancos || [])),
      usuarios: usuariosSeed,
      perfis: seedPerfis(),
      regras: {
        multaAtraso: 2.0,
        jurosDia: 0.033,
        tarifaBase: 0.78,
        descontoPadrao: 20,
        diasLembreteAntes: 3,
        diasCobrancaAposAtraso: 5,    // C6 do questionário
        diasEscalonamento: 15
      },
      integracoes: [
        { id: 'int-1', nome: 'Gateway Asaas',        descricao: 'Conciliação de boletos e Pix',        status: 'ativo',                                categoria: 'financeiro' },
        { id: 'int-2', nome: 'WhatsApp Business API', descricao: 'Canal principal de comunicação',     status: 'ativo',                                categoria: 'comunicacao' },

        { id: 'int-4', nome: 'SMTP',                  descricao: 'Envio transacional de e-mails',     status: 'ativo',                                categoria: 'comunicacao' }
      ],
      tema: JSON.parse(JSON.stringify(t.tema || {})),
      loginLayout: {
        eyebrow:      'Acesso à plataforma',
        formTitle:    'Entrar em ' + t.nome,
        formSub:      'Acesso restrito aos usuários da operação ' + t.cidade + '.',
        heroTitle:    'Bem-vindo à ' + t.nome,
        heroSub:      t.descricao || 'Plataforma de gestão de energia solar.',
        brandTagline: t.cidade + ' · ' + t.ucs + ' UCs',
        buttonLabel:  'Entrar na plataforma',
        footerLeft:   '© 2026 · ' + t.nome,
        footerRight:  'Plataforma de Gestão de Energia Solar'
      }
    };
  }

  function getConfig(tenantId) {
    const all = loadAll();
    if (!all[tenantId]) {
      all[tenantId] = seed(tenantId);
      saveAll(all);
    } else if (!all[tenantId].loginLayout) {
      // Migração: adiciona loginLayout em configs antigas
      all[tenantId].loginLayout = seed(tenantId).loginLayout;
      saveAll(all);
    }
    return all[tenantId];
  }

  function setConfig(tenantId, cfg) {
    const all = loadAll();
    all[tenantId] = cfg;
    saveAll(all);
    window.dispatchEvent(new CustomEvent('config-changed', { detail: { tenantId } }));
  }

  function uid(prefix) {
    return prefix + '-' + Math.random().toString(36).slice(2, 8);
  }

  // ===== API pública =====
  window.configStore = {
    get(tenantId) { return getConfig(tenantId || window.store.tenantId); },
    reset(tenantId) {
      const all = loadAll();
      delete all[tenantId || window.store.tenantId];
      saveAll(all);
      window.dispatchEvent(new CustomEvent('config-changed', { detail: { tenantId } }));
    },

    // ----- Bancos -----
    addBanco(banco) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      const novo = { id: uid('bk'), principal: false, ...banco };
      if (cfg.bancos.length === 0) novo.principal = true;
      cfg.bancos.push(novo);
      setConfig(tid, cfg);
    },
    updateBanco(id, patch) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      const i = cfg.bancos.findIndex(b => b.id === id);
      if (i >= 0) { cfg.bancos[i] = { ...cfg.bancos[i], ...patch }; setConfig(tid, cfg); }
    },
    removeBanco(id) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      const era = cfg.bancos.find(b => b.id === id);
      cfg.bancos = cfg.bancos.filter(b => b.id !== id);
      if (era && era.principal && cfg.bancos.length > 0) cfg.bancos[0].principal = true;
      setConfig(tid, cfg);
    },
    setPrincipal(id) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      cfg.bancos.forEach(b => b.principal = (b.id === id));
      setConfig(tid, cfg);
    },
    bancoPrincipal(tenantId) {
      const cfg = getConfig(tenantId || window.store.tenantId);
      return cfg.bancos.find(b => b.principal) || cfg.bancos[0] || null;
    },

    // ----- Usuários -----
    addUsuario(u) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      cfg.usuarios.push({ id: uid('u'), status: 'ativo', ...u });
      setConfig(tid, cfg);
    },
    updateUsuario(id, patch) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      const i = cfg.usuarios.findIndex(u => u.id === id);
      if (i >= 0) { cfg.usuarios[i] = { ...cfg.usuarios[i], ...patch }; setConfig(tid, cfg); }
    },
    removeUsuario(id) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      cfg.usuarios = cfg.usuarios.filter(u => u.id !== id);
      setConfig(tid, cfg);
    },

    // ----- Perfis (RBAC) -----
    addPerfil(p) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      cfg.perfis.push({ id: uid('p'), permissoes: [], ...p });
      setConfig(tid, cfg);
    },
    updatePerfil(id, patch) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      const i = cfg.perfis.findIndex(x => x.id === id);
      if (i >= 0) { cfg.perfis[i] = { ...cfg.perfis[i], ...patch }; setConfig(tid, cfg); }
    },
    togglePermissao(perfilId, endpointId) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      const p = cfg.perfis.find(x => x.id === perfilId);
      if (!p) return;
      const i = p.permissoes.indexOf(endpointId);
      if (i >= 0) p.permissoes.splice(i, 1);
      else p.permissoes.push(endpointId);
      setConfig(tid, cfg);
    },
    setPermissoesModulo(perfilId, modulo, granted) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      const p = cfg.perfis.find(x => x.id === perfilId);
      if (!p) return;
      const ids = window.ENDPOINTS_BY_MODULO[modulo].map(e => e.id);
      if (granted) {
        ids.forEach(id => { if (!p.permissoes.includes(id)) p.permissoes.push(id); });
      } else {
        p.permissoes = p.permissoes.filter(id => !ids.includes(id));
      }
      setConfig(tid, cfg);
    },
    removePerfil(id) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      const p = cfg.perfis.find(x => x.id === id);
      if (p && p.sistema) { alert('Perfis de sistema não podem ser excluídos.'); return; }
      const usados = cfg.usuarios.filter(u => u.perfilId === id).length;
      if (usados > 0) { alert('Este perfil está atribuído a ' + usados + ' usuário(s). Reatribua-os antes de excluir.'); return; }
      cfg.perfis = cfg.perfis.filter(x => x.id !== id);
      setConfig(tid, cfg);
    },
    getPerfil(id, tenantId) {
      const cfg = getConfig(tenantId || window.store.tenantId);
      return cfg.perfis.find(p => p.id === id);
    },
    getPermissoesUsuario(usuarioId, tenantId) {
      const cfg = getConfig(tenantId || window.store.tenantId);
      const u = cfg.usuarios.find(x => x.id === usuarioId);
      if (!u) return [];
      const p = cfg.perfis.find(x => x.id === u.perfilId);
      return p ? p.permissoes : [];
    },

    // ----- Regras Financeiras -----
    updateRegras(patch) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      cfg.regras = { ...cfg.regras, ...patch };
      setConfig(tid, cfg);
    },

    // ----- Integrações -----
    addIntegracao(i) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      cfg.integracoes.push({ id: uid('int'), status: 'ativo', categoria: 'outros', ...i });
      setConfig(tid, cfg);
    },
    updateIntegracao(id, patch) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      const i = cfg.integracoes.findIndex(x => x.id === id);
      if (i >= 0) { cfg.integracoes[i] = { ...cfg.integracoes[i], ...patch }; setConfig(tid, cfg); }
    },
    toggleIntegracao(id) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      const int = cfg.integracoes.find(x => x.id === id);
      if (int) { int.status = int.status === 'ativo' ? 'inativo' : 'ativo'; setConfig(tid, cfg); }
    },
    removeIntegracao(id) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      cfg.integracoes = cfg.integracoes.filter(x => x.id !== id);
      setConfig(tid, cfg);
    },

    // ----- Layout do Login -----
    updateLoginLayout(patch) {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      cfg.loginLayout = { ...(cfg.loginLayout || {}), ...patch };
      setConfig(tid, cfg);
    },
    resetLoginLayout() {
      const tid = window.store.tenantId;
      const cfg = getConfig(tid);
      const fresh = seed(tid).loginLayout;
      cfg.loginLayout = fresh;
      setConfig(tid, cfg);
    },

    // ----- Tema -----
    // Atualização "leve": salva e aplica CSS vars direto, sem re-renderizar
    // a view (para não perder foco do color picker durante o drag).
    updateTema(patch) {
      const tid = window.store.tenantId;
      const all = loadAll();
      if (!all[tid]) all[tid] = seed(tid);
      all[tid].tema = { ...all[tid].tema, ...patch };
      saveAll(all);
      window.applyTenantTheme(all[tid].tema);
      window.dispatchEvent(new CustomEvent('theme-changed', { detail: { tenantId: tid } }));
    },
    // Reset: dispara config-changed para re-renderizar os color inputs
    resetTema() {
      const tid = window.store.tenantId;
      const t = window.getTenant(tid);
      const cfg = getConfig(tid);
      cfg.tema = JSON.parse(JSON.stringify(t.tema || {}));
      setConfig(tid, cfg);
      window.applyTenantTheme(cfg.tema);
    }
  };

  // ===== Aplicação de tema via CSS custom properties =====
  window.applyTenantTheme = function(tema) {
    const r = document.documentElement.style;
    if (!tema) return;
    if (tema.primary)      r.setProperty('--primary',       tema.primary);
    if (tema.primaryDark)  r.setProperty('--primary-dark',  tema.primaryDark);
    if (tema.primaryLight) r.setProperty('--primary-light', tema.primaryLight);
    if (tema.secondary)    r.setProperty('--secondary',     tema.secondary);
    if (tema.dark)         r.setProperty('--dark',          tema.dark);
  };
})();
