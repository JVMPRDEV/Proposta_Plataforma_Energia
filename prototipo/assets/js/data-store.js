// ============================================================
// Data Store — camada mutável persistida por tenant
// Envolve mock-data.js: na primeira leitura gera o dataset
// procedural e persiste em localStorage. CRUD posterior é
// servido a partir do localStorage e dispara eventos.
// ============================================================

(function() {
  const KEY = 'proto_data_v1';

  function loadAll() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch { return {}; }
  }
  function saveAll(all) { localStorage.setItem(KEY, JSON.stringify(all)); }
  function uid(prefix) { return prefix + '-' + Math.random().toString(36).slice(2, 9); }

  // Recalcula KPIs e histórico a partir das listas
  function recomputeDerived(ds) {
    const ucsAtivas = ds.ucs.filter(u => u.status === 'ativo').length;
    const fatMar = ds.faturas.filter(f => f.competencia === 'Mar/26').reduce((a, f) => a + f.valor, 0);
    const venc = ds.faturas.filter(f => f.status === 'vencida').length;
    const pagasOrAbertas = ds.faturas.filter(f => ['vencida','paga','aberta','enviada'].includes(f.status)).length || 1;
    ds.kpis = {
      ucsAtivas,
      faturadoMes: fatMar,
      inadimplencia: Math.round(100 * venc / pagasOrAbertas),
      kwhGerado: ds.usinas.reduce((a, u) => a + u.producaoMes, 0)
    };
    ds.historico = ['Out','Nov','Dez','Jan','Fev','Mar'].map((m, i) => ({
      mes: m,
      valor: Math.round(Math.max(fatMar, 1000) * (0.78 + (i * 0.045)))
    }));
    return ds;
  }

  function get(tenantId) {
    const tid = tenantId || window.store.tenantId;
    const all = loadAll();
    if (!all[tid]) {
      // Primeira leitura: usa o gerador procedural do mock-data.js
      const ds = window.getDataset(tid);
      all[tid] = {
        clientes:  ds.clientes  || [],
        ucs:       ds.ucs       || [],
        contratos: ds.contratos || [],
        faturas:   ds.faturas   || [],
        usinas:    ds.usinas    || [],
        kpis:      ds.kpis      || {},
        historico: ds.historico || []
      };
      saveAll(all);
    }
    // Garante arrays mesmo após cargas antigas / reset parcial
    ['clientes','ucs','contratos','faturas','usinas','historico'].forEach(k => {
      if (!Array.isArray(all[tid][k])) all[tid][k] = [];
    });
    // Sempre devolve o tenant junto
    const t = window.getTenant(tid);
    return { ...all[tid], tenant: t };
  }

  function commit(tenantId, ds, opts) {
    const tid = tenantId || window.store.tenantId;
    const all = loadAll();
    recomputeDerived(ds);
    all[tid] = {
      clientes: ds.clientes,
      ucs: ds.ucs,
      contratos: ds.contratos,
      faturas: ds.faturas,
      usinas: ds.usinas,
      kpis: ds.kpis,
      historico: ds.historico
    };
    saveAll(all);
    window.dispatchEvent(new CustomEvent('data-changed', {
      detail: { tenantId: tid, entity: opts && opts.entity }
    }));
  }

  // ===== API pública =====
  window.dataStore = {
    get,
    reset(tenantId) {
      const tid = tenantId || window.store.tenantId;
      const all = loadAll();
      delete all[tid];
      saveAll(all);
      // Limpa cache do gerador procedural também
      if (window._dsCache) delete window._dsCache[tid];
      window.dispatchEvent(new CustomEvent('data-changed', { detail: { tenantId: tid } }));
    },

    // ----- Clientes -----
    addCliente(c) {
      const ds = get();
      const novo = {
        id: uid('CLI'),
        status: 'ativo',
        consumoMedio: 300,
        desconto: 20,
        adesao: new Date().toLocaleDateString('pt-BR'),
        contato: '(71) 90000-0000',
        titularidade: 'cliente',
        endereco: '',
        cnpj: '',
        ...c
      };
      ds.clientes.unshift(novo);
      commit(null, ds, { entity: 'cliente' });
      return novo;
    },
    updateCliente(id, patch) {
      const ds = get();
      const i = ds.clientes.findIndex(x => x.id === id);
      if (i >= 0) { ds.clientes[i] = { ...ds.clientes[i], ...patch }; commit(null, ds, { entity: 'cliente' }); }
    },
    removeCliente(id) {
      const ds = get();
      ds.clientes = ds.clientes.filter(c => c.id !== id);
      // Cascata: remove UCs, contratos e faturas vinculados
      ds.ucs = ds.ucs.filter(u => u.clienteId !== id);
      ds.contratos = ds.contratos.filter(c => c.clienteId !== id);
      ds.faturas = ds.faturas.filter(f => f.clienteId !== id);
      commit(null, ds, { entity: 'cliente' });
    },
    getCliente(id) {
      const ds = get();
      return ds.clientes.find(c => c.id === id);
    },

    // ----- UCs -----
    addUC(u) {
      const ds = get();
      const cliente = ds.clientes.find(c => c.id === u.clienteId);
      const novo = {
        id: uid('UC'),
        numInstalacao: Math.floor(10000000 + Math.random() * 89999999),
        status: 'ativo',
        tipo: 'Comercial',
        tarifa: 'B3',
        consumo: 300,
        cliente: cliente ? cliente.nome : '—',
        ...u
      };
      ds.ucs.unshift(novo);
      commit(null, ds, { entity: 'uc' });
      return novo;
    },
    updateUC(id, patch) {
      const ds = get();
      const i = ds.ucs.findIndex(x => x.id === id);
      if (i >= 0) { ds.ucs[i] = { ...ds.ucs[i], ...patch }; commit(null, ds, { entity: 'uc' }); }
    },
    removeUC(id) {
      const ds = get();
      ds.ucs = ds.ucs.filter(u => u.id !== id);
      commit(null, ds, { entity: 'uc' });
    },

    // ----- Contratos -----
    addContrato(c) {
      const ds = get();
      const cliente = ds.clientes.find(x => x.id === c.clienteId);
      const novo = {
        id: uid('CTR'),
        cliente: cliente ? cliente.nome : '—',
        fidelidade: 'Sem fidelidade',
        desconto: 20,
        vigenciaInicio: new Date().toLocaleDateString('pt-BR'),
        vigenciaFim: '31/12/2027',
        status: 'ativo',
        valorMensal: 250,
        ...c
      };
      ds.contratos.unshift(novo);
      commit(null, ds, { entity: 'contrato' });
      return novo;
    },
    updateContrato(id, patch) {
      const ds = get();
      const i = ds.contratos.findIndex(x => x.id === id);
      if (i >= 0) { ds.contratos[i] = { ...ds.contratos[i], ...patch }; commit(null, ds, { entity: 'contrato' }); }
    },
    encerrarContrato(id) {
      this.updateContrato(id, { status: 'encerrado', vigenciaFim: new Date().toLocaleDateString('pt-BR') });
    },
    renovarContrato(id) {
      const ds = get();
      const c = ds.contratos.find(x => x.id === id);
      if (c) {
        const ano = new Date().getFullYear() + 2;
        this.updateContrato(id, { status: 'ativo', vigenciaFim: '31/12/' + ano });
      }
    },
    removeContrato(id) {
      const ds = get();
      ds.contratos = ds.contratos.filter(c => c.id !== id);
      commit(null, ds, { entity: 'contrato' });
    },

    // ----- Usinas -----
    addUsina(u) {
      const ds = get();
      const novo = {
        id: uid('US'),
        status: 'operando',
        producaoMes: 8000,
        ultimaLeitura: new Date().toLocaleDateString('pt-BR'),
        cidade: 'Salvador / BA',
        ...u
      };
      ds.usinas.unshift(novo);
      commit(null, ds, { entity: 'usina' });
      return novo;
    },
    updateUsina(id, patch) {
      const ds = get();
      const i = ds.usinas.findIndex(x => x.id === id);
      if (i >= 0) { ds.usinas[i] = { ...ds.usinas[i], ...patch }; commit(null, ds, { entity: 'usina' }); }
    },
    removeUsina(id) {
      const ds = get();
      ds.usinas = ds.usinas.filter(u => u.id !== id);
      commit(null, ds, { entity: 'usina' });
    },
    registrarLeitura(usinaId, kwh, dataLeitura) {
      this.updateUsina(usinaId, {
        producaoMes: kwh,
        ultimaLeitura: dataLeitura || new Date().toLocaleDateString('pt-BR')
      });
    },

    // ----- Faturas -----
    addFatura(f) {
      const ds = get();
      const cliente = ds.clientes.find(c => c.id === f.clienteId);
      const novo = {
        id: 'FAT-2026-' + String(ds.faturas.length + 1).padStart(5, '0'),
        cliente: cliente ? cliente.nome : '—',
        competencia: 'Abr/26',
        vencimento: '15/05/2026',
        status: 'gerada',
        consumo: 300,
        valor: 250,
        ...f
      };
      ds.faturas.unshift(novo);
      commit(null, ds, { entity: 'fatura' });
      return novo;
    },
    updateFatura(id, patch) {
      const ds = get();
      const i = ds.faturas.findIndex(x => x.id === id);
      if (i >= 0) { ds.faturas[i] = { ...ds.faturas[i], ...patch }; commit(null, ds, { entity: 'fatura' }); }
    },
    marcarPaga(id) { this.updateFatura(id, { status: 'paga' }); },
    enviarFatura(id) { this.updateFatura(id, { status: 'enviada' }); },
    cancelarFatura(id) {
      const ds = get();
      ds.faturas = ds.faturas.filter(f => f.id !== id);
      commit(null, ds, { entity: 'fatura' });
    },
    gerarLote(competencia, vencimento, contratoIds) {
      const ds = get();
      let novas = 0;
      const filtro = contratoIds && contratoIds.length
        ? ds.contratos.filter(c => c.status === 'ativo' && contratoIds.indexOf(c.id) >= 0)
        : ds.contratos.filter(c => c.status === 'ativo');
      filtro.forEach(c => {
        const cli = ds.clientes.find(x => x.id === c.clienteId);
        if (!cli) return;
        if (ds.faturas.some(f => f.clienteId === cli.id && f.competencia === competencia)) return;
        ds.faturas.unshift({
          id: 'FAT-2026-' + String(ds.faturas.length + novas + 1).padStart(5, '0'),
          cliente: cli.nome,
          clienteId: cli.id,
          competencia,
          vencimento,
          status: 'gerada',
          consumo: cli.consumoMedio,
          valor: c.valorMensal
        });
        novas++;
      });
      commit(null, ds, { entity: 'fatura' });
      return novas;
    }
  };
})();
