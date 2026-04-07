// ============================================================
// Notificações in-app — simulação de SignalR push
// Em produção: hub SignalR (NotificationsHub) emite eventos para
// o cliente Vue conectado pelo tenantId. Aqui simulamos com
// eventos custom + localStorage por tenant.
// ============================================================

(function() {
  const KEY = 'proto_notifs_v1';

  const TIPOS = {
    fatura:    { icon: '🧾', cor: '#3498db', label: 'Faturamento' },
    pagamento: { icon: '💰', cor: '#27ae60', label: 'Pagamento'  },
    whatsapp:  { icon: '📤', cor: '#25D366', label: 'WhatsApp'   },
    geracao:   { icon: '☀️', cor: '#f39c12', label: 'Geração'    },
    alerta:    { icon: '⚠️', cor: '#e74c3c', label: 'Alerta'     },
    sistema:   { icon: '⚙️', cor: '#7f8c8d', label: 'Sistema'    }
  };

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } }
  function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }

  function seed() {
    const now = Date.now();
    const m = (mins) => now - mins * 60000;
    return [
      { id: 'n1', tipo: 'pagamento', titulo: 'Pagamento confirmado', msg: 'Cliente João Silva pagou FAT-2026-0042 (R$ 287,50)', ts: m(4),    lida: false, link: '/cobranca' },
      { id: 'n2', tipo: 'whatsapp',  titulo: 'Boleto entregue',      msg: 'BOL-2026-0118 entregue para Maria Santos via WhatsApp', ts: m(18), lida: false, link: '/whatsapp' },
      { id: 'n3', tipo: 'fatura',    titulo: 'Lote de faturas gerado', msg: '27 faturas geradas para o ciclo Mar/26', ts: m(95),  lida: false, link: '/faturamento' },
      { id: 'n4', tipo: 'alerta',    titulo: 'Inadimplência D+5',    msg: '3 clientes atingiram D+5 — régua de cobrança ativada', ts: m(180), lida: true,  link: '/cobranca' },
      { id: 'n5', tipo: 'geracao',   titulo: 'Coleta concluída',     msg: 'Parser COELBA importou geração de 4 usinas', ts: m(360), lida: true,  link: '/geracao' },
      { id: 'n6', tipo: 'sistema',   titulo: 'Backup diário',        msg: 'Snapshot do schema executado com sucesso', ts: m(720), lida: true,  link: null }
    ];
  }

  function getList() {
    const all = load();
    const tid = window.store && window.store.tenantId;
    if (!tid) return [];
    if (!all[tid]) { all[tid] = seed(); save(all); }
    return all[tid];
  }
  function setList(list) {
    const all = load();
    all[window.store.tenantId] = list;
    save(all);
    window.dispatchEvent(new CustomEvent('notif-changed'));
  }

  function relTime(ts) {
    const d = Math.floor((Date.now() - ts) / 1000);
    if (d < 60) return 'agora';
    if (d < 3600) return Math.floor(d / 60) + ' min';
    if (d < 86400) return Math.floor(d / 3600) + ' h';
    return Math.floor(d / 86400) + ' d';
  }

  const api = {
    list: getList,
    add(notif) {
      const list = getList();
      list.unshift({
        id: 'n-' + Date.now(),
        tipo: notif.tipo || 'sistema',
        titulo: notif.titulo || '',
        msg: notif.msg || '',
        ts: Date.now(),
        lida: false,
        link: notif.link || null
      });
      setList(list.slice(0, 50));
      // Toast visual
      showToast(notif);
    },
    markRead(id) {
      const list = getList();
      const i = list.findIndex(n => n.id === id);
      if (i >= 0 && !list[i].lida) { list[i].lida = true; setList(list); }
    },
    markAllRead() {
      const list = getList().map(n => ({ ...n, lida: true }));
      setList(list);
    },
    clear() { setList([]); },
    unreadCount() { return getList().filter(n => !n.lida).length; },
    TIPOS,
    relTime
  };
  window.notifications = api;

  // ===== Toast =====
  function showToast(n) {
    const tipo = TIPOS[n.tipo] || TIPOS.sistema;
    let host = document.getElementById('notifToastHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'notifToastHost';
      host.className = 'notif-toast-host';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.className = 'notif-toast';
    el.style.borderLeftColor = tipo.cor;
    el.innerHTML = `
      <div class="notif-toast-icon" style="background:${tipo.cor}22;color:${tipo.cor}">${tipo.icon}</div>
      <div class="notif-toast-body">
        <div class="notif-toast-title">${escapeHtml(n.titulo || '')}</div>
        <div class="notif-toast-msg">${escapeHtml(n.msg || '')}</div>
      </div>
      <button class="notif-toast-close" aria-label="Fechar">×</button>
    `;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    const close = () => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 250);
    };
    el.querySelector('.notif-toast-close').addEventListener('click', close);
    setTimeout(close, 5000);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  // ===== Bell + painel (montado no topbar) =====
  window.mountNotifBell = function() {
    if (document.getElementById('notifBell')) return;
    const actions = document.querySelector('.topbar-actions');
    if (!actions) return;
    const btn = document.createElement('button');
    btn.id = 'notifBell';
    btn.className = 'notif-bell';
    btn.title = 'Notificações';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <span class="notif-badge" id="notifBadge" hidden>0</span>
    `;
    // Inserir antes do tenant-switcher
    const tenant = actions.querySelector('.tenant-switcher');
    actions.insertBefore(btn, tenant);

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel();
    });

    refreshBadge();
    window.addEventListener('notif-changed', refreshBadge);
    window.addEventListener('tenant-changed', refreshBadge);
  };

  function refreshBadge() {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    const c = api.unreadCount();
    if (c > 0) {
      badge.textContent = c > 99 ? '99+' : c;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
    // Re-render painel se aberto
    const open = document.getElementById('notifPanel');
    if (open) renderPanel(open);
  }

  function togglePanel() {
    const exists = document.getElementById('notifPanel');
    if (exists) { exists.remove(); return; }
    const panel = document.createElement('div');
    panel.id = 'notifPanel';
    panel.className = 'notif-panel';
    document.body.appendChild(panel);
    renderPanel(panel);
    positionPanel(panel);

    const closeOutside = (ev) => {
      if (!panel.contains(ev.target) && !ev.target.closest('#notifBell')) {
        panel.remove();
        document.removeEventListener('click', closeOutside);
      }
    };
    setTimeout(() => document.addEventListener('click', closeOutside), 0);
  }

  function positionPanel(panel) {
    const bell = document.getElementById('notifBell');
    if (!bell) return;
    const r = bell.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    let left = r.right - pr.width;
    if (left < 8) left = 8;
    if (left + pr.width > window.innerWidth - 8) left = window.innerWidth - pr.width - 8;
    panel.style.top = (r.bottom + 8) + 'px';
    panel.style.left = left + 'px';
  }

  function renderPanel(panel) {
    const list = api.list();
    const unread = api.unreadCount();
    panel.innerHTML = `
      <div class="notif-panel-header">
        <div>
          <strong>Notificações</strong>
          <span class="notif-panel-sub">${unread} não lida${unread === 1 ? '' : 's'} · via SignalR</span>
        </div>
        <div class="notif-panel-actions">
          <button class="notif-link" id="np_read" ${unread ? '' : 'disabled'}>Marcar todas como lidas</button>
        </div>
      </div>
      <div class="notif-panel-body">
        ${list.length ? list.map(n => {
          const t = TIPOS[n.tipo] || TIPOS.sistema;
          return `
            <div class="notif-item ${n.lida ? '' : 'unread'}" data-id="${n.id}" ${n.link ? `data-link="${n.link}"` : ''}>
              <div class="notif-item-icon" style="background:${t.cor}22;color:${t.cor}">${t.icon}</div>
              <div class="notif-item-body">
                <div class="notif-item-top">
                  <span class="notif-item-title">${escapeHtml(n.titulo)}</span>
                  <span class="notif-item-time">${api.relTime(n.ts)}</span>
                </div>
                <div class="notif-item-msg">${escapeHtml(n.msg)}</div>
                <div class="notif-item-tipo">${t.label}</div>
              </div>
            </div>
          `;
        }).join('') : `<div class="notif-empty">Sem notificações</div>`}
      </div>
      <div class="notif-panel-footer">
        <button class="notif-link" id="np_clear">Limpar tudo</button>
        <button class="notif-link" id="np_simulate">+ Simular push</button>
      </div>
    `;

    panel.querySelector('#np_read').addEventListener('click', (e) => { e.stopPropagation(); api.markAllRead(); });
    panel.querySelector('#np_clear').addEventListener('click', (e) => { e.stopPropagation(); api.clear(); });
    panel.querySelector('#np_simulate').addEventListener('click', (e) => {
      e.stopPropagation();
      const samples = [
        { tipo: 'pagamento', titulo: 'Pagamento confirmado', msg: 'Webhook Asaas: BOL-2026-0' + Math.floor(Math.random()*999) + ' liquidado' },
        { tipo: 'whatsapp',  titulo: 'Mensagem entregue',     msg: 'Lembrete D-3 entregue a 12 clientes' },
        { tipo: 'geracao',   titulo: 'Coleta concluída',      msg: 'Parser COELBA atualizou geração da Usina 02' },
        { tipo: 'alerta',    titulo: 'Inadimplência detectada', msg: 'Cliente Carlos Mendes atingiu D+1 de atraso', link: '/cobranca' }
      ];
      api.add(samples[Math.floor(Math.random() * samples.length)]);
    });

    panel.querySelectorAll('.notif-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.dataset.id;
        api.markRead(id);
        const link = el.dataset.link;
        if (link) {
          panel.remove();
          location.hash = link;
        }
      });
    });
  }

  // ===== Simulação de push (SignalR mock) =====
  // Quando algo acontece no app, notifica
  window.addEventListener('proto-envio-whatsapp', (e) => {
    const d = e.detail || {};
    api.add({
      tipo: 'whatsapp',
      titulo: 'Envio realizado',
      msg: `${d.tipo || 'Mensagem'} enviada para ${d.cliente || 'cliente'} via Cloud API`,
      link: '/whatsapp'
    });
  });

  // Push aleatório a cada 60s para demo (desabilitado por padrão)
  // setInterval(() => { /* api.add(...) */ }, 60000);
})();
