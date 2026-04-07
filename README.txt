================================================================================
                    PROPOSTA COMERCIAL
                    Plataforma de Gestão de Energia Solar
================================================================================

ARQUIVOS INCLUÍDOS:
------------------
1. index.html              - Proposta completa interativa (navegação lateral)
2. proposta-impressao.html - Versão para impressão/PDF (layout formal)
3. comparativo-mercado.html - Análise comparativa vs Lumi (SaaS de mercado)
4. styles.css              - Estilos da versão interativa
5. script.js               - Funcionalidades JavaScript

COMO USAR:
----------
1. Para visualizar a proposta interativa:
   - Abra o arquivo "index.html" em qualquer navegador
   - Use o menu lateral para navegar entre as seções
   - Funciona em desktop e dispositivos móveis

2. Para gerar PDF / Imprimir:
   - Abra o arquivo "proposta-impressao.html" no navegador
   - Clique no botão "Imprimir / Salvar PDF" no canto superior direito
   - Selecione "Salvar como PDF" ou imprima diretamente

RESUMO DO PROJETO:
------------------
Plataforma: Gestão de Energia Solar
Modelo: Energia por Assinatura (Multitenant)
Integração: Boleto + Pix + WhatsApp

ESCOPO DO PROJETO:
------------------
Esta plataforma foi desenvolvida para atender operações de energia solar
por assinatura, com gestão de créditos, faturamento e comunicação automatizada.

IMPORTANTE: Funcionalidades adicionais que fujam do escopo apresentado nas
documentações serão orçadas e desenvolvidas separadamente.

MÓDULOS:
--------
01. Identity & Multitenancy
02. Cadastro de Clientes
03. Gestão de Contratos
04. Gestão de Geração / Produção
05. Distribuição de Créditos
06. Faturamento & Cobrança
07. Pagamento Automatizado (Asaas)
08. Comunicação WhatsApp (envio de faturas/boletos/documentos via Cloud API + templates HSM, sem bot)
8b. Notificações em Tempo Real (push in-app via SignalR — sino, badge, toast, painel)
09. Dashboards & Relatórios

STACK TECNOLÓGICO:
------------------
- Backend: .NET 8 (C#)
- Frontend: Vue 3
- Banco: SQL Server (multi-database — 1 banco dedicado por sócio) + Redis
- Real-time: SignalR (notificações e dashboards)
- Multitenancy: Database por sócio (N bancos independentes, isolamento físico total)
- Arquitetura: DDD + CQRS + Clean Architecture
- Armazenamento de imagens (templates de fatura, QR Code, código de barras,
  print da conta de luz, logos, anexos por boleto): AWS S3, com prefixo por
  tenant e por fatura — s3://faturas/{tenant}/{faturaId}/
- Mensageria assíncrona (geração de faturas em lote, envio de e-mails,
  processamento de webhooks, disparo de notificações): AWS SNS + SQS FIFO
  (garantia de ordem e exactly-once por chave de agrupamento) + AWS Lambda
  como consumidores serverless. Filas dead-letter (DLQ) para reprocessamento.

FLUXO DE FATURAMENTO NO CORE (sem gateway):
-------------------------------------------
Para cada fatura gerada, o operador importa três imagens — geradas no
banco/portal externo a cada boleto:
  1. QR Code Pix da fatura
  2. Código de barras / linha digitável
  3. Print da conta de luz (COELBA) da competência
As três imagens são armazenadas no S3 (uma versão por boleto) e
referenciadas pelo template do cliente, que é preenchido com os dados
dinâmicos vindos do banco (cliente, contrato, consumo, valores, banco
emissor) para gerar o PDF final da fatura.

CRONOGRAMA:
-----------
Mês 1: Foundation (Setup, Auth, CRUD)
Mês 2: Core Business (Contratos, Créditos)
Mês 3: Billing (Faturamento, Asaas)
Mês 4: WhatsApp + Dashboards + Go-Live

INVESTIMENTO:
-------------
PRIMEIRO SÓCIO (ESQ):
- Assessment Individual: R$ 2.500 a R$ 6.000 (cobrado à parte para todos os sócios, inclusive ESQ)
- Core MVP: R$ 28.500,00 (382h x R$ 75/h)
- Total Entrada: Core R$ 28.500,00 + Assessment (R$ 2.500 a R$ 6.000) = R$ 31.000,00 a R$ 34.500,00

Condições de Pagamento:
- 30% na assinatura      = R$ 8.550,00
- 30% entrega Core       = R$ 8.550,00
- 40% no Go-Live         = R$ 11.400,00

MÓDULOS DE EXPANSÃO (opcionais):
- Pagamento Automatizado Asaas (Boleto + Pix + Webhook de baixa + Conciliação) ~55h: + R$ 4.000
- WhatsApp Nativo (envio unidirecional via Cloud API + HSM) ~33h: + R$ 2.500
- Notificações em Tempo Real (SignalR — push in-app): + R$ 1.500

ROADMAP / MELHORIAS FUTURAS (fora do escopo atual):
- Bot Conversacional WhatsApp via n8n
  Fluxos automatizados de atendimento (2ª via, status de pagamento,
  FAQs, roteamento para humano) integrados à WhatsApp Cloud API via
  n8n. Desenvolvimento independente, orçado separadamente após Go-Live.
- Parser COELBA: + R$ 3.500
- Relatórios Avançados: + R$ 2.500

SÓCIOS FUTUROS (pagam apenas Assessment para entrar):
- Assessment Individual: R$ 2.500 a R$ 6.000
  (valor variável conforme a complexidade da operação)

IMPORTANTE: Operações de média/grande complexidade (múltiplas
usinas, integrações com ERP, regras de negócio não-padrão) podem
requerer orçamento de desenvolvimento individual, separado e
adicional ao Assessment, para implementar funcionalidades fora
do escopo do Core.

PLANOS E PREÇOS:
+----------+----------------------------------+-----------+-----------+
| Plano    | O que inclui                     | 1 Sócio   | 4 Sócios  |
+----------+----------------------------------+-----------+-----------+
| BÁSICO   | Core MVP (Cadastros, Contratos,  | R$ 28.500 | R$ 36.000 |
|          | Engine Créditos, baixa manual)   |           | R$ 9.000/s|
+----------+----------------------------------+-----------+-----------+
| MÉDIO    | Básico + Asaas + WhatsApp + Notif SignalR | R$ 35.000 | R$ 42.500 |
|          |                                  |           | R$10.625/s|
+----------+----------------------------------+-----------+-----------+
| FULL     | Médio + Parser COELBA +          | R$ 41.000 | R$ 48.500 |
|          | Relatórios Avançados             |           | R$12.125/s|
+----------+----------------------------------+-----------+-----------+

Todos os sócios: Assessment R$ 2.500 a R$ 6.000 + Core conforme plano
                 (valor do Assessment variável conforme complexidade da
                  operação; casos complexos podem exigir orçamento de
                  desenvolvimento individual à parte)

CUSTOS RECORRENTES (Após Go-Live):
----------------------------------
Infraestrutura (AWS):
- Hospedagem Cloud (EC2/ECS + RDS SQL Server): R$ 150 ~ 300/mês
- S3 (templates, QR, código de barras, prints COELBA): R$ 20 ~ 60/mês
- SNS + SQS FIFO + Lambda (mensageria/eventos): R$ 30 ~ 80/mês
- API WhatsApp: R$ 100 ~ 200/mês
- SSL: Incluído

Evolução e Manutenção Sob Demanda (Sem Recorrência):
Não há fee mensal de suporte. A infraestrutura AWS é paga
diretamente pelo cliente. Intervenções técnicas (manutenção,
correções, integrações Asaas/COELBA, novas features) são
orçadas pontualmente conforme demanda.

================================================================================
AUTORIA: João Rocha & José Ambrozi
================================================================================

================================================================================
ESTIMATIVA DE HORAS — LIMITES
================================================================================
Total do projeto: 568 horas
  - Core da Plataforma:        382 h
  - Módulos de Expansão:       186 h (opcionais — Asaas 53h + WhatsApp 33h + SignalR 20h + Parser COELBA 47h + Relatórios 33h)

================================================================================
ARQUITETURA — ATUALIZAÇÃO
================================================================================
Padrões: Monolito Modular, DDD, CQRS, Clean Architecture,
Multitenancy por Database (multibanco), Event-Driven Architecture
(arquitetura orientada a eventos) e Máquinas de Estado
(state machines explícitas para Contrato, Fatura, Crédito
e Cobrança).

Infra AWS adotada:
  - S3      → armazenamento de imagens (templates, logos, QR Code,
              código de barras, prints da conta de luz, anexos por
              boleto). Versionamento habilitado, prefixo por tenant.
  - SNS     → tópicos de eventos de domínio (FaturaGerada, FaturaEnviada,
              PagamentoConfirmado, etc.) com fan-out para múltiplos
              consumidores.
  - SQS FIFO → filas com garantia de ordem e deduplicação por chave de
              agrupamento (ex.: tenantId + faturaId), evitando
              processamento duplicado de boletos/baixas.
  - Lambda  → consumidores serverless para tarefas assíncronas
              (geração de PDF do template, envio de e-mail, conciliação,
              processamento de webhooks). DLQ para reprocessamento.

DECISÃO ARQUITETURAL — Segregação Completa de Infraestrutura?
Cada operação pode rodar em infra totalmente isolada (banco,
app, ambiente próprios) ou compartilhar a plataforma com
isolamento físico via multitenancy multibanco (1 database dedicado por sócio, padrão proposto).

  + Positivos da segregação total:
    - Isolamento absoluto entre sócios
    - Soberania total (manutenção, versão, backup, retenção)
    - Compliance simplificado
    - Portabilidade de saída individual

  - Negativos da segregação total:
    - Custo de infra multiplicado (N ambientes em vez de 1)
    - Manutenção N× maior
    - Sem economia de escala
    - Consolidação de indicadores vira projeto à parte
    - Suporte mais caro (horas proporcionais ao nº de ambientes)

Recomendação: Multitenancy multibanco (1 database por sócio) já entrega isolamento físico
físico de dados. Segregação completa fica como opção mediante
orçamento adicional.

VALIDADE: 30 dias a partir de 05/04/2026

================================================================================
                         Documento Confidencial
================================================================================
