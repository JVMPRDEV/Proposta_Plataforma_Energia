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
        <button class="btn btn-outline btn-sm">⚙ Configurar Webhook</button>
        <button class="btn btn-primary btn-sm">🔄 Sincronizar agora</button>
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
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <span class="badge success">Principal</span>
            ${totalBancos > 1 ? `<span class="badge info">+${totalBancos - 1} ${totalBancos - 1 === 1 ? 'outro banco' : 'outros bancos'}</span>` : ''}
            <a href="#/configuracoes" style="font-size: 0.75rem; color: var(--primary-dark); text-decoration: underline;">Gerenciar bancos →</a>
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
  };
})();
