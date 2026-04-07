// ============================================================
// Mock Data — datasets por tenant
// Cada tenant tem o mesmo formato; valores são proporcionais ao porte da operação.
// ============================================================

(function() {
  const NOMES = [
    'Padaria Estrela do Sul', 'Mercado São Jorge', 'Restaurante Sabor & Cia',
    'Clínica Saúde Plena', 'Auto Posto Boa Viagem', 'Academia Power Fit',
    'Escola Caminho do Saber', 'Lava Jato Brilho', 'Farmácia Vida Nova',
    'Pet Shop Amigo Fiel', 'Loja de Roupas Estilo BR', 'Pizzaria Forno a Lenha',
    'Barbearia Don Carlos', 'Salão Beleza Pura', 'Distribuidora Norte Sul',
    'Supermercado Família', 'Indústria Têxtil Boa Tela', 'Hotel Pôr do Sol',
    'Pousada Vista Mar', 'Mecânica do Zé', 'Borracharia Roda Viva',
    'Lanchonete Ponto Certo', 'Cafeteria Grão Nobre', 'Sorveteria Gelato',
    'Confeitaria Doce Mel', 'Floricultura Jardim', 'Livraria Saber',
    'Papelaria Escolar', 'Eletro Casa', 'Móveis & Decoração',
    'Material de Construção Forte', 'Madeireira Tronco', 'Cerâmica Bela Vista',
    'Tintas Cores Vivas', 'Vidraçaria Cristal', 'Marcenaria Arte em Madeira',
    'Serralheria Forte', 'Lava Roupa Espuma', 'Tinturaria Express',
    'Costura Fina', 'Studio de Yoga', 'Centro de Estética',
    'Clínica Odonto Sorriso', 'Laboratório Análises', 'Ótica Visão Clara',
    'Joalheria Brilho de Ouro', 'Relojoaria do Tempo', 'Sapataria do Pé',
    'Bolsa & Cia', 'Brinquedos Mundo Mágico', 'Bicicletaria Roda Livre',
    'Auto Peças Motor', 'Concessionária Carros', 'Locadora Veículos',
    'Transportadora Rápida', 'Logística Norte', 'Construtora Solar',
    'Imobiliária Casa Boa', 'Cartório do Centro', 'Escritório Advocacia',
    'Contabilidade Plus', 'Engenharia Civil', 'Arquitetura Design',
    'TI Soluções', 'Marketing Digital', 'Gráfica Rápida',
    'Editora Letras', 'Estúdio Foto', 'Vídeo Produção',
    'Casa de Festas Alegria', 'Buffet Sabor', 'Cerimonial Eventos',
    'Mini Mercado Bairro', 'Empório Gourmet', 'Adega Vinhos',
    'Bar do Zeca', 'Choperia da Esquina', 'Restaurante Mar Azul',
    'Comida Caseira', 'Marmitex Express', 'Açougue do Bairro',
    'Hortifruti Verde', 'Peixaria Mar Aberto', 'Padaria Pão Quentinho',
    'Doceria Caprichada', 'Sushibar Sakura', 'Churrascaria Boi Bom',
    'Restaurante Italiano', 'Pizzaria Napoli', 'Esfiharia Árabe',
    'Crepes & Cia', 'Hamburgueria Smash', 'Açaiteria Tropical',
    'Sucos Naturais', 'Tapioca Nordestina', 'Pastelaria Centro',
    'Cantina Universidade', 'Lanche da Praia', 'Quiosque Beira Mar',
    'Casa de Carnes Premium', 'Distribuidora Bebidas', 'Gás & Água',
    'Conveniência 24h', 'Drogaria Popular', 'Manipulação Farmácia',
    'Clínica Veterinária', 'Pet Banho & Tosa', 'Aquário Marinho',
    'Floricultura Rosas', 'Paisagismo Verde', 'Jardinagem Express',
    'Limpeza Profissional', 'Dedetizadora', 'Manutenção Predial',
    'Instalação Elétrica', 'Hidráulica Express', 'Ar Condicionado',
    'Refrigeração Norte', 'Som Automotivo', 'Película Fumê',
    'Estofaria Conforto', 'Tapeçaria do Sul', 'Cortinas & Persianas'
  ];

  const RUAS = [
    'Av. Paralela', 'R. Chile', 'R. da Independência', 'Av. ACM', 'R. das Flores',
    'Av. Tancredo Neves', 'R. da Liberdade', 'R. Carlos Gomes', 'Av. Sete de Setembro',
    'R. do Comércio', 'Av. Estados Unidos', 'R. das Hortências', 'R. das Acácias',
    'Av. Centenário', 'R. da Graça'
  ];

  function gerarClientes(qtd, seed) {
    const clientes = [];
    let rng = seed;
    function rnd() { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; }
    for (let i = 0; i < qtd; i++) {
      const nome = NOMES[Math.floor(rnd() * NOMES.length)];
      const status = rnd() > 0.92 ? 'inativo' : (rnd() > 0.85 ? 'pendente' : 'ativo');
      const desconto = [10, 12, 15, 18, 20, 22, 25][Math.floor(rnd() * 7)];
      const consumoMedio = Math.round(150 + rnd() * 1200);
      // D2 do questionário: clientes podem ter a conta de luz no próprio nome OU no nome da comercializadora
      // (legado, antes da formalização). Para clientes legados a fatura precisa anexar print da Coelba.
      const titularidade = rnd() > 0.55 ? 'cliente' : 'comercializadora';
      clientes.push({
        id: 'CLI-' + String(i + 1).padStart(4, '0'),
        nome: nome + (i > NOMES.length ? ' ' + Math.floor(i / NOMES.length + 1) : ''),
        cnpj: gerarCnpj(rnd),
        endereco: RUAS[Math.floor(rnd() * RUAS.length)] + ', ' + Math.floor(100 + rnd() * 900),
        status,
        desconto,
        consumoMedio,
        adesao: dataAleatoria(rnd, 2023, 2026),
        contato: '(71) 9' + Math.floor(1000 + rnd() * 8999) + '-' + Math.floor(1000 + rnd() * 8999),
        titularidade
      });
    }
    return clientes;
  }

  function gerarCnpj(rnd) {
    const num = (n) => Math.floor(rnd() * Math.pow(10, n)).toString().padStart(n, '0');
    return `${num(2)}.${num(3)}.${num(3)}/0001-${num(2)}`;
  }

  function dataAleatoria(rnd, anoMin, anoMax) {
    const ano = Math.floor(anoMin + rnd() * (anoMax - anoMin + 1));
    const mes = Math.floor(1 + rnd() * 12);
    const dia = Math.floor(1 + rnd() * 28);
    return `${String(dia).padStart(2,'0')}/${String(mes).padStart(2,'0')}/${ano}`;
  }

  function gerarUCs(clientes, seed) {
    let rng = seed;
    function rnd() { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; }
    const ucs = [];
    clientes.forEach((c, i) => {
      const qtdUcs = rnd() > 0.8 ? 2 : 1;
      for (let j = 0; j < qtdUcs; j++) {
        ucs.push({
          id: 'UC-' + String(ucs.length + 1).padStart(5, '0'),
          numInstalacao: Math.floor(10000000 + rnd() * 89999999),
          clienteId: c.id,
          cliente: c.nome,
          consumo: Math.round(c.consumoMedio * (0.85 + rnd() * 0.3)),
          tipo: ['Residencial', 'Comercial', 'Industrial', 'Rural'][Math.floor(rnd() * 4)],
          tarifa: ['B1', 'B2', 'B3', 'A4'][Math.floor(rnd() * 4)],
          status: c.status
        });
      }
    });
    return ucs;
  }

  function gerarContratos(clientes, seed) {
    let rng = seed;
    function rnd() { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; }
    return clientes.map((c, i) => ({
      id: 'CTR-' + String(i + 1).padStart(4, '0'),
      cliente: c.nome,
      clienteId: c.id,
      fidelidade: ['Sem fidelidade', '1 ano', '2 anos'][Math.floor(rnd() * 3)],
      desconto: c.desconto,
      vigenciaInicio: c.adesao,
      vigenciaFim: rnd() > 0.6 ? '31/12/2026' : '31/12/2027',
      status: c.status === 'inativo' ? 'encerrado' : (c.status === 'pendente' ? 'pendente' : 'ativo'),
      valorMensal: Math.round(c.consumoMedio * 0.78 * (1 - c.desconto / 100))
    }));
  }

  function gerarFaturas(clientes, seed) {
    let rng = seed;
    function rnd() { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; }
    const faturas = [];
    const meses = ['Jan/26', 'Fev/26', 'Mar/26', 'Abr/26'];
    clientes.slice(0, Math.min(clientes.length, 40)).forEach((c, i) => {
      meses.forEach((mes, mi) => {
        const r = rnd();
        let status;
        if (mi < 2) status = 'paga';
        else if (mi === 2) status = r > 0.85 ? 'vencida' : (r > 0.15 ? 'paga' : 'aberta');
        else status = r > 0.7 ? 'aberta' : (r > 0.4 ? 'enviada' : 'gerada');
        faturas.push({
          id: 'FAT-2026-' + String(faturas.length + 1).padStart(5, '0'),
          cliente: c.nome,
          clienteId: c.id,
          competencia: mes,
          vencimento: '15/0' + (mi + 1) + '/2026',
          valor: Math.round(c.consumoMedio * 0.78 * (1 - c.desconto / 100)),
          consumo: Math.round(c.consumoMedio * (0.9 + rnd() * 0.2)),
          status
        });
      });
    });
    return faturas;
  }

  function gerarUsinas(porte, seed) {
    let rng = seed;
    function rnd() { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; }
    const qtd = porte === 'p' ? 1 : (porte === 'm' ? 2 : (porte === 'g' ? 3 : 4));
    const usinas = [];
    const cidades = ['Juazeiro', 'Bom Jesus da Lapa', 'Caetité', 'Irecê', 'Barreiras'];
    for (let i = 0; i < qtd; i++) {
      const kwp = porte === 'p' ? 75 : (porte === 'm' ? 220 : (porte === 'g' ? 380 : 520));
      usinas.push({
        id: 'US-' + String(i + 1).padStart(3, '0'),
        nome: 'Usina ' + cidades[i % cidades.length],
        kwp: Math.round(kwp * (0.8 + rnd() * 0.4)),
        cidade: cidades[i % cidades.length] + ' / BA',
        producaoMes: Math.round(kwp * 130 * (0.85 + rnd() * 0.3)),
        status: 'operando',
        ultimaLeitura: '10/04/2026'
      });
    }
    return usinas;
  }

  // Geração de dataset por tenant
  function buildDataset(tenant) {
    const seed = tenant.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 17;
    const clientes = gerarClientes(tenant.ucs, seed);
    const ucs = gerarUCs(clientes, seed + 1);
    const contratos = gerarContratos(clientes, seed + 2);
    const faturas = gerarFaturas(clientes, seed + 3);
    const porte = tenant.ucs <= 30 ? 'p' : (tenant.ucs <= 70 ? 'm' : (tenant.ucs <= 100 ? 'g' : 'xg'));
    const usinas = gerarUsinas(porte, seed + 4);

    // KPIs
    const kpis = {
      ucsAtivas: ucs.filter(u => u.status === 'ativo').length,
      faturadoMes: faturas
        .filter(f => f.competencia === 'Mar/26')
        .reduce((a, f) => a + f.valor, 0),
      inadimplencia: Math.round(
        100 * faturas.filter(f => f.status === 'vencida').length /
        Math.max(1, faturas.filter(f => ['vencida','paga','aberta','enviada'].includes(f.status)).length)
      ),
      kwhGerado: usinas.reduce((a, u) => a + u.producaoMes, 0)
    };

    // Histórico para o gráfico
    const historico = ['Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar'].map((m, i) => ({
      mes: m,
      valor: Math.round(kpis.faturadoMes * (0.78 + (i * 0.045)))
    }));

    return {
      tenant,
      clientes,
      ucs,
      contratos,
      faturas,
      usinas,
      kpis,
      historico
    };
  }

  // Cache de datasets
  window._dsCache = {};
  window.getDataset = function(tenantId) {
    if (!window._dsCache[tenantId]) {
      const tenant = window.getTenant(tenantId);
      window._dsCache[tenantId] = buildDataset(tenant);
    }
    return window._dsCache[tenantId];
  };
})();
