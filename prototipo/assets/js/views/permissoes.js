// ============================================================
// View: Perfis & Permissões — RBAC granular por endpoint
// ============================================================

(function() {
  let perfilSelecionadoId = null;
  let buscaModulo = '';

  window.view_permissoes = function(root) {
    const t = window.store.tenant;
    const cfg = window.configStore.get(t.id);
    if (!perfilSelecionadoId || !cfg.perfis.find(p => p.id === perfilSelecionadoId)) {
      perfilSelecionadoId = cfg.perfis[0] ? cfg.perfis[0].id : null;
    }
    const perfilSel = cfg.perfis.find(p => p.id === perfilSelecionadoId);
    const totalEndpoints = window.ENDPOINTS.length;

    root.innerHTML = `
      ${viewHeader('Perfis & Permissões', 'Controle de acesso granular por endpoint · ' + t.nome, `
        <button class="btn btn-primary btn-sm" id="btnNovo">+ Novo perfil</button>
      `)}

      <div class="kpi-grid">
        <div class="kpi info">
          <div class="label">Perfis cadastrados</div>
          <div class="value">${cfg.perfis.length}</div>
        </div>
        <div class="kpi success">
          <div class="label">Endpoints disponíveis</div>
          <div class="value">${totalEndpoints}</div>
        </div>
        <div class="kpi warning">
          <div class="label">Usuários com perfis</div>
          <div class="value">${cfg.usuarios.filter(u => u.perfilId).length}</div>
        </div>
        <div class="kpi">
          <div class="label">Módulos do sistema</div>
          <div class="value">${Object.keys(window.ENDPOINTS_BY_MODULO).length}</div>
        </div>
      </div>

      <div class="grid-2-1" style="align-items: flex-start;">
        <!-- Coluna principal: matriz de permissões do perfil selecionado -->
        <div class="card">
          ${perfilSel ? renderMatriz(perfilSel, cfg) : '<div class="empty">Selecione um perfil à direita.</div>'}
        </div>

        <!-- Coluna lateral: lista de perfis -->
        <div class="card">
          <div class="card-header">
            <h3>Perfis (${cfg.perfis.length})</h3>
          </div>
          <div id="perfisList" style="display: flex; flex-direction: column; gap: 8px;"></div>
        </div>
      </div>
    `;

    function renderPerfis() {
      const wrap = root.querySelector('#perfisList');
      wrap.innerHTML = cfg.perfis.map(p => {
        const usados = cfg.usuarios.filter(u => u.perfilId === p.id).length;
        const sel = p.id === perfilSelecionadoId;
        const items = [
          { icon: '✎', label: 'Renomear / Descrição', onClick: () => modalEditarPerfil(p) }
        ];
        if (!p.sistema) {
          items.push({ divider: true });
          items.push({ icon: '🗑', label: 'Excluir perfil', danger: true, onClick: () => {
            if (confirm('Excluir o perfil "' + p.nome + '"?')) window.configStore.removePerfil(p.id);
          }});
        }
        return `
          <div data-pid="${p.id}" style="padding: 12px; border: 2px solid ${sel ? 'var(--primary)' : 'var(--gray-200)'}; border-radius: 8px; cursor: pointer; background: ${sel ? 'var(--primary-light)' : 'var(--white)'}; transition: var(--tr-fast);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <strong style="font-size: 0.9rem; color: var(--gray-900);">${esc(p.nome)}</strong>
                  ${p.sistema ? '<span class="badge gray" style="font-size: 0.6rem;">Sistema</span>' : ''}
                </div>
                <div style="font-size: 0.72rem; color: var(--gray-600); margin-top: 2px;">${esc(p.descricao || '')}</div>
                <div style="font-size: 0.7rem; color: var(--gray-500); margin-top: 4px;">
                  ${p.permissoes.length} permissões · ${usados} usuário${usados !== 1 ? 's' : ''}
                </div>
              </div>
              ${kebab(items)}
            </div>
          </div>
        `;
      }).join('');

      wrap.querySelectorAll('[data-pid]').forEach(card => {
        card.addEventListener('click', e => {
          if (e.target.closest('.kebab-btn') || e.target.closest('.kebab-menu')) return;
          perfilSelecionadoId = card.dataset.pid;
          view_permissoes(root);
        });
      });
    }
    renderPerfis();
    wireMatriz(root, cfg);

    root.querySelector('#btnNovo').addEventListener('click', () => modalEditarPerfil());
  };

  function renderMatriz(perfil, cfg) {
    const grupos = Object.keys(window.ENDPOINTS_BY_MODULO);
    return `
      <div class="card-header">
        <div>
          <h3>${esc(perfil.nome)} <span class="subtitle">${perfil.permissoes.length} permissões</span></h3>
          <p style="font-size: 0.78rem; color: var(--gray-500); margin-top: 2px;">${esc(perfil.descricao || '')}</p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-outline btn-sm" id="btnAll">✓ Marcar tudo</button>
          <button class="btn btn-outline btn-sm" id="btnNone">○ Limpar tudo</button>
        </div>
      </div>

      ${perfil.sistema ? '<div style="padding: 0.75rem; background: var(--info-bg); border-left: 4px solid var(--info); border-radius: 4px; margin-bottom: 1rem; font-size: 0.78rem; color: var(--gray-700);">⚠ Este é um perfil de <strong>sistema</strong>. As alterações ainda assim são aplicadas para a sua operação.</div>' : ''}

      <div style="max-height: 580px; overflow-y: auto; padding-right: 4px;">
        ${grupos.map(modulo => {
          const endpoints = window.ENDPOINTS_BY_MODULO[modulo];
          const granted = endpoints.filter(e => perfil.permissoes.includes(e.id)).length;
          const total = endpoints.length;
          const allChecked = granted === total;
          const someChecked = granted > 0 && granted < total;
          return `
            <div style="margin-bottom: 1rem; border: 1px solid var(--gray-200); border-radius: 6px; overflow: hidden;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: ${allChecked ? 'var(--success-bg)' : (someChecked ? 'var(--warning-bg)' : 'var(--gray-50)')}; border-bottom: 1px solid var(--gray-200);">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; flex: 1;">
                  <input type="checkbox" data-mod="${esc(modulo)}" ${allChecked ? 'checked' : ''} ${someChecked ? 'data-some="1"' : ''} style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary);" />
                  <strong style="font-size: 0.9rem; color: var(--gray-900);">${esc(modulo)}</strong>
                  <span style="font-size: 0.72rem; color: var(--gray-600);">${granted} / ${total}</span>
                </label>
              </div>
              <div style="padding: 8px 14px;">
                ${endpoints.map(e => {
                  const checked = perfil.permissoes.includes(e.id);
                  return `
                    <label style="display: flex; align-items: center; gap: 10px; padding: 6px 0; cursor: pointer; border-bottom: 1px dashed var(--gray-100);">
                      <input type="checkbox" data-eid="${e.id}" ${checked ? 'checked' : ''} style="width: 14px; height: 14px; cursor: pointer; accent-color: var(--primary);" />
                      <span style="font-family: monospace; font-size: 0.7rem; color: ${methodColor(e.metodo)}; padding: 1px 6px; background: ${methodBg(e.metodo)}; border-radius: 3px; min-width: 56px; text-align: center; font-weight: 700;">${esc(e.metodo)}</span>
                      <code style="font-family: monospace; font-size: 0.72rem; color: var(--gray-700); flex-shrink: 0;">${esc(e.path)}</code>
                      <span style="font-size: 0.78rem; color: var(--gray-600); flex: 1;">${esc(e.descricao)}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function methodColor(m) {
    return ({ GET: '#1e8449', POST: '#0e6ba8', PUT: '#b8740a', PATCH: '#9b59b6', DELETE: '#a93226' })[m] || '#555';
  }
  function methodBg(m) {
    return ({ GET: 'rgba(39,174,96,0.12)', POST: 'rgba(52,152,219,0.12)', PUT: 'rgba(243,156,18,0.15)', PATCH: 'rgba(155,89,182,0.12)', DELETE: 'rgba(231,76,60,0.12)' })[m] || 'rgba(0,0,0,0.05)';
  }

  function wireMatriz(root, cfg) {
    const perfil = cfg.perfis.find(p => p.id === perfilSelecionadoId);
    if (!perfil) return;

    // Toggle endpoint individual
    root.querySelectorAll('[data-eid]').forEach(cb => {
      cb.addEventListener('change', () => {
        window.configStore.togglePermissao(perfil.id, cb.dataset.eid);
      });
    });

    // Toggle por módulo
    root.querySelectorAll('[data-mod]').forEach(cb => {
      cb.addEventListener('change', () => {
        window.configStore.setPermissoesModulo(perfil.id, cb.dataset.mod, cb.checked);
      });
    });

    // Marcar/Limpar tudo
    const btnAll = root.querySelector('#btnAll');
    const btnNone = root.querySelector('#btnNone');
    if (btnAll) btnAll.addEventListener('click', () => {
      window.configStore.updatePerfil(perfil.id, { permissoes: window.ENDPOINTS.map(e => e.id) });
    });
    if (btnNone) btnNone.addEventListener('click', () => {
      if (confirm('Remover todas as permissões deste perfil?')) {
        window.configStore.updatePerfil(perfil.id, { permissoes: [] });
      }
    });
  }

  function modalEditarPerfil(p) {
    const ed = !!p;
    openModal(`
      <div class="modal" style="max-width: 520px;">
        <div class="modal-header">
          <h3>${ed ? 'Editar' : 'Novo'} perfil de acesso</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Nome do perfil</label>
            <input type="text" id="p_nome" value="${esc(p ? p.nome : '')}" placeholder="Ex: Auditor financeiro" />
          </div>
          <div class="form-row">
            <label>Descrição</label>
            <textarea id="p_desc" rows="3" style="padding: 0.6rem; border: 1px solid var(--gray-300); border-radius: 4px; font-family: inherit;">${esc(p ? p.descricao : '')}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" id="p_save">${ed ? 'Salvar' : 'Criar perfil'}</button>
        </div>
      </div>
    `);
    document.getElementById('p_save').addEventListener('click', () => {
      const data = {
        nome: document.getElementById('p_nome').value.trim(),
        descricao: document.getElementById('p_desc').value.trim()
      };
      if (!data.nome) { alert('Informe o nome do perfil.'); return; }
      if (ed) window.configStore.updatePerfil(p.id, data);
      else    window.configStore.addPerfil(data);
      closeModal();
    });
  }
})();
