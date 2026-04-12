# Protótipo Visual — Plataforma Energia Solar · Multitenant · Multibank

Protótipo navegável (SPA) para apresentações comerciais. Aderente ao **Questionário de Aderência assinado por Pedro Esquivel em 01/04/2026** (ESQ Energia). Mostra como o produto vai parecer e funcionar, sem backend real — apenas mock data.

## Aderência ao questionário

Cada decisão visual está rastreada a uma resposta do questionário:

| Resposta | Como aparece no protótipo |
|---|---|
| **A2** Modos Percentual e Prioridade | View Distribuição de Créditos com simulador funcional dos dois modos |
| **A3** 3 fidelidades (sem / 1 ano / 2 anos) | Coluna "Fidelidade" em Contratos |
| **A4 / D2** Titularidade da conta no cliente OU comercializadora | Coluna "Titularidade" em Clientes; preview de fatura anexa print da conta de luz quando comercializadora |
| **A5** COELBA | Concessionária referenciada nos campos de titularidade |
| **B1** ESQ usa digitação manual | Card de Geração mostra "Digitação Manual" com registro de leitura por usina |
| **B5** Saldo residual fica atrelado à UC | Engine de Créditos com state machine "Gerado → Alocado → Aplicado → Excedente" |
| **C1** Banco BTG | Header da Cobrança mostra o banco do tenant ativo; ESQ = BTG, demais com bancos diferentes (multibank) |
| **C4** 27 clientes ativos | Tenant ESQ tem `ucs: 27` |
| **C6** Mensagem após D+5 de atraso | Régua de Cobrança em Configurações + template WhatsApp |
| **C7** Multa 2% + juros 0,033%/dia | Regras Financeiras em Configurações + cálculo aplicado em faturas vencidas no preview |
| **D1** WhatsApp | Canal de envio unidirecional (faturas, boletos, documentos, mensagens curtas) via Cloud API + templates HSM. Sem bot conversacional |
| **D3** Sem portal do cliente | Apenas painel admin |
| **E1** Só Pedro como usuário (ESQ) | RBAC do tenant ESQ mostra apenas Pedro Esquivel |
| **E2** esqenergia.plataforma.com.br | Subdomínio em Configurações |
| **E3** Dashboard financeiro | Dashboard com KPIs financeiros |

## Como abrir

1. Abra **`index.html`** em qualquer navegador moderno (Chrome, Edge, Firefox).
2. Funciona offline (`file://`), sem servidor, sem build, sem `npm install`.
3. Selecione um tenant na tela de login → clique em **Entrar na plataforma**.

> 💡 **Dica para apresentação:** abra em tela cheia (`F11`) num notebook a 1366×768 ou superior.

## Como navegar

- **Sidebar à esquerda** lista todos os 11 módulos do produto, agrupados por área (Operação, Energia, Financeiro, Comunicação, Sistema).
- **Topbar** mostra o tenant ativo. Clique no seletor para **trocar de sócio ao vivo** — todos os dados (KPIs, tabelas, gráficos) recalculam instantaneamente. Esse é o efeito visual que vende o multitenancy.
- A URL muda via hash (`#/dashboard`, `#/creditos`, etc.) — você pode compartilhar links direto para uma tela específica durante a apresentação.

## Telas implementadas

| Módulo | Rota | Destaques |
|---|---|---|
| Dashboard | `#/dashboard` | KPIs, gráfico de barras, distribuição por tipo, últimas faturas |
| Clientes | `#/clientes` | Tabela com busca, filtros por status, modal de cadastro |
| Unidades Consumidoras | `#/ucs` | Tabela com tarifa, tipo, consumo médio |
| Contratos | `#/contratos` | State machine visual + tabela de fidelidade |
| Geração / Produção | `#/geracao` | Usinas, leitura manual, gráfico de produção |
| **Distribuição de Créditos** ⭐ | `#/creditos` | Engine de rateio com sliders ao vivo, modos % e Prioridade |
| **Faturamento** ⭐ | `#/faturamento` | State machine, modal de geração em lote, **preview de fatura** |
| Cobrança / Asaas | `#/cobranca` | Abas Boletos / Pix / Webhooks recebidos |
| WhatsApp | `#/whatsapp` | Histórico de envios (faturas, boletos, documentos, mensagens) + templates HSM aprovados |
| Notificações em tempo real | sino no topbar | Push in-app via SignalR — badge, toast, painel dropdown, isolamento por tenant |
| Relatórios & Aging | `#/relatorios` | Aging de recebíveis, top inadimplentes |
| Configurações | `#/configuracoes` | Identity, Multitenancy, RBAC, integrações |

## Como editar os mocks

Toda a base de dados simulada está em [`assets/js/mock-data.js`](assets/js/mock-data.js). Os dados são gerados procedural­mente a partir do `id` de cada tenant — para mudar o porte ou a quantidade de UCs de um sócio, edite [`assets/js/tenants.js`](assets/js/tenants.js):

```js
{
  id: 'esq',
  nome: 'ESQ Energia',
  cor: '#D4A849',
  ucs: 27,         // <-- mude aqui
  ...
}
```

Após salvar, recarregue o navegador (Ctrl+F5) para limpar o cache do dataset.

## Estrutura de arquivos

```
prototipo/
├── index.html              # Login (entrada do app)
├── app.html                # Shell SPA (sidebar + topbar + view)
├── README.md
└── assets/
    ├── css/
    │   ├── tokens.css       # Variáveis CSS, reset, paleta da marca
    │   ├── layout.css       # Sidebar, topbar, grid de tela
    │   ├── components.css   # Cards, KPIs, tabelas, badges, modais, forms
    │   └── views.css        # Estilos específicos de cada tela
    └── js/
        ├── tenants.js       # 4 tenants mockados
        ├── mock-data.js     # Geração procedural de clientes/UCs/faturas
        ├── store.js         # Estado global (tenant atual + utils)
        ├── components.js    # Helpers (badges, modais, charts CSS)
        ├── router.js        # Hash router + ícones SVG da sidebar
        └── views/
            ├── dashboard.js
            ├── clientes.js
            ├── ucs.js
            ├── contratos.js
            ├── geracao.js
            ├── creditos.js     ⭐
            ├── faturamento.js  ⭐
            ├── cobranca.js
            ├── whatsapp.js
            ├── relatorios.js
            └── configuracoes.js
```

## Identidade visual

A paleta é a mesma dos demais documentos da proposta:

- **Primary** `#D4A849` (dourado da marca)
- **Secondary** `#2C3E50` (azul-cinza escuro)
- **Dark** `#1a1a2e`
- **Success** `#27ae60` · **Danger** `#e74c3c` · **Warning** `#f39c12` · **Info** `#3498db`
- **Fonte** Inter (300-800)

## Roteiro sugerido para a apresentação

1. **Login** → demonstre que cada sócio entra no seu próprio tenant.
2. **Dashboard** → KPIs do primeiro sócio (ESQ).
3. **Trocar tenant na topbar** → "olha como os números mudam ao vivo — cada sócio tem dados totalmente isolados (multitenancy por schema)."
4. **Clientes** → mostre a coluna **Titularidade** (Cliente / Comercializadora) — regra do questionário D2.
5. **Distribuição de Créditos** → mexa nos sliders no **Modo Percentual**, depois alterne para **Modo Prioridade** e reordene as UCs (▲▼) — mostre o saldo sendo atendido em ordem e o **excedente** indo para a UC receptora escolhida.
6. **Geração** → o card de coleta mostra "Digitação Manual" (B1 do questionário). Clique em "Registrar leitura" em qualquer usina para registrar a produção do mês.
7. **Faturamento** → clique em uma fatura de cliente com titularidade da **Comercializadora** → o preview mostra o **anexo automático do print da conta de luz** (D2). O preview também mostra o **banco emissor próprio** do tenant (multibank).
8. **Cobrança** → header destaca o **banco do tenant ativo** (BTG para ESQ, Bradesco/Itaú/Santander para os demais — esse é o multibank). Percorra as abas Boletos → Pix → Webhooks.
9. **WhatsApp** → histórico de envios (faturas, boletos, documentos) + templates HSM aprovados pela Meta (incluindo **D+5 — regra do questionário C6**). **Canal unidirecional** — bot conversacional via n8n é melhoria futura, escopo separado.
10. **Configurações** → mostre Identity/Schema, **Banco Emissor (Multibank)**, **Régua de Cobrança com D+5**, RBAC (no ESQ aparece só Pedro — E1 do questionário), e integrações ativas.

## Limitações conhecidas (é protótipo)

- Sem persistência: o que você editar volta ao estado original ao recarregar.
- Sem backend, sem Keycloak, sem Asaas real.
- "Salvar", "Cadastrar", "Sincronizar" são botões decorativos.
- Não há geração real de PDF — o preview de fatura é HTML.

---

**Versão:** 0.1.0 · 2026-04 · ESQ Energia
