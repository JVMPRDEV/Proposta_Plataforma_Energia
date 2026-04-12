// ============================================================
// View: Ajuda & Documentação — links para todos os documentos
// ============================================================

window.view_ajuda = function(root) {
  const docs = [
    {
      grupo: 'Proposta Comercial',
      itens: [
        { icon: '📊', titulo: 'Pitch Deck',              desc: 'Apresentação comercial em slides (19 slides). Para apresentar na reunião presencial.', href: '../0.Proposta/pitch-deck.html', tag: 'HTML' },
        { icon: '📄', titulo: 'Proposta Completa',        desc: 'Documento de referência com todos os detalhes: módulos, arquitetura, comparativo, investimento e prazos.', href: '../0.Proposta/proposta-completa.html', tag: 'HTML' },
        { icon: '💰', titulo: 'Valores e Investimento',   desc: 'Documento exclusivo de custos: planos, decomposição, infra, pagamento, comparativo vs Lumi e projeção 5 anos.', href: '../0.Proposta/valores.html', tag: 'HTML' }
      ]
    },
    {
      grupo: 'Protótipos Navegáveis',
      itens: [
        { icon: '🎨', titulo: 'Protótipo Completo (esta versão)', desc: 'Versão completa da aplicação com todos os módulos (Core + expansões: Asaas, WhatsApp, SignalR).', href: 'index.html', tag: 'SPA', atual: true },
        { icon: '⚡', titulo: 'Protótipo Core',          desc: 'Apenas os módulos do Core (382h / R$ 28.500). Faturamento sem gateway, baixa manual e template do cliente.', href: '../2.Prototipo-core/index.html', tag: 'SPA' }
      ]
    }
  ];

  root.innerHTML = `
    ${viewHeader('Ajuda & Documentação', 'Acesso rápido a toda a documentação e protótipos do projeto', '')}

    <div style="display:grid; gap:1.25rem;">
      ${docs.map(g => `
        <div class="config-section">
          <h3>${esc(g.grupo)}</h3>
          <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:.85rem; margin-top:.85rem;">
            ${g.itens.map(d => `
              <a href="${esc(d.href)}" target="_blank" rel="noopener"
                 style="display:block; text-decoration:none; color:inherit; border:1px solid var(--gray-200); border-radius:8px; padding:1rem; background:var(--white); transition:all .15s; ${d.atual ? 'border-color:var(--primary); background:var(--primary-light);' : ''}"
                 onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,.08)'; this.style.borderColor='var(--primary)';"
                 onmouseout="this.style.transform=''; this.style.boxShadow=''; this.style.borderColor='${d.atual ? 'var(--primary)' : 'var(--gray-200)'}';">
                <div style="display:flex; align-items:flex-start; gap:.75rem;">
                  <div style="font-size:1.8rem; line-height:1;">${d.icon}</div>
                  <div style="flex:1; min-width:0;">
                    <div style="display:flex; align-items:center; gap:.5rem; flex-wrap:wrap;">
                      <strong style="font-size:.92rem; color:var(--gray-900);">${esc(d.titulo)}</strong>
                      <span style="font-size:.62rem; padding:2px 6px; background:var(--gray-100); color:var(--gray-700); border-radius:3px; font-weight:600; text-transform:uppercase; letter-spacing:.5px;">${esc(d.tag)}</span>
                      ${d.atual ? '<span style="font-size:.62rem; padding:2px 6px; background:var(--primary); color:white; border-radius:3px; font-weight:600; text-transform:uppercase;">Atual</span>' : ''}
                    </div>
                    <div style="font-size:.78rem; color:var(--gray-600); margin-top:.3rem; line-height:1.4;">${esc(d.desc)}</div>
                    <div style="font-size:.68rem; color:var(--gray-500); margin-top:.4rem; font-family:monospace;">↗ ${esc(d.href)}</div>
                  </div>
                </div>
              </a>
            `).join('')}
          </div>
        </div>
      `).join('')}

      <div style="padding:.85rem 1rem; background:var(--gray-50); border-left:3px solid var(--primary); border-radius:6px; font-size:.78rem; color:var(--gray-700);">
        💡 Documentação na pasta <code>0.Proposta/</code>. Os links abrem em uma nova aba.
      </div>
    </div>
  `;
};
