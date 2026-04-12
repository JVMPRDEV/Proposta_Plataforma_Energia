// ============================================================
// Router — hash-based, simples
// ============================================================

(function() {
  const routes = {
    '/dashboard':      { title: 'Dashboard',                view: 'dashboard',     icon: 'home' },
    '/clientes':       { title: 'Clientes',                 view: 'clientes',      icon: 'users' },
    '/ucs':            { title: 'Unidades Consumidoras',    view: 'ucs',           icon: 'plug' },
    '/contratos':      { title: 'Contratos',                view: 'contratos',     icon: 'file' },
    '/geracao':        { title: 'Geração / Produção',       view: 'geracao',       icon: 'sun' },
    '/creditos':       { title: 'Distribuição de Créditos', view: 'creditos',      icon: 'split' },
    '/faturamento':    { title: 'Faturamento',              view: 'faturamento',   icon: 'invoice' },
    '/relatorios':     { title: 'Relatórios & Aging',       view: 'relatorios',    icon: 'chart' },
    '/permissoes':     { title: 'Perfis & Permissões',       view: 'permissoes',    icon: 'shield' },
    '/configuracoes':  { title: 'Configurações',            view: 'configuracoes', icon: 'gear' },
    '/perfil':         { title: 'Meu Perfil',               view: 'perfil',        icon: 'user', hidden: true },
    '/ajuda':          { title: 'Ajuda & Documentação',     view: 'ajuda',         icon: 'file', hidden: true }
  };

  window.ROUTES = routes;

  const NAV_GROUPS = [
    { label: 'Operação', items: ['/dashboard', '/clientes', '/ucs', '/contratos'] },
    { label: 'Energia', items: ['/geracao', '/creditos'] },
    { label: 'Financeiro', items: ['/faturamento', '/relatorios'] },
    { label: 'Sistema', items: ['/permissoes', '/configuracoes'] }
  ];
  window.NAV_GROUPS = NAV_GROUPS;

  // Ícones SVG inline
  const ICONS = {
    home:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/></svg>',
    users:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><circle cx="17" cy="8" r="3"/><path d="M22 21a5 5 0 0 0-6-5"/></svg>',
    plug:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2v6"/><path d="M15 2v6"/><path d="M5 8h14v4a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z"/><path d="M12 17v5"/></svg>',
    file:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 13h6M9 17h6"/></svg>',
    sun:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    split:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v6"/><path d="M12 9 6 21"/><path d="M12 9l6 12"/><circle cx="12" cy="3" r="1"/></svg>',
    invoice:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V8z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
    card:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
    chat:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    chart:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/></svg>',
    gear:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z"/><path d="m9 12 2 2 4-4"/></svg>',
    user:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>'
  };
  window.ICONS = ICONS;

  function parseHash() {
    const h = location.hash.slice(1) || '/dashboard';
    return h;
  }
  function matchClienteDetail(path) {
    const m = path.match(/^\/clientes\/([^/]+)$/);
    return m ? m[1] : null;
  }
  function matchContratoDetail(path) {
    const m = path.match(/^\/contratos\/([^/]+)$/);
    return m ? m[1] : null;
  }

  function navigate(path) {
    location.hash = path;
  }
  window.navigate = navigate;

  function render() {
    if (!localStorage.getItem('proto_user')) {
      location.replace('index.html');
      return;
    }
    if (window.clearMenus) window.clearMenus();
    const path = parseHash();
    const viewEl = document.getElementById('view');
    // Detalhe de cliente
    const cliId = matchClienteDetail(path);
    if (cliId && typeof window.view_cliente_detalhe === 'function') {
      document.title = 'Cliente · ESQ Plataforma';
      const bc = document.querySelector('.breadcrumb');
      if (bc) bc.innerHTML = '<span>Plataforma</span> / <a href="#/clientes" style="color: inherit;">Clientes</a> / <strong>' + esc(cliId) + '</strong>';
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.toggle('active', l.dataset.path === '/clientes'));
      viewEl.innerHTML = '';
      window.view_cliente_detalhe(viewEl, cliId);
      document.querySelector('.main').scrollTop = 0;
      return;
    }
    // Detalhe de contrato
    const ctId = matchContratoDetail(path);
    if (ctId && typeof window.view_contrato_detalhe === 'function') {
      document.title = 'Contrato · ESQ Plataforma';
      const bc = document.querySelector('.breadcrumb');
      if (bc) bc.innerHTML = '<span>Plataforma</span> / <a href="#/contratos" style="color: inherit;">Contratos</a> / <strong>' + esc(ctId) + '</strong>';
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.toggle('active', l.dataset.path === '/contratos'));
      viewEl.innerHTML = '';
      window.view_contrato_detalhe(viewEl, ctId);
      document.querySelector('.main').scrollTop = 0;
      return;
    }
    const route = routes[path];
    if (!route) {
      viewEl.innerHTML = '<div class="empty"><div class="icon">⚠️</div><h2>Rota não encontrada</h2><p>' + esc(path) + '</p></div>';
      return;
    }
    document.title = route.title + ' · ESQ Plataforma';
    // Atualiza breadcrumb
    const bc = document.querySelector('.breadcrumb');
    if (bc) bc.innerHTML = '<span>Plataforma</span> / <strong>' + esc(route.title) + '</strong>';
    // Marca link ativo
    document.querySelectorAll('.sidebar-link').forEach(l => {
      l.classList.toggle('active', l.dataset.path === path);
    });
    // Renderiza view
    const viewFn = window['view_' + route.view];
    if (typeof viewFn === 'function') {
      viewEl.innerHTML = '';
      viewFn(viewEl);
    } else {
      viewEl.innerHTML = '<div class="empty"><div class="icon">🚧</div><h2>' + esc(route.title) + '</h2><p>Em construção</p></div>';
    }
    viewEl.scrollTop = 0;
    document.querySelector('.main').scrollTop = 0;
  }
  window.renderRoute = render;

  window.addEventListener('hashchange', render);
  window.addEventListener('tenant-changed', () => render());
})();
