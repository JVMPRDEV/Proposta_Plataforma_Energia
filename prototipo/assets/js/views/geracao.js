// ============================================================
// View: Geração / Produção — CRUD de usinas + leitura manual
// ============================================================

window.view_geracao = function(root) {
  const ds = window.store.dataset;
  const totalGerado = ds.usinas.reduce((a, u) => a + u.producaoMes, 0);
  const totalKwp = ds.usinas.reduce((a, u) => a + u.kwp, 0);

  const histProducao = ['Out','Nov','Dez','Jan','Fev','Mar'].map((m, i) => ({
    mes: m,
    valor: Math.round(Math.max(totalGerado, 1000) * (0.82 + (i * 0.04)))
  }));

  root.innerHTML = `
    ${viewHeader('Geração / Produção', ds.usinas.length + ' usinas · ' + ds.tenant.nome, `
      ${ds.tenant.parserCoelba ? '<button class="btn btn-outline btn-sm">📥 Upload fatura COELBA</button>' : ''}
      <button class="btn btn-primary btn-sm" id="btnNovaUsina">+ Nova Usina</button>
    `)}

    <div class="kpi-grid">
      <div class="kpi info">
        <div class="label">Usinas Cadastradas</div>
        <div class="value">${ds.usinas.length}</div>
      </div>
      <div class="kpi warning">
        <div class="label">Capacidade Total</div>
        <div class="value">${fmt.num(totalKwp)} kWp</div>
      </div>
      <div class="kpi success">
        <div class="label">Gerado em Mar/26</div>
        <div class="value">${fmt.num(totalGerado)} kWh</div>
      </div>
      <div class="kpi">
        <div class="label">Eficiência média</div>
        <div class="value">${totalKwp ? (totalGerado / totalKwp / 30).toFixed(2).replace('.', ',') : '0,00'} kWh/kWp/dia</div>
      </div>
    </div>

    <div class="grid-2-1">
      <div class="card">
        <div class="card-header">
          <h3>Produção — últimos 6 meses</h3>
          <span class="subtitle">kWh agregados</span>
        </div>
        ${barChart(histProducao, v => fmt.num(v))}
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Coleta de produção</h3>
        </div>
        ${ds.tenant.parserCoelba ? `
        <div style="text-align: center; padding: 1rem 0;">
          <div style="font-size: 0.7rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 1px;">Parser COELBA · Automático</div>
          <div style="font-size: 1.8rem; font-weight: 700; color: var(--success); margin: 0.5rem 0;">✓ Sucesso</div>
          <div style="font-size: 0.85rem; color: var(--gray-600);">10/04/2026 às 14:32</div>
          <div style="margin-top: 1rem; padding: 0.75rem; background: var(--success-bg); border-radius: 6px; font-size: 0.8rem; color: var(--success);">
            ${ds.usinas.length} usinas atualizadas automaticamente
          </div>
        </div>
        ` : `
        <div style="text-align: center; padding: 1rem 0;">
          <div style="font-size: 0.7rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 1px;">Modo de coleta atual</div>
          <div style="font-size: 1.4rem; font-weight: 700; color: var(--gray-700); margin: 0.5rem 0;">📝 Digitação Manual</div>
          <div style="font-size: 0.8rem; color: var(--gray-600); margin-top: 0.5rem;">
            Conforme questionário B1: digitação manual.
          </div>
          <div style="margin-top: 1rem; padding: 0.75rem; background: var(--info-bg); border-radius: 6px; font-size: 0.78rem; color: var(--info);">
            💡 Use o botão <strong>"Registrar leitura"</strong> em cada usina para informar a produção do mês.
          </div>
        </div>
        `}
      </div>
    </div>

    <h3 style="margin: 2rem 0 1rem; color: var(--gray-800); font-size: 1.05rem;">Usinas</h3>
    <div id="usinasList">${ds.usinas.length === 0 ? '<div class="empty">Nenhuma usina cadastrada</div>' : ''}</div>
  `;

  function renderUsinas() {
    const wrap = root.querySelector('#usinasList');
    wrap.innerHTML = ds.usinas.map(u => `
      <div class="usina-card">
        <div class="head">
          <h4>☀ ${esc(u.nome)}</h4>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            ${statusBadge(u.status)}
            ${kebab([
              { icon: '📊', label: 'Registrar leitura manual', onClick: () => modalLeitura(u) },
              { icon: '✎', label: 'Editar usina', onClick: () => modalUsina(u) },
              { divider: true },
              { icon: '🗑', label: 'Excluir', danger: true, onClick: () => {
                if (confirm('Excluir usina "' + u.nome + '"?')) window.dataStore.removeUsina(u.id);
              }}
            ])}
          </div>
        </div>
        <div class="stats">
          <div class="stat">
            <div class="label">Capacidade</div>
            <div class="val">${u.kwp} kWp</div>
          </div>
          <div class="stat">
            <div class="label">Produção mês</div>
            <div class="val">${fmt.num(u.producaoMes)} kWh</div>
          </div>
          <div class="stat">
            <div class="label">Localização</div>
            <div class="val" style="font-size: 0.95rem;">${esc(u.cidade)}</div>
          </div>
          <div class="stat">
            <div class="label">Última leitura</div>
            <div class="val" style="font-size: 0.95rem;">${esc(u.ultimaLeitura)}</div>
          </div>
        </div>
      </div>
    `).join('');

  }

  if (ds.usinas.length > 0) renderUsinas();
  root.querySelector('#btnNovaUsina').addEventListener('click', () => modalUsina());
};
