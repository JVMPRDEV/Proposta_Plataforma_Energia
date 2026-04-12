// ============================================================
// Store — estado global mínimo
// ============================================================

(function() {
  const KEY_TENANT = 'proto_tenant';
  const KEY_USER = 'proto_user';

  window.store = {
    get tenantId() {
      return localStorage.getItem(KEY_TENANT) || 'esq';
    },
    set tenantId(id) {
      localStorage.setItem(KEY_TENANT, id);
      window.dispatchEvent(new CustomEvent('tenant-changed', { detail: { id } }));
    },
    get tenant() {
      return window.getTenant(this.tenantId);
    },
    get dataset() {
      // Camada mutável (CRUD) com fallback para o gerador procedural
      return window.dataStore ? window.dataStore.get(this.tenantId) : window.getDataset(this.tenantId);
    },
    get user() {
      return JSON.parse(localStorage.getItem(KEY_USER) || '{"nome":"Demo Admin","iniciais":"DA"}');
    },
    set user(u) {
      localStorage.setItem(KEY_USER, JSON.stringify(u));
    },
    logout() {
      localStorage.removeItem(KEY_USER);
      localStorage.removeItem(KEY_TENANT);
    }
  };

  // Utilitários globais
  window.fmt = {
    moeda(v) {
      return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    moedaCompact(v) {
      if (v >= 1000000) return 'R$ ' + (v / 1000000).toFixed(1).replace('.', ',') + 'M';
      if (v >= 1000) return 'R$ ' + (v / 1000).toFixed(1).replace('.', ',') + 'k';
      return 'R$ ' + v;
    },
    num(v) {
      return Number(v).toLocaleString('pt-BR');
    },
    kwh(v) {
      return Number(v).toLocaleString('pt-BR') + ' kWh';
    },
    pct(v) {
      return Number(v).toFixed(1).replace('.', ',') + '%';
    }
  };

  // Helper para criar elementos com escape
  window.h = function(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  };

  // Escape HTML
  window.esc = function(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
})();
