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
      ${ds.tenant.parserCoelba ? '<button class="btn btn-outline btn-sm" id="btnUploadCoelba">📥 Upload fatura COELBA</button>' : ''}
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

  const btnUp = root.querySelector('#btnUploadCoelba');
  if (btnUp) btnUp.addEventListener('click', () => abrirUploadCoelba(ds));

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

// ============================================================
// Upload manual de fatura COELBA — fluxo em 3 etapas
// ============================================================
function abrirUploadCoelba(ds) {
  let etapa = 1;
  let arquivo = null;
  let resultado = null;

  function render() {
    openModal(`
      <div class="modal" style="max-width: 720px;">
        <div class="modal-header">
          <h3>📥 Upload manual de fatura COELBA</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="coelba-steps">
            ${[
              { n:1, l:'Selecionar arquivo' },
              { n:2, l:'Processar' },
              { n:3, l:'Confirmar' }
            ].map(s => `
              <div class="coelba-step ${etapa === s.n ? 'current' : (etapa > s.n ? 'done' : '')}">
                <div class="coelba-step-dot">${etapa > s.n ? '✓' : s.n}</div>
                <div class="coelba-step-label">${s.l}</div>
              </div>
            `).join('')}
          </div>

          ${etapa === 1 ? `
            <div class="coelba-drop" id="coelbaDrop">
              <input type="file" id="coelbaFile" accept=".pdf,.xml,.png,.jpg,.jpeg" hidden />
              <div class="coelba-drop-icon">📄</div>
              <div class="coelba-drop-title">Arraste a fatura COELBA aqui</div>
              <div class="coelba-drop-sub">ou <button class="coelba-drop-browse" id="coelbaBrowse">selecione um arquivo do computador</button></div>
              <div class="coelba-drop-meta">PDF · XML · PNG · JPG &nbsp;·&nbsp; máximo 10 MB</div>
            </div>
            <div style="margin-top:1rem; padding:.65rem .85rem; background:var(--info-bg); border-left:3px solid var(--info); border-radius:6px; font-size:.74rem; color:var(--gray-700);">
              ℹ Use este upload manual quando o parser automático falhar ou a fatura COELBA chegar fora do ciclo. O arquivo será processado pelo mesmo parser.
            </div>
          ` : ''}

          ${etapa === 2 ? `
            <div class="coelba-processing">
              <div class="coelba-spinner"></div>
              <div class="coelba-processing-title">Processando ${esc(arquivo.name)}…</div>
              <div class="coelba-processing-sub">Extraindo leituras de geração por UC. Não feche esta janela.</div>
              <div class="coelba-progress">
                <div class="coelba-progress-bar" id="coelbaBar"></div>
              </div>
              <div class="coelba-progress-meta" id="coelbaPct">0%</div>
            </div>
          ` : ''}

          ${etapa === 3 ? `
            <div style="display:flex; align-items:center; gap:.75rem; margin-bottom:1rem; padding:.7rem .9rem; background:var(--success-bg); border-radius:6px;">
              <div style="font-size:1.4rem;">✓</div>
              <div style="flex:1;">
                <div style="font-weight:700; color:var(--success);">Parser concluído</div>
                <div style="font-size:.74rem; color:var(--gray-700);">${resultado.length} leituras extraídas de <strong>${esc(arquivo.name)}</strong></div>
              </div>
            </div>
            <div style="font-size:.78rem; color:var(--gray-700); margin-bottom:.5rem; font-weight:600;">📊 Leituras a aplicar</div>
            <div style="max-height:280px; overflow:auto; border:1px solid var(--gray-200); border-radius:6px;">
              <table class="data" style="font-size:.78rem; margin:0;">
                <thead style="position:sticky; top:0; background:var(--white); z-index:1;">
                  <tr>
                    <th class="text-center" style="width:36px;"><input type="checkbox" id="coelbaChkAll" checked /></th>
                    <th>Usina</th>
                    <th class="text-right">Leitura anterior</th>
                    <th class="text-right">Nova leitura</th>
                    <th class="text-right">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  ${resultado.map((r, i) => {
                    const delta = r.kwh - r.anterior;
                    const sinal = delta >= 0 ? '▲' : '▼';
                    const cor = delta >= 0 ? 'var(--success)' : 'var(--danger)';
                    return `
                    <tr>
                      <td class="text-center"><input type="checkbox" data-aplicar="${i}" checked /></td>
                      <td>${esc(r.nome)}</td>
                      <td class="text-right num">${fmt.num(r.anterior)} kWh</td>
                      <td class="text-right num"><strong>${fmt.num(r.kwh)} kWh</strong></td>
                      <td class="text-right" style="color:${cor}; font-weight:600; font-size:.74rem;">
                        ${sinal} ${fmt.num(Math.abs(delta))}
                      </td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
            <div style="margin-top:.85rem; padding:.6rem .8rem; background:var(--gray-50); border-radius:6px; font-size:.72rem; color:var(--gray-600);">
              ℹ Desmarque qualquer linha que pareça incorreta — apenas as marcadas serão aplicadas.
            </div>
          ` : ''}
        </div>
        <div class="modal-footer anexo-footer">
          <button class="btn btn-ghost btn-link-back" onclick="closeModal()">${etapa === 3 ? '← Cancelar' : 'Cancelar'}</button>
          <div class="anexo-footer-actions" id="coelbaFooterActions">
            ${etapa === 1 && arquivo ? `<button class="btn btn-primary" id="coelbaProcessar">▶ Processar arquivo</button>` : ''}
            ${etapa === 3 ? `<button class="btn btn-primary" id="coelbaAplicar">✓ Aplicar leituras</button>` : ''}
          </div>
        </div>
      </div>
    `);

    if (etapa === 1) {
      const drop = document.getElementById('coelbaDrop');
      const inp = document.getElementById('coelbaFile');
      const browse = document.getElementById('coelbaBrowse');
      function setFile(file) {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { alert('Arquivo muito grande (máx 10 MB).'); return; }
        arquivo = { name: file.name, size: file.size };
        drop.classList.add('has-file');
        drop.innerHTML = `
          <div class="coelba-drop-icon" style="color:var(--success);">✓</div>
          <div class="coelba-drop-title" style="color:var(--success);">Arquivo selecionado</div>
          <div class="coelba-drop-sub" style="font-family:monospace;">${esc(arquivo.name)}</div>
          <div class="coelba-drop-meta">${(arquivo.size/1024).toFixed(0)} KB · clique em <strong>Processar</strong> abaixo</div>
          <button class="btn btn-ghost btn-sm" id="coelbaClear" style="margin-top:.5rem;">↺ Trocar arquivo</button>
        `;
        document.getElementById('coelbaClear').addEventListener('click', () => { arquivo = null; render(); });
        const footer = document.getElementById('coelbaFooterActions');
        if (footer && !footer.querySelector('#coelbaProcessar')) {
          footer.innerHTML = '<button class="btn btn-primary" id="coelbaProcessar">▶ Processar arquivo</button>';
          document.getElementById('coelbaProcessar').addEventListener('click', startProcessing);
        }
      }
      browse.addEventListener('click', (e) => { e.stopPropagation(); inp.click(); });
      drop.addEventListener('click', (e) => { if (!e.target.closest('button')) inp.click(); });
      inp.addEventListener('change', (e) => setFile(e.target.files && e.target.files[0]));
      ['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag-over'); }));
      ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag-over'); }));
      drop.addEventListener('drop', e => setFile(e.dataTransfer.files && e.dataTransfer.files[0]));
      const btnProc = document.getElementById('coelbaProcessar');
      if (btnProc) btnProc.addEventListener('click', startProcessing);
    }

    if (etapa === 2) {
      const bar = document.getElementById('coelbaBar');
      const pct = document.getElementById('coelbaPct');
      let p = 0;
      const tick = setInterval(() => {
        p += 8 + Math.random() * 12;
        if (p >= 100) {
          p = 100;
          bar.style.width = '100%';
          pct.textContent = '100%';
          clearInterval(tick);
          resultado = ds.usinas.map(u => {
            const fator = 0.85 + Math.random() * 0.3;
            return {
              id: u.id,
              nome: u.nome,
              anterior: u.producaoMes || 0,
              kwh: Math.round((u.kwp * 4.5 * 30) * fator)
            };
          });
          setTimeout(() => { etapa = 3; render(); }, 350);
        } else {
          bar.style.width = p + '%';
          pct.textContent = Math.floor(p) + '%';
        }
      }, 180);
    }

    if (etapa === 3) {
      const chkAll = document.getElementById('coelbaChkAll');
      if (chkAll) chkAll.addEventListener('change', () => {
        document.querySelectorAll('[data-aplicar]').forEach(c => c.checked = chkAll.checked);
      });
      document.getElementById('coelbaAplicar').addEventListener('click', () => {
        const aplicar = [];
        document.querySelectorAll('[data-aplicar]').forEach(c => {
          if (c.checked) aplicar.push(resultado[+c.dataset.aplicar]);
        });
        if (aplicar.length === 0) { alert('Selecione ao menos uma leitura para aplicar.'); return; }
        aplicar.forEach(r => window.dataStore.registrarLeitura(r.id, r.kwh));
        closeModal();
        setTimeout(() => alert('✓ ' + aplicar.length + ' leitura(s) aplicada(s) a partir da fatura COELBA.'), 100);
      });
    }
  }

  function startProcessing() { etapa = 2; render(); }

  render();
}
