// ============================================================
// View: Relatórios & Aging
// ============================================================

window._relPeriodo = window._relPeriodo || (function(){
  const d = new Date();
  const m = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return m[d.getMonth()] + '/' + String(d.getFullYear()).slice(-2);
})();

window.view_relatorios = function(root) {
  const ds = window.store.dataset;
  const MESES_LBL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const periodo = window._relPeriodo;
  const periodoOpcoes = (function(){
    const out = [];
    const d = new Date();
    for (let i = -11; i <= 0; i++) {
      const dt = new Date(d.getFullYear(), d.getMonth() + i, 1);
      out.push(MESES_LBL[dt.getMonth()] + '/' + String(dt.getFullYear()).slice(-2));
    }
    return out.reverse();
  })();

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
      <div class="periodo-picker">
        <button class="btn btn-primary btn-sm" id="btnPeriodo">📅 Período: <strong>${esc(periodo)}</strong> ▾</button>
      </div>
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

  // ===== Período picker =====
  const btnPer = root.querySelector('#btnPeriodo');
  if (btnPer) {
    btnPer.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.periodo-menu').forEach(m => m.remove());
      const menu = document.createElement('div');
      menu.className = 'kebab-menu periodo-menu';
      menu.style.minWidth = '180px';
      menu.style.maxHeight = '320px';
      menu.style.overflowY = 'auto';
      menu.innerHTML = periodoOpcoes.map(p => `
        <button class="item ${p === periodo ? 'success' : ''}" data-per="${esc(p)}">
          <span class="icon">${p === periodo ? '✓' : '📅'}</span>
          <span>${esc(p)}</span>
        </button>
      `).join('');
      document.body.appendChild(menu);
      const r = btnPer.getBoundingClientRect();
      const mr = menu.getBoundingClientRect();
      let top = r.bottom + 4;
      let left = r.right - mr.width;
      if (top + mr.height > window.innerHeight - 8) top = r.top - mr.height - 4;
      if (left < 8) left = 8;
      menu.style.top = top + 'px';
      menu.style.left = left + 'px';

      menu.querySelectorAll('[data-per]').forEach(b => {
        b.addEventListener('click', (ev) => {
          ev.stopPropagation();
          window._relPeriodo = b.dataset.per;
          menu.remove();
          view_relatorios(root);
        });
      });
      const closeOut = (ev) => {
        if (!menu.contains(ev.target) && ev.target !== btnPer) {
          menu.remove();
          document.removeEventListener('click', closeOut);
        }
      };
      setTimeout(() => document.addEventListener('click', closeOut), 0);
    });
  }
};
