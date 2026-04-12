// ============================================================
// View: Clientes — CRUD completo
// ============================================================

(function() {
  let filtro = '';
  let statusFilter = 'todos';
  let pagina = 1;
  let pageSize = 15;

  window.view_clientes = function(root) {
    const ds = window.store.dataset;

    function filtrados() {
      return ds.clientes.filter(c => {
        if (statusFilter !== 'todos' && c.status !== statusFilter) return false;
        if (filtro && !c.nome.toLowerCase().includes(filtro.toLowerCase())) return false;
        return true;
      });
    }

    root.innerHTML = `
      ${viewHeader('Clientes', ds.clientes.length + ' cadastrados · ' + ds.tenant.nome, `
        <button class="btn btn-outline btn-sm">📥 Importar CSV</button>
        <button class="btn btn-primary btn-sm" id="btnNovoCliente">+ Novo Cliente</button>
      `)}

      <div class="table-wrap">
        <div class="table-toolbar">
          <input type="search" id="busca" value="${esc(filtro)}" placeholder="🔍 Buscar por nome..." />
          <div class="filter-chips">
            ${['todos','ativo','pendente','inativo'].map(s => {
              const cnt = s === 'todos' ? ds.clientes.length : ds.clientes.filter(c => c.status === s).length;
              return `<button class="chip ${s === statusFilter ? 'active' : ''}" data-status="${s}">${s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}<span class="count">${cnt}</span></button>`;
            }).join('')}
          </div>
        </div>
        <table class="data">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>CNPJ</th>
              <th class="text-right">Consumo médio</th>
              <th class="text-center">Desconto</th>
              <th class="text-center">Titularidade</th>
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
      const list = filtrados();
      const p = paginar(list, pageSize, pagina);
      pagina = p.page;
      const tbody = root.querySelector('#tbody');
      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty">Nenhum cliente encontrado</td></tr>';
        root.querySelector('#pgWrap').innerHTML = '';
        return;
      }
      root.querySelector('#pgWrap').innerHTML = paginacao(p, (np, ns) => {
        if (ns) pageSize = ns;
        pagina = np;
        renderTable();
      });
      tbody.innerHTML = p.items.map(c => `
        <tr>
          <td><strong>${esc(c.id)}</strong></td>
          <td><a href="#/clientes/${esc(c.id)}" style="color: var(--primary-dark); text-decoration: none; font-weight: 600;">${esc(c.nome)}</a></td>
          <td>${esc(c.cnpj)}</td>
          <td class="text-right num">${fmt.kwh(c.consumoMedio)}</td>
          <td class="text-center"><strong style="color: var(--primary-dark)">${c.desconto}%</strong></td>
          <td class="text-center">
            ${c.titularidade === 'cliente'
              ? '<span class="badge success">Cliente</span>'
              : '<span class="badge warning">Comercializadora</span>'}
          </td>
          <td class="text-center">${statusBadge(c.status)}</td>
          <td class="text-center">${kebab([
            { icon: '👁', label: 'Ver detalhes', onClick: () => { location.hash = '/clientes/' + c.id; } },
            { icon: '✎', label: 'Editar cliente', onClick: () => modalCliente(c) },
            { divider: true },
            { icon: '🗑', label: 'Excluir', danger: true, onClick: () => {
              if (confirm('Excluir cliente "' + c.nome + '"?\nUCs, contratos e faturas vinculados também serão removidos.')) {
                window.dataStore.removeCliente(c.id);
              }
            }}
          ])}</td>
        </tr>
      `).join('');
    }

    renderTable();

    root.querySelector('#busca').addEventListener('input', e => { filtro = e.target.value; pagina = 1; renderTable(); });
    root.querySelectorAll('[data-status]').forEach(b => b.addEventListener('click', () => {
      statusFilter = b.dataset.status;
      pagina = 1;
      root.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.status === statusFilter));
      renderTable();
    }));
    root.querySelector('#btnNovoCliente').addEventListener('click', () => modalCliente());
  };

  // ============================================================
  // Detalhe do cliente
  // ============================================================
  window.view_cliente_detalhe = function(root, id) {
    const ds = window.store.dataset;
    const c = ds.clientes.find(x => x.id === id);
    if (!c) {
      root.innerHTML = '<div class="empty"><div class="icon">🔍</div><h2>Cliente não encontrado</h2><p><a href="#/clientes" class="btn btn-outline btn-sm">← Voltar para Clientes</a></p></div>';
      return;
    }
    const ucs = ds.ucs.filter(u => u.clienteId === id);
    const contratos = ds.contratos.filter(x => x.clienteId === id);
    const faturas = ds.faturas.filter(f => f.clienteId === id);
    const totalFaturado = faturas.reduce((a, f) => a + f.valor, 0);
    const totalAberto = faturas.filter(f => ['aberta','enviada','vencida'].includes(f.status)).reduce((a, f) => a + f.valor, 0);

    root.innerHTML = `
      <div class="view-header">
        <div>
          <a href="#/clientes" style="font-size: 0.8rem; color: var(--gray-600); text-decoration: none;">← Voltar para Clientes</a>
          <h1 style="margin-top: 4px;">${esc(c.nome)}</h1>
          <p>${esc(c.id)} · ${esc(c.cnpj)} · ${statusBadge(c.status)}</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-outline btn-sm" id="btnEdit">✎ Editar</button>
          <button class="btn btn-outline btn-sm" id="btnDel" style="color: var(--danger); border-color: var(--danger);">🗑 Excluir</button>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi info">
          <div class="label">UCs vinculadas</div>
          <div class="value">${ucs.length}</div>
        </div>
        <div class="kpi success">
          <div class="label">Total faturado</div>
          <div class="value">${fmt.moedaCompact(totalFaturado)}</div>
        </div>
        <div class="kpi warning">
          <div class="label">Em aberto</div>
          <div class="value">${fmt.moedaCompact(totalAberto)}</div>
        </div>
        <div class="kpi">
          <div class="label">Desconto</div>
          <div class="value">${c.desconto}%</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h3>Dados cadastrais</h3></div>
          <div class="config-row"><span class="key">Razão Social</span><span class="val">${esc(c.nome)}</span></div>
          <div class="config-row"><span class="key">CNPJ</span><span class="val">${esc(c.cnpj)}</span></div>
          <div class="config-row"><span class="key">Endereço</span><span class="val">${esc(c.endereco || '—')}</span></div>
          <div class="config-row"><span class="key">Contato</span><span class="val">${esc(c.contato)}</span></div>
          <div class="config-row"><span class="key">Adesão</span><span class="val">${esc(c.adesao)}</span></div>
          <div class="config-row"><span class="key">Consumo médio</span><span class="val">${fmt.kwh(c.consumoMedio)}</span></div>
          <div class="config-row"><span class="key">Titularidade conta de luz</span><span class="val">${c.titularidade === 'cliente' ? 'Próprio cliente' : 'Comercializadora (anexa conta de luz)'}</span></div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>UCs vinculadas (${ucs.length})</h3>
            <button class="btn btn-primary btn-sm" id="btnNovaUC">+ Vincular UC</button>
          </div>
          ${ucs.length === 0 ? '<div class="empty">Nenhuma UC vinculada</div>' : `
            <table class="data">
              <thead><tr><th>Nº Instalação</th><th>Tipo</th><th class="text-right">Consumo</th><th class="text-center">Status</th></tr></thead>
              <tbody>
                ${ucs.map(u => `
                  <tr>
                    <td><strong>${u.numInstalacao}</strong></td>
                    <td>${u.tipo}</td>
                    <td class="text-right num">${fmt.kwh(u.consumo)}</td>
                    <td class="text-center">${statusBadge(u.status)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>

      <div class="card" style="margin-top: 1.5rem;">
        <div class="card-header">
          <h3>Contratos (${contratos.length})</h3>
          <button class="btn btn-primary btn-sm" id="btnNovoContrato">+ Novo contrato</button>
        </div>
        ${contratos.length === 0 ? '<div class="empty">Nenhum contrato</div>' : `
          <table class="data">
            <thead><tr><th>ID</th><th>Fidelidade</th><th>Vigência</th><th class="text-right">Valor mensal</th><th class="text-center">Status</th></tr></thead>
            <tbody>
              ${contratos.map(ct => `
                <tr>
                  <td><strong>${esc(ct.id)}</strong></td>
                  <td>${esc(ct.fidelidade)}</td>
                  <td>${esc(ct.vigenciaInicio)} → ${esc(ct.vigenciaFim)}</td>
                  <td class="text-right num">${fmt.moeda(ct.valorMensal)}</td>
                  <td class="text-center">${statusBadge(ct.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>

      <div class="card" style="margin-top: 1.5rem;">
        <div class="card-header">
          <h3>Histórico de faturas (${faturas.length})</h3>
          <button class="btn btn-primary btn-sm" id="btnNovaFatura">+ Nova fatura</button>
        </div>
        ${faturas.length === 0 ? '<div class="empty">Nenhuma fatura emitida</div>' : `
          <table class="data">
            <thead><tr><th>Fatura</th><th>Competência</th><th>Vencimento</th><th class="text-right">Valor</th><th class="text-center">Status</th></tr></thead>
            <tbody>
              ${faturas.slice(0, 12).map(f => `
                <tr>
                  <td><strong>${esc(f.id)}</strong></td>
                  <td>${esc(f.competencia)}</td>
                  <td>${esc(f.vencimento)}</td>
                  <td class="text-right num"><strong>${fmt.moeda(f.valor)}</strong></td>
                  <td class="text-center">${statusBadge(f.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;

    root.querySelector('#btnEdit').addEventListener('click', () => modalCliente(c));
    root.querySelector('#btnDel').addEventListener('click', () => {
      if (confirm('Excluir cliente "' + c.nome + '"? UCs, contratos e faturas vinculados também serão removidos.')) {
        window.dataStore.removeCliente(c.id);
        location.hash = '/clientes';
      }
    });
    root.querySelector('#btnNovaUC').addEventListener('click', () => modalUC({ clienteId: c.id }));
    root.querySelector('#btnNovoContrato').addEventListener('click', () => modalContrato({ clienteId: c.id }));
    root.querySelector('#btnNovaFatura').addEventListener('click', () => modalFatura({ clienteId: c.id }));
  };
})();
