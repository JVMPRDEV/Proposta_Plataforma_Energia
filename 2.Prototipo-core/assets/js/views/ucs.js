// ============================================================
// View: Unidades Consumidoras — CRUD completo
// ============================================================

(function() {
  let busca = '';
  let statusFilter = 'todos';
  let pagina = 1;
  let pageSize = 15;

  window.view_ucs = function(root) {
    const ds = window.store.dataset;

    function filtradas() {
      return ds.ucs.filter(u => {
        if (statusFilter !== 'todos' && u.status !== statusFilter) return false;
        if (busca) {
          const q = busca.toLowerCase();
          if (!String(u.numInstalacao).includes(q) && !(u.cliente || '').toLowerCase().includes(q)) return false;
        }
        return true;
      });
    }

    root.innerHTML = `
      ${viewHeader('Unidades Consumidoras', ds.ucs.length + ' UCs vinculadas · ' + ds.tenant.nome, `
        <button class="btn btn-outline btn-sm">📥 Importar UCs</button>
        <button class="btn btn-primary btn-sm" id="btnNovaUC">+ Vincular UC</button>
      `)}

      <div class="kpi-grid">
        <div class="kpi info">
          <div class="label">Total de UCs</div>
          <div class="value">${ds.ucs.length}</div>
        </div>
        <div class="kpi success">
          <div class="label">Ativas</div>
          <div class="value">${ds.ucs.filter(u => u.status === 'ativo').length}</div>
        </div>
        <div class="kpi warning">
          <div class="label">Pendentes</div>
          <div class="value">${ds.ucs.filter(u => u.status === 'pendente').length}</div>
        </div>
        <div class="kpi">
          <div class="label">Consumo médio agregado</div>
          <div class="value">${fmt.kwh(ds.ucs.reduce((a, u) => a + u.consumo, 0))}</div>
        </div>
      </div>

      <div class="table-wrap">
        <div class="table-toolbar">
          <input type="search" id="busca" value="${esc(busca)}" placeholder="🔍 Buscar por nº ou cliente..." />
          <div class="filter-chips">
            ${['todos','ativo','pendente','inativo'].map(s => {
              const cnt = s === 'todos' ? ds.ucs.length : ds.ucs.filter(u => u.status === s).length;
              return `<button class="chip ${s === statusFilter ? 'active' : ''}" data-status="${s}">${s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}<span class="count">${cnt}</span></button>`;
            }).join('')}
          </div>
        </div>
        <table class="data">
          <thead>
            <tr>
              <th>Nº Instalação</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th class="text-center">Tarifa</th>
              <th class="text-right">Consumo médio</th>
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
        tbody.innerHTML = '<tr><td colspan="7" class="empty">Nenhuma UC encontrada</td></tr>';
        root.querySelector('#pgWrap').innerHTML = '';
        return;
      }
      root.querySelector('#pgWrap').innerHTML = paginacao(p, (np, ns) => {
        if (ns) pageSize = ns;
        pagina = np;
        renderTable();
      });
      tbody.innerHTML = p.items.map(u => `
        <tr>
          <td><strong>${u.numInstalacao}</strong></td>
          <td>${esc(u.cliente)}</td>
          <td>${u.tipo}</td>
          <td class="text-center"><span class="badge gray">${u.tarifa}</span></td>
          <td class="text-right num">${fmt.kwh(u.consumo)}</td>
          <td class="text-center">${statusBadge(u.status)}</td>
          <td class="text-center">${kebab([
            { icon: '✎', label: 'Editar UC', onClick: () => modalUC(u) },
            { divider: true },
            { icon: '🗑', label: 'Excluir', danger: true, onClick: () => {
              if (confirm('Excluir UC ' + u.numInstalacao + '?')) window.dataStore.removeUC(u.id);
            }}
          ])}</td>
        </tr>
      `).join('');
    }
    renderTable();

    root.querySelector('#busca').addEventListener('input', e => { busca = e.target.value; pagina = 1; renderTable(); });
    root.querySelectorAll('[data-status]').forEach(b => b.addEventListener('click', () => {
      statusFilter = b.dataset.status;
      pagina = 1;
      root.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.status === statusFilter));
      renderTable();
    }));
    root.querySelector('#btnNovaUC').addEventListener('click', () => modalUC());
  };
})();
