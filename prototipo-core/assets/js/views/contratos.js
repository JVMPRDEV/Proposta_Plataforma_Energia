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
        { icon: '👁', label: 'Ver detalhes', onClick: () => { location.hash = '/contratos/' + c.id; } },
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
          <td><a href="#/contratos/${esc(c.id)}" style="color: var(--primary-dark); text-decoration: none; font-weight: 600;">${esc(c.id)}</a></td>
          <td><a href="#/clientes/${esc(c.clienteId)}" style="color: var(--gray-800); text-decoration: none;">${esc(c.cliente)}</a></td>
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

// ============================================================
// Detalhe do contrato — tela dedicada
// ============================================================
window.view_contrato_detalhe = function(root, id) {
  const ds = window.store.dataset;
  const c = ds.contratos.find(x => x.id === id);
  if (!c) {
    root.innerHTML = '<div class="empty"><div class="icon">🔍</div><h2>Contrato não encontrado</h2><p><a href="#/contratos" class="btn btn-outline btn-sm">← Voltar para Contratos</a></p></div>';
    return;
  }

  const cliente = ds.clientes.find(x => x.id === c.clienteId) || { nome: c.cliente, id: c.clienteId };
  const ucs = ds.ucs.filter(u => u.clienteId === c.clienteId);
  const faturas = ds.faturas
    .filter(f => f.clienteId === c.clienteId)
    .sort((a, b) => (b.id || '').localeCompare(a.id || ''));
  const totalFaturado = faturas.reduce((a, f) => a + f.valor, 0);
  const totalPago = faturas.filter(f => f.status === 'paga').reduce((a, f) => a + f.valor, 0);
  const totalAberto = faturas.filter(f => ['aberta','enviada','vencida'].includes(f.status)).reduce((a, f) => a + f.valor, 0);

  // Cálculos de vigência
  function parseBR(s) {
    if (!s) return null;
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
  }
  const dIni = parseBR(c.vigenciaInicio);
  const dFim = parseBR(c.vigenciaFim);
  const hoje = new Date();
  let diasRestantes = null, diasTotal = null, pctVigencia = 0;
  if (dIni && dFim) {
    diasTotal = Math.max(1, Math.round((dFim - dIni) / 86400000));
    diasRestantes = Math.max(0, Math.round((dFim - hoje) / 86400000));
    const decorridos = Math.max(0, Math.min(diasTotal, Math.round((hoje - dIni) / 86400000)));
    pctVigencia = Math.round((decorridos / diasTotal) * 100);
  }
  const valorTotalRestante = (diasRestantes != null) ? Math.round((diasRestantes / 30) * (c.valorMensal || 0)) : null;

  const stepIdx = c.status === 'pendente' ? 1
                : c.status === 'ativo'    ? 2
                : c.status === 'encerrado' ? 4
                : 0;

  // Timeline mock
  const timeline = [
    { ts: c.vigenciaInicio, ev: 'Contrato criado', icon: '📝', cor: 'var(--gray-500)' },
    { ts: c.vigenciaInicio, ev: 'Documentação validada', icon: '✓', cor: 'var(--info)' },
    { ts: c.vigenciaInicio, ev: 'Contrato ativado', icon: '⚡', cor: 'var(--success)' }
  ];
  if (c.status === 'encerrado') timeline.push({ ts: c.vigenciaFim, ev: 'Contrato encerrado', icon: '⏸', cor: 'var(--gray-600)' });

  root.innerHTML = `
    <div class="view-header">
      <div>
        <a href="#/contratos" style="font-size: 0.8rem; color: var(--gray-600); text-decoration: none;">← Voltar para Contratos</a>
        <h1 style="margin-top: 4px;">Contrato ${esc(c.id)}</h1>
        <p>
          <a href="#/clientes/${esc(c.clienteId)}" style="color: var(--primary-dark); font-weight: 600; text-decoration: none;">${esc(cliente.nome)}</a>
          · ${esc(c.fidelidade)} · ${statusBadge(c.status)}
        </p>
      </div>
      <div class="view-actions">
        <button class="btn btn-outline btn-sm" id="ctEditar">✎ Editar</button>
        ${c.status === 'ativo'
          ? '<button class="btn btn-outline btn-sm" id="ctEncerrar" style="color: var(--warning); border-color: var(--warning);">⏸ Encerrar</button>'
          : '<button class="btn btn-outline btn-sm" id="ctRenovar" style="color: var(--success); border-color: var(--success);">↻ Renovar / Reativar</button>'}
        <button class="btn btn-outline btn-sm" id="ctExcluir" style="color: var(--danger); border-color: var(--danger);">🗑 Excluir</button>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi info">
        <div class="label">Valor mensal</div>
        <div class="value">${fmt.moeda(c.valorMensal)}</div>
        <div class="delta">Desconto ${c.desconto}%</div>
      </div>
      <div class="kpi success">
        <div class="label">Total faturado</div>
        <div class="value">${fmt.moedaCompact(totalFaturado)}</div>
        <div class="delta up">${faturas.length} fatura${faturas.length === 1 ? '' : 's'}</div>
      </div>
      <div class="kpi ${totalAberto > 0 ? 'warning' : ''}">
        <div class="label">Em aberto</div>
        <div class="value">${fmt.moedaCompact(totalAberto)}</div>
        <div class="delta">${faturas.filter(f => ['aberta','enviada','vencida'].includes(f.status)).length} pendente${faturas.filter(f => ['aberta','enviada','vencida'].includes(f.status)).length === 1 ? '' : 's'}</div>
      </div>
      <div class="kpi ${diasRestantes != null && diasRestantes < 60 ? 'danger' : ''}">
        <div class="label">${c.status === 'encerrado' ? 'Vigência (encerrado)' : 'Dias restantes'}</div>
        <div class="value">${diasRestantes != null ? diasRestantes + ' d' : '—'}</div>
        <div class="delta">${valorTotalRestante != null ? '~' + fmt.moedaCompact(valorTotalRestante) + ' restantes' : ''}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <h3>Ciclo de vida</h3>
        <span class="subtitle">Máquina de estado deste contrato</span>
      </div>
      ${steps(['Rascunho','Em análise','Ativo','Renovação','Encerrado'], stepIdx)}
      ${diasTotal ? `
        <div style="margin-top:1rem;">
          <div style="display:flex; justify-content:space-between; font-size:.74rem; color:var(--gray-600); margin-bottom:4px;">
            <span>${esc(c.vigenciaInicio)}</span>
            <span><strong>${pctVigencia}%</strong> da vigência decorrida</span>
            <span>${esc(c.vigenciaFim)}</span>
          </div>
          <div style="height:10px; background:var(--gray-100); border-radius:999px; overflow:hidden;">
            <div style="width:${pctVigencia}%; height:100%; background:linear-gradient(90deg, var(--success), var(--primary)); border-radius:inherit;"></div>
          </div>
        </div>
      ` : ''}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3>Dados do contrato</h3></div>
        <div class="config-row"><span class="key">ID</span><span class="val" style="font-family:monospace;">${esc(c.id)}</span></div>
        <div class="config-row"><span class="key">Cliente</span><span class="val"><a href="#/clientes/${esc(c.clienteId)}" style="color:var(--primary-dark); text-decoration:none; font-weight:600;">${esc(cliente.nome)}</a></span></div>
        <div class="config-row"><span class="key">CNPJ do cliente</span><span class="val">${esc(cliente.cnpj || '—')}</span></div>
        <div class="config-row"><span class="key">Fidelidade</span><span class="val">${esc(c.fidelidade)}</span></div>
        <div class="config-row"><span class="key">Desconto</span><span class="val"><strong style="color:var(--primary-dark);">${c.desconto}%</strong></span></div>
        <div class="config-row"><span class="key">Vigência</span><span class="val">${esc(c.vigenciaInicio)} → ${esc(c.vigenciaFim)}</span></div>
        <div class="config-row"><span class="key">Duração total</span><span class="val">${diasTotal ? diasTotal + ' dias' : '—'}</span></div>
        <div class="config-row"><span class="key">Valor mensal</span><span class="val"><strong>${fmt.moeda(c.valorMensal)}</strong></span></div>
        <div class="config-row"><span class="key">Status</span><span class="val">${statusBadge(c.status)}</span></div>
      </div>

      <div class="card">
        <div class="card-header"><h3>Histórico do contrato</h3><span class="subtitle">Eventos da máquina de estado</span></div>
        <div style="position:relative; padding-left:1.5rem;">
          <div style="position:absolute; left:.6rem; top:.3rem; bottom:.3rem; width:2px; background:var(--gray-200);"></div>
          ${timeline.map(t => `
            <div style="position:relative; padding:.5rem 0;">
              <div style="position:absolute; left:-1.05rem; top:.7rem; width:14px; height:14px; border-radius:50%; background:${t.cor}; border:2px solid var(--white); box-shadow:0 0 0 2px ${t.cor};"></div>
              <div style="font-size:.84rem; font-weight:600; color:var(--gray-800);">${t.icon} ${esc(t.ev)}</div>
              <div style="font-size:.7rem; color:var(--gray-500);">${esc(t.ts || '—')}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 1.5rem;">
      <div class="card-header">
        <h3>UCs do cliente vinculadas ao consumo (${ucs.length})</h3>
      </div>
      ${ucs.length === 0 ? '<div class="empty">Nenhuma UC vinculada ao cliente</div>' : `
        <table class="data">
          <thead><tr><th>Nº Instalação</th><th>Tipo</th><th class="text-right">Consumo médio</th><th class="text-center">Status</th></tr></thead>
          <tbody>
            ${ucs.map(u => `
              <tr>
                <td><strong>${esc(u.numInstalacao)}</strong></td>
                <td>${esc(u.tipo)}</td>
                <td class="text-right num">${fmt.kwh(u.consumo)}</td>
                <td class="text-center">${statusBadge(u.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </div>

    <div class="card" style="margin-top: 1.5rem;">
      <div class="card-header">
        <h3>Faturas relacionadas (${faturas.length})</h3>
        <span class="subtitle">${fmt.moeda(totalPago)} pago · ${fmt.moeda(totalAberto)} em aberto</span>
      </div>
      ${faturas.length === 0 ? '<div class="empty">Nenhuma fatura emitida para este cliente</div>' : `
        <table class="data">
          <thead><tr><th>Fatura</th><th>Competência</th><th>Vencimento</th><th class="text-right">Consumo</th><th class="text-right">Valor</th><th class="text-center">Status</th></tr></thead>
          <tbody>
            ${faturas.slice(0, 12).map(f => `
              <tr>
                <td><strong>${esc(f.id)}</strong></td>
                <td>${esc(f.competencia)}</td>
                <td>${esc(f.vencimento)}</td>
                <td class="text-right num">${fmt.kwh(f.consumo)}</td>
                <td class="text-right num"><strong>${fmt.moeda(f.valor)}</strong></td>
                <td class="text-center">${statusBadge(f.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${faturas.length > 12 ? `<div style="text-align:center; padding:.5rem; font-size:.75rem; color:var(--gray-500);">Mostrando 12 de ${faturas.length} · <a href="#/faturamento" style="color:var(--primary-dark);">ver todas →</a></div>` : ''}
      `}
    </div>
  `;

  root.querySelector('#ctEditar').addEventListener('click', () => modalContrato(c));
  const enc = root.querySelector('#ctEncerrar');
  if (enc) enc.addEventListener('click', () => {
    if (confirm('Encerrar este contrato?')) window.dataStore.encerrarContrato(c.id);
  });
  const ren = root.querySelector('#ctRenovar');
  if (ren) ren.addEventListener('click', () => window.dataStore.renovarContrato(c.id));
  root.querySelector('#ctExcluir').addEventListener('click', () => {
    if (confirm('Excluir este contrato?')) {
      window.dataStore.removeContrato(c.id);
      location.hash = '/contratos';
    }
  });
};
})();
