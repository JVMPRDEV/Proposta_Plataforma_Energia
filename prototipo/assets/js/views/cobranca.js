// ============================================================
// View: Cobrança / Asaas
// ============================================================

(function() {
  let aba = 'boletos';
  let pagina = { boletos: 1, pix: 1, webhooks: 1 };
  let pageSize = 15;

  window.view_cobranca = function(root) {
    const ds = window.store.dataset;

    // Mock de transações Asaas baseado nas faturas
    const boletos = ds.faturas.filter(f => ['paga','aberta','enviada','vencida'].includes(f.status));
    const pix = ds.faturas.filter(f => f.status === 'paga').map(f => ({
      ...f,
      pixId: 'pix_' + Math.random().toString(36).slice(2, 12),
      e2e: 'E18236120' + Math.floor(Math.random() * 1e10)
    }));
    const webhooks = ds.faturas.filter(f => f.status === 'paga').map((f, i) => ({
      id: 'whk_' + (i + 1),
      evento: 'PAYMENT_RECEIVED',
      fatura: f.id,
      valor: f.valor,
      data: '0' + (1 + (i % 9)) + '/04/2026 ' + (10 + (i % 12)) + ':' + (10 + (i % 49)),
      status: i % 8 === 0 ? 'reprocessado' : 'sucesso'
    }));

    const totalProcessado = boletos.filter(b => b.status === 'paga').reduce((a, b) => a + b.valor, 0);
    const taxaAsaas = totalProcessado * 0.0099;

    const banco = window.configStore.bancoPrincipal(ds.tenant.id) || { codigo: '-', nome: 'Sem banco', agencia: '-', conta: '-', carteira: '-' };
    const cfg = window.configStore.get(ds.tenant.id);
    const totalBancos = cfg.bancos.length;

    root.innerHTML = `
      ${viewHeader('Cobrança · Multibank', 'Banco emissor próprio + gateway Asaas · ' + ds.tenant.nome, `
        <button class="btn btn-outline btn-sm" id="btnConfigWebhook">⚙ Configurar Webhook</button>
        <button class="btn btn-primary btn-sm" id="btnSincronizar">🔄 Sincronizar agora</button>
      `)}

      <div class="card" style="margin-bottom: 1.25rem; border-left: 4px solid ${ds.tenant.cor};">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 48px; height: 48px; background: ${ds.tenant.cor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--dark); font-weight: 800; font-size: 1.2rem;">${banco.codigo}</div>
            <div>
              <div style="font-size: 0.7rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.6px;">Banco emissor deste tenant</div>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--gray-900);">${esc(banco.nome)}</div>
              <div style="font-size: 0.8rem; color: var(--gray-600);">Ag. ${esc(banco.agencia)} · Conta ${esc(banco.conta)} · Carteira ${esc(banco.carteira)}</div>
            </div>
          </div>
          <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
            <span class="badge success">Principal</span>
            ${totalBancos > 1 ? `<span class="badge info">+${totalBancos - 1} ${totalBancos - 1 === 1 ? 'outro banco' : 'outros bancos'}</span>` : ''}
            <a href="#/configuracoes" class="btn btn-outline btn-sm">🏦 Gerenciar bancos →</a>
          </div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi success">
          <div class="label">Processado em Mar/26</div>
          <div class="value">${fmt.moedaCompact(totalProcessado)}</div>
          <div class="delta up">▲ via ${esc(banco.nome)}</div>
        </div>
        <div class="kpi info">
          <div class="label">Boletos emitidos</div>
          <div class="value">${boletos.length}</div>
        </div>
        <div class="kpi warning">
          <div class="label">Taxa Asaas (~0,99%)</div>
          <div class="value">${fmt.moedaCompact(taxaAsaas)}</div>
        </div>
        <div class="kpi">
          <div class="label">Webhooks recebidos (24h)</div>
          <div class="value">${webhooks.length}</div>
        </div>
      </div>

      <div class="tabs">
        <button class="tab ${aba === 'boletos' ? 'active' : ''}" data-aba="boletos">Boletos</button>
        <button class="tab ${aba === 'pix' ? 'active' : ''}" data-aba="pix">Pix</button>
        <button class="tab ${aba === 'webhooks' ? 'active' : ''}" data-aba="webhooks">Webhooks recebidos</button>
      </div>

      <div id="abaContent"></div>
    `;

    function renderAba() {
      const c = root.querySelector('#abaContent');
      if (aba === 'boletos') {
        const p = paginar(boletos, pageSize, pagina.boletos);
        pagina.boletos = p.page;
        c.innerHTML = `
          <div class="table-wrap">
            <table class="data">
              <thead>
                <tr>
                  <th>Boleto</th>
                  <th>Cliente</th>
                  <th>Vencimento</th>
                  <th class="text-right">Valor</th>
                  <th class="text-center">Status</th>
                  <th class="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${p.items.map(b => {
                  const items = [
                    { icon: '📋', label: 'Copiar linha digitável', onClick: () => {
                      alert('Linha digitável copiada.\n\n23793.' + Math.floor(Math.random()*99999) + '.' + Math.floor(Math.random()*99999) + '.' + Math.floor(Math.random()*999999));
                    }}
                  ];
                  if (b.status !== 'paga') {
                    items.push({ icon: '✓', label: 'Baixa manual', success: true, onClick: () => {
                      if (confirm('Confirmar baixa manual de ' + b.id + '?\nValor: ' + fmt.moeda(b.valor))) {
                        window.dataStore.marcarPaga(b.id);
                      }
                    }});
                  }
                  items.push({ icon: '↻', label: 'Reemitir boleto', info: true, onClick: () => {
                    if (confirm('Reemitir boleto de ' + b.id + ' via ' + banco.nome + '?')) {
                      setTimeout(() => alert('Boleto reemitido com sucesso via ' + banco.nome + '.'), 50);
                    }
                  }});
                  return `
                    <tr>
                      <td><strong>${esc(b.id)}</strong></td>
                      <td>${esc(b.cliente)}</td>
                      <td>${esc(b.vencimento)}</td>
                      <td class="text-right num"><strong>${fmt.moeda(b.valor)}</strong></td>
                      <td class="text-center">${statusBadge(b.status)}</td>
                      <td class="text-center">${kebab(items)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            ${paginacao(p, (np, ns) => { if (ns) pageSize = ns; pagina.boletos = np; renderAba(); })}
          </div>
        `;
      } else if (aba === 'pix') {
        const pgPix = paginar(pix, pageSize, pagina.pix);
        pagina.pix = pgPix.page;
        c.innerHTML = `
          <div class="table-wrap">
            <table class="data">
              <thead>
                <tr>
                  <th>Pix ID</th>
                  <th>Fatura</th>
                  <th>Cliente</th>
                  <th class="text-right">Valor</th>
                  <th>End-to-End</th>
                  <th class="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                ${pgPix.items.map(p => `
                  <tr>
                    <td style="font-family: monospace; font-size: 0.75rem;"><strong>${esc(p.pixId)}</strong></td>
                    <td>${esc(p.id)}</td>
                    <td>${esc(p.cliente)}</td>
                    <td class="text-right num"><strong>${fmt.moeda(p.valor)}</strong></td>
                    <td style="font-family: monospace; font-size: 0.7rem; color: var(--gray-600);">${esc(p.e2e)}</td>
                    <td class="text-center"><span class="badge success">Confirmado</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${paginacao(pgPix, (np, ns) => { if (ns) pageSize = ns; pagina.pix = np; renderAba(); })}
          </div>
        `;
      } else {
        const pgWh = paginar(webhooks, pageSize, pagina.webhooks);
        pagina.webhooks = pgWh.page;
        c.innerHTML = `
          <div class="table-wrap">
            <div class="table-toolbar">
              <span style="font-size: 0.85rem; color: var(--gray-600);">
                Endpoint: <code style="background: var(--gray-100); padding: 2px 6px; border-radius: 4px;">https://api.${window.store.tenant.id}.plataforma.com.br/webhooks/asaas</code>
              </span>
              <span class="badge success">Webhook ativo</span>
            </div>
            <table class="data">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Evento</th>
                  <th>Fatura</th>
                  <th class="text-right">Valor</th>
                  <th>Recebido em</th>
                  <th class="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                ${pgWh.items.map(w => `
                  <tr>
                    <td style="font-family: monospace; font-size: 0.75rem;"><strong>${esc(w.id)}</strong></td>
                    <td><code style="font-size: 0.75rem; background: var(--info-bg); color: var(--info); padding: 2px 6px; border-radius: 4px;">${esc(w.evento)}</code></td>
                    <td>${esc(w.fatura)}</td>
                    <td class="text-right num">${fmt.moeda(w.valor)}</td>
                    <td style="font-size: 0.8rem; color: var(--gray-600);">${esc(w.data)}</td>
                    <td class="text-center">
                      ${w.status === 'sucesso' ? '<span class="badge success">Sucesso</span>' : '<span class="badge warning">Reprocessado</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${paginacao(pgWh, (np, ns) => { if (ns) pageSize = ns; pagina.webhooks = np; renderAba(); })}
          </div>
        `;
      }
    }
    renderAba();

    root.querySelectorAll('[data-aba]').forEach(t => {
      t.addEventListener('click', () => {
        aba = t.dataset.aba;
        view_cobranca(root);
      });
    });

    // ===== Sincronizar agora =====
    root.querySelector('#btnSincronizar').addEventListener('click', () => abrirSincronizar(ds));

    // ===== Configurar Webhook =====
    root.querySelector('#btnConfigWebhook').addEventListener('click', () => abrirConfigWebhook(ds));
  };

  // ============================================================
  // Modal: Sincronizar com Asaas
  // ============================================================
  function abrirSincronizar(ds) {
    let etapa = 1; // 1=confirm, 2=running, 3=done
    let resultado = null;

    function render() {
      openModal(`
        <div class="modal" style="max-width: 560px;">
          <div class="modal-header">
            <h3>🔄 Sincronizar com Asaas</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
          </div>
          <div class="modal-body">
            ${etapa === 1 ? `
              <p style="font-size:.85rem; color:var(--gray-700); margin-bottom:1rem;">
                A sincronização força a busca por <strong>cobranças, baixas e webhooks</strong> recentes
                no gateway Asaas. Útil quando há suspeita de eventos perdidos ou atraso na entrega de webhooks.
              </p>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:.6rem; margin-bottom:1rem;">
                <div style="padding:.7rem; background:var(--gray-50); border-radius:6px; text-align:center;">
                  <div style="font-size:.62rem; color:var(--gray-500); text-transform:uppercase; letter-spacing:.5px; font-weight:700;">Última sync</div>
                  <div style="font-size:.92rem; font-weight:700; color:var(--gray-800); margin-top:2px;">há 18 min</div>
                </div>
                <div style="padding:.7rem; background:var(--gray-50); border-radius:6px; text-align:center;">
                  <div style="font-size:.62rem; color:var(--gray-500); text-transform:uppercase; letter-spacing:.5px; font-weight:700;">Próxima automática</div>
                  <div style="font-size:.92rem; font-weight:700; color:var(--gray-800); margin-top:2px;">em 42 min</div>
                </div>
              </div>
              <div style="font-size:.78rem; color:var(--gray-700); font-weight:600; margin-bottom:.4rem;">O que será sincronizado:</div>
              <label class="sync-opt"><input type="checkbox" id="syncBol" checked /> <span>📋 Status de boletos e PIX (últimas 48h)</span></label>
              <label class="sync-opt"><input type="checkbox" id="syncWh" checked /> <span>📡 Webhooks pendentes / com falha de entrega</span></label>
              <label class="sync-opt"><input type="checkbox" id="syncSal" /> <span>💰 Saldo em conta e taxas (Asaas API)</span></label>
              <div style="margin-top:.85rem; padding:.55rem .75rem; background:var(--info-bg); border-left:3px solid var(--info); border-radius:6px; font-size:.72rem; color:var(--gray-700);">
                ℹ Sincronização leva ~5 segundos. As baixas confirmadas atualizam as faturas correspondentes automaticamente.
              </div>
            ` : ''}

            ${etapa === 2 ? `
              <div class="coelba-processing">
                <div class="coelba-spinner"></div>
                <div class="coelba-processing-title">Sincronizando com Asaas…</div>
                <div class="coelba-processing-sub" id="syncStep">Conectando ao gateway…</div>
                <div class="coelba-progress"><div class="coelba-progress-bar" id="syncBar"></div></div>
                <div class="coelba-progress-meta" id="syncPct">0%</div>
              </div>
            ` : ''}

            ${etapa === 3 ? `
              <div style="display:flex; align-items:center; gap:.75rem; margin-bottom:1rem; padding:.7rem .9rem; background:var(--success-bg); border-radius:6px;">
                <div style="font-size:1.4rem;">✓</div>
                <div>
                  <div style="font-weight:700; color:var(--success);">Sincronização concluída</div>
                  <div style="font-size:.74rem; color:var(--gray-700);">Concluído em ${resultado.duracao}s</div>
                </div>
              </div>
              <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:.5rem;">
                <div style="padding:.7rem; background:var(--gray-50); border-radius:6px; text-align:center;">
                  <div style="font-size:.62rem; color:var(--gray-500); text-transform:uppercase; letter-spacing:.5px; font-weight:700;">Cobranças checadas</div>
                  <div style="font-size:1.3rem; font-weight:800; color:var(--gray-800);">${resultado.checadas}</div>
                </div>
                <div style="padding:.7rem; background:var(--success-bg); border-radius:6px; text-align:center;">
                  <div style="font-size:.62rem; color:var(--gray-600); text-transform:uppercase; letter-spacing:.5px; font-weight:700;">Baixas aplicadas</div>
                  <div style="font-size:1.3rem; font-weight:800; color:var(--success);">${resultado.baixas}</div>
                </div>
                <div style="padding:.7rem; background:${resultado.webhooks > 0 ? 'var(--info-bg)' : 'var(--gray-50)'}; border-radius:6px; text-align:center;">
                  <div style="font-size:.62rem; color:var(--gray-600); text-transform:uppercase; letter-spacing:.5px; font-weight:700;">Webhooks recuperados</div>
                  <div style="font-size:1.3rem; font-weight:800; color:${resultado.webhooks > 0 ? 'var(--info)' : 'var(--gray-500)'};">${resultado.webhooks}</div>
                </div>
              </div>
            ` : ''}
          </div>
          <div class="modal-footer anexo-footer">
            <button class="btn btn-ghost btn-link-back" onclick="closeModal()">${etapa === 3 ? '← Fechar' : 'Cancelar'}</button>
            <div class="anexo-footer-actions">
              ${etapa === 1 ? '<button class="btn btn-primary" id="syncStart">▶ Iniciar sincronização</button>' : ''}
              ${etapa === 3 ? '<button class="btn btn-primary" onclick="closeModal()">✓ Concluir</button>' : ''}
            </div>
          </div>
        </div>
      `);

      if (etapa === 1) {
        document.getElementById('syncStart').addEventListener('click', () => { etapa = 2; render(); });
      }

      if (etapa === 2) {
        const bar = document.getElementById('syncBar');
        const pct = document.getElementById('syncPct');
        const stp = document.getElementById('syncStep');
        const passos = [
          { p: 15, l: 'Autenticando com Asaas API…' },
          { p: 35, l: 'Buscando cobranças das últimas 48h…' },
          { p: 60, l: 'Conferindo baixas confirmadas…' },
          { p: 85, l: 'Reprocessando webhooks pendentes…' },
          { p: 100, l: 'Atualizando base local…' }
        ];
        let i = 0;
        const tick = setInterval(() => {
          if (i >= passos.length) {
            clearInterval(tick);
            const baixas = (ds.faturas || []).filter(f => ['aberta','enviada','vencida'].includes(f.status)).slice(0, 2);
            baixas.forEach(f => window.dataStore.marcarPaga(f.id));
            resultado = {
              duracao: 4.7,
              checadas: (ds.faturas || []).length,
              baixas: baixas.length,
              webhooks: Math.floor(Math.random() * 3)
            };
            setTimeout(() => { etapa = 3; render(); }, 350);
            return;
          }
          bar.style.width = passos[i].p + '%';
          pct.textContent = passos[i].p + '%';
          stp.textContent = passos[i].l;
          i++;
        }, 700);
      }
    }
    render();
  }

  // ============================================================
  // Modal: Configurar Webhook do Asaas
  // ============================================================
  function abrirConfigWebhook(ds) {
    const KEY = 'proto_asaas_webhook_' + ds.tenant.id;
    let cfg;
    try { cfg = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e) { cfg = {}; }
    cfg = Object.assign({
      url: 'https://api.' + (ds.tenant.id || 'tenant') + '.solar/webhooks/asaas',
      authToken: '',
      eventos: {
        PAYMENT_RECEIVED: true,
        PAYMENT_OVERDUE: true,
        PAYMENT_REFUNDED: true,
        PAYMENT_DELETED: false,
        PAYMENT_UPDATED: false
      },
      retry: true,
      ativo: true
    }, cfg);

    function render() {
      openModal(`
        <div class="modal" style="max-width: 680px;">
          <div class="modal-header">
            <h3>⚙ Configurar Webhook Asaas</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div style="display:flex; align-items:center; gap:.75rem; margin-bottom:1rem; padding:.65rem .85rem; background:${cfg.ativo ? 'var(--success-bg)' : 'var(--gray-50)'}; border-radius:6px;">
              <label class="switch">
                <input type="checkbox" id="whAtivo" ${cfg.ativo ? 'checked' : ''} />
                <span class="switch-track"></span>
              </label>
              <div style="flex:1;">
                <div style="font-weight:700; color:${cfg.ativo ? 'var(--success)' : 'var(--gray-700)'};">
                  ${cfg.ativo ? '✓ Webhook ativo' : '⏸ Webhook inativo'}
                </div>
                <div style="font-size:.72rem; color:var(--gray-600);">
                  ${cfg.ativo ? 'Recebendo eventos do Asaas em tempo real' : 'Eventos não estão sendo entregues'}
                </div>
              </div>
            </div>

            <div class="form-row">
              <label>URL do endpoint <span style="color:var(--danger);">*</span></label>
              <div style="display:flex; gap:.4rem;">
                <input type="text" id="whUrl" value="${esc(cfg.url)}" style="flex:1; font-family:monospace; font-size:.8rem;" />
                <button class="btn btn-ghost btn-sm" id="whCopy" title="Copiar URL">📋</button>
              </div>
              <div style="font-size:.7rem; color:var(--gray-500); margin-top:4px;">Esta é a URL que você precisa cadastrar no painel do Asaas em <em>Integrações → Webhooks</em>.</div>
            </div>

            <div class="form-row" style="margin-top:.85rem;">
              <label>Token de autenticação (asaas-access-token)</label>
              <input type="password" id="whToken" value="${esc(cfg.authToken)}" placeholder="Cole aqui o token gerado no painel Asaas" style="font-family:monospace;" />
              <div style="font-size:.7rem; color:var(--gray-500); margin-top:4px;">O token é validado em cada requisição recebida. Mantenha em sigilo.</div>
            </div>

            <div style="margin-top:1rem;">
              <div style="font-size:.78rem; font-weight:700; color:var(--gray-800); margin-bottom:.5rem;">📡 Eventos a receber</div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:.4rem;">
                ${[
                  ['PAYMENT_RECEIVED', 'Pagamento recebido', 'success'],
                  ['PAYMENT_OVERDUE', 'Pagamento atrasado', 'warning'],
                  ['PAYMENT_REFUNDED', 'Pagamento estornado', 'info'],
                  ['PAYMENT_UPDATED', 'Cobrança atualizada', 'gray'],
                  ['PAYMENT_DELETED', 'Cobrança removida', 'danger']
                ].map(([k, l, cor]) => `
                  <label class="wh-event">
                    <input type="checkbox" data-evt="${k}" ${cfg.eventos[k] ? 'checked' : ''} />
                    <div>
                      <div style="font-size:.78rem; font-weight:600; color:var(--gray-800);">${l}</div>
                      <code style="font-size:.66rem; color:var(--gray-500);">${k}</code>
                    </div>
                  </label>
                `).join('')}
              </div>
            </div>

            <div style="margin-top:1rem; padding:.7rem .85rem; background:var(--gray-50); border-radius:6px;">
              <label style="display:flex; align-items:center; gap:.5rem; font-size:.8rem; color:var(--gray-700); cursor:pointer;">
                <input type="checkbox" id="whRetry" ${cfg.retry ? 'checked' : ''} />
                <span>Reentregar automaticamente em caso de falha (até 5 tentativas com backoff exponencial)</span>
              </label>
            </div>

            <details style="margin-top:.85rem;">
              <summary style="cursor:pointer; font-size:.74rem; color:var(--gray-600); font-weight:600;">🧪 Testar conexão</summary>
              <div style="margin-top:.5rem; padding:.7rem .85rem; background:var(--gray-50); border-radius:6px;">
                <div style="font-size:.74rem; color:var(--gray-700); margin-bottom:.5rem;">Envia um evento de teste (<code>WEBHOOK_TEST</code>) para o endpoint configurado.</div>
                <button class="btn btn-outline btn-sm" id="whTest">▶ Enviar evento de teste</button>
                <div id="whTestResult" style="margin-top:.5rem; font-size:.72rem;"></div>
              </div>
            </details>
          </div>
          <div class="modal-footer anexo-footer">
            <button class="btn btn-ghost btn-link-back" onclick="closeModal()">← Cancelar</button>
            <div class="anexo-footer-actions">
              <button class="btn btn-primary" id="whSave">💾 Salvar configuração</button>
            </div>
          </div>
        </div>
      `);

      document.getElementById('whAtivo').addEventListener('change', (e) => { cfg.ativo = e.target.checked; render(); });
      document.getElementById('whCopy').addEventListener('click', () => {
        const url = document.getElementById('whUrl').value;
        navigator.clipboard && navigator.clipboard.writeText(url);
        const btn = document.getElementById('whCopy');
        const old = btn.textContent;
        btn.textContent = '✓';
        setTimeout(() => btn.textContent = old, 1200);
      });
      document.getElementById('whTest').addEventListener('click', () => {
        const out = document.getElementById('whTestResult');
        out.innerHTML = '<span style="color:var(--gray-500);">⏳ Enviando evento de teste…</span>';
        setTimeout(() => {
          out.innerHTML = '<span style="color:var(--success); font-weight:600;">✓ HTTP 200 OK</span> · <span style="color:var(--gray-600);">resposta em 142 ms</span>';
        }, 900);
      });
      document.getElementById('whSave').addEventListener('click', () => {
        cfg.url = document.getElementById('whUrl').value.trim();
        cfg.authToken = document.getElementById('whToken').value.trim();
        cfg.retry = document.getElementById('whRetry').checked;
        document.querySelectorAll('[data-evt]').forEach(c => { cfg.eventos[c.dataset.evt] = c.checked; });
        if (!cfg.url) { alert('A URL do endpoint é obrigatória.'); return; }
        localStorage.setItem(KEY, JSON.stringify(cfg));
        closeModal();
        setTimeout(() => alert('✓ Configuração do webhook salva.\nLembre de cadastrar a URL no painel do Asaas.'), 100);
      });
    }
    render();
  }
})();
