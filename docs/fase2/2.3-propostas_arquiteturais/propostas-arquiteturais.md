# Propostas Arquiteturais — Panelada (Fase 2.3)

> Fase 2.3 — Propostas arquiteturais. Papel da IA: arquiteto de software, com análise de trade-offs.
> Destino: `/docs/fase2/propostas-arquiteturais.md`. Versão 1.2 — 06/10/2026: decisões formalizadas nos ADR-001 a ADR-014 (2.4); ajustes listados em "0. Mudanças".
> Insumos: `briefing-passagem-2.3.md`, `briefing-fase2.md` (seções 3, 5, 7 e 8), `diario-de-bordo-fase2.md` (entradas 2.1 e 2.2), `atributos-qualidade.md` v1.1, `estilo-arquitetural.md` v1.0, `backlog.md`, `requisitos.md`; consultas pontuais a `regras-de-negocio.md`, `casos-de-uso.md` e `modelo-conceitual.md` (Fase 1) para a US10.
> Convenção: IDs A01–A14 conforme `atributos-qualidade.md`. Medidas (H) são hipóteses. Notas de 1 (atende mal) a 5 (atende bem).

## 0. Mudanças em relação à v0.1

1. **Duas camadas:** *ambiente de demonstração* (roda de verdade, localmente) e *arquitetura-alvo de lançamento* (documentada e justificada, sem deploy).
2. **Plataforma da demo:** Android no emulador. A dupla não dispõe de Mac; o iOS fica só no alvo.
3. **Ferramentas de estudante** consideradas como hipótese: o GitHub Student Developer Pack **será submetido** e a dupla o considera praticamente certo, mas **ainda não está verificado**.
4. **Novo requisito de escopo (professor):** uso de IA no desenvolvimento e no uso da aplicação, via API. Decisão da dupla: **abordagem A pura**, com o agente de IA como **assistente opcional** da curadoria (importação do catálogo, tradução, alérgenos por ingrediente e substituições da US10), sempre com aprovação do curador. O fluxo manual do UC12 permanece.
5. **Novo critério na matriz:** demonstrabilidade local, peso 2. O peso do prazo deixa de incluir o esforço de implantação.
6. **Confirmações da dupla (06/10/2026):** P1 escolhida; divisão demonstração × alvo aceita; uso da IA pelo curador conta como "uso na aplicação".
7. **Conferência dos artefatos da Fase 1 (06/10/2026):** o RNF05 está corrigido; RNF06, RF18, RN08, RN10, RN16, US09 e o modelo conceitual já trazem a criptografia e o estado de alérgenos; as RNs têm status "validado". Pendências remanescentes na seção 14 e na issue de retroalimentação.
8. **Provedor de IA (v1.1):** Kimi K3, por API. O preço da página oficial está em **yuan (CNY)**: ¥20 por milhão de tokens de entrada e ¥100 por milhão de saída (≈ US$ 3 e US$ 15). Uma conversão anterior, feita como se ¥ fossem ienes, subestimava o custo em cerca de 24 vezes.
9. **Fontes de receitas (v1.1):** APIs e bancos de dados pesquisados têm custo alto ou entregam dados em outro idioma. A importação assistida passa a receber **o texto da receita fornecido pelo curador**, e o agente traduz, extrai, mapeia ingredientes e propõe alérgenos e substitutos. O "fluxo misto" com fonte estruturada foi descartado.
10. **RN22 decidida (v1.1):** o substituto sugerido não pode conter alérgeno da restrição do usuário.
11. **Ajustes da v1.2 (2.4):** agente de IA vira módulo da API (ADR-010); esforço de raciocínio e JSON Mode do Kimi (ADR-011); chave protegida via expo-secure-store (ADR-005); backup do Android (ADR-006); fotos baixadas com as planejadas (ADR-012); alvo Cloud Run + Neon (ADR-004).

## 1. Recapitulação (2.1 e 2.2)

- **Críticos:** A06 alérgenos, A05 LGPD, A08 integridade/sincronização, A04 offline parcial. **Altos:** A09, A01, A02. **Médios:** A07, A03, A11, A13. **Baixo:** A12. **Fora:** A14.
- **D1 (fechada):** E2, offline-first com sincronização, restrito ao conjunto baixado (planejadas, em preparo, preparadas). Alternativa viva: E3 (BaaS). **D2:** monólito modular.
- **Fechado na 2.2:** sugestão e busca no servidor, com filtro de alérgenos; checagem de alérgenos também no cliente para receita baixada, com a mesma suíte de testes; desbloqueio local sem revogação (RN04); idempotência por identificador gerado no cliente; gatilho de 10 dias para o protótipo de sincronização; criptografia da restrição alimentar é **requisito** (LGPD art. 46).
- **Restrições:** MVP em 1,5 mês (~45 dias); infraestrutura gratuita (pagamento único baixo aceitável, via ADR); 1.500 usuários ativos no pico; 350 pratos (100 no lançamento); experiência em React/TypeScript.
- `atributos-qualidade.md` já está na v1.1 com a criptografia em A05.

## 2. Duas camadas: demonstração e alvo

| | Ambiente de demonstração (entrega acadêmica) | Arquitetura-alvo (lançamento) |
|---|---|---|
| Execução | Docker Compose local: API TypeScript (com o módulo de importação e o agente de IA) + Postgres | Hospedagem gerenciada (seção 3) |
| Cliente | App React Native em *development build* no emulador Android (`expo run:android`), falando com a API do host (no emulador, o endereço do host é `10.0.2.2`) | Publicação na Google Play; iOS opcional |
| Dados | Seed pequeno (cerca de 20 pratos) produzido pelo fluxo assistido ou manual | 100 pratos no lançamento, 350 no dimensionamento |
| Fotos | Servidas pela própria API (ADR-012) | Armazenamento de objetos do provedor; custo a verificar (ADR-012) |
| Atributos medidos | A04, A08, A06, A05 (inspeção do banco local e do Postgres), A09 (importação com IA) | A01, A11 e custo ficam como hipóteses documentadas |

**Consequência para a verificação:** cold start, pausa de projeto, cotas e cartão **não afetam a demo**. A01 medido localmente mede só a lógica da sugestão, e não a rede nem o provedor; isso deve ser dito na apresentação. A criptografia **precisa** aparecer na demo, porque é requisito: banco do dispositivo ilegível sem a chave e campos de restrição cifrados no Postgres.

## 3. Limites gratuitos, preços e ferramentas de estudante

Verificado em 06/10/2026. Itens de estudante dependem da verificação do GitHub Student Developer Pack (a ser submetida; aprovação considerada praticamente certa, mas não confirmada).

| Serviço | Limite ou preço relevante | Efeito |
|---|---|---|
| [Render](https://render.com/docs/free) | Web service desliga após 15 min e religa em cerca de 1 min; Postgres gratuito expira em 30 dias | Descartado |
| [Google Cloud Run](https://cloud.google.com/run/pricing) | 2 milhões de requisições/mês gratuitas; cota por conta de faturamento (cartão); cold start não medido | Opção de alvo. A página oficial lista São Paulo (southamerica-east1) como Tier 1; confirmar a cota no console (ADR-004) |
| [Neon](https://neon.com/docs/introduction/plans) | 1 GB por projeto no plano gratuito | Cabe com folga. Há região em São Paulo (aws-sa-east-1). |
| [Supabase](https://uibakery.io/blog/supabase-pricing) | 500 MB, 50 mil MAU, pausa após 7 dias sem uso | Plano B (P2) |
| [Azure para estudantes](https://azure.microsoft.com/en-us/free/students) | US$ 100 de crédito; serviços gratuitos, incluindo 750 horas de PostgreSQL Flexible Server B1MS; App Service gratuito limitado a 1 h/dia | Alternativa de alvo, sem cartão (maiores de 18). Crédito é temporário. A confirmar na 2.4 |
| [GitHub Student Developer Pack](https://education.github.com/pack) | Verificação exigida; ofertas mudam (ex.: Copilot Student teve novas inscrições pausadas e o crédito da DigitalOcean saiu, segundo fontes secundárias) | Não depender de oferta específica |
| [Expo EAS](https://expo.dev/pricing) | Plano gratuito: 15 builds Android e 15 iOS por mês | Dispensável na demo (build local) |
| [Kimi K3 (API)](https://platform.kimi.ai/docs/pricing/chat) | US$ 3,00 de entrada, US$ 0,30 de entrada em cache e US$ 15,00 de saída por milhão de tokens (equivale a ¥20 / ¥100 na página em yuan); contexto de 1.048.576 tokens | Provedor escolhido. **Pagamento por uso**, não gratuito (seção 4) |
| Google Play / Apple | US$ 25 únicos / US$ 99 por ano | Só no alvo. Sem Mac, iOS fora da demo |

Crédito de estudante **não** é custo zero permanente; o ADR deve registrar isso. Não verificados: criptografia em repouso e backups dos provedores, cold start real, hospedagem das fotos, cota do Cloud Run em São Paulo (a confirmar no console), preço do Kimi K3 no console da conta da dupla.

## 4. Agente de IA na importação (abordagem A pura)

**Papel:** o agente atende ao requisito do professor (IA via API no uso da aplicação, pelo ator Curador, UC12; confirmado pela dupla) e à US10, sem violar a RN15 ("substitutos cadastrados; sem inventar troca"): a IA **propõe**, o curador **aprova**, e o app só **consulta**. **A IA é assistente opcional:** o fluxo manual do UC12 continua sendo o fluxo principal e a alternativa quando a API falha ou o custo pesa.

**Fluxos de importação:**

| Fluxo | Quando usar |
|---|---|
| Manual (UC12 original) | Fluxo principal; também quando a API falha ou o custo pesa (ADR-010) |
| Assistido por IA | Opcional; usado no seed da demo e para fontes em outro idioma (ADR-010) |

O fluxo misto (campos estruturados vindos da fonte e IA só para alérgenos e substituições) foi descartado: as fontes pesquisadas têm custo alto ou dados em outro idioma.

**Etapas do fluxo assistido (módulo de importação da API, acionado por rota de curadoria; ADR-010):**
1. **Receber** o texto da receita fornecido pelo curador, em qualquer idioma, com a identificação da fonte (RN17, RNF08). O agente **não navega na web**.
2. **Traduzir** para português do Brasil e **extrair** os campos para um esquema fixo (nome, culinária, ingredientes, utensílios, tempo, dificuldade, passo a passo, fonte).
3. **Mapear ingredientes** para os já cadastrados no catálogo (ingrediente canônico), para não quebrar a despensa (US03) nem as substituições; ingredientes novos ficam marcados para revisão.
4. **Propor alérgenos** por ingrediente e por receita. O resultado entra como "não verificado" ou "declarado pela fonte". **Somente o curador** pode marcar "verificado".
5. **Propor substitutos** globais dirigidos (D5), cada um com seus alérgenos. Substituto sem alérgenos declarados fica "não verificado" e **não é sugerido a quem tem restrição** (RN22 e RN08).
6. **Validar** o esquema e as regras (fonte obrigatória, estado dos alérgenos, prato base quando houver cadeia).
7. **Gravar** como `proposto` com `origem = ia`; o curador revisa a tradução e as propostas e muda para `aprovado`. Só o aprovado é publicado (RN21).

**Salvaguardas:**
- **A06:** a IA nunca decide o estado "verificado"; lista vazia continua significando "não verificado" (RN08). Na aplicação, a RN22 impede que um substituto com o alérgeno da restrição seja sugerido.
- **Texto colado é conteúdo não confiável:** a saída é validada por esquema, o agente não tem ferramentas com efeito colateral e nada é publicado sem aprovação humana.
- **A05:** a importação não recebe dado de usuário nem envia restrição alguma.
- **Direitos e termos de uso:** traduzir ou adaptar receitas com IA não elimina questões de direito autoral nem dos termos de cada fonte. A atribuição (RN17, RNF08) é necessária; os termos de cada fonte devem ser conferidos antes da publicação (risco R10; não é aconselhamento jurídico).
- **Troca de provedor:** o agente fica atrás de uma interface (porta e adaptador). **Provedor escolhido: Kimi K3**, por API compatível com o protocolo da OpenAI (`https://api.moonshot.ai/v1`); a documentação consultada descreve o JSON Mode (objeto JSON válido); o esquema é validado no servidor (ADR-011).
- **Rastreabilidade:** cada item guarda origem, data e aprovador. Para a demo, é possível gravar uma execução prévia como plano B se a rede falhar.

**Custo estimado (teto, todas as receitas pelo agente).** Cotações de 05/10/2026, aproximadas: 1 CNY ≈ R$ 0,75 e 1 USD ≈ R$ 5,00. Entrada ≈ R$ 15 por milhão de tokens; saída ≈ R$ 75 por milhão; entrada em cache ≈ R$ 1,50 por milhão. Hipótese: 4.000 tokens de entrada e 10.000 de saída por receita. Ver ADR-012

| Cenário | Entrada | Saída | Total aproximado |
|---|---|---|---|
| Seed da demo (20 pratos) | R$ 1,20 | R$ 15,00 | **R$ 16** |
| Lançamento (100 pratos) | R$ 6,00 | R$ 75,00 | **R$ 81** |
| Dimensionamento (350 pratos) | R$ 21,00 | R$ 262,50 | **R$ 284** |

É um custo único por carga de catálogo, e não recorrente por usuário, mas **não é custo zero**. O ADR deve tratá-lo como pagamento pontual justificado e definir um limite de gasto no console. **Medir o consumo real com 3 a 5 receitas antes de projetar o total.**

**Lacuna no modelo conceitual (decidida):** `Ingrediente` tinha só `nome`. A dupla decidiu acrescentar o atributo `alergenos` a `Ingrediente` (e não à relação de substituição). A alteração entra na issue de retroalimentação da Fase 1.

## 5. Opções por camada

| Camada | Opções avaliadas | Observação |
|---|---|---|
| Cliente | React Native com TypeScript (Expo, *dev build*); Flutter | SQLCipher não roda no Expo Go |
| Banco local cifrado | `expo-sqlite` com `useSQLCipher`; `op-sqlite` com SQLCipher; Drift com SQLite3MultipleCiphers (Flutter) | No Drift 2.32+, `sqlcipher_flutter_libs` ficou obsoleto |
| Backend | Servidor TypeScript próprio (monólito modular); Supabase | BaaS substitui a D2 |
| Banco do servidor | Postgres em contêiner (demo); Neon ou Azure Database for PostgreSQL (alvo) | Render Postgres descartado |
| Autenticação | Conta anônima emitida pelo servidor, com e-mail e senha opcionais; Supabase Auth | A02 pede chegar à primeira sugestão sem cadastro extenso (RNF02: no máximo 3 campos obrigatórios) |
| Notificações | Locais agendadas no dispositivo; push (FCM) | Datas definidas pelo usuário; push desnecessário |
| Importação do catálogo | Manual (UC12) ou assistida por agente de IA (Kimi K3), com aprovação do curador | Seção 4 |
| Fotos | Servidas pela API (demo); hospedagem estática (alvo) | 2.4 |

## 6. Propostas de MVP

### P1 — React Native + servidor TypeScript próprio

- **Cliente:** React Native com TypeScript (Expo, *dev build*), por feature. SQLCipher com chave de 256 bits protegida pelo Keystore via expo-secure-store; fila de sincronização na mesma base cifrada.
- **Servidor:** Fastify ou NestJS, monólito modular (catálogo, perfil e restrições, rotina, progresso e avaliação, importação). Endpoint de sincronização idempotente.
- **Regra de alérgenos:** pacote TypeScript único, usado no cliente e no servidor, com a mesma suíte de testes (A06), incluindo a RN22 para substitutos.
- **Dados do servidor:** Postgres; AES-256-GCM nos campos de restrição, com chave fora do banco, para que *dumps* e backups contenham texto cifrado em qualquer provedor.
- **Demo:** Docker Compose (API com módulo de importação + Postgres) e emulador Android.
- **Alvo:** Cloud Run + Neon, ou Azure com crédito de estudante (a decidir na 2.4).
- **Riscos:** construir autenticação e sincronização no servidor; configuração nativa do SQLCipher; no alvo, cold start (R5) e conta de faturamento (R6).

### P2 — React Native + Supabase (plano B)

- **Cliente:** igual ao P1; o SDK não substitui o banco local nem a fila.
- **Backend:** Supabase (Postgres, Auth, RLS, Edge Functions). Substitui a D2.
- **Regra de alérgenos:** duas implementações (Edge Function ou SQL, e cliente), com vetores de teste em arquivo comum.
- **Demo:** a pilha local do Supabase roda em contêineres, provavelmente mais pesada que um Compose simples (**hipótese, não verificada**).
- **Riscos:** pausa após 7 dias sem uso no alvo; dado sensível sob terceiro (A05); RLS é conhecimento novo.

### P3 — Flutter + servidor TypeScript próprio

- **Cliente:** Flutter com Drift e SQLite3MultipleCiphers. Servidor, banco, notificações e importação iguais ao P1.
- **Regra de alérgenos:** duas implementações (Dart e TypeScript), com vetores de teste comuns.
- **Riscos:** curva de Dart e Flutter em 45 dias.

## 7. Cobertura das US Must

| US | Resumo | Cobertura nas três propostas |
|---|---|---|
| US01, US02, US03 | Sugestão, aprovação, ingredientes | Servidor |
| US05 | Receita completa | Local, offline |
| US06, US07 | Plano e lista de compras | Local + sincronização |
| US08 | Lembretes | Notificações locais |
| US09 | Restrições e alérgenos | Cifrado, três estados |
| US10 | Substituições | Cadastradas e aprovadas na importação (manual ou assistida), baixadas com a receita; filtradas pela RN22 |
| US12, US14 | Avaliação e coleção | Local + sincronização |
| US18 | Importação | Manual, ou assistida por agente de IA com aprovação do curador |

## 8. Critérios e pesos

Pesos da 2.1: crítico = 3, alto = 2, médio = 1. Prazo e custo zero são restrições duras (3). Curva de aprendizado = 2. **Demonstrabilidade local = 2** (a entrega acadêmica é uma execução local). Fora da matriz: A03 e A12 (não diferenciam) e A14 (fora do MVP). O custo da API de IA não entra no critério "custo zero" da matriz porque é igual nas três propostas.

Pesos: A06, A05, A08, A04, Prazo, Custo = 3; A09, A01, A02, Curva, Demonstrabilidade = 2; A11, A13, A07 = 1. Máximo: 31 × 5 = 155.

## 9. Matriz

| Critério (peso) | P1 | P2 | P3 |
|---|---|---|---|
| A06 Alérgenos (3) | 4 | 3 | 3 |
| A05 LGPD (3) | 4 | 3 | 4 |
| A08 Integridade e sincronização (3) | 4 | 4 | 4 |
| A04 Offline parcial (3) | 4 | 4 | 4 |
| Prazo (3) | 4 | 4 | 2 |
| Custo zero (3) | 4 | 4 | 4 |
| A09 Catálogo (2) | 4 | 4 | 4 |
| A01 Desempenho da sugestão (2) | 3 | 3 | 3 |
| A02 Primeiro valor (2) | 4 | 5 | 4 |
| Curva de aprendizado (2) | 5 | 4 | 2 |
| Demonstrabilidade local (2) | 5 | 3 | 5 |
| A11 Escala (1) | 4 | 3 | 4 |
| A13 Observabilidade (1) | 4 | 3 | 4 |
| A07 Notificações (1) | 4 | 4 | 4 |
| **Total (máx. 155)** | **126** | **114** | **111** |

### Justificativa das notas que diferenciam

- **A06:** o P1 tem uma única regra em TypeScript nos dois lados; P2 e P3 têm duas implementações.
- **A05:** no alvo, o P2 deixa o dado sob terceiro, com backups gratuitos não verificáveis; P1 e P3 mantêm o controle e usam cifra de aplicação.
- **Prazo:** o esforço de implantação saiu do cálculo. O P2 poupa autenticação e backend, mas perde parte disso na pilha local; o P1 constrói o backend; o P3 soma a curva de Dart.
- **A01:** igual (3) para as três; cold start só existe no alvo e não é medido (R5).
- **Demonstrabilidade:** P1 e P3 rodam em um Compose simples; a nota 3 do P2 é **hipótese**.
- **Curva:** P1 usa a stack conhecida; P2 exige RLS; P3 exige Dart.

### Sensibilidade

| Cenário | P1 | P2 | P3 |
|---|---|---|---|
| Base | 126 | 114 | 111 |
| Sem o critério de demonstrabilidade (máx. 145) | 116 | 108 | 101 |
| Prazo, custo e curva com peso 1 | 105 | 94 | 97 |
| A05 e A06 com peso 4 | 134 | 120 | 118 |

O P1 lidera nos quatro cenários. A vantagem sobre o P2 vai de 8 a 14 pontos. Essas notas são julgamento do arquiteto, não medição; o gatilho de 10 dias cobre o erro.

## 10. Escolha confirmada: P1

**Escolha (confirmada pela dupla em 06/10/2026):** P1, com demonstração em Docker Compose e emulador Android, e alvo documentado (Cloud Run + Neon, ou Azure com crédito de estudante).

Motivos: (1) criptografia sob controle da dupla e demonstrável por inspeção; (2) regra única de alérgenos (A06); (3) stack conhecida; (4) coerência com D1 e D2; (5) a demo local é simples e previsível.

### O que se perde

| Perda | Atributo | Mitigação |
|---|---|---|
| Autenticação e backend a construir | Prazo | Conta anônima; escopo mínimo; protótipo com limite de 10 dias |
| A01 e A11 não medidos em produção | A01, A11 (R5) | Declarar como hipótese; medir se houver implantação |
| Agente de IA pode errar tradução, alérgenos ou substitutos | A06, A09 | Estado "não verificado" por padrão; aprovação humana; esquema validado; RN22 (R8) |
| Dependência e custo da API de IA (R$ 16 a R$ 284 por carga) | A09 | Interface para trocar provedor; fluxo manual como alternativa; execução gravada; limite de gasto (R9) |
| Direitos e termos de uso das fontes | Legal | Atribuição; conferência dos termos de cada fonte (R10) |
| RN22 reduz a oferta de substitutos (muitos ficam "não verificados") | A06 × usabilidade | Agente propõe alérgenos por ingrediente; app informa "sem substituto seguro cadastrado" |

### Descartadas

- **P2 (Supabase):** perde em A05 (alvo) e A06; pausa de 7 dias no alvo; plano B se o protótipo de sincronização ultrapassar 10 dias.
- **P3 (Flutter):** perde em prazo e curva, sem ganho em atributo ponderado.
- **Render:** religa em cerca de 1 min; Postgres expira em 30 dias.

### Gatilhos de revisão

| Gatilho | Ação |
|---|---|
| Protótipo de sincronização acima de **10 dias corridos** ou falha nos 100 ciclos de A08 | Reavaliar P2 ou reduzir o escopo offline |
| Abertura offline com SQLCipher acima de 2 s no emulador de referência | Trocar biblioteca ou reduzir o escopo local; abrir mão da cifra não é opção |
| Dupla decidir implantar de fato | Medir A01 e A11 no provedor; decidir hospedagem em ADR |
| Consumo real de tokens com 3 a 5 receitas muito acima da hipótese, ou preço do console diferente do informado | Rever o escopo do fluxo assistido; usar mais o fluxo manual; avaliar outro provedor |
| Professor passar a exigir IA diante do usuário final | Reabrir a decisão A pura; exigiria alterar a RN15 e checar alérgenos de forma determinística |
| Dupla ganhar um Mac e quiser iOS | Registrar custo anual de US$ 99 em ADR |

## 11. Criptografia (A05)

| Camada | Mecanismo (hipótese) | Verificação na demo |
|---|---|---|
| Trânsito | TLS no alvo; na demo local, HTTP em rede local deve ser declarado como limitação | Declarar a diferença; TLS no alvo |
| Dispositivo | SQLCipher (inclui a fila); chave de 256 bits protegida pelo Keystore via expo-secure-store | Arquivo do banco ilegível sem a chave |
| Servidor | AES-256-GCM nos campos de restrição; chave fora do banco | Colunas só com texto cifrado no Postgres do Compose |
| Backups | Herdam o texto cifrado | Restaurar um *dump* e inspecionar |
| Backup do Android | Desativar o backup automático e excluir o banco e as preferências da chave por regras de extração (ADR-006) | Teste de restauração |
| Revogação | Apagar banco ou chave local na hora; armazenamento ativo do servidor em até 24 h após receber o pedido (H); backups expiram pela retenção do provedor | Cenário de teste de A05 |

A medida de abertura em 2 s (H) será feita no emulador de referência, com SQLCipher. TLS em "100% das comunicações" (A05) não vale em HTTP local; registrar como limitação da demo.

## 12. Plano de validação das medidas (H)

| Medida | Como validar | Onde |
|---|---|---|
| Dispositivo de referência (Android, 4 GB, 4G) | Emulador configurado com 4 GB; registrar o perfil | Demo |
| Abertura offline em 2 s com SQLCipher | 30 aberturas com o seed baixado | Demo |
| Salvar avaliação e desbloquear em 1 s | Cronometrar | Demo |
| Sincronização iniciada em 60 s após reconexão | Simular queda de rede no emulador | Demo |
| 0 perdidas e 0 duplicadas em 100 ciclos (A08) | Teste automatizado | Demo |
| Sugestão em 2,5 s em 95% | Teste local mede só a lógica; no alvo, medir com instância fria | Demo (parcial) |
| Exclusão em 24 h | Teste de revogação | Demo |
| Consumo de tokens e custo por receita | Importar 3 a 5 receitas pelo Kimi K3 e somar tokens de entrada e saída | Protótipo do agente |
| Saída estruturada por JSON Schema | Validar o esquema de saída do agente com receitas em outro idioma | Protótipo do agente |
| RN22 (substituto sem alérgeno da restrição) | Teste automatizado com restrições e substitutos nos três estados | Demo |

## 13. Conflitos (atualizados)

| Conflito | Tratamento |
|---|---|
| A04 × A06 | Data visível dos alérgenos; atualização ao abrir com rede |
| A04 × A08 | RN04, sem revogação |
| Custo × A01 × A11 | Só no alvo; documentado |
| A09 × prazo | Agente de IA com aprovação humana reduz o esforço de curadoria e tradução |
| A09 × A06 | IA propõe, curador aprova; "verificado" é só humano; RN22 filtra substitutos |
| A09 × custo da API | Seed pequeno; fluxo manual como alternativa; limite de gasto |
| A13 × A05 | Logs sem dado de restrição |
| A05 × A04 | SQLCipher com medida de 2 s e gatilho de revisão |

## 14. Retroalimentação

Detalhada no artefato `issue-retroalimentacao-fase1.md` (v1.3), que é a fonte de verdade da issue.

**Já resolvido na Fase 1 (conferido em 06/10/2026):** RNF05 reescrito; RNF06 com criptografia; estado de alérgenos em RF18, RN08, RN10, RN16, US09 e modelo conceitual; US12 sem a redação circular; status das RNs como "validado".

**Pendente (issue de retroalimentação da Fase 1):**
- **Correções de texto:** "ingredievalidadonte" na RN15; erros de digitação na US09; concordância na RN16; separador faltando na tabela do modelo conceitual.
- **Requisito de IA:** novo RNF11 (apoio opcional de agente de IA, com tradução e aprovação do curador); ajuste do RF18; RNF06 com "nenhum dado de usuário vai a provedor de IA"; RNF08 estendido a receitas traduzidas; exigência do professor como restrição de projeto.
- **Modelo e regras:** `alergenos` em `Ingrediente` (decidido); RN15 com origem manual ou de IA aprovada; novas RN21 (aprovação do curador) e RN22 (substituto sem alérgeno da restrição, decidida).
- **Casos de uso e backlog:** UC09 e UC12 (fluxo manual principal, fluxo assistido alternativo, exceção de falha da API); US10 e US18 com critérios novos.
- **Documentos derivados:** `documento-de-requisitos.md`, `casos-de-uso.md`, `casos-de-teste.md`, `matriz-rastreabilidade.md` e `lexico.md` a conferir (alguns mantêm o mesmo tamanho de arquivo de antes das correções).

**Fase 2:**
- `atributos-qualidade.md` (v1.2, aplicada): exclusão offline conta 24 h a partir do recebimento pelo servidor; TLS da demo local; cenário de qualidade da saída da IA na importação (A09).
- `estilo-arquitetural.md`: v1.1: módulos do servidor e referências aos ADRs.

## 15. Conferência com a Definition of Done (2.3)

- Pelo menos 2 propostas concretas: sim (P1, P2, P3).
- Critérios com pesos derivados da 2.1, incluindo prazo, custo zero e curva: sim (seção 8).
- Proposta escolhida e descartadas justificadas: sim, com a escolha confirmada pela dupla (seção 10).

## 16. Riscos aceitos nesta etapa

| ID | Risco | Mitigação |
|---|---|---|
| R6 | No alvo, conta de faturamento com cartão (Cloud Run) | Alerta de orçamento; alternativa Azure com crédito de estudante |
| R7 | Diferença entre P1 e P2 baseada em notas de julgamento | Plano B e gatilho de 10 dias |
| R8 | O agente de IA erra tradução, alérgenos ou substitutos | Estado "não verificado" por padrão; aprovação humana; validação por esquema; RN22 |
| R9 | Custo (R$ 16 a R$ 284 por carga, hipótese), disponibilidade e mudança de oferta do Kimi K3 | Interface para trocar provedor; fluxo manual; execução gravada; limite de gasto; medir tokens reais |
| R10 | Direitos autorais e termos de uso das fontes ao traduzir e publicar receitas | Atribuição; conferência dos termos de cada fonte; preferir fontes com licença aberta (a verificar) |
| R11 | Divergência das fontes sobre uso de dados da API da Kimi para treinamento | Enviar só texto de receita; nunca dado de usuário; revisar termos antes de ampliar o uso |
| R12 | Conta anônima sem e-mail e sem recuperação de senha é irrecuperável se o aparelho for perdido ou a sessão encerrada; vale também a regra de um aparelho por conta (ADR-007, ADR-008) | A interface incentiva vincular e-mail; sincronização assim que houver rede; aviso claro ao criar a conta; revisão se a perda de conta virar queixa recorrente |
| R13 | Refresh token sem rotação: o roubo de um token dá acesso até a revogação ou o fim da validade (ADR-007) | Token guardado em `expo-secure-store`; validade máxima; revogação no servidor; revogação do aparelho anterior no login com e-mail; revisar a rotação se houver implantação real |

A criptografia da restrição alimentar continua sendo requisito, e não risco.