// ============================================================
// Tenants — sócios da plataforma multitenant / multibank
// Cada tenant tem identidade visual, bancos emissores e
// conjunto inicial de configurações (editável em runtime).
// ============================================================

window.TENANTS = [
  {
    id: 'esq',
    nome: 'ESQ Energia',
    iniciais: 'ES',
    cor: '#D4A849',
    cidade: 'Salvador / BA',
    cnpj: '12.345.678/0001-90',
    schema: 'tenant_esq',
    ucs: 27,
    socios: 'Real (1º sócio)',
    descricao: 'Operação real da ESQ Energia (dados reais do questionário assinado)',
    parserCoelba: false,           // B1: digitação manual
    usuarioUnico: 'Pedro Esquivel',
    tema: {
      primary:      '#D4A849',
      primaryDark:  '#B8923D',
      primaryLight: '#F5E6C3',
      secondary:    '#2C3E50',
      dark:         '#1a1a2e'
    },
    bancos: [
      { id: 'bk-esq-1', codigo: '208', nome: 'BTG Pactual',     agencia: '0050', conta: '12345-6', carteira: '17', principal: true }
    ]
  },
  {
    id: 'solar-norte',
    nome: 'Solar Norte',
    iniciais: 'SN',
    cor: '#3498db',
    cidade: 'Feira de Santana / BA',
    cnpj: '23.456.789/0001-01',
    schema: 'tenant_solar_norte',
    ucs: 60,
    socios: 'Estimado (2º sócio)',
    descricao: 'Operação estimada para o segundo sócio da plataforma',
    parserCoelba: true,
    usuarioUnico: null,
    tema: {
      primary:      '#3498db',
      primaryDark:  '#2573a7',
      primaryLight: '#D6EAF8',
      secondary:    '#1B3A57',
      dark:         '#0F1F2E'
    },
    bancos: [
      { id: 'bk-sn-1', codigo: '237', nome: 'Bradesco', agencia: '1234', conta: '56789-0', carteira: '09',  principal: true },
      { id: 'bk-sn-2', codigo: '341', nome: 'Itaú',     agencia: '4567', conta: '12345-6', carteira: '109', principal: false }
    ]
  },
  {
    id: 'reconcavo',
    nome: 'Energia Recôncavo',
    iniciais: 'ER',
    cor: '#27ae60',
    cidade: 'Santo Antônio de Jesus / BA',
    cnpj: '34.567.890/0001-12',
    schema: 'tenant_reconcavo',
    ucs: 90,
    socios: 'Estimado (3º sócio)',
    descricao: 'Operação estimada para o terceiro sócio da plataforma',
    parserCoelba: true,
    usuarioUnico: null,
    tema: {
      primary:      '#27ae60',
      primaryDark:  '#1e8449',
      primaryLight: '#D4EFDF',
      secondary:    '#1C4532',
      dark:         '#0E2818'
    },
    bancos: [
      { id: 'bk-rc-1', codigo: '341', nome: 'Itaú Unibanco', agencia: '4567', conta: '89012-3', carteira: '109', principal: true }
    ]
  },
  {
    id: 'bahia-sun',
    nome: 'Bahia Sun Power',
    iniciais: 'BS',
    cor: '#9b59b6',
    cidade: 'Vitória da Conquista / BA',
    cnpj: '45.678.901/0001-23',
    schema: 'tenant_bahia_sun',
    ucs: 120,
    socios: 'Estimado (4º sócio)',
    descricao: 'Operação estimada para o quarto sócio da plataforma',
    parserCoelba: true,
    usuarioUnico: null,
    tema: {
      primary:      '#9b59b6',
      primaryDark:  '#7d3c98',
      primaryLight: '#EBDEF0',
      secondary:    '#3C1F4A',
      dark:         '#1E0F26'
    },
    bancos: [
      { id: 'bk-bs-1', codigo: '033', nome: 'Santander',    agencia: '7890', conta: '34567-8', carteira: '101', principal: true },
      { id: 'bk-bs-2', codigo: '001', nome: 'Banco do Brasil', agencia: '1357', conta: '24680-1', carteira: '17', principal: false }
    ]
  }
];

window.getTenant = function(id) {
  return window.TENANTS.find(t => t.id === id) || window.TENANTS[0];
};
