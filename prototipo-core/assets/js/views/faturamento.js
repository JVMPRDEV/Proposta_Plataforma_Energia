// ============================================================
// View: Faturamento ⭐ (wow factor)
// ============================================================

// Store global de toggles "usar imagem padrão do template"
// (compartilhado entre Configurações e Faturamento)
// Versão Core: TODOS os 3 anexos são manuais por boleto (não há padrão fixo
// no template — QR Code, código de barras e print da conta variam a cada
// emissão e devem ser importados pelo operador antes do envio).
window.faturaTemplateStore = window.faturaTemplateStore || (function() {
  const def = { qrcode: false, codbarras: false, printConta: false };
  return {
    get: () => Object.assign({}, def),
    usar: () => false,
    set: () => {} // no-op no Core
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
      <button class="btn btn-outline btn-sm" id="btnGerarLote">⚡ Gerar faturas do mês</button>
      <button class="btn btn-primary btn-sm" id="btnEnviarLote">📤 Enviar faturas prontas</button>
    `)}

    <div class="card" style="margin-bottom: 1.25rem; border-left: 4px solid var(--warning); background: var(--warning-bg);">
      <div style="padding: 0.85rem 1rem; font-size: 0.85rem; color: var(--gray-800);">
        <strong>Operação sem gateway de pagamento.</strong> Esta versão Core gera faturas a partir do
        <em>template fornecido pelo cliente</em>, preenchendo os campos automaticamente com dados da base
        (cliente, contrato, consumo, valores, banco emissor). Imagens fixas (logo, QR estático, print da
        conta de luz) são importadas manualmente em <a href="#/configuracoes" style="color: var(--primary-dark); font-weight: 600;">Configurações → Template de Fatura</a>.
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
        { icon: '👁', label: 'Ver preview da fatura', onClick: () => abrirPreviewFatura(f, ds.tenant) }
      ];
      // Anexos NÃO entram no kebab — a coluna "Anexos" já é o ponto de entrada
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
          <td class="text-center">
            ${(function(){
              const totalNeed = need.length;
              const importados = need.filter(k => anexos[k]).length;
              const faltam = totalNeed - importados;
              if (totalNeed === 0) {
                return `<span class="anexo-pill ok" title="Todos os anexos vêm do template padrão">✓ Padrão template</span>`;
              }
              if (faltam === 0) {
                return `<button class="anexo-pill ok" data-view="${esc(f.id)}" title="Visualizar documentos anexados">✓ ${importados}/${totalNeed} OK</button>`;
              }
              if (importados === 0) {
                return `<button class="anexo-pill danger" data-import="${esc(f.id)}" title="Importar ${totalNeed} anexos do boleto">⬆ Importar (${totalNeed})</button>`;
              }
              return `<button class="anexo-pill warn" data-import="${esc(f.id)}" title="${faltam} anexo(s) faltando — clique para importar">⚠ ${importados}/${totalNeed}</button>`;
            })()}
          </td>
          <td class="text-center">${statusBadge(f.status)}</td>
          <td class="text-center">${kebab(items)}</td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('[data-view]').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const fat = ds.faturas.find(x => x.id === b.dataset.view);
        if (fat) verAnexosBoleto(fat);
      });
    });
    tbody.querySelectorAll('[data-import]').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const fat = ds.faturas.find(x => x.id === b.dataset.import);
        if (fat) abrirAnexosBoleto(fat);
      });
    });
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

  // ===== Enviar lote (só faturas prontas: status=gerada + anexos completos) =====
  root.querySelector('#btnEnviarLote').addEventListener('click', () => {
    const tpl = window.faturaTemplateStore.get();
    const need = ['qrcode','codbarras','printConta'].filter(k => !tpl[k]);
    function isReady(f) {
      if (f.status !== 'gerada') return false;
      const a = f.anexos || {};
      return need.every(k => a[k]);
    }
    const todasGeradas = ds.faturas.filter(f => f.status === 'gerada');
    const prontas = todasGeradas.filter(isReady);
    const pendentes = todasGeradas.filter(f => !isReady(f));
    const selSet = new Set(prontas.map(f => f.id));
    const totalProntas = prontas.reduce((a, f) => a + f.valor, 0);

    openModal(`
      <div class="modal" style="max-width: 720px;">
        <div class="modal-header">
          <h3>📤 Enviar faturas prontas</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          ${todasGeradas.length === 0 ? `
            <div style="text-align:center; padding:1.5rem; color:var(--gray-600);">
              <div style="font-size:2.4rem;">📭</div>
              <div style="font-weight:600; margin-top:.4rem;">Nenhuma fatura no estado "Gerada"</div>
              <div style="font-size:.78rem; margin-top:.3rem;">Use <strong>"⚡ Gerar faturas do mês"</strong> ou <strong>"+ Fatura individual"</strong> primeiro.</div>
            </div>
          ` : `
          <p style="font-size:.85rem; color:var(--gray-700); margin-bottom:1rem;">
            Apenas faturas com <strong>todos os anexos importados</strong> podem ser enviadas. Faturas com pendências ficam marcadas e exigem ação no botão de anexos da linha.
          </p>

          <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:.5rem; margin-bottom:1rem;">
            <div style="padding:.65rem; background:var(--success-bg); border-radius:6px; text-align:center;">
              <div style="font-size:.62rem; color:var(--gray-600); text-transform:uppercase; letter-spacing:.5px; font-weight:700;">Prontas para envio</div>
              <div style="font-size:1.35rem; font-weight:800; color:var(--success);">${prontas.length}</div>
            </div>
            <div style="padding:.65rem; background:${pendentes.length > 0 ? 'var(--warning-bg)' : 'var(--gray-50)'}; border-radius:6px; text-align:center;">
              <div style="font-size:.62rem; color:var(--gray-600); text-transform:uppercase; letter-spacing:.5px; font-weight:700;">Aguardando anexos</div>
              <div style="font-size:1.35rem; font-weight:800; color:${pendentes.length > 0 ? '#b8740a' : 'var(--gray-500)'};">${pendentes.length}</div>
            </div>
            <div style="padding:.65rem; background:var(--info-bg); border-radius:6px; text-align:center;">
              <div style="font-size:.62rem; color:var(--gray-600); text-transform:uppercase; letter-spacing:.5px; font-weight:700;">Valor total</div>
              <div style="font-size:1.05rem; font-weight:800; color:var(--info);">${fmt.moedaCompact(totalProntas)}</div>
            </div>
          </div>

          ${prontas.length > 0 ? `
            <div style="font-size:.78rem; color:var(--gray-700); font-weight:600; margin-bottom:.4rem;">✓ Prontas para envio</div>
            <div style="max-height:200px; overflow:auto; border:1px solid var(--gray-200); border-radius:6px; margin-bottom:.85rem;">
              <table class="data" style="font-size:.76rem; margin:0;">
                <thead style="position:sticky; top:0; background:var(--white); z-index:1;">
                  <tr>
                    <th class="text-center" style="width:36px;"><input type="checkbox" id="el_chkAll" checked /></th>
                    <th>Fatura</th><th>Cliente</th><th>Competência</th><th class="text-right">Valor</th>
                  </tr>
                </thead>
                <tbody id="el_prontas">
                  ${prontas.map(f => `
                    <tr>
                      <td class="text-center"><input type="checkbox" data-env="${esc(f.id)}" checked /></td>
                      <td><strong>${esc(f.id)}</strong></td>
                      <td>${esc(f.cliente)}</td>
                      <td>${esc(f.competencia)}</td>
                      <td class="text-right num">${fmt.moeda(f.valor)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          ${pendentes.length > 0 ? `
            <details>
              <summary style="cursor:pointer; font-size:.78rem; color:#b8740a; font-weight:600;">
                ⚠ ${pendentes.length} fatura(s) bloqueadas — clique para ver
              </summary>
              <div style="max-height:160px; overflow:auto; border:1px solid var(--gray-200); border-radius:6px; margin-top:.5rem;">
                <table class="data" style="font-size:.74rem; margin:0;">
                  <thead><tr><th>Fatura</th><th>Cliente</th><th>Pendência</th><th></th></tr></thead>
                  <tbody>
                    ${pendentes.map(f => {
                      const a = f.anexos || {};
                      const falt = need.filter(k => !a[k]).length;
                      return `<tr style="opacity:.75;">
                        <td><strong>${esc(f.id)}</strong></td>
                        <td>${esc(f.cliente)}</td>
                        <td><span class="badge warning">${falt} anexo${falt > 1 ? 's' : ''} faltando</span></td>
                        <td class="text-center"><button class="btn btn-ghost btn-sm" data-fix="${esc(f.id)}">⬆ Importar</button></td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </details>
          ` : ''}
          `}
        </div>
        <div class="modal-footer anexo-footer">
          <button class="btn btn-ghost btn-link-back" onclick="closeModal()">← Cancelar</button>
          ${prontas.length > 0 ? `<button class="btn btn-primary" id="btnConfirmaEnvio">📤 Enviar ${prontas.length} fatura(s)</button>` : ''}
        </div>
      </div>
    `);

    if (todasGeradas.length === 0) return;

    const chkAll = document.getElementById('el_chkAll');
    const btnGo = document.getElementById('btnConfirmaEnvio');
    function refreshCount() {
      btnGo.disabled = selSet.size === 0;
      btnGo.textContent = selSet.size === 0 ? '📤 Selecione ao menos uma' : `📤 Enviar ${selSet.size} fatura(s)`;
    }
    if (chkAll) chkAll.addEventListener('change', () => {
      document.querySelectorAll('[data-env]').forEach(c => {
        c.checked = chkAll.checked;
        if (chkAll.checked) selSet.add(c.dataset.env);
        else selSet.delete(c.dataset.env);
      });
      refreshCount();
    });
    document.querySelectorAll('[data-env]').forEach(c => {
      c.addEventListener('change', () => {
        if (c.checked) selSet.add(c.dataset.env);
        else selSet.delete(c.dataset.env);
        refreshCount();
      });
    });
    document.querySelectorAll('[data-fix]').forEach(b => {
      b.addEventListener('click', () => {
        const fat = ds.faturas.find(x => x.id === b.dataset.fix);
        if (fat) { closeModal(); abrirAnexosBoleto(fat); }
      });
    });
    if (btnGo) btnGo.addEventListener('click', () => {
      const ids = Array.from(selSet);
      ids.forEach(id => window.dataStore.enviarFatura(id));
      closeModal();
      setTimeout(() => alert('✓ ' + ids.length + ' fatura(s) enviada(s).'), 100);
    });
  });

  // Botão gerar lote
  root.querySelector('#btnGerarLote').addEventListener('click', () => {
    const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const ativos = ds.contratos.filter(c => c.status === 'ativo');
    const selecionados = new Set(ativos.map(c => c.id)); // todos pré-selecionados
    const hoje = new Date();
    const vencDef = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 15).toISOString().slice(0, 10);
    const compDef = MESES[hoje.getMonth()] + '/' + String(hoje.getFullYear()).slice(-2);

    function compOptions(selecionada) {
      const opts = [];
      for (let i = -2; i <= 2; i++) {
        const dt = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
        const v = MESES[dt.getMonth()] + '/' + String(dt.getFullYear()).slice(-2);
        opts.push(`<option value="${v}" ${v === selecionada ? 'selected' : ''}>${v}</option>`);
      }
      return opts.join('');
    }

    openModal(`
      <div class="modal" style="max-width: 640px;">
        <div class="modal-header">
          <h3>⚡ Geração de Faturas em Lote</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          ${ativos.length === 0 ? `
            <div style="text-align:center; padding:1.5rem; color:var(--gray-600);">
              <div style="font-size:2.4rem;">📭</div>
              <div style="font-weight:600; margin-top:.4rem;">Nenhum contrato ativo</div>
              <div style="font-size:.78rem; margin-top:.3rem;">Cadastre contratos ativos antes de gerar faturas em lote.</div>
            </div>
          ` : `
          <p style="font-size:.85rem; color:var(--gray-700); margin-bottom:1rem;">
            Será gerada <strong>uma fatura por contrato ativo</strong> usando o valor mensal acordado em cada contrato.
            Faturas duplicadas (mesma competência + cliente) são automaticamente ignoradas.
          </p>

          <div class="form-grid">
            <div class="form-row">
              <label>Competência <span style="color:var(--danger);">*</span></label>
              <select id="lt_comp">${compOptions(compDef)}</select>
            </div>
            <div class="form-row">
              <label>Vencimento <span style="color:var(--danger);">*</span></label>
              <input type="date" id="lt_venc" value="${vencDef}" />
            </div>
          </div>

          <div id="lt_resumo" style="margin-top:1rem;"></div>

          <div style="margin-top:1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:.5rem;">
              <div style="font-size:.78rem; color:var(--gray-700); font-weight:600;">
                📋 Selecione os contratos a incluir <span id="lt_selCount" style="color:var(--gray-500); font-weight:400;"></span>
              </div>
              <div style="display:flex; gap:.4rem;">
                <button class="btn btn-ghost btn-sm" id="lt_selAll" type="button">✓ Todos</button>
                <button class="btn btn-ghost btn-sm" id="lt_selNone" type="button">✕ Nenhum</button>
                <button class="btn btn-ghost btn-sm" id="lt_selNew" type="button">↻ Só novos</button>
              </div>
            </div>
            <div style="max-height:260px; overflow:auto; border:1px solid var(--gray-200); border-radius:6px;">
              <table class="data" style="font-size:.76rem; margin:0;">
                <thead style="position:sticky; top:0; background:var(--white); z-index:1;">
                  <tr>
                    <th class="text-center" style="width:36px;"><input type="checkbox" id="lt_chkAll" /></th>
                    <th>Cliente</th>
                    <th>Contrato</th>
                    <th class="text-right">Valor</th>
                    <th class="text-center">Status</th>
                  </tr>
                </thead>
                <tbody id="lt_preview"></tbody>
              </table>
            </div>
          </div>
          `}
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          ${ativos.length > 0 ? '<button class="btn btn-primary" id="btnConfirmaLote">⚡ Gerar agora</button>' : ''}
        </div>
      </div>
    `);

    if (ativos.length === 0) return;

    const selComp = document.getElementById('lt_comp');
    const inpVenc = document.getElementById('lt_venc');
    const resumoEl = document.getElementById('lt_resumo');
    const previewEl = document.getElementById('lt_preview');

    function refresh() {
      const comp = selComp.value;
      const linhas = ativos.map(c => {
        const jaExiste = (ds.faturas || []).some(f => f.clienteId === c.clienteId && f.competencia === comp);
        return { c, jaExiste, marcado: selecionados.has(c.id) };
      });
      const aGerar = linhas.filter(l => l.marcado && !l.jaExiste);
      const dup = linhas.filter(l => l.marcado && l.jaExiste).length;
      const ignorados = linhas.filter(l => !l.marcado).length;
      const total = aGerar.reduce((a, l) => a + (l.c.valorMensal || 0), 0);

      resumoEl.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:.5rem;">
          <div style="padding:.65rem; background:var(--success-bg); border-radius:6px; text-align:center;">
            <div style="font-size:.62rem; color:var(--gray-600); text-transform:uppercase; letter-spacing:.5px; font-weight:700;">A gerar</div>
            <div style="font-size:1.35rem; font-weight:800; color:var(--success);">${aGerar.length}</div>
          </div>
          <div style="padding:.65rem; background:${dup > 0 ? 'var(--warning-bg)' : 'var(--gray-50)'}; border-radius:6px; text-align:center;">
            <div style="font-size:.62rem; color:var(--gray-600); text-transform:uppercase; letter-spacing:.5px; font-weight:700;">Duplicadas</div>
            <div style="font-size:1.35rem; font-weight:800; color:${dup > 0 ? '#b8740a' : 'var(--gray-500)'};">${dup}</div>
          </div>
          <div style="padding:.65rem; background:var(--gray-50); border-radius:6px; text-align:center;">
            <div style="font-size:.62rem; color:var(--gray-600); text-transform:uppercase; letter-spacing:.5px; font-weight:700;">Excluídas</div>
            <div style="font-size:1.35rem; font-weight:800; color:var(--gray-500);">${ignorados}</div>
          </div>
          <div style="padding:.65rem; background:var(--info-bg); border-radius:6px; text-align:center;">
            <div style="font-size:.62rem; color:var(--gray-600); text-transform:uppercase; letter-spacing:.5px; font-weight:700;">Total</div>
            <div style="font-size:1.05rem; font-weight:800; color:var(--info);">${fmt.moedaCompact(total)}</div>
          </div>
        </div>
      `;

      previewEl.innerHTML = linhas.map(l => `
        <tr style="${!l.marcado ? 'opacity:.45;' : ''}">
          <td class="text-center"><input type="checkbox" data-sel="${esc(l.c.id)}" ${l.marcado ? 'checked' : ''} /></td>
          <td>${esc(l.c.cliente)}</td>
          <td><span style="font-family:monospace; font-size:.7rem;">${esc(l.c.id)}</span></td>
          <td class="text-right num">${fmt.moeda(l.c.valorMensal || 0)}</td>
          <td class="text-center">${l.jaExiste ? '<span class="badge warning">duplicada</span>' : '<span class="badge success">nova</span>'}</td>
        </tr>
      `).join('');

      // Atualiza checkbox header e contador
      const chkAll = document.getElementById('lt_chkAll');
      if (chkAll) {
        chkAll.checked = selecionados.size === linhas.length;
        chkAll.indeterminate = selecionados.size > 0 && selecionados.size < linhas.length;
      }
      const cnt = document.getElementById('lt_selCount');
      if (cnt) cnt.textContent = `(${selecionados.size}/${linhas.length} marcados)`;

      // Bind checkboxes de linha
      previewEl.querySelectorAll('[data-sel]').forEach(chk => {
        chk.addEventListener('change', () => {
          if (chk.checked) selecionados.add(chk.dataset.sel);
          else selecionados.delete(chk.dataset.sel);
          refresh();
        });
      });

      // Habilita/desabilita botão de gerar
      const btnGo = document.getElementById('btnConfirmaLote');
      if (btnGo) {
        btnGo.disabled = aGerar.length === 0;
        btnGo.textContent = aGerar.length === 0 ? '⚡ Nenhuma fatura a gerar' : `⚡ Gerar ${aGerar.length} fatura(s)`;
      }
    }
    selComp.addEventListener('change', refresh);

    // Bind controles de seleção em massa
    document.getElementById('lt_chkAll').addEventListener('change', (e) => {
      if (e.target.checked) ativos.forEach(c => selecionados.add(c.id));
      else selecionados.clear();
      refresh();
    });
    document.getElementById('lt_selAll').addEventListener('click', () => {
      ativos.forEach(c => selecionados.add(c.id));
      refresh();
    });
    document.getElementById('lt_selNone').addEventListener('click', () => {
      selecionados.clear();
      refresh();
    });
    document.getElementById('lt_selNew').addEventListener('click', () => {
      const comp = selComp.value;
      selecionados.clear();
      ativos.forEach(c => {
        const jaExiste = (ds.faturas || []).some(f => f.clienteId === c.clienteId && f.competencia === comp);
        if (!jaExiste) selecionados.add(c.id);
      });
      refresh();
    });

    refresh();

    document.getElementById('btnConfirmaLote').addEventListener('click', () => {
      const comp = selComp.value;
      const vencISO = inpVenc.value;
      if (!vencISO) { alert('Informe a data de vencimento.'); return; }
      if (selecionados.size === 0) { alert('Selecione ao menos um contrato.'); return; }
      const vencBR = vencISO.split('-').reverse().join('/');
      const qtd = window.dataStore.gerarLote(comp, vencBR, Array.from(selecionados));
      closeModal();
      setTimeout(() => alert('✓ ' + qtd + ' fatura(s) gerada(s) em lote para ' + comp + '.\nVencimento: ' + vencBR), 100);
    });
  });
};
})();

// ============================================================
// VISUALIZADOR de anexos (read-only) — separado do importador
// ============================================================
function verAnexosBoleto(f) {
  f.anexos = f.anexos || { qrcode: false, codbarras: false, printConta: false };
  const ALL = [
    { k:'qrcode',     l:'QR Code Pix',      i:'📱', d:'QR de cobrança gerado para esta fatura.' },
    { k:'codbarras',  l:'Código de barras', i:'🏷', d:'Barcode + linha digitável do boleto.' },
    { k:'printConta', l:'Print da conta',   i:'📄', d:'Captura da conta de luz do mês.' }
  ];
  const tpl = window.faturaTemplateStore.get();
  const itens = ALL.filter(x => !tpl[x.k]);
  const importados = itens.filter(x => f.anexos[x.k]);
  const completo = importados.length === itens.length;

  openModal(`
    <div class="modal" style="max-width:720px;">
      <div class="modal-header">
        <h3>📎 Documentos anexados · ${esc(f.id)}</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap; margin-bottom:1rem; padding:.7rem .9rem; background:var(--gray-50); border-radius:6px;">
          <div style="font-size:.82rem; color:var(--gray-700);">
            <strong>${esc(f.cliente)}</strong> · ${esc(f.competencia)} · ${fmt.moeda(f.valor)}
          </div>
          <span class="anexo-pill ${completo ? 'ok' : (importados.length === 0 ? 'danger' : 'warn')}">
            ${completo ? '✓' : (importados.length === 0 ? '⬆' : '⚠')} ${importados.length}/${itens.length}
          </span>
        </div>

        <div class="anexo-gallery">
          ${itens.map(x => {
            const ok = !!f.anexos[x.k];
            return `
              <div class="anexo-thumb ${ok ? 'has-file' : 'empty'}">
                <div class="anexo-thumb-preview">
                  ${ok
                    ? `<div class="anexo-thumb-icon">${x.i}</div>
                       <div class="anexo-thumb-meta">
                         <span class="anexo-thumb-file">arquivo-${x.k}.png</span>
                         <span class="anexo-thumb-size">124 KB</span>
                       </div>`
                    : `<div class="anexo-thumb-empty">
                         <div style="font-size:1.8rem; opacity:.4;">${x.i}</div>
                         <div style="font-size:.7rem; color:var(--gray-500); margin-top:.3rem;">Não enviado</div>
                       </div>`}
                </div>
                <div class="anexo-thumb-label">
                  <strong>${x.l}</strong>
                  <span>${x.d}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top:1rem; padding:.6rem .8rem; background:var(--info-bg); border-left:3px solid var(--info); border-radius:6px; font-size:.72rem; color:var(--gray-700);">
          ℹ Esta tela é apenas para visualização. Para enviar ou substituir um arquivo, use <strong>"⬆ Importar / atualizar"</strong>.
        </div>
      </div>
      <div class="modal-footer anexo-footer">
        <button class="btn btn-ghost btn-link-back" onclick="closeModal()">← Voltar para faturas</button>
        <button class="btn btn-primary" id="btnGoImport">⬆ Importar / atualizar anexos</button>
      </div>
    </div>
  `);

  document.getElementById('btnGoImport').addEventListener('click', () => {
    closeModal();
    abrirAnexosBoleto(f);
  });
}

function abrirAnexosBoleto(f) {
  f.anexos = f.anexos || { qrcode: false, codbarras: false, printConta: false };
  const ALL = [
    { k:'qrcode',     l:'QR Code Pix',      i:'📱', d:'Imagem do QR de cobrança gerada para esta fatura.', tipos:'PNG, JPG' },
    { k:'codbarras',  l:'Código de barras', i:'🏷', d:'Imagem do barcode + linha digitável do boleto.',   tipos:'PNG, JPG' },
    { k:'printConta', l:'Print da conta',   i:'📄', d:'Captura da conta de luz do mês com a leitura.',   tipos:'PNG, JPG, PDF' }
  ];

  function render() {
    const a = f.anexos;
    const tpl = window.faturaTemplateStore.get();
    const need = ALL.filter(x => !tpl[x.k]);
    const padroes = ALL.filter(x => tpl[x.k]);
    const importados = need.filter(x => a[x.k]).length;
    const totalNeed = need.length;
    const completo = totalNeed === 0 || importados === totalNeed;

    const headerStatus = totalNeed === 0
      ? `<span class="anexo-pill ok">✓ Tudo padrão do template</span>`
      : (completo
          ? `<span class="anexo-pill ok">✓ ${importados}/${totalNeed} completos</span>`
          : `<span class="anexo-pill ${importados === 0 ? 'danger' : 'warn'}">${importados}/${totalNeed} importados · faltam ${totalNeed - importados}</span>`);

    const row = (x) => {
      const ok = !!a[x.k];
      return `
      <div class="anexo-row ${ok ? 'is-ok' : 'is-pending'}">
        <div class="anexo-row-icon">${x.i}</div>
        <div class="anexo-row-body">
          <div class="anexo-row-title">${x.l}</div>
          <div class="anexo-row-desc">${x.d}</div>
          <div class="anexo-row-meta">Aceita: ${x.tipos} · máx 5 MB</div>
        </div>
        <div class="anexo-row-status">
          ${ok
            ? `<div class="anexo-status-ok">
                 <span>✓ Importado</span>
                 <span class="anexo-file">arquivo-${x.k}.png · 124 KB</span>
               </div>
               <div class="anexo-row-actions">
                 <button class="btn btn-ghost btn-sm" data-up="${x.k}">↻ Substituir</button>
                 <button class="btn btn-ghost btn-sm danger" data-clear="${x.k}">🗑 Remover</button>
               </div>`
            : `<button class="btn btn-primary btn-sm" data-up="${x.k}">⬆ Importar arquivo</button>`}
        </div>
      </div>`;
    };

    openModal(`
      <div class="modal" style="max-width:680px;">
        <div class="modal-header">
          <h3>⬆ Importar anexos · ${esc(f.id)}</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap; margin-bottom:1rem; padding:.7rem .9rem; background:var(--gray-50); border-radius:6px;">
            <div style="font-size:.82rem; color:var(--gray-700);">
              <strong>${esc(f.cliente)}</strong> · ${esc(f.competencia)} · ${fmt.moeda(f.valor)}
            </div>
            ${headerStatus}
          </div>

          ${totalNeed === 0 ? `
            <div style="text-align:center; padding:1.5rem; background:var(--success-bg); border-radius:8px;">
              <div style="font-size:2.2rem;">✓</div>
              <div style="font-weight:700; color:var(--success); margin-top:.3rem;">Nenhum anexo necessário</div>
              <div style="font-size:.78rem; color:var(--gray-600); margin-top:.3rem; max-width:380px; margin-left:auto; margin-right:auto;">
                As 3 imagens estão configuradas como <strong>padrão do template</strong> em Configurações → Template de Fatura. Elas serão usadas automaticamente na geração do PDF.
              </div>
            </div>
          ` : `
            <div class="anexo-list">
              ${need.map(row).join('')}
            </div>
          `}

          ${padroes.length > 0 && totalNeed > 0 ? `
            <div style="margin-top:1rem; padding:.65rem .8rem; background:var(--gray-50); border-radius:6px;">
              <div style="font-size:.66rem; color:var(--gray-500); text-transform:uppercase; letter-spacing:.5px; font-weight:700; margin-bottom:.3rem;">
                ✓ Usando padrão do template (${padroes.length})
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:.4rem;">
                ${padroes.map(x => `<span style="font-size:.74rem; padding:3px 8px; background:var(--white); border:1px solid var(--gray-200); border-radius:999px;">${x.i} ${x.l}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          <div style="margin-top:1rem; padding:.6rem .8rem; background:var(--info-bg); border-left:3px solid var(--info); border-radius:6px; font-size:.72rem; color:var(--gray-700);">
            ℹ Arquivos versionados em <code style="font-size:.7rem;">s3://faturas/${esc(f.tenantId||'tenant')}/${esc(f.id)}/</code> e referenciados pelo template ao montar o PDF final.
          </div>
        </div>
        <div class="modal-footer anexo-footer">
          <button class="btn btn-ghost btn-link-back" onclick="closeModal()">← Voltar para faturas</button>
          <div class="anexo-footer-actions">
            ${totalNeed > 0 && !completo ? `
              <button class="btn btn-secondary" id="btnUpAll" title="Importa de uma vez os ${totalNeed - importados} arquivos pendentes">
                ⬆ Importar ${totalNeed - importados} pendente${totalNeed - importados > 1 ? 's' : ''}
              </button>` : ''}
            ${completo ? `<button class="btn btn-outline" id="btnGoView">👁 Ver galeria</button>` : ''}
            ${completo && f.status === 'gerada'
              ? `<button class="btn btn-primary" id="btnEnviarAqui">📤 Enviar fatura agora →</button>`
              : (completo ? `<button class="btn btn-primary" onclick="closeModal()">✓ Concluído</button>` : '')}
          </div>
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
    const btnAll = document.getElementById('btnUpAll');
    if (btnAll) btnAll.addEventListener('click', () => {
      need.forEach(x => f.anexos[x.k] = true);
      window.dispatchEvent(new CustomEvent('data-changed'));
      render();
    });
    const btnEnv = document.getElementById('btnEnviarAqui');
    if (btnEnv) btnEnv.addEventListener('click', () => {
      window.dataStore.enviarFatura(f.id);
      closeModal();
    });
    const btnView = document.getElementById('btnGoView');
    if (btnView) btnView.addEventListener('click', () => {
      closeModal();
      verAnexosBoleto(f);
    });
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
            <h4>Ciclo de vida desta fatura</h4>
            ${steps(['Gerada','Enviada','Aberta','Paga'],
              f.status === 'paga' ? 3 :
              (f.status === 'aberta' || f.status === 'vencida') ? 2 :
              f.status === 'enviada' ? 1 : 0)}
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
            <h4 style="color: #b8740a;">📎 Anexo obrigatório — Print da conta de luz</h4>
            <p style="font-size: 0.8rem; color: var(--gray-700); margin-top: 4px;">
              Como a conta de luz deste cliente está em nome da comercializadora, o sistema anexa automaticamente o print da conta de luz do mês com a leitura do consumo.
            </p>
            <div style="margin-top: 0.5rem; padding: 0.5rem; background: var(--white); border-radius: 4px; font-size: 0.78rem; color: var(--gray-600); display: flex; align-items: center; gap: 0.5rem;">
              📄 conta-luz-${esc(f.competencia.toLowerCase().replace('/', '-'))}-${esc(f.clienteId)}.pdf
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
