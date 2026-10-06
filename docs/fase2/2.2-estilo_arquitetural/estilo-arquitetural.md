# Estilo Arquitetural — Panelada (Fase 2.2)

> Fase 2.2 — Estilo arquitetural. Papel da IA: arquiteto de software, com análise de trade-offs.
> Destino: `/docs/fase2/estilo-arquitetural.md`. Versão 1.0 — 06/10/2026 — status: decisões discutidas e fechadas com a dupla na conversa 2.2, com o E2 confirmado expressamente em 06/10/2026; a formalização em ADR ocorre na 2.4.
> Insumos: `briefing-fase2.md` (seções 3, 5, 7 e 8), `briefing-passagem-2.2.md`, `diario-de-bordo-fase2.md` (com a entrada 2.1), `atributos-qualidade.md` v1.0.
> Convenção: IDs dos atributos conforme `atributos-qualidade.md` (A01 a A14). Medidas marcadas (H) são hipóteses a revalidar na 2.3.

## 1. Recapitulação da 2.1

| Faixa | Atributos | Peso na matriz |
|---|---|---|
| Crítico | A06 alérgenos, A05 LGPD, A08 integridade e sincronização, A04 offline parcial | 3 |
| Alto | A09 catálogo, A01 desempenho da sugestão, A02 tempo até o primeiro valor | 2 |
| Médio | A07, A03, A11, A13 | Não pontuados |
| Baixo / fora | A12 baixa; A14 fora do MVP | Não pontuados |

**Restrições:** MVP em 1,5 mês (cerca de 45 dias); infraestrutura gratuita (pagamento único baixo aceitável); até 1.500 usuários ativos no pico; catálogo de 350 pratos (100 no lançamento); experiência em React e TypeScript, com Flutter a comparar na 2.3.

**Offline:** receitas planejadas, em preparo e preparadas, com avaliação salva offline e sincronização posterior. Candidatas não ficam offline. "Prato concluído" = avaliação salva (RN01).

**Conflitos a tratar:** A04 × A06, A04 × A08, custo × A01 × A11, A09 × prazo, A13 × A05.

## 2. Premissas decididas nesta etapa

| # | Decisão | Efeito |
|---|---|---|
| P1 | Sugestão e busca (A01) rodam no servidor. | O catálogo de candidatas não é replicado no dispositivo; A01 depende de rede, de cold start e da camada gratuita (H). |
| P2 | A checagem de alérgenos roda no servidor para sugestão e busca, e no cliente para abrir receita já baixada (offline). As duas implementações passam pela mesma suíte de testes de A06. | Regra duplicada, com risco de divergência controlado por teste. |
| P3 | O cliente desbloqueia evolução e badge localmente; o servidor apenas confirma, sem revogar (RN04). | Ranking (Won't) não é afetado agora; A04 × A08 mitigado. |
| P4 | Regra do projeto: **um estilo dominante por nível, mais táticas justificadas.** Cada mistura registra o atributo que resolve e o que custa. | Evita combinar estilos sem ganho de atributo. |
| P5 | A decisão se divide em duas: (D1) estilo do sistema; (D2) estilo interno do servidor. | Atributos de cliente e de servidor deixam de se misturar na matriz. |
| P6 | Idempotência entra como princípio; o mecanismo fica para a 2.6. | O estilo continua válido com qualquer mecanismo escolhido depois. |
| P7 | **Proteção criptográfica da restrição alimentar é requisito do estilo, e não risco aceito:** criptografia em trânsito (TLS), em repouso no servidor e em repouso no dispositivo (banco local, fila de sincronização e backups). O mecanismo concreto (por exemplo, banco local cifrado com chave guardada no Keystore ou Keychain, hipótese) é decidido na 2.3 e na 2.4. | Fundamento: LGPD art. 46 (medidas de segurança aptas a proteger o dado) e §2º (aplicadas desde a concepção); a restrição alimentar é tratada como dado sensível (A05). Custo em prazo e na abertura do banco local (A04) a medir na 2.3. |

## 3. D1 — Estilo do sistema

### 3.1 Candidatos

| ID | Estilo | Ideia central |
|---|---|---|
| E1 | Cliente-servidor online-first | Cliente fino; regras e dados no servidor; cache apenas de leitura. |
| E2 | Offline-first com sincronização | Cliente com banco local e fila de operações para o conjunto baixado; servidor como fonte de verdade do catálogo e cópia do progresso. |
| E3 | BaaS / serverless | Sem servidor próprio; SDK do provedor, regras de acesso e funções gerenciadas. |
| E5 | Orientado a eventos (event sourcing) | Ações gravadas como eventos imutáveis; estado derivado por projeção. |

O E4 (microsserviços) é um estilo interno de servidor e foi movido para a D2.

### 3.2 Matriz

Notas de 1 (atende mal) a 5 (atende bem); pesos da 2.1 (crítico = 3, alto = 2); máximo de 90.

| Atributo (peso) | E1 | E2 | E3 | E5 |
|---|---|---|---|---|
| A06 Alérgenos (3) | 3 | 4 | 3 | 3 |
| A05 LGPD (3) | 4 | 3 | 3 | 2 |
| A08 Integridade e sincronização (3) | 2 | 4 | 3 | 5 |
| A04 Offline parcial (3) | 2 | 5 | 3 | 4 |
| A09 Catálogo (2) | 4 | 4 | 3 | 3 |
| A01 Desempenho (2), com sugestão no servidor | 3 | 3 | 4 | 3 |
| A02 Primeiro valor (2) | 4 | 4 | 5 | 3 |
| **Total ponderado** | **55** | **70** | **60** | **60** |
| Prazo de 1,5 mês (apoio, não somado) | Alto | Médio | Alto | Baixo |
| Custo zero (apoio, não somado) | Alto | Alto | Médio (cotas) | Médio |
| Curva de aprendizado (apoio, não somada) | Baixa | Média | Baixa a média | Alta |

O total é uma ajuda de leitura, não a decisão. Os pesos formais, incluindo prazo, custo e curva de aprendizado, ficam para a 2.3.

### 3.3 Justificativa das notas

**E1 — online-first**
- A04 = 2 e A08 = 2: sem banco local e fila, a avaliação feita sem rede se perde, e não há desbloqueio local.
- A06 = 3: o servidor centraliza a regra, mas a abertura offline fica sem checagem garantida.
- A05 = 4: o dado sensível circula e fica em poucos lugares; a revogação é direta.
- A01 = 3: depende de rede e de cold start (H).

**E2 — offline-first**
- A04 = 5: receita planejada, em preparo e preparada abre do banco local; salvar avaliação e desbloquear localmente não dependem da rede (P3).
- A08 = 4: a fila de operações com identificador estável permite reenvio sem perda nem duplicação. Perde 1 ponto porque o desbloqueio local pode divergir do servidor (A04 × A08), mitigado por RN04.
- A06 = 4: o servidor filtra sugestão e busca; o cliente checa ao abrir offline (P2). Perde 1 ponto pelo risco R2 (alérgenos desatualizados) e pela regra em dois lugares.
- A05 = 3: a restrição alimentar fica replicada no dispositivo, o que amplia a superfície de exposição; a nota já considera a criptografia obrigatória (P7). A revogação local é imediata e, com dado cifrado, pode ser feita descartando a chave, mas exige tratar também a fila e os backups do sistema operacional.
- A01 = 3: com a sugestão no servidor (P1), não ganha vantagem sobre o E1.
- A09 = 4: o catálogo é publicado no servidor; o estilo não atrapalha.

**E3 — BaaS**
- A02 = 5: autenticação e persistência prontas aceleram o primeiro acesso.
- A04 = 3 e A08 = 3: o cache offline do SDK cobre o que o usuário já consultou, mas garantir que as planejadas estejam baixadas e evitar duplicação exige código próprio (H, verificar na 2.3).
- A06 = 3 e A05 = 3: regras de domínio ficam espalhadas entre regras de acesso e funções; dado sensível fica sob terceiro.
- Notas desta coluna dependem do comportamento real de um SDK e são hipóteses.

**E5 — eventos**
- A08 = 5: log com identificadores únicos é a forma mais robusta de garantir 0 perdas e 0 duplicações.
- A05 = 2: o log imutável conflita com a revogação e a exclusão da LGPD.
- Prazo baixo: projeções, reprocessamento e versionamento de eventos têm curva alta para 1,5 mês.

### 3.4 Escolha: E2 (offline-first com sincronização)

**Escopo do offline-first:** só o conjunto baixado (planejadas, em preparo, preparadas) e o registro de avaliação. Sugestão, busca e candidatas são online (P1).

**Táticas adotadas (P4):**

| Tática | Origem | Atributo | Custo |
|---|---|---|---|
| Operação gravada localmente com identificador estável gerado no cliente; servidor trata o reenvio como repetição, sem aplicar duas vezes. O mecanismo (formato da chave, armazenamento, validade, resposta no reenvio) fica para a 2.6. | E5 (sem event sourcing) | A08 | Endpoint de sincronização idempotente; teste dos 100 ciclos. |
| Data da última atualização dos alérgenos visível; atualização ao abrir com rede. | Mitigação da 2.1 | A06, A04 | Campo extra no modelo e na tela. |
| Servidor confirma desbloqueios sem revogar (RN04). | P3 | A04 × A08 | Cliente é a autoridade provisória do desbloqueio. |
| Criptografia em trânsito, em repouso no servidor e em repouso no dispositivo para a restrição alimentar (P7); a fila de sincronização não carrega restrição em texto claro. | Requisito legal (LGPD art. 46) | A05 | Biblioteca ou recurso de banco cifrado e gestão de chave; leve sobrecarga na abertura do banco (A04, medir na 2.3). |

### 3.5 O que se perde com o E2

| Perda aceita | Atributo afetado | Mitigação |
|---|---|---|
| Complexidade de sincronização (fila, idempotência, reenvio) | Prazo; A08 | Escopo mínimo: só avaliação e itens da rotina sincronizam. Protótipo cedo, com limite de 10 dias corridos. |
| Dado sensível replicado no dispositivo | A05 | Criptografia obrigatória (P7); consentimento antes da gravação; revogação apaga cópia local e fila; logs sem restrição (A13); backups do sistema operacional tratados na 2.4. |
| Alérgenos desatualizados offline | A06 (risco R2) | Data visível; estado "não verificado" nunca é sugerido. |
| Regra de alérgenos em dois lugares | A06 | Mesma suíte de testes nos dois lados. |
| Desbloqueio local diverge do servidor | A04 × A08 | RN04: nunca revogar; servidor confirma. |
| Sugestão depende de rede e da camada gratuita | A01, A11 | Medir na 2.3 (meta: 2,5 s em 95%); revisitar se falhar. |
| Servidor não é autoridade imediata do progresso | Ranking (Won't) | Reavaliar se o ranking for priorizado. |

### 3.6 Quando revisitar o estilo do sistema

| Gatilho | Ação |
|---|---|
| O protótipo de sincronização consumir mais de **10 dias corridos** ou não passar nos 100 ciclos de A08 | Reavaliar E3 (BaaS com cache do SDK) ou reduzir o escopo offline; reabrir A04 na 2.1. |
| A criptografia local inviabilizar a abertura offline em 2 s (A04, H) ou o prazo | Reavaliar a biblioteca ou o escopo do que fica no dispositivo; abrir mão da criptografia não é opção. |
| A sugestão online não atingir 2,5 s em 95% na camada gratuita (A01 × A11) | Rever hospedagem na 2.3; avaliar catálogo parcial local (reabre P1). |
| Ranking (Won't) ou pontuação global (RN19) ser priorizado | Reavaliar autoridade do servidor sobre o progresso. |
| Catálogo ultrapassar 350 pratos ou o download das planejadas pesar no dispositivo de referência | Revisar estratégia de pacotes. |
| A14 entrar no escopo | Reavaliar eventos para telemetria, com consentimento (RNF06). |
| Usuário submeter receitas (fora da v1) | Rever moderação e fluxo de importação. |

## 4. D2 — Estilo interno do servidor

Esta decisão vale se o sistema usar servidor próprio. Se a 2.3 escolher BaaS (E3), a D2 é substituída pela configuração do provedor; a D1 continua válida.

| Critério | S1 Monólito em camadas | S2 Monólito modular (módulos por domínio, camadas dentro de cada módulo) | S3 Microsserviços |
|---|---|---|---|
| Prazo de 1,5 mês | Alto | Alto | Muito baixo |
| Custo zero (um único processo) | Alto | Alto | Muito baixo |
| A09 Catálogo (importação e curadoria) | Bom | Bom, com módulo próprio | Fragmenta o fluxo |
| A12 Modificabilidade (RN19 afeta um módulo) | Médio | Alto | Alto, a custo de operação |
| A11 Escala (1.500 usuários no pico) | Suficiente (H) | Suficiente (H) | Excede a necessidade |
| A13 Observabilidade | Simples | Simples | Rastreio distribuído |
| Curva de aprendizado | Baixa | Baixa a média | Alta |

**Escolha: S2 (monólito modular).**

- Para equipes pequenas e MVPs, as fontes consultadas apontam o monólito, com limites de módulo claros para evoluir depois.
- Módulos previstos (nomes provisórios): catálogo, perfil e restrições, rotina e planejamento, progresso e avaliação, notificações. A estrutura detalhada fica para a 2.5 e a 2.7.
- **Evolução planejada:** se A11 deixar de ser suficiente, módulos podem ser extraídos em serviços. Isso é gatilho, não decisão agora.

**Perda aceita:** um único processo e uma única implantação; falha ou sobrecarga de um módulo afeta todos. **Gatilhos:** carga acima de 1.500 usuários ativos no pico com A01 violado; necessidade de escalar um módulo de forma independente.

**A avaliar na 2.3 e na 2.4 (não decidido aqui):**
- Importação do catálogo como pipeline (importar, normalizar, definir estado de alérgenos, publicar), pelo atributo A09.
- Notificações assíncronas, pelos atributos A07 e A13; dependem da escolha entre notificação local e push.

## 5. Requisitos cruzados entre D1 e D2

O E2 só se sustenta se o servidor oferecer:
- um endpoint de sincronização idempotente para avaliação e itens da rotina;
- confirmação de desbloqueio sem revogação;
- sugestão e busca com filtro de alérgenos no servidor (estados verificado, declarado pela fonte e não verificado);
- entrega do conjunto baixado (planejadas, em preparo, preparadas) com a data de atualização dos alérgenos;
- exclusão e revogação de restrições em até 24 h (H), também sobre os dados sincronizados;
- TLS nas comunicações e criptografia em repouso dos dados de restrição alimentar no armazenamento do servidor e nos backups (P7).

## 6. Diretriz de organização do cliente

O cliente é organizado por feature: uma pasta por funcionalidade, com camadas (apresentação, domínio, dados) dentro de cada feature, mais um núcleo compartilhado para banco local, fila de sincronização e rede. Isso não é um estilo na matriz; é uma diretriz de decomposição, ligada a A12 (a mudança de RN19 altera no máximo um módulo). O servidor segue a mesma lógica por módulo de domínio (D2). A estrutura detalhada fica para a 2.5 (C4) e a 2.7 (padrões).

Itens transversais (sincronização e regra de alérgenos) ficam no núcleo compartilhado ou em uma feature própria. Se a stack for TypeScript nos dois lados, a regra de alérgenos pode virar pacote compartilhado; essa decisão pertence à 2.3.

## 7. Conferência com a Definition of Done (2.2)

- Pelo menos 3 estilos comparados contra os atributos prioritários: sim (E1, E2, E3, E5 em D1; S1, S2, S3 em D2; atributos A06, A05, A08, A04, A09, A01, A02).
- Estilo escolhido com o que se perde e quando revisitar: sim (seções 3.5, 3.6 e 4).
- Rastreabilidade: cada nota cita atributo; as decisões citam atributo; RN01 e RN04 aparecem onde se aplicam.

## 8. Riscos aceitos nesta etapa

| ID | Risco | Mitigação |
|---|---|---|
| R4 | A complexidade de sincronização consome parte relevante do prazo | Escopo mínimo de sync; gatilho de 10 dias corridos |
| R5 | Sugestão online depende de rede e da camada gratuita (A01 × A11) | Medição na 2.3; gatilho de revisão (seção 3.6) |

Os riscos R1 a R3 seguem em `atributos-qualidade.md`. A criptografia da restrição alimentar não é risco aceito: é requisito (P7).

## 9. Retroalimentação

- **A05 reaberto (proposta):** acrescentar ao cenário A05 a medida "0 registros de restrição alimentar em texto claro no dispositivo, no servidor e nos backups; comunicação somente por TLS". Registrado no diário; a alteração em `atributos-qualidade.md` ainda não foi feita.
- `atributos-qualidade.md`: as medidas (H) de A04 e A08 viram critérios de aceite do protótipo de sincronização; revalidar A01 na 2.3 considerando a sugestão no servidor.
- Fase 1: nenhuma issue nova. A issue agrupada da 2.1 segue pendente.
