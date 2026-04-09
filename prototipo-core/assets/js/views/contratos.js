// ============================================================
// View: Contratos — CRUD + encerrar / renovar
// ============================================================

(function() {
  let busca = '';
  let statusFilter = 'todos';
  let pagina = 1;
  let pageSize = 15;

window.view_contratos = function(root) {
  const ds = window.store.dataset;
  const totalAtivos = ds.contratos.filter(c => c.status === 'ativo').length;
  const totalPendentes = ds.contratos.filter(c => c.status === 'pendente').length;
  const totalEncerrados = ds.contratos.filter(c => c.status === 'encerrado').length;
  const receitaContratada = ds.contratos.filter(c => c.status === 'ativo').reduce((a, c) => a + c.valorMensal, 0);

  root.innerHTML = `
    ${viewHeader('Contratos', ds.contratos.length + ' contratos · ' + ds.tenant.nome, `
      <button class="btn btn-primary btn-sm" id="btnNovo">+ Novo Contrato</button>
    `)}

    <div class="kpi-grid">
      <div class="kpi success">
        <div class="label">Ativos</div>
        <div class="value">${totalAtivos}</div>
      </div>
      <div class="kpi warning">
        <div class="label">Pendentes</div>
        <div class="value">${totalPendentes}</div>
      </div>
      <div class="kpi">
        <div class="label">Encerrados</div>
        <div class="value">${totalEncerrados}</div>
      </div>
      <div class="kpi info">
        <div class="label">Receita contratada / mês</div>
        <div class="value">${fmt.moedaCompact(receitaContratada)}</div>
      </div>
    </div>

    <div class="table-wrap">
      <div class="table-toolbar">
        <input type="search" id="busca" value="${esc(busca)}" placeholder="🔍 Buscar contrato por cliente..." />
        <div class="filter-chips">
          ${['todos','ativo','pendente','encerrado'].map(s => {
            const cnt = s === 'todos' ? ds.contratos.length : ds.contratos.filter(c => c.status === s).length;
            return `<button class="chip ${s === statusFilter ? 'active' : ''}" data-status="${s}">${s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}<span class="count">${cnt}</span></button>`;
          }).join('')}
        </div>
      </div>
      <table class="data">
        <thead>
          <tr>
            <th>Contrato</th>
            <th>Cliente</th>
            <th>Fidelidade</th>
            <th class="text-center">Desconto</th>
            <th>Vigência</th>
            <th class="text-right">Valor mensal</th>
            <th class="text-center">Status</th>
            <th class="text-center">Ações</th>
          </tr>
        </thead>
        <tbody id="tbody"></tbody>
      </table>
      <div id="pgWrap"></div>
    </div>
  `;

  function filtrados() {
    return ds.contratos.filter(c => {
      if (statusFilter !== 'todos' && c.status !== statusFilter) return false;
      if (busca && !(c.cliente || '').toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }

  function renderTable() {
    const tbody = root.querySelector('#tbody');
    const list = filtrados();
    const p = paginar(list, pageSize, pagina);
    pagina = p.page;
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty">Nenhum contrato encontrado</td></tr>';
      root.querySelector('#pgWrap').innerHTML = '';
      return;
    }
    root.querySelector('#pgWrap').innerHTML = paginacao(p, (np, ns) => {
      if (ns) pageSize = ns;
      pagina = np;
      renderTable();
    });
    tbody.innerHTML = p.items.map(c => {
      const items = [
        { icon: '👁', label: 'Ver detalhes', onClick: () => modalDetalhesContrato(c) },
        { icon: '✎', label: 'Editar contrato', onClick: () => modalContrato(c) }
      ];
      if (c.status === 'ativo') {
        items.push({ icon: '⏸', label: 'Encerrar contrato', warning: true, onClick: () => {
          if (confirm('Encerrar este contrato?')) window.dataStore.encerrarContrato(c.id);
        }});
      } else {
        items.push({ icon: '↻', label: 'Renovar / Reativar', success: true, onClick: () => {
          window.dataStore.renovarContrato(c.id);
        }});
      }
      items.push({ divider: true });
      items.push({ icon: '🗑', label: 'Excluir', danger: true, onClick: () => {
        if (confirm('Excluir este contrato?')) window.dataStore.removeContrato(c.id);
      }});
      return `
        <tr>
          <td><strong>${esc(c.id)}</strong></td>
          <td>${esc(c.cliente)}</td>
          <td>${esc(c.fidelidade)}</td>
          <td class="text-center"><strong style="color: var(--primary-dark)">${c.desconto}%</strong></td>
          <td><span style="font-size: 0.8rem; color: var(--gray-600)">${esc(c.vigenciaInicio)} → ${esc(c.vigenciaFim)}</span></td>
          <td class="text-right num"><strong>${fmt.moeda(c.valorMensal)}</strong></td>
          <td class="text-center">${statusBadge(c.status)}</td>
          <td class="text-center">${kebab(items)}</td>
        </tr>
      `;
    }).join('');
  }

  renderTable();
  root.querySelector('#btnNovo').addEventListener('click', () => modalContrato());
  root.querySelector('#busca').addEventListener('input', e => { busca = e.target.value; pagina = 1; renderTable(); });
  root.querySelectorAll('[data-status]').forEach(b => b.addEventListener('click', () => {
    statusFilter = b.dataset.status;
    pagina = 1;
    root.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.status === statusFilter));
    renderTable();
  }));
};

function modalDetalhesContrato(c) {
  const stepIdx = c.status === 'pendente' ? 1
                : c.status === 'ativo'    ? 2
                : c.status === 'encerrado' ? 4
                : 0;
  openModal(`
    <div class="modal" style="max-width: 640px;">
      <div class="modal-header">
        <h3>Detalhes do Contrato · ${esc(c.id)}</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
          <div>
            <div style="font-size:1.05rem; font-weight:700; color:var(--gray-900);">${esc(c.cliente)}</div>
            <div style="font-size:.78rem; color:var(--gray-600); margin-top:2px;">Contrato ${esc(c.id)}</div>
          </div>
          ${statusBadge(c.status)}
        </div>

        <div class="card" style="margin-bottom:1rem;">
          <div class="card-header">
            <h3 style="font-size:.9rem;">Ciclo de vida deste contrato</h3>
          </div>
          ${steps(['Rascunho','Em análise','Ativo','Renovação','Encerrado'], stepIdx)}
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:.75rem; font-size:.85rem;">
          <div><strong>Fidelidade:</strong> ${esc(c.fidelidade)}</div>
          <div><strong>Desconto:</strong> ${c.desconto}%</div>
          <div><strong>Vigência:</strong> ${esc(c.vigenciaInicio)} → ${esc(c.vigenciaFim)}</div>
          <div><strong>Valor mensal:</strong> ${fmt.moeda(c.valorMensal)}</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="closeModal()">Fechar</button>
      </div>
    </div>
  `);
}
})();
