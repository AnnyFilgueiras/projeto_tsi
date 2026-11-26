# ADR-016 — Framework conceitual de gamificação: abordagem híbrida 6D + Octalysis e extensão declarativa de marcos

- **Status:** Aceito
- **Data:** 18/11/2026
- **Autores:** Dupla
- **Atributos:** A12 (baixo/modificabilidade da gamificação); A04, A08 (críticos — cálculo offline e idempotência); A07 (controle de notificações)
- **Rastreio:** US12, US13, US14, US15, US16, US17; RF11 a RF17; RN01 a RN07, RN12, RN18 a RN20; RNF07, RNF09, RNF10
- **ADRs relacionados:** ADR-001, ADR-002, ADR-005, ADR-008, ADR-009, ADR-015

## Contexto

O projeto recebeu a exigência acadêmica de fundamentar o planejamento e a
modelagem de gamificação do **Panelada** em um **framework conceitual
especializado** da literatura.

Até a etapa 2.7, as mecânicas de gamificação do produto — **Coleção por
Culinária** ("Pokédex de pratos", `US14`, `RN07`), **Cadeias de Evolução de
Pratos** (`US15`, `RN02`, `RN18`), **Badges por Marcos Verificáveis** (`US16`,
`RN03`, `RN04`) e a **Filosofia Não Punitiva** (`RNF09`, `RN12`) — estavam
especificadas funcionalmente e isoladas arquiteturalmente no módulo `progress`
(`UnlockRules` no servidor e `UnlockCalculator` no app, conforme a Opção 2A),
mas careciam de:

1. Um mapeamento metodológico formal que conectasse objetivos de negócio,
   comportamentos-alvo, perfis motivacionais das personas (`Marina`, `Rafael`,
   `Cleusa`), ciclos de atividade (*Activity Loops*) e a pirâmide de elementos
   de jogo (*Dinâmicas, Mecânicas e Componentes*).
2. Uma avaliação crítica sobre se os 5 tipos originais de marco da `RN03`
   (`dish`, `cuisine`, `n_cuisines`, `all_continents`, `set`) cobriam todos os
   impulsos motivacionais das personas ou se deixavam lacunas que obrigariam a
   refatorar o contrato de `UnlockCalculator` / `UnlockRules` durante a
   implementação do MVP (Fase 3).

## Decisão

1. **Framework conceitual adotado (Abordagem Híbrida 6D + Octalysis):**
   - **Espinha dorsal de engenharia — 6D Framework (Werbach & Hunter, 2012):**
     estrutura o processo de projeto em seis passos (*D1. Define business
     objectives*, *D2. Delineate target behaviors*, *D3. Describe your
     players*, *D4. Devise activity loops*, *D5. Don't forget the fun*, *D6.
     Deploy appropriate tools* com a pirâmide **DMC** — Dinâmicas, Mecânicas e
     Componentes).
   - **Lente motivacional e psicológica — Octalysis (Yu-kai Chou, 2015):**
     fundamenta os passos D2, D3 e D5 por meio dos **8 Core Drives**, da
     distinção entre gamificação **White Hat** (motivação positiva, autonomia,
     criatividade e maestria) e **Black Hat** (pressão, perda e escassez —
     *CD8: Loss & Avoidance*), e das 4 fases da jornada do jogador
     (*Discovery, Onboarding, Scaffolding, Endgame*).
2. **Nível de intervenção funcional e arquitetural (Nível 2 — Extensão
   declarativa de `RN03` sem novas tabelas):**
   - A análise pelos 8 Core Drives e pelas escadas de progressão do 6D revelou
     que os 5 tipos originais de marco da `RN03` (`a..e`) premiavam apenas a
     exploração geográfica (*CD4 Ownership* e *CD7 Curiosity*), deixando sem
     reconhecimento por badge três dimensões cujos dados **já existem** em
     `Rating` (`Avaliacao`) e `Dish` (`Prato`):
     - **Onboarding e consistência por volume (*6D Onboarding/Habit Loop* / *CD2*):**
       `(f) total_dishes` — concluir ao menos $N$ pratos distintos no catálogo;
     - **Maestria em cadeia de evolução (*6D Progression Stair* / *CD2 Accomplishment*):**
       `(g) evolution_level` — concluir ao menos um prato com nível de
       profundidade $\ge k$ ($k \ge 2$) em uma cadeia de evolução (`RN18`);
     - **Expressão criativa e autoria (*Octalysis CD3 — Empowerment of Creativity & Feedback*):**
       `(h) adaptation_count` — registrar alterações pessoais na receita
       (`changes` não vazio, `RN05` / `US12`) em ao menos $N$ preparos.
   - A união discriminada `Milestone` (no `openapi.yaml`, em `BadgeDefinition`,
     em `UnlockCalculator` e em `UnlockRules`) passa de 5 para **8 variantes
     declarativas** (`dish`, `cuisine`, `n_cuisines`, `all_continents`, `set`,
     `total_dishes`, `evolution_level`, `adaptation_count`), processadas pelo
     mesmo `switch` exaustivo com checagem `never` (`R03`).
3. **Preservação estrita das fronteiras modulares (`A12`) e do esquema de dados:**
   - **Zero novas tabelas ou colunas:** os novos marcos são avaliados
     exclusivamente a partir do histórico de `Rating` (que já contém `dishId` e
     `changes`) e do `catalogIndex.dishes` (que já contém `cuisineId` e
     `baseDishId` no `DownloadSet`).
   - **Isolamento no módulo `progress`:** nenhuma regra de gamificação vaza para
     `catalog`, `routine`, `profile` ou `importer`. O cálculo permanece puro,
     determinístico, executável offline em até 1 s (`A04`), somente aditivo
     (`RN04`, `A08`) e validado pela suíte compartilhada de vetores JSON entre
     App e API.
4. **Manutenção do recorte MoSCoW para Pontuação (`US13`/`RN19`) e Ranking (`RN20`):**
   - O sistema de pontos extrínsecos (`US13`, *Could*, `RN19`) permanece fora do
     MVP v1: sob a ótica do Octalysis, pontos avulsos são recompensas
     extrínsecas (*Left Brain*) de menor retenção a longo prazo do que a
     coleção cultural (*CD4*), a árvore de evolução (*CD2*) e o caderno criativo
     (*CD3*).
   - O descarte do ranking competitivo (`RN20`, *Won't*) ganha fundamentação
     teórica explícita: evita pressão social negativa e desmotivação de
     iniciantes, mantendo o *Core Drive 5 (Social Influence & Relatedness)*
     estritamente colaborativo (indicação de prato a amigo — `US17`, *Could*).

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| **Apenas 6D Framework (Werbach & Hunter)** | Excelente estrutura de engenharia (objetivos, loops e pirâmide DMC), mas não oferece vocabulário psicológico (como *White Hat vs. Black Hat*) para justificar cientificamente a ausência de punição (`RNF09`, `RN12`) e as diferenças motivacionais entre Marina, Rafael e Cleusa. |
| **Apenas Octalysis (Yu-kai Chou)** | Muito forte na análise psicológica dos 8 Core Drives, mas não formaliza os ciclos operacionais (*Engagement Loops* e *Progression Stairs*) nem a decomposição em *Dinâmicas → Mecânicas → Componentes* que conecta o design às classes de software da Fase 2. |
| **MDA (Hunicke, LeBlanc & Zubek)** | Voltado a jogos completos de entretenimento (*game design* puro); menos adequado para aplicativos utilitários de rotina e mudança de hábito (*serious gamification*). |
| **Nível 1 de intervenção (apenas documental, mantendo 5 marcos em `RN03`)** | Deixaria o *Core Drive 3 (Criatividade)* da persona Cleusa e a profundidade das *Cadeias de Evolução* do Rafael sem cobertura de marcos em `UnlockRules`, exigindo refatoração do contrato de `state` e dos vetores JSON na Fase 3. |
| **Nível 3 de intervenção (ativar Pontuação `US13`/`RN19` no MVP)** | Exigiria novas tabelas/colunas, alterações em endpoints e novas telas para uma mecânica extrínseca classificada como *Could* na Fase 1, comprometendo o prazo de 1,5 mês do MVP (R4). |

## Consequências

**Positivas**
- Atende integralmente à exigência acadêmica com um documento metodológico
  completo (`/docs/fase2/03-modelagem/framework-gamificacao.md`) e rastreabilidade ponta a
  ponta (`Persona → Core Drive / 6D → US → RN → Classe → Contrato OpenAPI → Vetor JSON`).
- Torna o contrato de `UnlockCalculator` e `UnlockRules` *future-proof* para as
  4 fases da jornada do usuário (*Discovery, Onboarding, Scaffolding, Endgame*)
  sem adicionar complexidade de banco de dados ou de rede.
- Comprova na prática a eficácia do atributo de qualidade **A12
  (Modificabilidade da gamificação)**: a evolução do modelo de marcos de 5 para
  8 variantes modificou apenas o módulo de progresso e o schema `Milestone` do
  contrato, sem tocar nos demais módulos do monólito modular.

**Negativas**
- Aumenta de 5 para 8 os ramos do `switch` exaustivo em `UnlockCalculator` e
  `UnlockRules` e exige ao menos 3 novos casos na suíte compartilhada de vetores
  JSON.
- O cálculo de `evolution_level` exige percorrer os ponteiros `baseDishId` no
  índice leve do catálogo (`catalogIndex.dishes`); como o catálogo tem 100 a 350
  pratos em memória e árvores rasas (2 a 4 níveis), o custo computacional é
  desprezível ($O(d)$ onde $d \le 5$, sub-milissegundo).

## Riscos relacionados

- **R4 (Prazo do MVP):** mitigado pela escolha do Nível 2 (zero novas tabelas,
  zero novas telas obrigatórias; apenas mais 3 ramos puros no `switch` de
  desbloqueio).
- **Divergência entre `UnlockCalculator` (App) e `UnlockRules` (API):**
  mitigado pela suíte única de vetores JSON executada na CI nos dois lados
  (decisão da 2.7 mantida).

## Quando revisitar

| Gatilho | Ação |
|---|---|
| `US13` (Pontuação, `RN19`) ou `US17` (Indicação a amigo) entrarem em versão pós-MVP | Estender o módulo `progress` (para `RN19`) usando o passo D6 do `framework-gamificacao.md`, mantendo a fronteira pública `ProgressPublic`. |
| Surgimento de mais de 10 tipos de marco com lógica complexa | Reavaliar a decisão `R03` (`padroes-de-projeto.md`), podendo substituir o `switch` exaustivo por uma tabela de estratégias por tipo de marco. |

## Detalhamento (Pratos misteriosos e ícones de badge — 25/11/2026)

Registro de duas decisões tomadas pela dupla durante `MVP-04H` (#86). A decisão original continua valendo; isto só detalha como ela aparece na tela.

### 1. Evoluções ainda não alcançadas são "pratos misteriosos" (formato C)

- **Regra:** uma evolução (`baseDishId != null`) cujo prato base ainda não foi concluído aparece **sem nome** ("Prato misterioso", ícone de interrogação) na Coleção e **não é sugerida** na Descobrir. Concluir o prato base revela o nome na hora (`RN02`).
- **Todos os níveis da cadeia aparecem:** o total da culinária (`totalDishes`, `RN07`) continua contando os pratos ocultos.
- **A dica cita o prato base só quando ele está visível:** "Conclua *Aglio e Olio* para revelar". Sob outro mistério, a dica é "Revele o prato acima primeiro", que aponta o base pela posição e ainda cumpre a `RN02`.
- **Por que não esconder os níveis seguintes:** o "falta X" já revela que eles existem. Reduzir o total para escondê-los faria uma culinária "Completa" voltar a ficar incompleta quando o prato surgisse, uma perda que este ADR proíbe (`CD8`, `RN04`, `RNF09`).
- **Perfis atendidos** (personas de `framework-gamificacao.md` §4):
  - O *Explorer* ganha a silhueta que convida à descoberta (`CD7`).
  - O *Achiever* mantém uma meta estável e um próximo passo claro (`CD2`).
  - Socializador e predador não são afetados: a Onda 1A não tem recursos sociais nem competição.
- **Risco aceito:** uma restrição alimentar que exclui o prato base (ex.: ovo na Carbonara) impede revelar as evoluções acima dele. Isso já decorria de `RN02` + `RN07` e fica para a revisão de UX (`UX-02`, #69).

### 2. Ícone próprio por badge: `Should`, cosmético e persuasivo

- **Decisão:** cada badge pode declarar um `iconKey` opcional na própria definição, que vem do seed (`RN03`): o mesmo lugar do nome, da descrição e do marco. O app liga a chave a um SVG do seu catálogo de ícones e usa o ícone genérico quando ela falta ou é desconhecida.
- **Alternativa descartada:** uma tabela `badgeId → ícone` só no app. Ela dividiria a definição do badge em dois lugares e prenderia o app aos UUIDs do seed.
- **Prioridade `Should`:** nenhuma regra de progresso depende do ícone. Mesmo assim, ele tem papel persuasivo: transforma o badge em objeto de coleção reconhecível (`CD4` posse, `CD2` conquista), como os avatares e emblemas do Duolingo.
- **Rastreio:** `GAM-03` (#100, campo `iconKey` da API ao app) e `GAM-04` (#101, um desenho por badge do seed, sub-issues #102–#112), na Onda 1B (#46).

