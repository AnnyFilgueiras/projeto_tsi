# Design Doc: Refatoração de Governança Multi-Agente e Alinhamento Arquitetural para MVP (Panelada)

- **Data:** 18/11/2026
- **Autores:** Gabryel Souza, Anny Filgueiras e Agente Arquiteto (Antigravity CLI)
- **Status:** Em Revisão pela Dupla
- **Escopo:** Governança para agentes CLI, padronização da árvore de diretórios do repositório e ajustes arquiteturais incrementais para viabilizar o MVP, o deploy em nuvem gratuita e a futura modelagem com framework metodológico de gamificação.

---

## 1. Intenção e Motivação (O Porquê)

O projeto **Panelada** concluiu a Fase 1 (Engenharia de Requisitos) e avançou até a etapa 2.7 da Fase 2 (Projeto Arquitetural). Até aqui, o trabalho foi conduzido principalmente via threads no Perplexity Web, utilizando "briefings de passagem" manuais entre conversas.

Dois fatores motivam esta refatoração agora:
1. **Mudança no fluxo de trabalho com IA:** A dupla está migrando do Perplexity Web para **agentes de IA baseados em CLI**, trabalhando colaborativamente via GitHub. Sem um ponto de entrada canônico no repositório, um painel de estado vivo e manuais operacionais objetivos (*playbooks*), cada novo agente ou nova thread corre o risco de perder contexto, procurar arquivos em caminhos inexistentes ou quebrar invariantes arquiteturais.
2. **Viabilidade do MVP, Deploy em Cloud Gratuita e Requisito de Gamificação:**
   - Após a Fase 2, surgiu o requisito acadêmico de fundamentar a gamificação do projeto em um **framework conceitual/metodológico especializado** (ex.: Octalysis ou 6D), o que será realizado em etapa futura dedicada.
   - A dupla deseja implementar em breve uma versão com funcionalidades mínimas (MVP) com **deploy real em serviços cloud gratuitos**, sem travar semanas na infraestrutura completa de fila offline (*Transactional Outbox* + *Idempotent Receiver*) logo no primeiro corte, mas preservando o desenho para ativar o offline completo sem retrabalho.

---

## 2. Objetivos, Não-Objetivos e Anti-Objetivos

### Objetivos (Goals)
- **G1. Ponto de entrada único para Agentes (`AGENTS.md` + `CLAUDE.md`):** Qualquer agente CLI que abrir o repositório deve saber imediatamente onde estão os artefatos, qual a ordem de precedência documental, as regras de idioma ([ADR-015](../../fase2/adr/adr-015-idioma-dos-identificadores.md)) e o protocolo obrigatório de início e fim de sessão.
- **G2. Rastreamento contínuo de estado (`STATE.md` + GitHub Issues):** Substituir os antigos briefings de passagem avulsos por um painel vivo versionado na raiz (`STATE.md`), sincronizado com as GitHub Issues e contendo o *handoff* estruturado entre sessões/agentes.
- **G3. Manuais operacionais objetivos (`docs/playbooks/`):** Guiar agentes em tarefas recorrentes (ciclo de sessão e diário de bordo, manutenção de ADRs e retroalimentação, validação de fronteiras e contratos).
- **G4. Consistência física de `/docs/fase2/`:** Alinhar os caminhos reais dos arquivos no disco com os cabeçalhos `> Destino:` já declarados nos artefatos (`/docs/fase2/<artefato>.md`, `/docs/fase2/adr/` e `/docs/fase2/bruno/`), atualizando o `README.md` da raiz.
- **G5. Preparação arquitetural para MVP, Deploy Cloud e Gamificação:** Registrar nos ADRs, C4 e Padrões de Projeto:
  - A preparação do módulo `progress` para receber a modelagem de um framework conceitual de gamificação (6D/Octalysis).
  - A estratégia de implementação do Offline-First em **2 estágios** (Estágio 1: leitura offline no SQLCipher + escrita online direta; Estágio 2: ativação da `SyncQueue` e `ProcessedOperation` através das portas já existentes).
  - O uso de **Supabase (PostgreSQL + Storage gratuitos) + container Fastify em PaaS gratuita (Render / Fly.io / Cloud Run)** para o deploy real do MVP, mantendo paridade com o Docker Compose local.

### Não-Objetivos (Non-Goals — ficam para conversas futuras)
- **NG1.** Escolher ou aplicar o framework de gamificação (6D, Octalysis, etc.) nesta conversa.
- **NG2.** Definir o recorte exato de telas/histórias de usuário do primeiro deploy do MVP.
- **NG3.** Escrever código de aplicação (`apps/api`, `apps/mobile`, `packages/allergen-rules`) ou executar as etapas 2.8 (Revisão Arquitetural) e 2.9 (Checklist Final) nesta tarefa.

### Anti-Objetivos (Anti-Goals — o que configuraria falha mesmo se funcionar)
- **AG1.** Criar burocracia documental que obrigue a dupla a escrever textos longos manualmente antes de cada conversa com um agente CLI.
- **AG2.** Perder histórico ou rastreabilidade exigida pelo professor na disciplina (os Diários de Bordo por fase e a numeração de ADRs e requisitos são inegociáveis).
- **AG3.** Descartar a arquitetura Offline-First ([ADR-001](../../fase2/adr/adr-001-estilo-sistema-offline-first.md)) ao simplificar o Estágio 1 do MVP — as interfaces/portas devem permanecer intactas para que a volta ao plano completo seja plugável.

---

## 3. Restrições
1. **Regra de Precedência Documental:** Artefatos aprovados > ADRs > `STATE.md` > `briefing-fase2.md`.
2. **Convenção Bilingue ([ADR-015](../../fase2/adr/adr-015-idioma-dos-identificadores.md)):** Documentação, comentários de PR, Issues e Diário de Bordo em **português (Brasil)**; identificadores de código, nomes de pastas de código, rotas OpenAPI, coleção Bruno e mensagens de commit em **inglês**.
3. **Imutabilidade de ADRs:** Nenhum ADR é apagado. Evoluções de escopo desta refatoração entram como seções `## Detalhamento (Governança e MVP)` nos ADRs existentes (ou novo ADR se substituir decisão central).
4. **Custo Zero:** Toda ferramenta de governança, lint, banco e deploy deve operar em camada gratuita.

---

## 4. Abordagens Consideradas e Escolhas da Dupla

### 4.1. Organização de `/docs/fase2/` e Estrutura do Repositório
- **Opção 1A:** Manter subpastas numeradas atuais (`2.1-requisitos_de_qualidade`, `2.4-ADRs`...) e mapear os caminhos reais no `AGENTS.md`. *(Descartada: mantém a discrepância entre o caminho no disco e o cabeçalho `> Destino:` escrito dentro dos próprios arquivos).*
- **Opção 1B (Escolhida — Variante Raiz Limpa):** Mover os artefatos da Fase 2 para os caminhos exatos declarados em seus cabeçalhos (`/docs/fase2/*.md`, `/docs/fase2/adr/adr-*.md`, `/docs/fase2/bruno/panelada-curadoria/`), mantendo a Fase 1 em `/docs/fase1/1.1-...` a `1.4-...` e organizando o índice completo por sub-etapa (2.1 a 2.9) no `README.md` e no `AGENTS.md`.
- **Opção 1C:** Criar apenas `AGENTS.md` e `STATE.md` sem tocar em pastas. *(Descartada: não corrige caminhos quebrados nem prepara os playbooks).*

### 4.2. Preparação para o Framework Conceitual de Gamificação (6D / Octalysis)
- **Opção 2A (Escolhida — Ajustada para Framework Metodológico):** Manter o motor de gamificação desacoplado em `UnlockCalculator` (app) e `UnlockRules` (API, módulo `progress`), orientado a definições declarativas de marcos (`MilestoneDefinition` carregadas por seed e testadas por vetores JSON comuns). Documentar no `padroes-de-projeto.md` e `STATE.md` que a futura modelagem com framework conceitual (6D/Octalysis) atuará estendendo essas regras/dados declarativos dentro do módulo `progress` (e retroalimentando RNs da Fase 1), sem acoplar telas ou rotas de outros módulos.
- **Opção 2B:** Criar barramento de eventos de domínio (`DomainEvents`). *(Descartada: complexidade desnecessária já rejeitada na etapa 2.7).*
- **Opção 2C:** Ignorar completamente até a conversa de gamificação. *(Descartada: registrar o ponto de extensão agora protege o código caso a implementação comece antes).*

### 4.3. Mitigação da Complexidade Offline-First para o Primeiro Deploy do MVP
- **Opção 3A:** Online-First puro no Estágio 1 com SQLite em memória. *(Descartada: não entrega a leitura offline de receitas na cozinha nem a proteção SQLCipher desde o início).*
- **Opção 3B:** Construir toda a fila de sincronização bidirecional antes de qualquer tela. *(Descartada: alto risco de consumir o prazo antes do primeiro deploy funcional).*
- **Opção 3C (Escolhida — Escopo Offline em 2 Estágios com Retorno Transparente ao Plano Original):**
  - **Estágio 1 (Primeiro Deploy do MVP):** O app já implementa o banco local cifrado (`SqlCipherDatabase` via porta `LocalDatabase` — `P02a`) e armazena o conjunto baixado (permitindo abrir e cozinhar receitas planejadas/em preparo offline com checagem local de alérgenos). Porém, **operações de mutação** (criar/editar rotina, salvar avaliação, alterar restrição) exigem conectividade e batem direto na API. Para garantir retorno fácil ao plano original, os casos de uso do app **continuam chamando a interface `OperationEnqueuer` (`P04`)**, mas no Estágio 1 o adaptador injetado na raiz de composição (`src/app/composition`) envia a operação imediatamente à API (via `POST /v1/sync/operations` ou rota direta equivalente com `Idempotency-Key`) e atualiza o banco local na confirmação, exibindo aviso amigável se estiver sem rede.
  - **Estágio 2 (Offline-First Completo):** Troca-se na raiz de composição o adaptador direto pelo `OutboxOperationEnqueuer` + `Synchronizer` com backoff em background e ativa-se a tabela `ProcessedOperation` (`Idempotent Receiver` — `P05`) para reenvios offline, **sem alterar nenhuma tela ou caso de uso**.

### 4.4. Estratégia de Deploy Real em Cloud Gratuita
- **Opção 4A:** Google Cloud Run + Secret Manager + Cloud Storage + Neon separados. *(Descartada para o MVP inicial: exige cartão de crédito no GCP e configuração de 4 serviços distintos).*
- **Opção 4B:** Cloud-Only sem Docker Compose local. *(Descartada: perde a segurança de demonstrar localmente caso a internet falhe).*
- **Opção 4C (Escolhida — PaaS Unificada + Container da API, mantendo Paridade com Docker Compose):**
  - **Banco de Dados e Fotos na Nuvem:** Utilizar **Supabase (Free Tier)** exclusivamente como infraestrutura gerenciada de **PostgreSQL** e **Storage de Objetos (buckets para as fotos WebP)** — **sem usar o BaaS/SDK do Supabase no cliente**. Todo acesso continua passando pela `API Panelada` (Fastify), o que garante que as restrições alimentares (`A05`) continuem sendo cifradas em memória pela aplicação com `AES-256-GCM` ([ADR-006](../../fase2/adr/adr-006-criptografia-restricao-alimentar.md)) antes de chegar ao disco do banco na nuvem.
  - **Hospedagem da API Fastify:** Hospedar o container Docker da API (`API Panelada`) em PaaS gratuita compatível com Dockerfile (ex.: **Render Free Web Service**, **Fly.io** ou **Koyeb**), configurada via variáveis de ambiente (`DATABASE_URL`, `AES_KEY`, `AI_API_KEY`, `STORAGE_URL`). *(Mitigação de suspensão/cold start: ping de aquecimento antes de sessões de demonstração).*
  - **Paridade Local:** O `docker-compose.yml` local continua existindo intacto (PostgreSQL local + volume local de fotos) para desenvolvimento offline e como plano B garantido para apresentação em sala. Uma porta simples `PhotoStorage` (`LocalDiskPhotoStorage` vs. `SupabasePhotoStorage` / URL estática) isola a diferença.

---

## 5. Especificação Detalhada da Refatoração

### 5.1. Nova Árvore de Arquivos do Repositório

```text
/
├── AGENTS.md                        # [NOVO] Guia mestre para qualquer agente CLI
├── CLAUDE.md                        # [NOVO] Ponteiro curto para AGENTS.md (compatibilidade multi-CLI)
├── STATE.md                         # [NOVO] Painel vivo de progresso, issues, pendências e handoff
├── README.md                        # [ATUALIZADO] Visão geral do projeto (Fases 1 e 2 + Governança)
└── docs/
    ├── playbooks/                   # [NOVO] Manuais operacionais curtos para tarefas recorrentes
    │   ├── 01-sessao-issues-e-diario.md
    │   ├── 02-arquitetura-adrs-e-retroalimentacao.md
    │   └── 03-qualidade-fronteiras-e-contratos.md
    ├── superpowers/
    │   └── specs/
    │       └── 2026-11-18-governance-and-architecture-refactoring-design.md
    ├── fase1/                       # [MANTIDO] Estrutura 1.1 a 1.4 preservada
    │   ├── 1.1-elicitacao/
    │   ├── 1.2-analise/
    │   ├── 1.3-documentacao/
    │   ├── 1.4-validacao/
    │   ├── assets/
    │   └── diario_de_bordo-fase1.md
    └── fase2/                       # [REFATORADO - Opção 1B] Caminhos alinhados aos cabeçalhos
        ├── briefing-fase2.md
        ├── diario_de_bordo-fase2.md
        ├── atributos-qualidade.md          # (movido de 2.1-requisitos_de_qualidade/)
        ├── estilo-arquitetural.md          # (movido de 2.2-estilo_arquitetural/)
        ├── propostas-arquiteturais.md      # (movido de 2.3-propostas_arquiteturais/)
        ├── c4-contexto.md                  # (movido de 2.5-c4/)
        ├── c4-containers.md                # (movido de 2.5-c4/)
        ├── c4-componentes.md               # (movido de 2.5-c4/)
        ├── diagrama-classes.md             # (movido de 2.6-diagramas_fluxos_contratos/)
        ├── sequencia-uc04.md               # (movido de 2.6-diagramas_fluxos_contratos/)
        ├── sequencia-uc08.md               # (movido de 2.6-diagramas_fluxos_contratos/)
        ├── sequencia-uc10.md               # (movido de 2.6-diagramas_fluxos_contratos/)
        ├── sequencia-uc12.md               # (movido de 2.6-diagramas_fluxos_contratos/)
        ├── glossario-identificadores.md    # (movido de 2.6-diagramas_fluxos_contratos/)
        ├── mapa-renomeacao-openapi.md      # (movido de 2.6-diagramas_fluxos_contratos/)
        ├── openapi.yaml                    # (movido de 2.6-diagramas_fluxos_contratos/)
        ├── padroes-de-projeto.md           # (movido de 2.7-padroes_de_projeto/)
        ├── adr/                            # (renomeado de 2.4-ADRs/)
        │   └── adr-001..015-*.md
        └── bruno/                          # (movido de 2.6-diagramas_fluxos_contratos/bruno/)
            └── panelada-curadoria/
```

> **Nota sobre a futura Fase 3 (Implementação):** O `AGENTS.md` já documentará a topologia reservada do monorepo (`apps/api/`, `apps/mobile/`, `packages/allergen-rules/`), que será instanciada assim que a codificação iniciar.

### 5.2. Conteúdo e Papel dos Arquivos de Governança

#### A. `AGENTS.md` (e `CLAUDE.md`)
- **Identidade e Contexto:** Resumo de 1 parágrafo do Panelada e objetivo acadêmico (disciplina de TSI — IA generativa no ciclo de vida de software).
- **Protocolo Obrigatório de Sessão (4 passos):**
  1. Ler `STATE.md` para entender a fase atual, o último *handoff* e as Issues ativas.
  2. Consultar a matriz de contexto no próprio `AGENTS.md` para ler **apenas** os documentos necessários para a tarefa (evitando poluir a janela de contexto).
  3. Seguir o playbook correspondente em `docs/playbooks/`.
  4. Ao concluir: atualizar `STATE.md` (seção *Handoff* e tabela de progresso), atualizar o `diario_de_bordo-faseX.md` aplicável e fazer commit seguindo o [ADR-015](../../fase2/adr/adr-015-idioma-dos-identificadores.md).
- **Ordem de Precedência e Regras de Ouro:**
  - Precedência: Artefatos aprovados > ADRs > `STATE.md` > `briefing-fase2.md`.
  - Idioma ([ADR-015](../../fase2/adr/adr-015-idioma-dos-identificadores.md)): código/contratos/commits em inglês; docs/PRs/issues em português.
  - Nunca apagar ADRs; nunca violar regras `S1..S8` e `A1..A8` de fronteiras modulares; nunca logar restrição alimentar em texto claro (`A05`).
- **Mapa de Navegação do Repositório:** Tabela direta apontando para cada artefato da Fase 1, Fase 2 e futura estrutura de código (`apps/` e `packages/`).

#### B. `STATE.md` (Painel de Controle e Passagem de Bastão)
- **Cabeçalho de Status:** Fase atual (Fase 2 — pós-2.7 / Preparação para 2.8, Gamificação e MVP), branch ativa, última atualização.
- **Decisões Estratégicas Vigentes (Resumo Executivo):**
  - Topologia Monorepo (`apps/api`, `apps/mobile`, `packages/allergen-rules`, `docs/`).
  - Gamificação: pendente etapa dedicada com framework metodológico (6D/Octalysis) atuando sobre o módulo `progress` (`UnlockCalculator` / `UnlockRules`).
  - Estratégia Offline em 2 Estágios (Estágio 1: leitura offline SQLCipher + escrita online via porta `OperationEnqueuer`; Estágio 2: Outbox + Sync background completo).
  - Estratégia de Deploy Cloud Gratuita: Supabase (Postgres + Storage) + PaaS gratuita para container Fastify (Render/Fly.io), mantendo Docker Compose local.
- **Backlog Ativo e Pendências (Sincronizado com GitHub Issues):**
  - Tabela com as pendências herdadas do [diario_de_bordo-fase2.md](../../fase2/diario_de_bordo-fase2.md):
    - Fechamento da Fase 2: Lote 2 de higiene dos ADRs, Lote 3 (Issue #31 de retroalimentação da Fase 1), lint do `openapi.yaml`, validação da coleção Bruno, Etapa 2.8 (Revisão Arquitetural) e Etapa 2.9 (Checklist Final).
    - Frente de Gamificação: Modelagem com framework conceitual (6D/Octalysis).
    - Frente de MVP & Deploy: Recorte funcional do MVP, setup do monorepo e primeiro deploy.
- **Bloco de Handoff da Última Sessão:** Template fixo de 5 linhas (`Data/Agente`, `O que foi feito`, `Decisões tomadas`, `Arquivos alterados`, `Próximo passo recomendado`).

#### C. Manuais Operacionais (`docs/playbooks/`)
1. **`01-sessao-issues-e-diario.md`:** Como iniciar uma sessão, sincronizar com GitHub Issues (`gh issue list/view`), formato exato da entrada obrigatória no `diario_de_bordo-faseX.md` (exigência do professor para os slides finais) e como preencher o *Handoff* no `STATE.md`.
2. **`02-arquitetura-adrs-e-retroalimentacao.md`:** Como adicionar notas de detalhamento em ADRs existentes, quando criar um ADR novo, como manter a rastreabilidade (`US/RN/RNF -> A## -> ADR -> C4 -> Classes`) e como registrar retroalimentação para fases anteriores via Issue.
3. **`03-qualidade-fronteiras-e-contratos.md`:** Checklist prático para código e contratos: regras `eslint-plugin-boundaries` (`S1..S8` e `A1..A8`), sincronia entre `openapi.yaml` e coleção Bruno, suíte de vetores JSON para `allergen-rules` e `UnlockRules`, e diretrizes de TDD por camada.

### 5.3. Atualizações nos Artefatos Arquiteturais da Fase 2

Para refletir as decisões `2A`, `3C` e `4C` sem reescrever a história da Fase 2, aplicaremos notas de detalhamento datadas (`Detalhamento — Governança e Estratégia de MVP`):
1. **`docs/fase2/adr/adr-004-demonstracao-docker-e-alvo.md` e `adr-012-fotos.md` (Opção 4C):**
   - Adicionar seção `Detalhamento (Estratégia de Deploy MVP — Cloud Gratuita)` registrando que o ambiente de nuvem deixa de ser apenas documentado e passa a ser implantado no MVP usando **Supabase (PostgreSQL + Storage gratuitos)** e **container Fastify em PaaS gratuita (Render / Fly.io)**, mantendo o Docker Compose local como ambiente de desenvolvimento e fallback de apresentação.
2. **`docs/fase2/adr/adr-008-estrategia-offline-e-sincronizacao.md` (Opção 3C):**
   - Adicionar seção `Detalhamento (Implementação Incremental em 2 Estágios para o MVP)` documentando que as portas `LocalDatabase` e `OperationEnqueuer` são implementadas desde o Estágio 1, onde a leitura de receitas planejadas já ocorre offline via SQLCipher e as mutações operam online direto na API, permitindo ativar a fila *Transactional Outbox* (`SyncQueue`) e o `Idempotent Receiver` no Estágio 2 apenas trocando o adaptador na raiz de composição (`src/app/composition`).
3. **`docs/fase2/padroes-de-projeto.md` e `docs/fase2/diagrama-classes.md` (Opções 2A, 3C e 4C):**
   - Registrar a porta `PhotoStorage` (`P02f` — adaptador de disco local no Docker Compose vs. adaptador Supabase Storage na nuvem).
   - Explicitar em `OperationEnqueuer` (`P04`) os dois adaptadores de estágio do MVP (`DirectOnlineOperationEnqueuer` para o Estágio 1 vs. `OutboxOperationEnqueuer` para o Estágio 2).
   - Registrar na seção da regra de desbloqueio (`UnlockCalculator` / `UnlockRules`) que ela constitui o ponto de extensão isolado para as mecânicas que vierem da futura modelagem com framework conceitual de gamificação (6D/Octalysis).
4. **`docs/fase2/c4-containers.md` e `docs/fase2/briefing-fase2.md`:**
   - Atualizar o diagrama/notas de implantação do alvo em `c4-containers.md` com a opção PaaS (Supabase + PaaS container) e atualizar o `briefing-fase2.md` (v1.5) apontando para o novo fluxo com `AGENTS.md` e `STATE.md`.
5. **`docs/fase2/diario_de_bordo-fase2.md`:**
   - Adicionar a entrada correspondente a esta sessão de refatoração estrutural e de governança.

---

## 6. O que Fica a Cargo do Implementador (Builder's Calls)

- Ajustar links relativos quebrados nos arquivos Markdown ao mover os artefatos das subpastas `2.1-...` a `2.7-...` para `/docs/fase2/`.
- Garantir que `git mv` seja utilizado para preservar todo o histórico (`git log --follow`) dos arquivos movidos.
- Verificar se restou alguma pasta vazia em `/docs/fase2/` após a movimentação e removê-la.
