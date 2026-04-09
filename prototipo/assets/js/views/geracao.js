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
          ${ds.tenant.parserCoelba ? '<span class="badge success" title="Parser COELBA importa a fatura mensal e atualiza a geração de cada UC automaticamente">Parser COELBA</span>' : ''}
        </div>
        ${ds.tenant.parserCoelba ? (function(){
          const totalU = ds.usinas.length;
          const atualizadas = ds.usinas.filter(u => u.ultimaLeitura).length;
          const cobertura = totalU ? Math.round(atualizadas / totalU * 100) : 0;
          const parcial = atualizadas < totalU;
          const cor = parcial ? 'var(--warning)' : 'var(--success)';
          const bg  = parcial ? 'var(--warning-bg)' : 'var(--success-bg)';
          const icon = parcial ? '⚠' : '✓';
          const label = parcial ? 'Sucesso parcial' : 'Sucesso';
          return `
          <div style="padding:.5rem 0;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:.75rem; padding:.6rem .75rem; background:${bg}; border-radius:6px;">
              <div style="display:flex; align-items:center; gap:.6rem;">
                <div style="font-size:1.4rem; color:${cor}; line-height:1;">${icon}</div>
                <div>
                  <div style="font-size:.85rem; font-weight:700; color:${cor};">${label}</div>
                  <div style="font-size:.7rem; color:var(--gray-600);">há 2h · 10/04/2026 14:32</div>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:.66rem; color:var(--gray-500); text-transform:uppercase; letter-spacing:.5px;">Cobertura</div>
                <div style="font-size:.95rem; font-weight:700; color:var(--gray-900);">${atualizadas}/${totalU} <span style="font-size:.7rem; color:var(--gray-500); font-weight:500;">(${cobertura}%)</span></div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:.5rem; margin-top:.6rem; font-size:.72rem;">
              <div style="padding:.5rem .65rem; background:var(--gray-50); border-radius:6px;">
                <div style="color:var(--gray-500); text-transform:uppercase; letter-spacing:.5px; font-size:.62rem;">Competência</div>
                <div style="font-weight:600; color:var(--gray-800); margin-top:1px;">Mar/26</div>
              </div>
              <div style="padding:.5rem .65rem; background:var(--gray-50); border-radius:6px;">
                <div style="color:var(--gray-500); text-transform:uppercase; letter-spacing:.5px; font-size:.62rem;">Próxima execução</div>
                <div style="font-weight:600; color:var(--gray-800); margin-top:1px;">amanhã 06:00</div>
              </div>
            </div>

            <div style="display:flex; gap:.4rem; margin-top:.65rem;">
              <button class="btn btn-outline btn-sm" id="btnRunParser" style="flex:1;">▶ Executar agora</button>
              <button class="btn btn-ghost btn-sm" id="btnLogParser" style="flex:1;">📋 Ver histórico</button>
            </div>
          </div>
          `;
        })() : `
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
            <button class="btn btn-secondary btn-sm" data-leitura="${u.id}" title="Registrar leitura manual">📊 Registrar leitura</button>
            ${kebab([
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

    wrap.querySelectorAll('[data-leitura]').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = ds.usinas.find(x => x.id === btn.dataset.leitura);
        if (u) modalLeitura(u);
      });
    });
  }

  if (ds.usinas.length > 0) renderUsinas();
  root.querySelector('#btnNovaUsina').addEventListener('click', () => modalUsina());

  const btnRun = root.querySelector('#btnRunParser');
  if (btnRun) btnRun.addEventListener('click', () => {
    btnRun.disabled = true;
    btnRun.innerHTML = '⏳ Executando...';
    setTimeout(() => {
      btnRun.disabled = false;
      btnRun.innerHTML = '▶ Executar agora';
      alert('Parser COELBA executado com sucesso.\n' + ds.usinas.length + ' usinas processadas.\n(Mock — sem chamada real)');
    }, 1200);
  });

  const btnLog = root.querySelector('#btnLogParser');
  if (btnLog) btnLog.addEventListener('click', () => {
    openModal(`
      <div class="modal" style="max-width:560px;">
        <div class="modal-header">
          <h3>Histórico do Parser COELBA</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <table class="data" style="font-size:.8rem;">
            <thead>
              <tr><th>Quando</th><th>Competência</th><th class="text-center">Usinas</th><th class="text-center">Status</th></tr>
            </thead>
            <tbody>
              <tr><td>10/04/2026 14:32</td><td>Mar/26</td><td class="text-center">${ds.usinas.length}/${ds.usinas.length}</td><td class="text-center"><span class="badge success">OK</span></td></tr>
              <tr><td>10/03/2026 06:04</td><td>Fev/26</td><td class="text-center">${ds.usinas.length}/${ds.usinas.length}</td><td class="text-center"><span class="badge success">OK</span></td></tr>
              <tr><td>10/02/2026 06:01</td><td>Jan/26</td><td class="text-center">${Math.max(0, ds.usinas.length - 1)}/${ds.usinas.length}</td><td class="text-center"><span class="badge warning">Parcial</span></td></tr>
              <tr><td>10/01/2026 06:02</td><td>Dez/25</td><td class="text-center">${ds.usinas.length}/${ds.usinas.length}</td><td class="text-center"><span class="badge success">OK</span></td></tr>
            </tbody>
          </table>
          <div style="margin-top:.85rem; padding:.6rem .75rem; background:var(--gray-50); border-radius:6px; font-size:.72rem; color:var(--gray-600);">
            ℹ Execução automática diária às 06:00. Configure em <strong>Configurações → Integrações → Parser COELBA</strong>.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="closeModal()">Fechar</button>
        </div>
      </div>
    `);
  });
};
