// ============================================================
// View: Faturamento ⭐ (wow factor)
// ============================================================

(function() {
  let busca = '';
  let statusFilter = 'todos';
  let pagina = 1;
  let pageSize = 15;

window.view_faturamento = function(root) {
  const ds = window.store.dataset;
  function filtradas() {
    return ds.faturas.filter(f => {
      if (statusFilter !== 'todos') {
        if (statusFilter === 'aberta' && !['aberta','enviada','gerada'].includes(f.status)) return false;
        if (statusFilter !== 'aberta' && f.status !== statusFilter) return false;
      }
      if (busca) {
        const q = busca.toLowerCase();
        if (!String(f.id || '').toLowerCase().includes(q) && !(f.cliente || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }
  const total = ds.faturas.length;
  const pagas = ds.faturas.filter(f => f.status === 'paga').length;
  const vencidas = ds.faturas.filter(f => f.status === 'vencida').length;
  const abertas = ds.faturas.filter(f => f.status === 'aberta' || f.status === 'enviada').length;
  const valorAberto = ds.faturas.filter(f => ['aberta','enviada','vencida'].includes(f.status)).reduce((a,f) => a + f.valor, 0);

  root.innerHTML = `
    ${viewHeader('Faturamento', total + ' faturas · ' + ds.tenant.nome, `
      <button class="btn btn-outline btn-sm" id="btnNovaFatura">+ Fatura individual</button>
      <button class="btn btn-primary btn-sm" id="btnGerarLote">⚡ Gerar faturas do mês</button>
    `)}

    <div class="kpi-grid">
      <div class="kpi success">
        <div class="label">Pagas</div>
        <div class="value">${pagas}</div>
      </div>
      <div class="kpi info">
        <div class="label">Em aberto</div>
        <div class="value">${abertas}</div>
      </div>
      <div class="kpi danger">
        <div class="label">Vencidas</div>
        <div class="value">${vencidas}</div>
      </div>
      <div class="kpi warning">
        <div class="label">Valor a receber</div>
        <div class="value">${fmt.moedaCompact(valorAberto)}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <h3>Ciclo de vida da fatura</h3>
        <span class="subtitle">Máquina de estado</span>
      </div>
      ${steps(['Gerada', 'Enviada', 'Aberta', 'Paga'], 2)}
      <p style="font-size: 0.8rem; color: var(--gray-600); margin-top: 0.75rem;">
        Cada transição é registrada com timestamp e usuário. Faturas vencidas geram juros automaticamente (2% + 0,033%/dia).
      </p>
    </div>

    <div class="table-wrap">
      <div class="table-toolbar">
        <input type="search" id="busca" value="${esc(busca)}" placeholder="🔍 Buscar por nº ou cliente..." />
        <div class="filter-chips">
          ${[
            { k: 'todos',   l: 'Todas',    n: ds.faturas.length },
            { k: 'aberta',  l: 'Em aberto', n: ds.faturas.filter(f => ['aberta','enviada','gerada'].includes(f.status)).length },
            { k: 'paga',    l: 'Pagas',    n: ds.faturas.filter(f => f.status === 'paga').length },
            { k: 'vencida', l: 'Vencidas', n: ds.faturas.filter(f => f.status === 'vencida').length }
          ].map(f => `<button class="chip ${f.k === statusFilter ? 'active' : ''}" data-status="${f.k}">${f.l}<span class="count">${f.n}</span></button>`).join('')}
        </div>
      </div>
      <table class="data">
        <thead>
          <tr>
            <th>Fatura</th>
            <th>Cliente</th>
            <th>Competência</th>
            <th>Vencimento</th>
            <th class="text-right">Consumo</th>
            <th class="text-right">Valor</th>
            <th class="text-center">Status</th>
            <th class="text-center">Ações</th>
          </tr>
        </thead>
        <tbody id="tbody"></tbody>
      </table>
      <div id="pgWrap"></div>
    </div>
  `;

  function renderTable() {
    const list = filtradas();
    const p = paginar(list, pageSize, pagina);
    pagina = p.page;
    const tbody = root.querySelector('#tbody');
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty">Nenhuma fatura encontrada</td></tr>';
      root.querySelector('#pgWrap').innerHTML = '';
      return;
    }
    root.querySelector('#pgWrap').innerHTML = paginacao(p, (np, ns) => {
      if (ns) pageSize = ns;
      pagina = np;
      renderTable();
    });
    tbody.innerHTML = p.items.map(f => {
      const items = [
        { icon: '👁', label: 'Ver preview', onClick: () => abrirPreviewFatura(f, ds.tenant) }
      ];
      if (f.status === 'gerada') {
        items.push({ icon: '📤', label: 'Enviar fatura', info: true, onClick: () => window.dataStore.enviarFatura(f.id) });
      }
      if (['gerada','enviada','aberta','vencida'].includes(f.status)) {
        items.push({ icon: '✓', label: 'Marcar como paga', success: true, onClick: () => {
          if (confirm('Marcar fatura ' + f.id + ' como paga?')) window.dataStore.marcarPaga(f.id);
        }});
      }
      items.push({ icon: '✎', label: 'Editar fatura', onClick: () => modalFatura(f) });
      items.push({ divider: true });
      items.push({ icon: '🗑', label: 'Cancelar fatura', danger: true, onClick: () => {
        if (confirm('Cancelar fatura ' + f.id + '?')) window.dataStore.cancelarFatura(f.id);
      }});
      return `
        <tr class="fatura-row">
          <td><strong>${esc(f.id)}</strong></td>
          <td>${esc(f.cliente)}</td>
          <td>${esc(f.competencia)}</td>
          <td>${esc(f.vencimento)}</td>
          <td class="text-right num">${fmt.kwh(f.consumo)}</td>
          <td class="text-right num"><strong>${fmt.moeda(f.valor)}</strong></td>
          <td class="text-center">${statusBadge(f.status)}</td>
          <td class="text-center">${kebab(items)}</td>
        </tr>
      `;
    }).join('');
  }
  renderTable();

  root.querySelector('#busca').addEventListener('input', e => { busca = e.target.value; pagina = 1; renderTable(); });
  root.querySelectorAll('[data-status]').forEach(b => b.addEventListener('click', () => {
    statusFilter = b.dataset.status;
    pagina = 1;
    root.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.status === statusFilter));
    renderTable();
  }));

  root.querySelector('#btnNovaFatura').addEventListener('click', () => modalFatura());

  // Botão gerar lote
  root.querySelector('#btnGerarLote').addEventListener('click', () => {
    openModal(`
      <div class="modal" style="max-width: 480px;">
        <div class="modal-header">
          <h3>Geração de Faturas em Lote</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body" style="text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">⚡</div>
          <p style="font-size: 0.9rem; color: var(--gray-700); margin-bottom: 1.25rem;">
            Será gerada uma fatura para cada contrato ativo deste tenant referente à competência <strong>Abr/2026</strong>.
          </p>
          <div style="background: var(--gray-50); padding: 1rem; border-radius: 6px; text-align: left;">
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>Contratos ativos:</span>
              <strong>${ds.contratos.filter(c => c.status === 'ativo').length}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>Valor total estimado:</span>
              <strong>${fmt.moeda(ds.contratos.filter(c => c.status === 'ativo').reduce((a,c) => a + c.valorMensal, 0))}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>Vencimento:</span>
              <strong>15/04/2026</strong>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" id="btnConfirmaLote">⚡ Gerar agora</button>
        </div>
      </div>
    `);
    document.getElementById('btnConfirmaLote').addEventListener('click', () => {
      const qtd = window.dataStore.gerarLote('Abr/26', '15/04/2026');
      closeModal();
      setTimeout(() => alert(qtd + ' fatura(s) gerada(s) em lote.'), 100);
    });
  });
};
})();

function abrirPreviewFatura(f, t) {
  const juros = f.status === 'vencida' ? Math.round(f.valor * 0.025) : 0;
  const total = f.valor + juros;
  // Buscar cliente para checar titularidade (D2 do questionário)
  const ds = window.store.dataset;
  const cliente = ds.clientes.find(c => c.id === f.clienteId) || {};
  const anexarCoelba = cliente.titularidade === 'comercializadora';
  const banco = window.configStore.bancoPrincipal(t.id) || {};
  openModal(`
    <div class="modal" style="max-width: 720px;">
      <div class="modal-header">
        <h3>Preview da Fatura</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body" style="background: var(--gray-100);">
        <div class="fatura-preview">
          <div class="header">
            <div class="brand">
              <div class="logo" style="background: ${t.cor}">${t.iniciais}</div>
              <div>
                <div style="font-size: 1.05rem; font-weight: 700; color: var(--gray-900);">${esc(t.nome)}</div>
                <div style="font-size: 0.7rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px;">CNPJ ${t.cnpj}</div>
              </div>
            </div>
            <div class="nf">
              <div class="label">Fatura</div>
              <div class="num">${esc(f.id)}</div>
            </div>
          </div>

          <div class="section">
            <h4>Cliente</h4>
            <div style="font-weight: 600; font-size: 1rem;">${esc(f.cliente)}</div>
            <div style="font-size: 0.75rem; color: var(--gray-600); margin-top: 4px;">
              Titularidade da conta de luz:
              <strong style="color: ${anexarCoelba ? 'var(--warning)' : 'var(--success)'};">
                ${anexarCoelba ? 'Comercializadora (legado)' : 'Próprio cliente'}
              </strong>
            </div>
          </div>

          <div class="section">
            <div class="grid">
              <div>
                <h4>Competência</h4>
                <div style="font-weight: 600;">${esc(f.competencia)}</div>
              </div>
              <div>
                <h4>Vencimento</h4>
                <div style="font-weight: 600;">${esc(f.vencimento)}</div>
              </div>
              <div>
                <h4>Consumo</h4>
                <div style="font-weight: 600;">${fmt.kwh(f.consumo)}</div>
              </div>
              <div>
                <h4>Status</h4>
                <div>${statusBadge(f.status)}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h4>Composição</h4>
            <table class="data" style="font-size: 0.85rem;">
              <tr><td>Energia consumida (${fmt.kwh(f.consumo)})</td><td class="text-right">${fmt.moeda(f.valor)}</td></tr>
              ${juros > 0 ? `<tr><td>Juros e multa (vencida)</td><td class="text-right" style="color: var(--danger)">+ ${fmt.moeda(juros)}</td></tr>` : ''}
            </table>
          </div>

          <div class="section">
            <h4>Banco emissor (multibank)</h4>
            <div style="font-size: 0.85rem; color: var(--gray-700);">
              <strong>${esc(banco.nome || '—')}</strong> · Ag. ${esc(banco.agencia || '')} · Conta ${esc(banco.conta || '')} · Carteira ${esc(banco.carteira || '')}
            </div>
          </div>

          ${anexarCoelba ? `
          <div class="section" style="background: var(--warning-bg); padding: 0.75rem 1rem; border-radius: 6px; border-left: 4px solid var(--warning);">
            <h4 style="color: #b8740a;">📎 Anexo obrigatório — Print da fatura COELBA</h4>
            <p style="font-size: 0.8rem; color: var(--gray-700); margin-top: 4px;">
              Como a conta de luz deste cliente está em nome da comercializadora, o sistema anexa automaticamente o print da fatura COELBA do mês com a leitura do consumo.
            </p>
            <div style="margin-top: 0.5rem; padding: 0.5rem; background: var(--white); border-radius: 4px; font-size: 0.78rem; color: var(--gray-600); display: flex; align-items: center; gap: 0.5rem;">
              📄 fatura-coelba-${esc(f.competencia.toLowerCase().replace('/', '-'))}-${esc(f.clienteId)}.pdf
            </div>
          </div>
          ` : ''}

          <div class="total">
            <div class="label">Total a pagar</div>
            <div class="value">${fmt.moeda(total)}</div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline">📧 Reenviar por e-mail</button>
        <button class="btn btn-success">💬 Enviar via WhatsApp</button>
        <button class="btn btn-primary" onclick="closeModal()">Fechar</button>
      </div>
    </div>
  `);
}
