// ============================================================
// View: Relatórios & Aging
// ============================================================

window.view_relatorios = function(root) {
  const ds = window.store.dataset;

  // Aging dos recebíveis (mockado a partir das faturas em aberto/vencidas)
  const emAberto = ds.faturas.filter(f => ['aberta','enviada','vencida'].includes(f.status));
  const total = emAberto.reduce((a, f) => a + f.valor, 0);
  const aging = {
    a: { range: '0 a 30 dias',  valor: Math.round(total * 0.62), count: Math.round(emAberto.length * 0.62) },
    b: { range: '31 a 60 dias', valor: Math.round(total * 0.22), count: Math.round(emAberto.length * 0.22) },
    c: { range: '61 a 90 dias', valor: Math.round(total * 0.10), count: Math.round(emAberto.length * 0.10) },
    d: { range: 'Acima de 90',  valor: Math.round(total * 0.06), count: Math.round(emAberto.length * 0.06) }
  };

  root.innerHTML = `
    ${viewHeader('Relatórios & Aging', 'Análise financeira · ' + ds.tenant.nome, `
      <button class="btn btn-outline btn-sm">📥 Exportar CSV</button>
      <button class="btn btn-outline btn-sm">📄 Exportar PDF</button>
      <button class="btn btn-primary btn-sm">📅 Período: Mar/26</button>
    `)}

    <h3 style="margin-bottom: 1rem; color: var(--gray-800); font-size: 1rem;">Aging de Recebíveis</h3>
    <div class="aging-grid">
      <div class="aging-card">
        <div class="range">${aging.a.range}</div>
        <div class="value">${fmt.moedaCompact(aging.a.valor)}</div>
        <div class="count">${aging.a.count} faturas</div>
      </div>
      <div class="aging-card warn">
        <div class="range">${aging.b.range}</div>
        <div class="value">${fmt.moedaCompact(aging.b.valor)}</div>
        <div class="count">${aging.b.count} faturas</div>
      </div>
      <div class="aging-card danger">
        <div class="range">${aging.c.range}</div>
        <div class="value">${fmt.moedaCompact(aging.c.valor)}</div>
        <div class="count">${aging.c.count} faturas</div>
      </div>
      <div class="aging-card crit">
        <div class="range">${aging.d.range}</div>
        <div class="value">${fmt.moedaCompact(aging.d.valor)}</div>
        <div class="count">${aging.d.count} faturas</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h3>Receita realizada vs prevista</h3>
          <span class="subtitle">Últimos 6 meses</span>
        </div>
        ${barChart(ds.historico, fmt.moedaCompact)}
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Top 5 inadimplentes</h3>
          <span class="subtitle">Por valor em aberto</span>
        </div>
        <table class="data">
          <thead>
            <tr>
              <th>Cliente</th>
              <th class="text-right">Em aberto</th>
              <th class="text-center">Faturas</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
              const map = {};
              emAberto.forEach(f => {
                if (!map[f.cliente]) map[f.cliente] = { valor: 0, count: 0 };
                map[f.cliente].valor += f.valor;
                map[f.cliente].count++;
              });
              return Object.entries(map)
                .sort((a, b) => b[1].valor - a[1].valor)
                .slice(0, 5)
                .map(([nome, v]) => `
                  <tr>
                    <td>${esc(nome)}</td>
                    <td class="text-right num"><strong style="color: var(--danger)">${fmt.moeda(v.valor)}</strong></td>
                    <td class="text-center">${v.count}</td>
                  </tr>
                `).join('');
            })()}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top: 1.5rem;">
      <div class="card-header">
        <h3>Relatórios disponíveis</h3>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
        ${[
          '📊 Receita por período',
          '📈 Crescimento de UCs',
          '⚡ Geração vs Consumo',
          '💰 Faturamento por cliente',
          '🧾 Notas fiscais emitidas',
          '📉 Inadimplência detalhada',
          '🔁 Renovações de contrato',
          '📋 Auditoria de transições'
        ].map(r => `
          <button class="btn btn-outline" style="justify-content: flex-start; padding: 0.85rem 1rem;">${r}</button>
        `).join('')}
      </div>
    </div>
  `;
};
