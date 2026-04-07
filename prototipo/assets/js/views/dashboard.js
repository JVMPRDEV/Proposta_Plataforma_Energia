// ============================================================
// View: Dashboard Operacional
// ============================================================

window.view_dashboard = function(root) {
  const ds = window.store.dataset;
  const t = window.store.tenant;

  const ultimasFaturas = ds.faturas
    .slice()
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 6);

  root.innerHTML = `
    ${viewHeader('Dashboard Operacional', 'Visão consolidada de ' + t.nome, `
      <button class="btn btn-outline btn-sm">📊 Exportar</button>
      <button class="btn btn-primary btn-sm">+ Novo Cliente</button>
    `)}

    <div class="kpi-grid">
      <div class="kpi info">
        <div class="label">UCs Ativas</div>
        <div class="value">${fmt.num(ds.kpis.ucsAtivas)}</div>
        <div class="delta up">▲ 4 novas este mês</div>
      </div>
      <div class="kpi success">
        <div class="label">Faturado em Mar/26</div>
        <div class="value">${fmt.moedaCompact(ds.kpis.faturadoMes)}</div>
        <div class="delta up">▲ 8,2% vs mês anterior</div>
      </div>
      <div class="kpi danger">
        <div class="label">Inadimplência</div>
        <div class="value">${fmt.pct(ds.kpis.inadimplencia)}</div>
        <div class="delta down">▼ 1,3 pp vs mês anterior</div>
      </div>
      <div class="kpi warning">
        <div class="label">kWh Gerado / mês</div>
        <div class="value">${fmt.num(ds.kpis.kwhGerado)}</div>
        <div class="delta up">▲ Sazonalidade favorável</div>
      </div>
    </div>

    <div class="grid-2-1">
      <div class="card">
        <div class="card-header">
          <h3>Faturamento — últimos 6 meses</h3>
          <span class="subtitle">Valores em R$</span>
        </div>
        ${barChart(ds.historico, fmt.moedaCompact)}
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Distribuição da Receita</h3>
          <span class="subtitle">Por tipo de UC</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          ${[
            { label: 'Comercial', pct: 48, cor: 'var(--primary)' },
            { label: 'Residencial', pct: 28, cor: 'var(--info)' },
            { label: 'Industrial', pct: 18, cor: 'var(--success)' },
            { label: 'Rural', pct: 6, cor: 'var(--warning)' }
          ].map(s => `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
                <span style="color: var(--gray-700); font-weight: 600;">${s.label}</span>
                <span style="color: var(--gray-600);">${s.pct}%</span>
              </div>
              <div style="height: 8px; background: var(--gray-100); border-radius: 4px; overflow: hidden;">
                <div style="width: ${s.pct}%; height: 100%; background: ${s.cor};"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 1.5rem;">
      <div class="card-header">
        <h3>Últimas Faturas</h3>
        <a href="#/faturamento" class="btn btn-ghost btn-sm">Ver todas →</a>
      </div>
      <table class="data">
        <thead>
          <tr>
            <th>Fatura</th>
            <th>Cliente</th>
            <th>Competência</th>
            <th class="text-right">Consumo</th>
            <th class="text-right">Valor</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${ultimasFaturas.map(f => `
            <tr>
              <td><strong>${esc(f.id)}</strong></td>
              <td>${esc(f.cliente)}</td>
              <td>${esc(f.competencia)}</td>
              <td class="text-right num">${fmt.kwh(f.consumo)}</td>
              <td class="text-right num"><strong>${fmt.moeda(f.valor)}</strong></td>
              <td class="text-center">${statusBadge(f.status)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
};
