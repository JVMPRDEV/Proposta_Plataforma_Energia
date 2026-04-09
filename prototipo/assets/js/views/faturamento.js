// ============================================================
// View: Faturamento ⭐ (wow factor)
// ============================================================

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
      tbody.innerHTML = '<tr><td colspan="8" class="empty">Nenhuma fatura encontrada</td></tr>';
      root.querySelector('#pgWrap').innerHTML = '';
      return;
    }
    root.querySelector('#pgWrap').innerHTML = paginacao(p, (np, ns) => {
      if (ns) pageSize = ns;
      pagina = np;
      renderTable();
    });
    tbody.innerHTML = p.items.map(f => {
      const items = [
        { icon: '👁', label: 'Ver preview', onClick: () => abrirPreviewFatura(f, ds.tenant) }
      ];
      if (f.status === 'gerada') {
        items.push({ icon: '📤', label: 'Enviar fatura', info: true, onClick: () => window.dataStore.enviarFatura(f.id) });
      }
      if (['gerada','enviada','aberta','vencida'].includes(f.status)) {
        items.push({ icon: '✓', label: 'Marcar como paga', success: true, onClick: () => {
          if (confirm('Marcar fatura ' + f.id + ' como paga?')) window.dataStore.marcarPaga(f.id);
        }});
      }
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
    const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const ativos = ds.contratos.filter(c => c.status === 'ativo');
    const selecionados = new Set(ativos.map(c => c.id));
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

      const chkAll = document.getElementById('lt_chkAll');
      if (chkAll) {
        chkAll.checked = selecionados.size === linhas.length;
        chkAll.indeterminate = selecionados.size > 0 && selecionados.size < linhas.length;
      }
      const cnt = document.getElementById('lt_selCount');
      if (cnt) cnt.textContent = `(${selecionados.size}/${linhas.length} marcados)`;

      previewEl.querySelectorAll('[data-sel]').forEach(chk => {
        chk.addEventListener('change', () => {
          if (chk.checked) selecionados.add(chk.dataset.sel);
          else selecionados.delete(chk.dataset.sel);
          refresh();
        });
      });

      const btnGo = document.getElementById('btnConfirmaLote');
      if (btnGo) {
        btnGo.disabled = aGerar.length === 0;
        btnGo.textContent = aGerar.length === 0 ? '⚡ Nenhuma fatura a gerar' : `⚡ Gerar ${aGerar.length} fatura(s)`;
      }
    }
    selComp.addEventListener('change', refresh);

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
        <button class="btn btn-outline">📧 Reenviar por e-mail</button>
        <button class="btn btn-success">💬 Enviar via WhatsApp</button>
        <button class="btn btn-primary" onclick="closeModal()">Fechar</button>
      </div>
    </div>
  `);
}
