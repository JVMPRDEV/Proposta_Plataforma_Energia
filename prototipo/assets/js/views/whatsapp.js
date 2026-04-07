// ============================================================
// View: Comunicação WhatsApp — Envio unidirecional de documentos
// Escopo: faturas, boletos, documentos e mensagens curtas via
// WhatsApp Cloud API (Meta) usando templates HSM aprovados.
// SEM bot conversacional. Bot via n8n é melhoria futura (escopo
// separado, fora do Core).
// ============================================================

(function() {
  // Templates por tenant em memória + localStorage
  const KEY = 'proto_wa_templates_v1';
  const KEY_HIST = 'proto_wa_envios_v1';

  function loadTpl() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } }
  function saveTpl(t) { localStorage.setItem(KEY, JSON.stringify(t)); }
  function loadHist() { try { return JSON.parse(localStorage.getItem(KEY_HIST) || '{}'); } catch { return {}; } }
  function saveHist(h) { localStorage.setItem(KEY_HIST, JSON.stringify(h)); }

  function seedTpl() {
    return [
      { id: 't1', nome: 'Envio de Fatura',               tipo: 'fatura',    status: 'aprovado', uso: 36 },
      { id: 't2', nome: 'Envio de Boleto',               tipo: 'boleto',    status: 'aprovado', uso: 31 },
      { id: 't3', nome: 'Lembrete D-3 (antes do venc.)', tipo: 'mensagem',  status: 'aprovado', uso: 24 },
      { id: 't4', nome: 'Lembrete D-0 (no vencimento)',  tipo: 'mensagem',  status: 'aprovado', uso: 18 },
      { id: 't5', nome: 'Cobrança D+5 (após atraso)',    tipo: 'mensagem',  status: 'aprovado', uso: 9 },
      { id: 't6', nome: 'Recibo de pagamento',           tipo: 'documento', status: 'aprovado', uso: 22 },
      { id: 't7', nome: 'Boas-vindas',                   tipo: 'mensagem',  status: 'aprovado', uso: 4 }
    ];
  }
  function seedHist(ds) {
    const cs = ds.clientes.slice(0, 6);
    const fat = ds.faturas[0] || {};
    const tipos = ['fatura', 'boleto', 'mensagem', 'documento'];
    const status = ['lido', 'lido', 'entregue', 'lido', 'falhou', 'entregue'];
    return cs.map((c, i) => ({
      id: 'env-' + i,
      tipo: tipos[i % tipos.length],
      cliente: c.nome,
      contato: c.contato,
      template: ['Envio de Fatura','Envio de Boleto','Lembrete D-3','Recibo de pagamento'][i % 4],
      anexo: i % 4 < 2 ? (fat.id || 'FAT-2026-000' + (i+1)) + '.pdf' : null,
      status: status[i % status.length],
      enviadoEm: `${10 + i}:${(15 + i*7) % 60 < 10 ? '0' : ''}${(15 + i*7) % 60}`
    }));
  }

  function getTpl() {
    const all = loadTpl();
    const tid = window.store.tenantId;
    if (!all[tid]) { all[tid] = seedTpl(); saveTpl(all); }
    return all[tid];
  }
  function setTpl(list) {
    const all = loadTpl();
    all[window.store.tenantId] = list;
    saveTpl(all);
    window.dispatchEvent(new CustomEvent('data-changed'));
  }
  function getHist(ds) {
    const all = loadHist();
    const tid = window.store.tenantId;
    if (!all[tid]) { all[tid] = seedHist(ds); saveHist(all); }
    return all[tid];
  }
  function setHist(list) {
    const all = loadHist();
    all[window.store.tenantId] = list;
    saveHist(all);
    window.dispatchEvent(new CustomEvent('data-changed'));
  }

  const uid = () => 't-' + Math.random().toString(36).slice(2, 8);

  const TIPO_LABEL = {
    fatura:    { icon: '🧾', label: 'Fatura' },
    boleto:    { icon: '💳', label: 'Boleto' },
    documento: { icon: '📄', label: 'Documento' },
    mensagem:  { icon: '✉️', label: 'Mensagem' }
  };
  const STATUS_BADGE = {
    enviado:  { cls: 'info',    label: 'Enviado'  },
    entregue: { cls: 'info',    label: 'Entregue ✓✓' },
    lido:     { cls: 'success', label: 'Lido ✓✓'  },
    falhou:   { cls: 'danger',  label: 'Falhou'   }
  };

  window.view_whatsapp = function(root) {
    const ds = window.store.dataset;
    const templates = getTpl();
    const historico = getHist(ds);

    const totalMes = historico.length;
    const lidos = historico.filter(h => h.status === 'lido').length;
    const taxaLeitura = totalMes ? Math.round((lidos / totalMes) * 100) : 0;
    const faturasEnv = historico.filter(h => h.tipo === 'fatura' || h.tipo === 'boleto').length;

    root.innerHTML = `
      ${viewHeader('Comunicação WhatsApp', 'Envio de faturas, boletos e documentos · ' + ds.tenant.nome, `
        <button class="btn btn-outline btn-sm" id="btnNovoEnvio">📤 Novo envio</button>
        <button class="btn btn-primary btn-sm" id="btnNovoTpl">+ Novo template</button>
      `)}

      <div class="alert alert-info" style="margin-bottom: 1rem;">
        <strong>Canal unidirecional.</strong> Envio de faturas, boletos, documentos e mensagens curtas via
        <strong>WhatsApp Cloud API (Meta)</strong> usando templates HSM aprovados. Sem bot conversacional —
        atendimento automatizado é melhoria futura (escopo separado via n8n).
      </div>

      <div class="kpi-grid">
        <div class="kpi success">
          <div class="label">Envios entregues (mês)</div>
          <div class="value">${totalMes}</div>
        </div>
        <div class="kpi info">
          <div class="label">Faturas / boletos enviados</div>
          <div class="value">${faturasEnv}</div>
        </div>
        <div class="kpi warning">
          <div class="label">Taxa de leitura</div>
          <div class="value">${taxaLeitura}%</div>
        </div>
        <div class="kpi">
          <div class="label">Custo médio / envio</div>
          <div class="value">R$ 0,08</div>
        </div>
      </div>

      <div class="grid-2-1">
        <div class="card">
          <div class="card-header">
            <div>
              <h3>📤 Histórico de envios</h3>
              <span class="subtitle">Últimos documentos enviados via Cloud API</span>
            </div>
          </div>
          <div class="envios-filtros" id="envFiltros">
            <button class="chip active" data-f="all">Todos <span>${historico.length}</span></button>
            <button class="chip" data-f="fatura">🧾 Faturas <span>${historico.filter(h=>h.tipo==='fatura').length}</span></button>
            <button class="chip" data-f="boleto">💳 Boletos <span>${historico.filter(h=>h.tipo==='boleto').length}</span></button>
            <button class="chip" data-f="documento">📄 Documentos <span>${historico.filter(h=>h.tipo==='documento').length}</span></button>
            <button class="chip" data-f="mensagem">✉️ Mensagens <span>${historico.filter(h=>h.tipo==='mensagem').length}</span></button>
          </div>
          <div class="envios-list" id="histList"></div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>📋 Templates HSM (${templates.length})</h3>
            <span class="subtitle">Aprovados pela Meta</span>
          </div>
          <div id="tplList" style="display: flex; flex-direction: column; gap: 0.5rem;"></div>
        </div>
      </div>
    `;

    let filtroAtivo = 'all';
    function renderHist() {
      const list = root.querySelector('#histList');
      const itens = filtroAtivo === 'all' ? historico : historico.filter(h => h.tipo === filtroAtivo);
      if (!itens.length) {
        list.innerHTML = `<div class="envios-empty">Nenhum envio ${filtroAtivo === 'all' ? '' : 'desse tipo '}ainda</div>`;
        return;
      }
      list.innerHTML = itens.map(h => {
        const t = TIPO_LABEL[h.tipo] || TIPO_LABEL.mensagem;
        const s = STATUS_BADGE[h.status] || STATUS_BADGE.enviado;
        return `
          <div class="envio-item tipo-${h.tipo}">
            <div class="envio-icon">${t.icon}</div>
            <div class="envio-body">
              <div class="envio-top">
                <span class="envio-cliente">${esc(h.cliente)}</span>
                <span class="badge ${s.cls}">${s.label}</span>
              </div>
              <div class="envio-meta">
                <span class="envio-tipo">${t.label}</span>
                <span class="dot">·</span>
                <span>${esc(h.template)}</span>
                <span class="dot">·</span>
                <span>🕐 ${esc(h.enviadoEm)}</span>
              </div>
              ${h.anexo ? `<div class="envio-anexo">📎 ${esc(h.anexo)}</div>` : ''}
              <div class="envio-contato">${esc(h.contato || '')}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    function renderTpl() {
      const wrap = root.querySelector('#tplList');
      wrap.innerHTML = templates.map(t => {
        const tipo = TIPO_LABEL[t.tipo] || TIPO_LABEL.mensagem;
        return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.75rem; background: var(--gray-50); border-radius: 6px;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 0.85rem; color: var(--gray-900);">${tipo.icon} ${esc(t.nome)}</div>
            <div style="font-size: 0.7rem; color: var(--gray-500);">${t.uso} envios este mês · ${esc(t.status)}</div>
          </div>
          ${kebab([
            { icon: '✎', label: 'Editar template', onClick: () => modalTpl(t) },
            { divider: true },
            { icon: '🗑', label: 'Excluir', danger: true, onClick: () => {
              if (confirm('Excluir template "' + t.nome + '"?')) {
                setTpl(templates.filter(x => x.id !== t.id));
              }
            }}
          ])}
        </div>
      `;}).join('');
    }
    renderHist();
    renderTpl();

    root.querySelector('#btnNovoTpl').addEventListener('click', () => modalTpl());
    root.querySelector('#btnNovoEnvio').addEventListener('click', () => modalEnviar(ds, historico));
    root.querySelectorAll('#envFiltros .chip').forEach(c => {
      c.addEventListener('click', () => {
        root.querySelectorAll('#envFiltros .chip').forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        filtroAtivo = c.dataset.f;
        renderHist();
      });
    });
  };

  function modalTpl(t) {
    const ed = !!t;
    const templates = getTpl();
    openModal(`
      <div class="modal" style="max-width: 520px;">
        <div class="modal-header">
          <h3>${ed ? 'Editar' : 'Novo'} Template HSM</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Nome do template</label>
            <input type="text" id="t_nome" value="${esc(t ? t.nome : '')}" placeholder="Ex: Lembrete personalizado" />
          </div>
          <div class="form-row">
            <label>Tipo de envio</label>
            <select id="t_tipo">
              <option value="fatura"    ${t && t.tipo === 'fatura'    ? 'selected' : ''}>🧾 Fatura (com anexo PDF)</option>
              <option value="boleto"    ${t && t.tipo === 'boleto'    ? 'selected' : ''}>💳 Boleto (com PDF + linha digitável)</option>
              <option value="documento" ${t && t.tipo === 'documento' ? 'selected' : ''}>📄 Documento (PDF genérico)</option>
              <option value="mensagem"  ${!t || t.tipo === 'mensagem' ? 'selected' : ''}>✉️ Mensagem curta (texto)</option>
            </select>
          </div>
          <div class="form-row">
            <label>Status (Meta WhatsApp Business)</label>
            <select id="t_status">
              <option value="aprovado" ${!t || t.status === 'aprovado' ? 'selected' : ''}>Aprovado</option>
              <option value="pendente" ${t && t.status === 'pendente' ? 'selected' : ''}>Pendente análise</option>
              <option value="rejeitado" ${t && t.status === 'rejeitado' ? 'selected' : ''}>Rejeitado</option>
            </select>
          </div>
          <div class="form-row">
            <label>Conteúdo do template</label>
            <textarea id="t_msg" rows="5" style="padding: 0.6rem; border: 1px solid var(--gray-300); border-radius: 4px; font-family: inherit;">Olá {{cliente}}, sua fatura de {{competencia}} no valor de {{valor}} vence em {{vencimento}}.</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" id="t_save">${ed ? 'Salvar' : 'Criar template'}</button>
        </div>
      </div>
    `);
    document.getElementById('t_save').addEventListener('click', () => {
      const data = {
        nome: document.getElementById('t_nome').value.trim(),
        tipo: document.getElementById('t_tipo').value,
        status: document.getElementById('t_status').value,
        uso: t ? t.uso : 0
      };
      if (!data.nome) { alert('Informe o nome.'); return; }
      if (ed) {
        const i = templates.findIndex(x => x.id === t.id);
        templates[i] = { ...t, ...data };
      } else {
        templates.push({ id: uid(), ...data });
      }
      setTpl(templates);
      closeModal();
    });
  }

  function modalEnviar(ds, historico) {
    const tpls = getTpl();
    openModal(`
      <div class="modal" style="max-width: 560px;">
        <div class="modal-header">
          <h3>Novo Envio WhatsApp</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Tipo de envio</label>
            <select id="m_tipo">
              <option value="fatura">🧾 Fatura</option>
              <option value="boleto">💳 Boleto</option>
              <option value="documento">📄 Documento</option>
              <option value="mensagem">✉️ Mensagem curta</option>
            </select>
          </div>
          <div class="form-row">
            <label>Destinatário</label>
            <select id="m_dest">
              ${ds.clientes.slice(0, 30).map(c => `<option value="${c.id}">${esc(c.nome)} · ${esc(c.contato)}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <label>Template HSM</label>
            <select id="m_tpl">
              ${tpls.map(t => `<option value="${esc(t.nome)}">${esc(t.nome)} (${esc(t.status)})</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <label>Anexo (PDF)</label>
            <input type="text" id="m_anexo" placeholder="ex: FAT-2026-0123.pdf" />
            <small style="color: var(--gray-500);">Opcional para mensagens curtas. Obrigatório para fatura/boleto.</small>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-success" id="m_send">📤 Enviar via Cloud API</button>
        </div>
      </div>
    `);
    document.getElementById('m_send').addEventListener('click', () => {
      const tipo = document.getElementById('m_tipo').value;
      const destId = document.getElementById('m_dest').value;
      const cli = ds.clientes.find(c => c.id == destId) || ds.clientes[0];
      const tplNome = document.getElementById('m_tpl').value;
      const anexo = document.getElementById('m_anexo').value.trim();
      const now = new Date();
      historico.unshift({
        id: 'env-' + Date.now(),
        tipo,
        cliente: cli.nome,
        contato: cli.contato,
        template: tplNome,
        anexo: anexo || null,
        status: 'entregue',
        enviadoEm: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      });
      setHist(historico);
      closeModal();
      window.dispatchEvent(new CustomEvent('proto-envio-whatsapp', {
        detail: { tipo: TIPO_LABEL[tipo].label, cliente: cli.nome }
      }));
    });
  }
})();
