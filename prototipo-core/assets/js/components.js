// ============================================================
// Helpers para renderizar componentes reutilizáveis
// ============================================================

(function() {
  // Badge de status (texto -> classe + label)
  window.statusBadge = function(status) {
    const map = {
      ativo:    { cls: 'success', label: 'Ativo' },
      inativo:  { cls: 'gray',    label: 'Inativo' },
      pendente: { cls: 'warning', label: 'Pendente' },
      encerrado:{ cls: 'gray',    label: 'Encerrado' },
      paga:     { cls: 'success', label: 'Paga' },
      vencida:  { cls: 'danger',  label: 'Vencida' },
      aberta:   { cls: 'info',    label: 'Aberta' },
      enviada:  { cls: 'info',    label: 'Enviada' },
      gerada:   { cls: 'gray',    label: 'Gerada' },
      operando: { cls: 'success', label: 'Operando' }
    };
    const m = map[status] || { cls: 'gray', label: status };
    return `<span class="badge ${m.cls}">${m.label}</span>`;
  };

  // Modal
  window.openModal = function(html) {
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = html;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    return overlay;
  };

  window.closeModal = function() {
    const existing = document.querySelector('.modal-overlay');
    if (existing) {
      existing.remove();
      document.body.style.overflow = '';
    }
  };

  // Header da view
  window.viewHeader = function(title, subtitle, actionsHtml) {
    return `
      <div class="view-header">
        <div>
          <h1>${esc(title)}</h1>
          ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
        </div>
        ${actionsHtml ? `<div class="view-actions">${actionsHtml}</div>` : ''}
      </div>
    `;
  };

  // Bar chart simples
  window.barChart = function(items, formatter) {
    const fmtFn = formatter || ((v) => v);
    const max = Math.max(...items.map(i => i.valor));
    return `
      <div class="bar-chart-wrap">
        <div class="bar-chart">
          ${items.map(i => {
            const pct = max ? (i.valor / max * 100) : 0;
            return `
              <div class="bar" style="height: ${pct}%">
                <span class="value">${fmtFn(i.valor)}</span>
                <span class="label">${esc(i.mes || i.label)}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  };

  // ===== Kebab menu (lista de ações) =====
  // Uso:
  //   kebab([
  //     { icon: '👁', label: 'Ver detalhes', onClick: () => ... },
  //     { icon: '✎', label: 'Editar', onClick: () => ... },
  //     { divider: true },
  //     { icon: '🗑', label: 'Excluir', danger: true, onClick: () => ... }
  //   ])
  window._menus = {};
  let _menuCounter = 0;

  window.kebab = function(items) {
    const id = '_m' + (++_menuCounter);
    window._menus[id] = items;
    return '<button class="kebab-btn" data-menu="' + id + '" title="Mais ações">⋮</button>';
  };

  // Limpar registry quando a rota muda (evita acúmulo)
  window.clearMenus = function() {
    window._menus = {};
    _menuCounter = 0;
    window._pagCbs = {};
    _pagCounter = 0;
    closeAnyMenu();
  };

  // ===== Paginação =====
  // Uso:
  //   const p = paginar(lista, pageSize, paginaAtual);
  //   tbody.innerHTML = p.items.map(...).join('');
  //   tableWrap.insertAdjacentHTML('beforeend', paginacao(p, novaPagina => { paginaAtual = novaPagina; render(); }));
  window._pagCbs = {};
  let _pagCounter = 0;

  window.paginar = function(list, pageSize, page) {
    pageSize = pageSize || 15;
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    page = Math.min(Math.max(1, page || 1), totalPages);
    const start = (page - 1) * pageSize;
    return {
      items: list.slice(start, start + pageSize),
      page,
      pageSize,
      totalPages,
      total,
      start: total === 0 ? 0 : start + 1,
      end: Math.min(start + pageSize, total)
    };
  };

  function pageButtons(current, total) {
    // Mostra: 1 ... (current-1) current (current+1) ... total
    if (total <= 7) {
      const out = [];
      for (let i = 1; i <= total; i++) out.push(i);
      return out;
    }
    const out = [1];
    if (current > 3) out.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) out.push(i);
    if (current < total - 2) out.push('...');
    out.push(total);
    return out;
  }

  window.paginacao = function(p, onChange) {
    const id = '_p' + (++_pagCounter);
    window._pagCbs[id] = onChange;
    if (p.total === 0) return '';
    const btns = pageButtons(p.page, p.totalPages);
    return `
      <div class="pagination" data-pid="${id}">
        <div class="info">Mostrando <strong>${p.start}</strong>–<strong>${p.end}</strong> de <strong>${p.total}</strong></div>
        <div class="controls">
          <button class="pg-btn" data-pg="first" ${p.page === 1 ? 'disabled' : ''} title="Primeira página">«</button>
          <button class="pg-btn" data-pg="prev" ${p.page === 1 ? 'disabled' : ''} title="Anterior">‹</button>
          ${btns.map(b => b === '...'
            ? '<span class="pg-ellipsis">…</span>'
            : `<button class="pg-btn ${b === p.page ? 'active' : ''}" data-pg="${b}">${b}</button>`
          ).join('')}
          <button class="pg-btn" data-pg="next" ${p.page === p.totalPages ? 'disabled' : ''} title="Próxima">›</button>
          <button class="pg-btn" data-pg="last" ${p.page === p.totalPages ? 'disabled' : ''} title="Última página">»</button>
        </div>
        <div class="pg-size">
          Por página:
          <select data-pgsize>
            ${[10, 15, 25, 50, 100].map(s => `<option ${s === p.pageSize ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
    `;
  };

  // Delegação global para clicks de paginação
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.pagination .pg-btn');
    if (!btn || btn.disabled) return;
    const wrap = btn.closest('.pagination');
    const id = wrap.dataset.pid;
    const cb = window._pagCbs[id];
    if (!cb) return;
    const v = btn.dataset.pg;
    const current = +wrap.querySelector('.pg-btn.active').textContent;
    const last = +wrap.querySelector('.pg-btn[data-pg="last"]').dataset.pg || current;
    let novaPagina = current;
    if (v === 'first') novaPagina = 1;
    else if (v === 'prev') novaPagina = Math.max(1, current - 1);
    else if (v === 'next') novaPagina = current + 1;
    else if (v === 'last') {
      const all = [...wrap.querySelectorAll('.pg-btn[data-pg]')]
        .map(b => +b.dataset.pg).filter(n => !isNaN(n));
      novaPagina = Math.max(...all);
    }
    else novaPagina = +v;
    cb(novaPagina, null);
  });
  document.addEventListener('change', function(e) {
    const sel = e.target.closest('.pagination [data-pgsize]');
    if (!sel) return;
    const wrap = sel.closest('.pagination');
    const cb = window._pagCbs[wrap.dataset.pid];
    if (cb) cb(1, +sel.value);
  });

  function closeAnyMenu() {
    document.querySelectorAll('.kebab-menu').forEach(m => m.remove());
  }

  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.kebab-btn');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.menu;
      const items = window._menus[id];
      if (!items) return;
      const wasOpen = btn.classList.contains('menu-open');
      closeAnyMenu();
      document.querySelectorAll('.kebab-btn.menu-open, .user-avatar.menu-open').forEach(b => b.classList.remove('menu-open'));
      if (wasOpen) return;
      btn.classList.add('menu-open');

      const rect = btn.getBoundingClientRect();
      const menu = document.createElement('div');
      menu.className = 'kebab-menu';
      menu.innerHTML = items.map((it, i) => {
        if (it.divider) return '<div class="divider"></div>';
        const cls = it.danger ? 'danger' : (it.success ? 'success' : (it.warning ? 'warning' : (it.info ? 'info' : '')));
        return '<button class="item ' + cls + '" data-i="' + i + '">' +
               '<span class="icon">' + (it.icon || '') + '</span>' +
               '<span>' + esc(it.label) + '</span></button>';
      }).join('');
      document.body.appendChild(menu);

      // Posicionamento: tenta abrir abaixo e à esquerda do botão
      const mr = menu.getBoundingClientRect();
      let top = rect.bottom + 4;
      let left = rect.right - mr.width;
      if (top + mr.height > window.innerHeight - 8) top = rect.top - mr.height - 4;
      if (left < 8) left = 8;
      if (left + mr.width > window.innerWidth - 8) left = window.innerWidth - mr.width - 8;
      menu.style.top = top + 'px';
      menu.style.left = left + 'px';

      menu.querySelectorAll('[data-i]').forEach(it => {
        it.addEventListener('click', function(ev) {
          ev.stopPropagation();
          const i = +it.dataset.i;
          closeAnyMenu();
          document.querySelectorAll('.kebab-btn.menu-open, .user-avatar.menu-open').forEach(b => b.classList.remove('menu-open'));
          if (items[i] && items[i].onClick) items[i].onClick();
        });
      });
      return;
    }
    if (!e.target.closest('.kebab-menu')) {
      closeAnyMenu();
      document.querySelectorAll('.kebab-btn.menu-open, .user-avatar.menu-open').forEach(b => b.classList.remove('menu-open'));
    }
  });

  window.addEventListener('hashchange', () => {
    closeAnyMenu();
    document.querySelectorAll('.kebab-btn.menu-open, .user-avatar.menu-open').forEach(b => b.classList.remove('menu-open'));
  });

  // Steps (state machine)
  window.steps = function(stepsList, currentIndex) {
    return `
      <div class="steps">
        ${stepsList.map((s, i) => {
          const cls = i < currentIndex ? 'done' : (i === currentIndex ? 'current' : '');
          const isLast = i === stepsList.length - 1;
          return `
            <div class="step ${cls}">
              <div class="dot">${i < currentIndex ? '✓' : (i + 1)}</div>
              <span>${esc(s)}</span>
            </div>
            ${!isLast ? `<div class="step ${i < currentIndex ? 'done' : ''}"><div class="connector"></div></div>` : ''}
          `;
        }).join('')}
      </div>
    `;
  };
})();
