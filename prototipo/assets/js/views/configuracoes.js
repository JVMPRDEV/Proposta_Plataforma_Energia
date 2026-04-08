// ============================================================
// View: Configurações — CRUD completo por tenant
// Seções: Identity · Tema · Bancos · Usuários · Regras · Integrações
// ============================================================

window.view_configuracoes = function(root) {
  const t = window.store.tenant;
  const cfg = window.configStore.get(t.id);

  root.innerHTML = `
    ${viewHeader('Configurações', 'Identidade visual, Multibank, RBAC, regras e integrações · ' + t.nome, `
      <button class="btn btn-outline btn-sm" id="btnResetConfig">↻ Restaurar padrão</button>
    `)}

    <!-- ===== Identity & Multitenancy ===== -->
    <div class="config-section">
      <h3>🔐 Identity & Multitenancy</h3>
      <p class="desc">Cada sócio opera dentro do seu próprio tenant, com schema isolado e SSO via Keycloak.</p>
      <div class="config-row"><span class="key">Tenant ID</span><span class="val">${esc(t.id)}</span></div>
      <div class="config-row"><span class="key">Schema do banco</span><span class="val">${esc(t.schema)}</span></div>
      <div class="config-row"><span class="key">Subdomínio</span><span class="val">${esc(t.id)}.plataforma.com.br</span></div>
      <div class="config-row"><span class="key">Provedor de identidade</span><span class="val">Keycloak (OAuth 2.0)</span></div>
      <div class="config-row"><span class="key">Realm</span><span class="val">solar-${esc(t.id)}</span></div>
    </div>

    <!-- ===== Tema visual ===== -->
    <div class="config-section">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3>🎨 Identidade Visual</h3>
          <p class="desc">Cada tenant tem sua própria paleta. Ao alterar as cores aqui, a aplicação inteira é re-renderizada ao vivo com a identidade do sócio.</p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-outline btn-sm" id="btnResetTema">↻ Cores padrão</button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-top: 1rem;">
        ${[
          { key: 'primary',      label: 'Cor principal' },
          { key: 'primaryDark',  label: 'Principal escura' },
          { key: 'primaryLight', label: 'Principal clara' },
          { key: 'secondary',    label: 'Secundária (sidebar)' },
          { key: 'dark',         label: 'Fundo escuro' }
        ].map(c => `
          <label style="display: flex; flex-direction: column; gap: 6px;">
            <span style="font-size: 0.72rem; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">${c.label}</span>
            <div style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid var(--gray-300); border-radius: 6px; background: var(--white);">
              <input type="color" data-tema="${c.key}" value="${esc(cfg.tema[c.key] || '#000000')}" style="width: 32px; height: 32px; border: none; padding: 0; background: none; cursor: pointer;" />
              <span style="font-family: monospace; font-size: 0.78rem; color: var(--gray-700);" data-hex="${c.key}">${esc(cfg.tema[c.key] || '#000000')}</span>
            </div>
          </label>
        `).join('')}
      </div>

      <div style="margin-top: 1rem; padding: 0.85rem; background: var(--primary-light); border-radius: 6px; font-size: 0.8rem; color: var(--gray-700);">
        💡 As mudanças são aplicadas <strong>instantaneamente</strong> em toda a aplicação. Abra outras telas (Dashboard, Cobrança, Faturamento) para ver o efeito ao vivo.
      </div>

      <h4 style="margin-top:1.25rem; font-size:.82rem; color:var(--gray-700);">Logo do tenant</h4>
      <p style="font-size:.74rem; color:var(--gray-600); margin:.2rem 0 .6rem;">
        Logo exibida no canto superior esquerdo da sidebar. Dimensão fixa <strong>32×32 px</strong>. Enquanto não houver upload, exibimos as iniciais do tenant sobre a cor principal.
      </p>
      <div style="display:flex; align-items:center; gap:1rem; padding:1rem; border:1px solid var(--gray-200); border-radius:8px; background:var(--white);">
        <div id="logoPreview" style="width:64px; height:64px; border-radius:6px; display:flex; align-items:center; justify-content:center; background:var(--gray-100); overflow:hidden; flex-shrink:0; border:1px dashed var(--gray-300);"></div>
        <div style="flex:1; min-width:0;">
          <div style="font-size:.78rem; color:var(--gray-700); margin-bottom:.5rem;">
            Tenant: <strong>${esc(t.nome)}</strong>
          </div>
          <div style="display:flex; gap:.5rem; flex-wrap:wrap;">
            <label class="btn btn-outline btn-sm" style="cursor:pointer; margin:0;">
              ⬆ Importar logo
              <input type="file" id="logoFile" accept="image/png,image/jpeg,image/svg+xml,image/webp" style="display:none;" />
            </label>
            <button class="btn btn-ghost btn-sm" id="logoRemove">Restaurar padrão</button>
          </div>
          <div style="font-size:.68rem; color:var(--gray-500); margin-top:.4rem;">
            PNG, JPG, SVG ou WebP. Recomendado: 256×256 px, fundo transparente.
          </div>
        </div>
      </div>
    </div>

    <!-- ===== Bancos (Multibank) ===== -->
    <div class="config-section">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3>🏦 Bancos Emissores (Multibank)</h3>
          <p class="desc">Cada tenant pode ter múltiplos bancos emissores. Um deles é marcado como <strong>principal</strong> e é usado por padrão em todas as cobranças novas.</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btnAddBanco">+ Adicionar banco</button>
      </div>

      <table class="data" style="margin-top: 1rem; border: 1px solid var(--gray-200); border-radius: 6px;">
        <thead>
          <tr>
            <th>Cód.</th>
            <th>Banco</th>
            <th>Agência</th>
            <th>Conta</th>
            <th>Carteira</th>
            <th class="text-center">Principal</th>
            <th class="text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${cfg.bancos.length === 0 ? '<tr><td colspan="7" class="empty">Nenhum banco cadastrado</td></tr>' : cfg.bancos.map(b => {
            const items = [
              { icon: '✎', label: 'Editar banco', onClick: () => abrirModalBanco(b) }
            ];
            if (!b.principal) {
              items.push({ icon: '⭐', label: 'Tornar principal', success: true, onClick: () => window.configStore.setPrincipal(b.id) });
            }
            items.push({ divider: true });
            items.push({ icon: '🗑', label: 'Excluir banco', danger: true, onClick: () => {
              if (confirm('Remover banco "' + b.nome + '"?')) window.configStore.removeBanco(b.id);
            }});
            return `
              <tr>
                <td><strong>${esc(b.codigo)}</strong></td>
                <td>${esc(b.nome)}</td>
                <td>${esc(b.agencia)}</td>
                <td>${esc(b.conta)}</td>
                <td>${esc(b.carteira)}</td>
                <td class="text-center">${b.principal ? '<span class="badge success">Principal</span>' : '<span style="font-size: 0.75rem; color: var(--gray-500);">—</span>'}</td>
                <td class="text-center">${kebab(items)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- ===== Usuários (RBAC) ===== -->
    <div class="config-section">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3>👥 Usuários (RBAC)</h3>
          <p class="desc">Controle de acesso baseado em papéis. ${t.usuarioUnico ? '<strong>Conforme questionário E1, este tenant iniciou com apenas 1 usuário.</strong>' : ''}</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btnAddUsuario">+ Novo usuário</button>
      </div>

      <table class="data" style="margin-top: 1rem; border: 1px solid var(--gray-200); border-radius: 6px;">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Papel</th>
            <th class="text-center">Status</th>
            <th class="text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${cfg.usuarios.length === 0 ? '<tr><td colspan="5" class="empty">Nenhum usuário cadastrado</td></tr>' : cfg.usuarios.map(u => {
            const p = cfg.perfis.find(x => x.id === u.perfilId) || { nome: '—' };
            return `
            <tr>
              <td><strong>${esc(u.nome)}</strong></td>
              <td>${esc(u.email)}</td>
              <td><a href="#/permissoes" class="badge info" style="text-decoration: none;">${esc(p.nome)}</a></td>
              <td class="text-center">${statusBadge(u.status)}</td>
              <td class="text-center">${kebab([
                { icon: '✎', label: 'Editar usuário', onClick: () => abrirModalUsuario(u) },
                { icon: u.status === 'ativo' ? '⏸' : '▶', label: u.status === 'ativo' ? 'Desativar' : 'Ativar', onClick: () => {
                  window.configStore.updateUsuario(u.id, { status: u.status === 'ativo' ? 'inativo' : 'ativo' });
                }},
                { divider: true },
                { icon: '🗑', label: 'Excluir', danger: true, onClick: () => {
                  if (confirm('Remover usuário "' + u.nome + '"?')) window.configStore.removeUsuario(u.id);
                }}
              ])}</td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- ===== Regras Financeiras ===== -->
    <div class="config-section">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3>💰 Regras Financeiras</h3>
          <p class="desc">Multa, juros, tarifa base, desconto e régua de cobrança (conforme questionário C6 e C7).</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btnEditRegras">✎ Editar regras</button>
      </div>

      <div class="config-row"><span class="key">Multa por atraso</span><span class="val">${cfg.regras.multaAtraso.toString().replace('.', ',')}%</span></div>
      <div class="config-row"><span class="key">Juros de mora ao dia</span><span class="val">${cfg.regras.jurosDia.toString().replace('.', ',')}%</span></div>
      <div class="config-row"><span class="key">Tarifa base de referência</span><span class="val">R$ ${cfg.regras.tarifaBase.toFixed(2).replace('.', ',')} / kWh</span></div>
      <div class="config-row"><span class="key">Desconto padrão de novos contratos</span><span class="val">${cfg.regras.descontoPadrao}%</span></div>
      <div class="config-row"><span class="key">Lembrete antes do vencimento</span><span class="val">D-${cfg.regras.diasLembreteAntes}</span></div>
      <div class="config-row"><span class="key"><strong style="color: var(--warning)">Cobrança após atraso (C6)</strong></span><span class="val">D+${cfg.regras.diasCobrancaAposAtraso}</span></div>
      <div class="config-row"><span class="key">Escalonamento de inadimplência</span><span class="val">D+${cfg.regras.diasEscalonamento}</span></div>
    </div>

    <!-- ===== Integrações ===== -->
    <div class="config-section">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3>🔌 Integrações</h3>
          <p class="desc">Gateways, APIs e serviços externos conectados a este tenant.</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btnAddIntegracao">+ Nova integração</button>
      </div>

      <table class="data" style="margin-top: 1rem; border: 1px solid var(--gray-200); border-radius: 6px;">
        <thead>
          <tr>
            <th>Integração</th>
            <th>Descrição</th>
            <th>Categoria</th>
            <th class="text-center">Status</th>
            <th class="text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${cfg.integracoes.length === 0 ? '<tr><td colspan="5" class="empty">Nenhuma integração</td></tr>' : cfg.integracoes.map(i => `
            <tr>
              <td><strong>${esc(i.nome)}</strong></td>
              <td style="color: var(--gray-600);">${esc(i.descricao)}</td>
              <td><span class="badge gray">${esc(i.categoria)}</span></td>
              <td class="text-center">${statusBadge(i.status)}</td>
              <td class="text-center">${kebab([
                { icon: i.status === 'ativo' ? '⏸' : '▶', label: i.status === 'ativo' ? 'Desativar' : 'Ativar', onClick: () => window.configStore.toggleIntegracao(i.id) },
                { icon: '✎', label: 'Editar integração', onClick: () => abrirModalIntegracao(i) },
                { divider: true },
                { icon: '🗑', label: 'Excluir', danger: true, onClick: () => {
                  if (confirm('Remover integração "' + i.nome + '"?')) window.configStore.removeIntegracao(i.id);
                }}
              ])}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  wireEventos(root, cfg);
};

// ============================================================
// Helpers
// ============================================================
function papelBadge(papel) {
  const map = {
    'Administrador':    'info',
    'Financeiro':       'warning',
    'Operador':         'gray',
    'Somente leitura':  'gray'
  };
  return `<span class="badge ${map[papel] || 'gray'}">${esc(papel)}</span>`;
}

function renderLogoSection(root) {
  const t = window.store.tenant;
  const cfg = window.configStore.get(t.id);
  const preview = root.querySelector('#logoPreview');
  if (!preview) return;
  function paint() {
    const url = window.tenantLogoStore && window.tenantLogoStore.get(t.id);
    if (url) {
      preview.innerHTML = '<img src="' + url + '" alt="logo" style="max-width:100%; max-height:100%; object-fit:contain;" />';
      preview.style.background = 'var(--white)';
    } else {
      const ini = (t.iniciais || (t.nome || '?').slice(0,2)).toString().toUpperCase();
      preview.innerHTML = '<span style="font-weight:800; font-size:1.4rem; color:var(--dark);">' + ini + '</span>';
      preview.style.background = (cfg.tema && cfg.tema.primary) || t.cor || 'var(--gray-100)';
    }
  }
  paint();
  const fileInput = root.querySelector('#logoFile');
  if (fileInput) fileInput.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      window.tenantLogoStore.set(t.id, ev.target.result);
      paint();
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  });
  const rmBtn = root.querySelector('#logoRemove');
  if (rmBtn) rmBtn.addEventListener('click', () => {
    window.tenantLogoStore.clear(t.id);
    paint();
  });
}

function wireEventos(root, cfg) {
  // ----- Restaurar padrão do tenant -----
  root.querySelector('#btnResetConfig').addEventListener('click', () => {
    if (confirm('Restaurar todas as configurações ao padrão do tenant? Isso vai descartar todas as edições locais.')) {
      window.configStore.reset();
    }
  });

  // ----- Tema -----
  root.querySelectorAll('input[type=color][data-tema]').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const key = e.target.dataset.tema;
      const val = e.target.value;
      // Atualiza hex label ao vivo sem re-render
      const hexEl = root.querySelector(`[data-hex="${key}"]`);
      if (hexEl) hexEl.textContent = val;
      window.configStore.updateTema({ [key]: val });
    });
  });
  root.querySelector('#btnResetTema').addEventListener('click', () => {
    window.configStore.resetTema();
  });

  // ----- Logo do tenant -----
  renderLogoSection(root);

  // Botões de adicionar (kebabs já tratam edit/delete via closures)
  root.querySelector('#btnAddBanco').addEventListener('click', () => abrirModalBanco());
  root.querySelector('#btnAddUsuario').addEventListener('click', () => abrirModalUsuario());
  root.querySelector('#btnEditRegras').addEventListener('click', () => abrirModalRegras(cfg.regras));
  root.querySelector('#btnAddIntegracao').addEventListener('click', () => abrirModalIntegracao());
}

// ============================================================
// Modais de CRUD
// ============================================================

function abrirModalBanco(banco) {
  const ed = !!banco;
  openModal(`
    <div class="modal" style="max-width: 560px;">
      <div class="modal-header">
        <h3>${ed ? 'Editar' : 'Adicionar'} Banco Emissor</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-row">
            <label>Código</label>
            <input type="text" id="f_codigo" value="${esc(banco ? banco.codigo : '')}" placeholder="237" />
          </div>
          <div class="form-row">
            <label>Nome do banco</label>
            <input type="text" id="f_nome" value="${esc(banco ? banco.nome : '')}" placeholder="Bradesco" />
          </div>
          <div class="form-row">
            <label>Agência</label>
            <input type="text" id="f_agencia" value="${esc(banco ? banco.agencia : '')}" placeholder="0000" />
          </div>
          <div class="form-row">
            <label>Conta</label>
            <input type="text" id="f_conta" value="${esc(banco ? banco.conta : '')}" placeholder="00000-0" />
          </div>
          <div class="form-row">
            <label>Carteira</label>
            <input type="text" id="f_carteira" value="${esc(banco ? banco.carteira : '')}" placeholder="09" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="f_save">${ed ? 'Salvar alterações' : 'Adicionar banco'}</button>
      </div>
    </div>
  `);
  document.getElementById('f_save').addEventListener('click', () => {
    const data = {
      codigo:   document.getElementById('f_codigo').value.trim(),
      nome:     document.getElementById('f_nome').value.trim(),
      agencia:  document.getElementById('f_agencia').value.trim(),
      conta:    document.getElementById('f_conta').value.trim(),
      carteira: document.getElementById('f_carteira').value.trim()
    };
    if (!data.nome || !data.codigo) { alert('Informe ao menos código e nome.'); return; }
    if (ed) window.configStore.updateBanco(banco.id, data);
    else    window.configStore.addBanco(data);
    closeModal();
  });
}

function abrirModalUsuario(u) {
  const ed = !!u;
  const cfg = window.configStore.get();
  openModal(`
    <div class="modal" style="max-width: 600px;">
      <div class="modal-header">
        <h3>${ed ? 'Editar' : 'Adicionar'} Usuário</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-row">
            <label>Nome completo</label>
            <input type="text" id="f_nome" value="${esc(u ? u.nome : '')}" placeholder="Nome do usuário" />
          </div>
          <div class="form-row">
            <label>E-mail</label>
            <input type="email" id="f_email" value="${esc(u ? u.email : '')}" placeholder="email@empresa.com.br" />
          </div>
          <div class="form-row">
            <label>Telefone</label>
            <input type="text" id="f_tel" value="${esc(u && u.telefone || '')}" placeholder="(71) 99999-9999" />
          </div>
          <div class="form-row">
            <label>Cargo</label>
            <input type="text" id="f_cargo" value="${esc(u && u.cargo || '')}" placeholder="Ex: Analista financeiro" />
          </div>
          <div class="form-row">
            <label>Perfil de acesso (RBAC)</label>
            <select id="f_perfil">
              ${cfg.perfis.map(p => `<option value="${p.id}" ${u && u.perfilId === p.id ? 'selected' : ''}>${esc(p.nome)} — ${p.permissoes.length} permissões</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <label>Status</label>
            <select id="f_status">
              <option value="ativo"   ${!u || u.status === 'ativo'   ? 'selected' : ''}>Ativo</option>
              <option value="inativo" ${u && u.status === 'inativo' ? 'selected' : ''}>Inativo</option>
            </select>
          </div>
        </div>
        <p style="font-size: 0.78rem; color: var(--gray-500); margin-top: 8px;">As permissões deste usuário são definidas pelo perfil selecionado. Para gerenciar perfis, vá em <a href="#/permissoes" style="color: var(--primary-dark);">Perfis &amp; Permissões</a>.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="f_save">${ed ? 'Salvar' : 'Criar usuário'}</button>
      </div>
    </div>
  `);
  document.getElementById('f_save').addEventListener('click', () => {
    const data = {
      nome:     document.getElementById('f_nome').value.trim(),
      email:    document.getElementById('f_email').value.trim(),
      telefone: document.getElementById('f_tel').value.trim(),
      cargo:    document.getElementById('f_cargo').value.trim(),
      perfilId: document.getElementById('f_perfil').value,
      status:   document.getElementById('f_status').value
    };
    if (!data.nome || !data.email) { alert('Informe nome e e-mail.'); return; }
    if (ed) window.configStore.updateUsuario(u.id, data);
    else    window.configStore.addUsuario(data);
    closeModal();
  });
}

function abrirModalRegras(r) {
  openModal(`
    <div class="modal" style="max-width: 600px;">
      <div class="modal-header">
        <h3>Editar Regras Financeiras</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-row">
            <label>Multa por atraso (%)</label>
            <input type="number" step="0.01" id="f_multa" value="${r.multaAtraso}" />
          </div>
          <div class="form-row">
            <label>Juros ao dia (%)</label>
            <input type="number" step="0.001" id="f_juros" value="${r.jurosDia}" />
          </div>
          <div class="form-row">
            <label>Tarifa base (R$ / kWh)</label>
            <input type="number" step="0.01" id="f_tarifa" value="${r.tarifaBase}" />
          </div>
          <div class="form-row">
            <label>Desconto padrão (%)</label>
            <input type="number" step="1" id="f_desc" value="${r.descontoPadrao}" />
          </div>
          <div class="form-row">
            <label>Lembrete antes do venc. (dias)</label>
            <input type="number" step="1" id="f_dAntes" value="${r.diasLembreteAntes}" />
          </div>
          <div class="form-row">
            <label>Cobrança após atraso (dias)</label>
            <input type="number" step="1" id="f_dApos" value="${r.diasCobrancaAposAtraso}" />
          </div>
          <div class="form-row">
            <label>Escalonamento (dias)</label>
            <input type="number" step="1" id="f_dEsc" value="${r.diasEscalonamento}" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="f_save">Salvar regras</button>
      </div>
    </div>
  `);
  document.getElementById('f_save').addEventListener('click', () => {
    window.configStore.updateRegras({
      multaAtraso:             +document.getElementById('f_multa').value,
      jurosDia:                +document.getElementById('f_juros').value,
      tarifaBase:              +document.getElementById('f_tarifa').value,
      descontoPadrao:          +document.getElementById('f_desc').value,
      diasLembreteAntes:       +document.getElementById('f_dAntes').value,
      diasCobrancaAposAtraso:  +document.getElementById('f_dApos').value,
      diasEscalonamento:       +document.getElementById('f_dEsc').value
    });
    closeModal();
  });
}

function abrirModalIntegracao(i) {
  const ed = !!i;
  openModal(`
    <div class="modal" style="max-width: 560px;">
      <div class="modal-header">
        <h3>${ed ? 'Editar' : 'Adicionar'} Integração</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <label>Nome da integração</label>
          <input type="text" id="f_nome" value="${esc(i ? i.nome : '')}" placeholder="Ex: Google Calendar" />
        </div>
        <div class="form-row">
          <label>Descrição</label>
          <input type="text" id="f_desc" value="${esc(i ? i.descricao : '')}" placeholder="Para que serve essa integração" />
        </div>
        <div class="form-grid">
          <div class="form-row">
            <label>Categoria</label>
            <select id="f_cat">
              ${['financeiro','comunicacao','dados','outros'].map(c =>
                `<option value="${c}" ${i && i.categoria === c ? 'selected' : ''}>${c}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-row">
            <label>Status</label>
            <select id="f_status">
              <option value="ativo"   ${!i || i.status === 'ativo'   ? 'selected' : ''}>Ativo</option>
              <option value="inativo" ${i && i.status === 'inativo' ? 'selected' : ''}>Inativo</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="f_save">${ed ? 'Salvar' : 'Adicionar integração'}</button>
      </div>
    </div>
  `);
  document.getElementById('f_save').addEventListener('click', () => {
    const data = {
      nome:      document.getElementById('f_nome').value.trim(),
      descricao: document.getElementById('f_desc').value.trim(),
      categoria: document.getElementById('f_cat').value,
      status:    document.getElementById('f_status').value
    };
    if (!data.nome) { alert('Informe o nome da integração.'); return; }
    if (ed) window.configStore.updateIntegracao(i.id, data);
    else    window.configStore.addIntegracao(data);
    closeModal();
  });
}
