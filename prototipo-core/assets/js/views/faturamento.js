// ============================================================
// View: Faturamento ⭐ (wow factor)
// ============================================================

// Store global de toggles "usar imagem padrão do template"
// (compartilhado entre Configurações e Faturamento)
window.faturaTemplateStore = window.faturaTemplateStore || (function() {
  const KEY = 'proto_fatura_tpl_padroes';
  const def = { qrcode: true, codbarras: true, printConta: false };
  let state;
  try { state = Object.assign({}, def, JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch(e) { state = Object.assign({}, def); }
  return {
    get: () => Object.assign({}, state),
    usar: (k) => !!state[k],
    set: (k, v) => { state[k] = !!v; localStorage.setItem(KEY, JSON.stringify(state)); window.dispatchEvent(new CustomEvent('fatura-tpl-changed')); }
  };
})();

(function() {
  let busca = '';
  let statusFilter = 'todos';
  let pagina = 1;
  let pageSize = 15;

window.view_faturamento = function(root) {
  const ds = window.store.dataset;
  function filtradas() {
    return ds.faturas.filter(f => {
      if (statusFilter !== 'todos') {
        if (statusFilter === 'aberta' && !['aberta','enviada','gerada'].includes(f.status)) return false;
        if (statusFilter !== 'aberta' && f.status !== statusFilter) return false;
      }
      if (busca) {
        const q = busca.toLowerCase();
        if (!String(f.id || '').toLowerCase().includes(q) && !(f.cliente || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }
  const total = ds.faturas.length;
  const pagas = ds.faturas.filter(f => f.status === 'paga').length;
  const vencidas = ds.faturas.filter(f => f.status === 'vencida').length;
  const abertas = ds.faturas.filter(f => f.status === 'aberta' || f.status === 'enviada').length;
  const valorAberto = ds.faturas.filter(f => ['aberta','enviada','vencida'].includes(f.status)).reduce((a,f) => a + f.valor, 0);

  root.innerHTML = `
    ${viewHeader('Faturamento', total + ' faturas · ' + ds.tenant.nome, `
      <button class="btn btn-outline btn-sm" id="btnNovaFatura">+ Fatura individual</button>
      <button class="btn btn-primary btn-sm" id="btnGerarLote">⚡ Gerar faturas do mês</button>
    `)}

    <div class="card" style="margin-bottom: 1.25rem; border-left: 4px solid var(--warning); background: var(--warning-bg);">
      <div style="padding: 0.85rem 1rem; font-size: 0.85rem; color: var(--gray-800);">
        <strong>Operação sem gateway de pagamento.</strong> Esta versão Core gera faturas a partir do
        <em>template fornecido pelo cliente</em>, preenchendo os campos automaticamente com dados da base
        (cliente, contrato, consumo, valores, banco emissor). Imagens fixas (logo, QR estático, print da
        COELBA) são importadas manualmente em <a href="#/configuracoes" style="color: var(--primary-dark); font-weight: 600;">Configurações → Template de Fatura</a>.
        O envio e a baixa de pagamento são realizados manualmente.
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi success">
        <div class="label">Pagas</div>
        <div class="value">${pagas}</div>
      </div>
      <div class="kpi info">
        <div class="label">Em aberto</div>
        <div class="value">${abertas}</div>
      </div>
      <div class="kpi danger">
        <div class="label">Vencidas</div>
        <div class="value">${vencidas}</div>
      </div>
      <div class="kpi warning">
        <div class="label">Valor a receber</div>
        <div class="value">${fmt.moedaCompact(valorAberto)}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <h3>Ciclo de vida da fatura</h3>
        <span class="subtitle">Máquina de estado</span>
      </div>
      ${steps(['Gerada', 'Enviada', 'Aberta', 'Paga'], 2)}
      <p style="font-size: 0.8rem; color: var(--gray-600); margin-top: 0.75rem;">
        Cada transição é registrada com timestamp e usuário. Faturas vencidas geram juros automaticamente (2% + 0,033%/dia).
      </p>
    </div>

    <div class="table-wrap">
      <div class="table-toolbar">
        <input type="search" id="busca" value="${esc(busca)}" placeholder="🔍 Buscar por nº ou cliente..." />
        <div class="filter-chips">
          ${[
            { k: 'todos',   l: 'Todas',    n: ds.faturas.length },
            { k: 'aberta',  l: 'Em aberto', n: ds.faturas.filter(f => ['aberta','enviada','gerada'].includes(f.status)).length },
            { k: 'paga',    l: 'Pagas',    n: ds.faturas.filter(f => f.status === 'paga').length },
            { k: 'vencida', l: 'Vencidas', n: ds.faturas.filter(f => f.status === 'vencida').length }
          ].map(f => `<button class="chip ${f.k === statusFilter ? 'active' : ''}" data-status="${f.k}">${f.l}<span class="count">${f.n}</span></button>`).join('')}
        </div>
      </div>
      <table class="data">
        <thead>
          <tr>
            <th>Fatura</th>
            <th>Cliente</th>
            <th>Competência</th>
            <th>Vencimento</th>
            <th class="text-right">Consumo</th>
            <th class="text-right">Valor</th>
            <th class="text-center">Anexos</th>
            <th class="text-center">Status</th>
            <th class="text-center">Ações</th>
          </tr>
        </thead>
        <tbody id="tbody"></tbody>
      </table>
      <div id="pgWrap"></div>
    </div>
  `;

  function renderTable() {
    const list = filtradas();
    const p = paginar(list, pageSize, pagina);
    pagina = p.page;
    const tbody = root.querySelector('#tbody');
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty">Nenhuma fatura encontrada</td></tr>';
      root.querySelector('#pgWrap').innerHTML = '';
      return;
    }
    root.querySelector('#pgWrap').innerHTML = paginacao(p, (np, ns) => {
      if (ns) pageSize = ns;
      pagina = np;
      renderTable();
    });
    tbody.innerHTML = p.items.map(f => {
      const anexos = (f.anexos = f.anexos || { qrcode: false, codbarras: false, printConta: false });
      const tpl = window.faturaTemplateStore.get();
      const need = ['qrcode','codbarras','printConta'].filter(k => !tpl[k]);
      const anexosOk = need.every(k => anexos[k]);
      const items = [
        { icon: '👁', label: 'Ver preview', onClick: () => abrirPreviewFatura(f, ds.tenant) }
      ];
      if (need.length > 0) {
        items.push({ icon: '🖼', label: anexosOk ? 'Anexos OK — reenviar' : 'Importar anexos do boleto', info: true, onClick: () => abrirAnexosBoleto(f) });
      }
      if (f.status === 'gerada') {
        items.push({ icon: '📤', label: 'Enviar fatura', info: true, onClick: () => {
          if (!anexosOk) { alert('Importe antes os 3 anexos do boleto (QR Code, código de barras e print da conta).'); return; }
          window.dataStore.enviarFatura(f.id);
        }});
      }
      if (['gerada','enviada','aberta','vencida'].includes(f.status)) {
        items.push({ icon: '✓', label: 'Baixa manual (marcar como paga)', success: true, onClick: () => abrirBaixaManual(f) });
      }
      items.push({ icon: '📧', label: 'Enviar por e-mail (manual)', onClick: () => alert('E-mail registrado como enviado para o cliente ' + f.cliente + '.\n(Mock — sem disparo real)') });
      items.push({ icon: '⬇', label: 'Baixar PDF do template', onClick: () => alert('Geraria o PDF da fatura ' + f.id + ' com o template do cliente preenchido.\n(Mock)') });
      items.push({ icon: '✎', label: 'Editar fatura', onClick: () => modalFatura(f) });
      items.push({ divider: true });
      items.push({ icon: '🗑', label: 'Cancelar fatura', danger: true, onClick: () => {
        if (confirm('Cancelar fatura ' + f.id + '?')) window.dataStore.cancelarFatura(f.id);
      }});
      return `
        <tr class="fatura-row">
          <td><strong>${esc(f.id)}</strong></td>
          <td>${esc(f.cliente)}</td>
          <td>${esc(f.competencia)}</td>
          <td>${esc(f.vencimento)}</td>
          <td class="text-right num">${fmt.kwh(f.consumo)}</td>
          <td class="text-right num"><strong>${fmt.moeda(f.valor)}</strong></td>
          <td class="text-center" style="font-size:.78rem;">
            ${[
              ['qrcode','▣','QR Code Pix'],
              ['codbarras','|||','Código de barras'],
              ['printConta','📄','Print conta de luz']
            ].map(([k,i,l]) => {
              const padrao = tpl[k];
              const ok = padrao || anexos[k];
              const title = padrao ? l+' (padrão do template)' : (anexos[k] ? l+' (importado)' : l+' (pendente)');
              const color = padrao ? 'var(--gray-500)' : (anexos[k] ? 'var(--success)' : 'var(--danger)');
              return `<span title="${title}" style="color:${color}; opacity:${ok?1:.55}">${i}</span>`;
            }).join(' ')}
          </td>
          <td class="text-center">${statusBadge(f.status)}</td>
          <td class="text-center">${kebab(items)}</td>
        </tr>
      `;
    }).join('');
  }
  renderTable();

  root.querySelector('#busca').addEventListener('input', e => { busca = e.target.value; pagina = 1; renderTable(); });
  root.querySelectorAll('[data-status]').forEach(b => b.addEventListener('click', () => {
    statusFilter = b.dataset.status;
    pagina = 1;
    root.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.status === statusFilter));
    renderTable();
  }));

  root.querySelector('#btnNovaFatura').addEventListener('click', () => modalFatura());

  // Botão gerar lote
  root.querySelector('#btnGerarLote').addEventListener('click', () => {
    openModal(`
      <div class="modal" style="max-width: 480px;">
        <div class="modal-header">
          <h3>Geração de Faturas em Lote</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body" style="text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">⚡</div>
          <p style="font-size: 0.9rem; color: var(--gray-700); margin-bottom: 1.25rem;">
            Será gerada uma fatura para cada contrato ativo deste tenant referente à competência <strong>Abr/2026</strong>.
          </p>
          <div style="background: var(--gray-50); padding: 1rem; border-radius: 6px; text-align: left;">
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>Contratos ativos:</span>
              <strong>${ds.contratos.filter(c => c.status === 'ativo').length}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>Valor total estimado:</span>
              <strong>${fmt.moeda(ds.contratos.filter(c => c.status === 'ativo').reduce((a,c) => a + c.valorMensal, 0))}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>Vencimento:</span>
              <strong>15/04/2026</strong>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" id="btnConfirmaLote">⚡ Gerar agora</button>
        </div>
      </div>
    `);
    document.getElementById('btnConfirmaLote').addEventListener('click', () => {
      const qtd = window.dataStore.gerarLote('Abr/26', '15/04/2026');
      closeModal();
      setTimeout(() => alert(qtd + ' fatura(s) gerada(s) em lote.'), 100);
    });
  });
};
})();

function abrirAnexosBoleto(f) {
  f.anexos = f.anexos || { qrcode: false, codbarras: false, printConta: false };
  function render() {
    const a = f.anexos;
    const tpl = window.faturaTemplateStore.get();
    const all = [
      { k:'qrcode',     l:'QR Code Pix',      i:'▣',  d:'Imagem do QR gerado para esta fatura' },
      { k:'codbarras',  l:'Código de barras', i:'|||',d:'Linha digitável + barcode' },
      { k:'printConta', l:'Print da conta',   i:'📄',d:'PNG/PDF da fatura COELBA do mês' }
    ];
    const need = all.filter(x => !tpl[x.k]);
    const slot = (key, label, icon, desc) => `
      <div style="border:1px dashed var(--gray-300); border-radius:8px; padding:.85rem; background:${a[key]?'var(--success-bg)':'var(--gray-50)'}; text-align:center;">
        <div style="font-size:1.6rem;">${icon}</div>
        <div style="font-size:.8rem; font-weight:600; color:var(--gray-800); margin-top:.25rem;">${label}</div>
        <div style="font-size:.68rem; color:var(--gray-600); margin:.2rem 0 .5rem;">${desc}</div>
        ${a[key]
          ? `<div style="font-size:.72rem; color:var(--success); font-weight:600;">✓ Importado</div>
             <button class="btn btn-ghost btn-sm" data-clear="${key}" style="margin-top:.4rem;">Substituir</button>`
          : `<button class="btn btn-outline btn-sm" data-up="${key}">⬆ Importar</button>`}
      </div>`;
    openModal(`
      <div class="modal" style="max-width:640px;">
        <div class="modal-header">
          <h3>Anexos do boleto · ${esc(f.id)}</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <p style="font-size:.83rem; color:var(--gray-700); margin-bottom:.85rem;">
            ${need.length === 0
              ? 'Nenhuma imagem precisa ser importada nesta fatura — todas as 3 estão configuradas como <strong>padrão do template</strong> em Configurações.'
              : 'As imagens abaixo estão marcadas como <strong>específicas por boleto</strong> em Configurações. Importe-as para esta fatura — serão armazenadas no S3 do tenant.'}
          </p>
          ${all.filter(x => tpl[x.k]).length > 0 ? `
            <div style="margin-bottom:.85rem; padding:.6rem .75rem; background:var(--gray-50); border-radius:6px; font-size:.74rem; color:var(--gray-600);">
              <strong>Usando padrão do template:</strong>
              ${all.filter(x => tpl[x.k]).map(x => x.i+' '+x.l).join(' · ')}
            </div>` : ''}
          ${need.length > 0 ? `
            <div style="display:grid; grid-template-columns:repeat(${need.length},1fr); gap:.75rem;">
              ${need.map(x => slot(x.k, x.l, x.i, x.d)).join('')}
            </div>` : ''}
          <div style="margin-top:1rem; padding:.65rem .8rem; background:var(--info-bg,var(--gray-50)); border-left:3px solid var(--info,var(--primary)); border-radius:6px; font-size:.75rem; color:var(--gray-700);">
            ℹ Os arquivos importados são versionados no S3 (<code>s3://faturas/${esc(f.tenantId||'tenant')}/${esc(f.id)}/</code>) e referenciados pelo template ao montar o PDF final.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="closeModal()">Concluir</button>
        </div>
      </div>
    `);
    document.querySelectorAll('[data-up]').forEach(b => b.addEventListener('click', () => {
      f.anexos[b.dataset.up] = true;
      window.dispatchEvent(new CustomEvent('data-changed'));
      render();
    }));
    document.querySelectorAll('[data-clear]').forEach(b => b.addEventListener('click', () => {
      f.anexos[b.dataset.clear] = false;
      window.dispatchEvent(new CustomEvent('data-changed'));
      render();
    }));
  }
  render();
}

function abrirBaixaManual(f) {
  const hoje = new Date().toISOString().slice(0, 10);
  openModal(`
    <div class="modal" style="max-width: 460px;">
      <div class="modal-header">
        <h3>Baixa manual de pagamento</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.85rem; color: var(--gray-700); margin-bottom: 1rem;">
          Como esta versão Core opera <strong>sem gateway</strong>, a confirmação de pagamento é feita manualmente
          pelo operador após verificação do recebimento no banco.
        </p>
        <div style="background: var(--gray-50); padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.85rem;">
          <div><strong>Fatura:</strong> ${esc(f.id)}</div>
          <div><strong>Cliente:</strong> ${esc(f.cliente)}</div>
          <div><strong>Valor:</strong> ${fmt.moeda(f.valor)}</div>
        </div>
        <label style="display:block; font-size:.78rem; font-weight:600; color:var(--gray-700); margin-bottom:4px;">Data do pagamento</label>
        <input type="date" id="bxData" value="${hoje}" style="width:100%; padding:.55rem; border:1px solid var(--gray-300); border-radius:6px; margin-bottom:.85rem;" />
        <label style="display:block; font-size:.78rem; font-weight:600; color:var(--gray-700); margin-bottom:4px;">Forma de recebimento</label>
        <select id="bxForma" style="width:100%; padding:.55rem; border:1px solid var(--gray-300); border-radius:6px; margin-bottom:.85rem;">
          <option>Boleto bancário</option>
          <option>PIX (manual)</option>
          <option>Transferência / TED</option>
          <option>Dinheiro / outros</option>
        </select>
        <label style="display:block; font-size:.78rem; font-weight:600; color:var(--gray-700); margin-bottom:4px;">Observação</label>
        <textarea id="bxObs" rows="2" placeholder="Ex.: comprovante recebido por e-mail" style="width:100%; padding:.55rem; border:1px solid var(--gray-300); border-radius:6px;"></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-success" id="bxConfirm">✓ Confirmar baixa</button>
      </div>
    </div>
  `);
  document.getElementById('bxConfirm').addEventListener('click', () => {
    window.dataStore.marcarPaga(f.id);
    closeModal();
  });
}

function abrirPreviewFatura(f, t) {
  const juros = f.status === 'vencida' ? Math.round(f.valor * 0.025) : 0;
  const total = f.valor + juros;
  // Buscar cliente para checar titularidade (D2 do questionário)
  const ds = window.store.dataset;
  const cliente = ds.clientes.find(c => c.id === f.clienteId) || {};
  const anexarCoelba = cliente.titularidade === 'comercializadora';
  const banco = window.configStore.bancoPrincipal(t.id) || {};
  openModal(`
    <div class="modal" style="max-width: 720px;">
      <div class="modal-header">
        <h3>Preview da Fatura</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body" style="background: var(--gray-100);">
        <div class="fatura-preview">
          <div class="header">
            <div class="brand">
              <div class="logo" style="background: ${t.cor}">${t.iniciais}</div>
              <div>
                <div style="font-size: 1.05rem; font-weight: 700; color: var(--gray-900);">${esc(t.nome)}</div>
                <div style="font-size: 0.7rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px;">CNPJ ${t.cnpj}</div>
              </div>
            </div>
            <div class="nf">
              <div class="label">Fatura</div>
              <div class="num">${esc(f.id)}</div>
            </div>
          </div>

          <div class="section">
            <h4>Cliente</h4>
            <div style="font-weight: 600; font-size: 1rem;">${esc(f.cliente)}</div>
            <div style="font-size: 0.75rem; color: var(--gray-600); margin-top: 4px;">
              Titularidade da conta de luz:
              <strong style="color: ${anexarCoelba ? 'var(--warning)' : 'var(--success)'};">
                ${anexarCoelba ? 'Comercializadora (legado)' : 'Próprio cliente'}
              </strong>
            </div>
          </div>

          <div class="section">
            <div class="grid">
              <div>
                <h4>Competência</h4>
                <div style="font-weight: 600;">${esc(f.competencia)}</div>
              </div>
              <div>
                <h4>Vencimento</h4>
                <div style="font-weight: 600;">${esc(f.vencimento)}</div>
              </div>
              <div>
                <h4>Consumo</h4>
                <div style="font-weight: 600;">${fmt.kwh(f.consumo)}</div>
              </div>
              <div>
                <h4>Status</h4>
                <div>${statusBadge(f.status)}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h4>Composição</h4>
            <table class="data" style="font-size: 0.85rem;">
              <tr><td>Energia consumida (${fmt.kwh(f.consumo)})</td><td class="text-right">${fmt.moeda(f.valor)}</td></tr>
              ${juros > 0 ? `<tr><td>Juros e multa (vencida)</td><td class="text-right" style="color: var(--danger)">+ ${fmt.moeda(juros)}</td></tr>` : ''}
            </table>
          </div>

          <div class="section">
            <h4>Banco emissor (multibank)</h4>
            <div style="font-size: 0.85rem; color: var(--gray-700);">
              <strong>${esc(banco.nome || '—')}</strong> · Ag. ${esc(banco.agencia || '')} · Conta ${esc(banco.conta || '')} · Carteira ${esc(banco.carteira || '')}
            </div>
          </div>

          <div class="section">
            <h4>Imagens do boleto</h4>
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:.6rem; margin-top:.4rem;">
              ${(function(){
                const tpl = window.faturaTemplateStore.get();
                return [
                  ['qrcode','▣','QR Code Pix'],
                  ['codbarras','|||','Código de barras'],
                  ['printConta','📄','Print conta luz']
                ].map(([k,i,l]) => {
                  const padrao = tpl[k];
                  const importado = f.anexos && f.anexos[k];
                  const ok = padrao || importado;
                  const tag = padrao ? 'padrão do template' : (importado ? '✓ por boleto (S3)' : 'pendente');
                  const bg = padrao ? 'var(--gray-50)' : (importado ? 'var(--success-bg)' : 'var(--warning-bg)');
                  const color = padrao ? 'var(--gray-600)' : (importado ? 'var(--success)' : '#b8740a');
                  return `<div style="border:1px solid var(--gray-200); border-radius:6px; padding:.55rem; text-align:center; background:${bg};">
                    <div style="font-size:1.3rem;">${i}</div>
                    <div style="font-size:.72rem; font-weight:600; color:var(--gray-800);">${l}</div>
                    <div style="font-size:.66rem; color:${color};">${tag}</div>
                  </div>`;
                }).join('');
              })()}
            </div>
          </div>

          ${anexarCoelba ? `
          <div class="section" style="background: var(--warning-bg); padding: 0.75rem 1rem; border-radius: 6px; border-left: 4px solid var(--warning);">
            <h4 style="color: #b8740a;">📎 Anexo obrigatório — Print da fatura COELBA</h4>
            <p style="font-size: 0.8rem; color: var(--gray-700); margin-top: 4px;">
              Como a conta de luz deste cliente está em nome da comercializadora, o sistema anexa automaticamente o print da fatura COELBA do mês com a leitura do consumo.
            </p>
            <div style="margin-top: 0.5rem; padding: 0.5rem; background: var(--white); border-radius: 4px; font-size: 0.78rem; color: var(--gray-600); display: flex; align-items: center; gap: 0.5rem;">
              📄 fatura-coelba-${esc(f.competencia.toLowerCase().replace('/', '-'))}-${esc(f.clienteId)}.pdf
            </div>
          </div>
          ` : ''}

          <div class="total">
            <div class="label">Total a pagar</div>
            <div class="value">${fmt.moeda(total)}</div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="alert('E-mail registrado como enviado.\\n(Mock — sem disparo real)')">📧 Enviar por e-mail</button>
        <button class="btn btn-outline" onclick="alert('Geraria PDF do template preenchido.\\n(Mock)')">⬇ Baixar PDF</button>
        <button class="btn btn-primary" onclick="closeModal()">Fechar</button>
      </div>
    </div>
  `);
}
