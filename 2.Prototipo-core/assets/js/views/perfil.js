// ============================================================
// View: Meu Perfil — dados do usuário logado, segurança, permissões
// ============================================================

(function() {
  let aba = 'dados';

  // Store de fotos de usuário (data URL persistido em localStorage)
  window.userPhotoStore = window.userPhotoStore || (function() {
    const KEY = 'proto_user_photos';
    let state;
    try { state = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e) { state = {}; }
    return {
      get: (id) => state[id] || null,
      set: (id, dataUrl) => { state[id] = dataUrl; localStorage.setItem(KEY, JSON.stringify(state)); window.dispatchEvent(new CustomEvent('user-photo-changed')); },
      clear: (id) => { delete state[id]; localStorage.setItem(KEY, JSON.stringify(state)); window.dispatchEvent(new CustomEvent('user-photo-changed')); }
    };
  })();

  window.view_perfil = function(root) {
    const t = window.store.tenant;
    const cfg = window.configStore.get(t.id);
    // Por convenção do protótipo, o usuário "logado" é o primeiro usuário ativo do tenant
    const usr = cfg.usuarios.find(u => u.status === 'ativo') || cfg.usuarios[0];
    if (!usr) {
      root.innerHTML = '<div class="empty"><div class="icon">👤</div><h2>Nenhum usuário</h2></div>';
      return;
    }
    const perfil = window.configStore.getPerfil(usr.perfilId) || { nome: '—', permissoes: [], descricao: '' };
    const iniciais = (usr.nome || 'XX').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
    const totalEndpoints = window.ENDPOINTS.length;
    const totalPermitidos = perfil.permissoes.length;

    root.innerHTML = `
      <div class="view-header">
        <div>
          <a href="#/dashboard" style="font-size: 0.8rem; color: var(--gray-600); text-decoration: none;">← Voltar</a>
          <h1 style="margin-top: 4px;">Meu Perfil</h1>
          <p>Dados do usuário logado em <strong>${esc(t.nome)}</strong></p>
        </div>
      </div>

      <div class="card" style="margin-bottom: 1.5rem;">
        <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
          <div class="profile-avatar" id="profileAvatar" title="Clique para alterar a foto">
            ${(function(){
              const photo = window.userPhotoStore.get(usr.id);
              return photo
                ? `<img src="${photo}" alt="${esc(usr.nome)}" />`
                : `<span class="profile-avatar-initials">${iniciais}</span>`;
            })()}
            <div class="profile-avatar-overlay">
              <span class="profile-avatar-icon">📷</span>
              <span class="profile-avatar-label">Alterar</span>
            </div>
            <input type="file" id="profilePhotoInput" accept="image/*" hidden />
          </div>
          <div style="flex: 1; min-width: 240px;">
            <h2 style="font-size: 1.4rem; color: var(--gray-900); margin-bottom: 4px;">${esc(usr.nome)}</h2>
            <div style="font-size: 0.9rem; color: var(--gray-600); margin-bottom: 8px;">${esc(usr.email)} · ${esc(usr.cargo || '—')}</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <span class="badge info">${esc(perfil.nome)}</span>
              ${statusBadge(usr.status)}
              <span class="badge gray">Tenant: ${esc(t.nome)}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.7rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.6px;">Último acesso</div>
            <div style="font-size: 0.95rem; font-weight: 600; color: var(--gray-800);">${esc(usr.ultimoAcesso || '—')}</div>
          </div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi info">
          <div class="label">Perfil de acesso</div>
          <div class="value" style="font-size: 1.2rem;">${esc(perfil.nome)}</div>
        </div>
        <div class="kpi success">
          <div class="label">Endpoints permitidos</div>
          <div class="value">${totalPermitidos} <span style="font-size: 0.8rem; color: var(--gray-500); font-weight: 400;">/ ${totalEndpoints}</span></div>
        </div>
        <div class="kpi warning">
          <div class="label">Cobertura de acesso</div>
          <div class="value">${Math.round(100 * totalPermitidos / Math.max(1, totalEndpoints))}%</div>
        </div>
        <div class="kpi">
          <div class="label">Status da conta</div>
          <div class="value" style="font-size: 1.2rem;">${usr.status === 'ativo' ? '✓ Ativa' : '⏸ Inativa'}</div>
        </div>
      </div>

      <div class="tabs">
        <button class="tab ${aba === 'dados' ? 'active' : ''}" data-aba="dados">Dados pessoais</button>
        <button class="tab ${aba === 'seguranca' ? 'active' : ''}" data-aba="seguranca">Segurança</button>
        <button class="tab ${aba === 'permissoes' ? 'active' : ''}" data-aba="permissoes">Minhas permissões</button>
        <button class="tab ${aba === 'atividade' ? 'active' : ''}" data-aba="atividade">Atividade recente</button>
      </div>

      <div id="abaContent"></div>
    `;

    function renderAba() {
      const c = root.querySelector('#abaContent');
      if (aba === 'dados') {
        c.innerHTML = `
          <div class="card">
            <div class="form-grid">
              <div class="form-row">
                <label>Nome completo</label>
                <input type="text" id="p_nome" value="${esc(usr.nome)}" />
              </div>
              <div class="form-row">
                <label>E-mail</label>
                <input type="email" id="p_email" value="${esc(usr.email)}" />
              </div>
              <div class="form-row">
                <label>Telefone</label>
                <input type="text" id="p_tel" value="${esc(usr.telefone || '')}" />
              </div>
              <div class="form-row">
                <label>Cargo</label>
                <input type="text" id="p_cargo" value="${esc(usr.cargo || '')}" />
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
              <button class="btn btn-ghost" id="btnCancel">Cancelar</button>
              <button class="btn btn-primary" id="btnSave">Salvar alterações</button>
            </div>
          </div>
        `;
        c.querySelector('#btnSave').addEventListener('click', () => {
          window.configStore.updateUsuario(usr.id, {
            nome: document.getElementById('p_nome').value.trim(),
            email: document.getElementById('p_email').value.trim(),
            telefone: document.getElementById('p_tel').value.trim(),
            cargo: document.getElementById('p_cargo').value.trim()
          });
          setTimeout(() => alert('Dados atualizados.'), 50);
        });
        c.querySelector('#btnCancel').addEventListener('click', () => view_perfil(root));
      }
      else if (aba === 'seguranca') {
        c.innerHTML = `
          <div class="card">
            <h3 style="margin-bottom: 0.5rem;">Alterar senha</h3>
            <p style="font-size: 0.85rem; color: var(--gray-600); margin-bottom: 1rem;">A senha é gerenciada via Keycloak. Esta tela apenas dispara um e-mail de redefinição.</p>
            <div class="form-row">
              <label>Senha atual</label>
              <input type="password" placeholder="••••••••" />
            </div>
            <div class="form-grid">
              <div class="form-row">
                <label>Nova senha</label>
                <input type="password" placeholder="••••••••" />
              </div>
              <div class="form-row">
                <label>Confirmar nova senha</label>
                <input type="password" placeholder="••••••••" />
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
              <button class="btn btn-primary">Solicitar alteração</button>
            </div>
          </div>

          <div class="card" style="margin-top: 1rem;">
            <h3 style="margin-bottom: 0.5rem;">Autenticação em duas etapas (2FA)</h3>
            <p style="font-size: 0.85rem; color: var(--gray-600); margin-bottom: 1rem;">Adiciona uma camada extra de segurança ao seu login.</p>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: 6px;">
              <div>
                <div style="font-weight: 600;">2FA via aplicativo autenticador</div>
                <div style="font-size: 0.78rem; color: var(--gray-500);">Google Authenticator, Authy, 1Password</div>
              </div>
              <button class="btn btn-outline btn-sm">Configurar</button>
            </div>
          </div>

          <div class="card" style="margin-top: 1rem;">
            <h3 style="margin-bottom: 0.5rem;">Sessões ativas</h3>
            <table class="data">
              <thead><tr><th>Dispositivo</th><th>Localização</th><th>Último uso</th><th class="text-center">Ação</th></tr></thead>
              <tbody>
                <tr>
                  <td><strong>Chrome · Windows 11</strong> <span class="badge success">Atual</span></td>
                  <td>Salvador / BA</td>
                  <td>Agora</td>
                  <td class="text-center">—</td>
                </tr>
                <tr>
                  <td>Safari · iPhone</td>
                  <td>Salvador / BA</td>
                  <td>Há 2 horas</td>
                  <td class="text-center"><button class="btn btn-ghost btn-sm" style="color: var(--danger);">Encerrar</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      }
      else if (aba === 'permissoes') {
        const porModulo = {};
        perfil.permissoes.forEach(id => {
          const e = window.ENDPOINTS.find(x => x.id === id);
          if (e) (porModulo[e.modulo] = porModulo[e.modulo] || []).push(e);
        });
        c.innerHTML = `
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
              <div>
                <h3>Perfil: ${esc(perfil.nome)}</h3>
                <p style="font-size: 0.85rem; color: var(--gray-600);">${esc(perfil.descricao)}</p>
              </div>
              <a href="#/permissoes" class="btn btn-outline btn-sm">⚙ Gerenciar perfis</a>
            </div>

            <p style="font-size: 0.85rem; color: var(--gray-700); margin-bottom: 1rem;">Você tem acesso a <strong>${totalPermitidos} de ${totalEndpoints}</strong> endpoints da plataforma. Abaixo, agrupados por módulo:</p>

            ${Object.keys(porModulo).length === 0 ? '<div class="empty">Sem permissões atribuídas.</div>' : Object.keys(porModulo).map(mod => `
              <div style="margin-bottom: 1rem;">
                <h4 style="font-size: 0.85rem; color: var(--gray-800); margin-bottom: 0.5rem; padding-bottom: 4px; border-bottom: 1px solid var(--gray-200);">${esc(mod)} <span style="font-weight: 400; color: var(--gray-500); font-size: 0.75rem;">(${porModulo[mod].length})</span></h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 6px;">
                  ${porModulo[mod].map(e => `
                    <div style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: var(--success-bg); border-radius: 4px; font-size: 0.78rem;">
                      <span style="color: var(--success);">✓</span>
                      <span style="font-family: monospace; font-size: 0.7rem; color: var(--gray-600); padding: 1px 5px; background: rgba(255,255,255,0.6); border-radius: 3px;">${esc(e.metodo)}</span>
                      <span style="color: var(--gray-800);">${esc(e.descricao)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
      else if (aba === 'atividade') {
        c.innerHTML = `
          <div class="card">
            <h3 style="margin-bottom: 0.5rem;">Últimas ações</h3>
            <p style="font-size: 0.85rem; color: var(--gray-600); margin-bottom: 1rem;">Auditoria das principais ações realizadas pelo usuário no tenant atual.</p>
            <table class="data">
              <thead><tr><th>Data / Hora</th><th>Ação</th><th>Recurso</th><th class="text-center">IP</th></tr></thead>
              <tbody>
                ${[
                  ['10/04/2026 14:32', 'Login', 'Plataforma', '189.30.x.x'],
                  ['10/04/2026 14:28', 'Atualização', 'Configurações · Tema', '189.30.x.x'],
                  ['10/04/2026 11:15', 'Geração em lote', 'Faturamento · 27 faturas', '189.30.x.x'],
                  ['10/04/2026 09:48', 'Edição', 'Cliente CLI-0012', '189.30.x.x'],
                  ['09/04/2026 18:11', 'Login', 'Plataforma', '189.30.x.x'],
                  ['09/04/2026 16:22', 'Criação', 'UC vinculada ao CLI-0009', '189.30.x.x']
                ].map(([d, a, r, ip]) => `
                  <tr>
                    <td style="font-family: monospace; font-size: 0.78rem;">${esc(d)}</td>
                    <td>${esc(a)}</td>
                    <td>${esc(r)}</td>
                    <td class="text-center" style="font-family: monospace; font-size: 0.75rem; color: var(--gray-600);">${esc(ip)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    }
    renderAba();

    root.querySelectorAll('[data-aba]').forEach(b => b.addEventListener('click', () => {
      aba = b.dataset.aba;
      view_perfil(root);
    }));

    // ===== Upload de foto de perfil =====
    const avatar = root.querySelector('#profileAvatar');
    const fileInp = root.querySelector('#profilePhotoInput');
    if (avatar && fileInp) {
      avatar.addEventListener('click', () => fileInp.click());
      fileInp.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { alert('Selecione um arquivo de imagem.'); return; }
        if (file.size > 2 * 1024 * 1024) { alert('Imagem muito grande (máx 2 MB).'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
          window.userPhotoStore.set(usr.id, ev.target.result);
          view_perfil(root);
        };
        reader.readAsDataURL(file);
      });
    }
  };
})();
