# ADR-001 — Estilo do sistema: offline-first com sincronização

- **Status:** Aceito
- **Data:** 06/10/2026
- **Autores:** Dupla
- **Atributos:** A04, A08 (críticos); A06, A05 (críticos); A09, A01, A02 (altos)
- **Rastreio:** RNF05, RNF06, RN01, RN04, US05, US12, US14, US15, US16
- **ADRs relacionados:** ADR-002, ADR-005, ADR-006, ADR-008, ADR-014

## Contexto

O Panelada precisa abrir receitas planejadas, em preparo e preparadas sem rede,
salvar a avaliação sem rede e desbloquear evolução e badge localmente (A04).
A avaliação é o gatilho de coleção, evolução e badges (RN01), por isso não
pode ser perdida nem duplicada (A08). A restrição alimentar é dado sensível
e fica replicada no dispositivo, o que aumenta a exposição (A05).

Restrições: MVP em 1,5 mês (cerca de 45 dias), infraestrutura gratuita,
até 1.500 usuários ativos no pico e catálogo de 350 pratos. Candidatas não
ficam offline. Sugestão e busca rodam no servidor.

## Decisão

Adotamos o estilo **offline-first com sincronização (E2)**, restrito ao
**conjunto baixado**: receitas planejadas, em preparo e preparadas, com suas
fotos, mais o registro de avaliação e os itens da rotina.

- O cliente mantém banco local e fila de operações. O servidor é a fonte de
  verdade do catálogo e guarda cópia do progresso.
- Sugestão, busca e candidatas são online. Não há catálogo completo no
  dispositivo.
- O cliente desbloqueia evolução e badge localmente. O servidor apenas
  confirma, sem revogar (RN04).
- A checagem de alérgenos roda no servidor para sugestão e busca, e no
  cliente para abrir receita já baixada (ver ADR-014).
- Cada operação da fila leva identificador estável gerado no cliente, e o
  reenvio é tratado como repetição (princípio no ADR-008).
- A criptografia da restrição alimentar é parte do estilo, não um item
  opcional (ADR-006).

## Alternativas consideradas

Notas da matriz da 2.2: pesos crítico = 3 e alto = 2; máximo de 90.

| Alternativa | Total | Por que não foi escolhida |
|---|---|---|
| E1 — cliente-servidor online-first | 55 | Sem banco local nem fila, a avaliação feita sem rede se perde. Não cobre A04 (nota 2) nem A08 (nota 2). |
| E3 — BaaS / serverless | 60 | O cache offline do SDK cobre só o que o usuário já consultou. Garantir que as planejadas estejam baixadas e evitar duplicação exige código próprio. Regras de alérgenos ficam espalhadas, e o dado sensível fica sob terceiro. Notas dependem de comportamento real do SDK (hipótese). Segue como plano B (P2). |
| E5 — orientado a eventos (event sourcing) | 60 | O log imutável conflita com revogação e exclusão da LGPD (A05, nota 2). Curva alta para 1,5 mês. |

O total do E2 é 70. O total é só ajuda de leitura; a decisão considera também
prazo, custo e curva de aprendizado, pesados formalmente na 2.3 (ADR-003).

## Consequências

**Positivas**
- A04 e A08 ficam atendidos por construção: a avaliação nunca depende da rede.
- A coleção, a evolução e os badges funcionam sem conexão.
- O servidor continua como autoridade do catálogo, o que preserva A09.

**Negativas**
- **Complexidade de sincronização** (fila, idempotência, reenvio) consome
  prazo e é o maior risco técnico do projeto (R4).
- **Dado sensível replicado no dispositivo** amplia a superfície de
  exposição (A05). A criptografia é obrigatória e custa prazo e tempo de
  abertura do banco.
- **Alérgenos desatualizados offline** (R2). A data da última atualização
  fica visível, e o estado "não verificado" nunca é sugerido.
- **Regra de alérgenos em dois lugares**, com risco de divergência
  controlado por uma suíte de testes comum (ADR-014).
- **O desbloqueio local pode divergir do servidor** (A04 × A08). O cliente é
  a autoridade provisória do desbloqueio.
- **Peso do conjunto baixado:** as fotos baixam junto com as planejadas
  (decisão de 06/10/2026), o que aumenta o download e o espaço no
  dispositivo. Tamanho não medido (hipótese).
- **Sugestão depende de rede** e, no alvo, da camada gratuita (R5). Na demo
  local, só a lógica é medida.
- O servidor não é autoridade imediata do progresso. Se o ranking (Won't) for
  priorizado, a decisão precisa ser revista.

## Riscos relacionados

R2, R4, R5.

## Verificações pendentes (H)

- Abertura offline em até 2 s com SQLCipher no emulador de referência.
- Protótipo de sincronização: 0 avaliações perdidas e 0 duplicadas em 100
  ciclos de teste.
- Tamanho do conjunto baixado com fotos para o seed de cerca de 20 pratos.

## Quando revisitar

| Gatilho | Ação |
|---|---|
| Protótipo de sincronização passa de 10 dias corridos ou falha nos 100 ciclos | Reavaliar E3 (plano B, P2) ou reduzir o escopo offline; reabrir A04 na 2.1. |
| A criptografia local inviabiliza a abertura em 2 s ou o prazo | Trocar a biblioteca ou reduzir o que fica no dispositivo. Abrir mão da criptografia não é opção. |
| A sugestão online não atinge 2,5 s em 95% (A01 × A11) | Rever hospedagem; avaliar catálogo parcial local (reabre a decisão de sugestão no servidor). |
| Ranking (Won't) ou pontuação global (RN19) é priorizado | Reavaliar a autoridade do servidor sobre o progresso. |
| Catálogo passa de 350 pratos, ou o download das planejadas com fotos pesa no dispositivo de referência | Revisar a estratégia de pacotes e de fotos. |
| A14 entra no escopo | Reavaliar eventos para telemetria, com consentimento (RNF06). |
| Usuário passa a submeter receitas (fora da v1) | Rever moderação e fluxo de importação. |

## Detalhamento (2.5)

- **Índice leve do catálogo no aparelho:** identificadores e nomes de pratos e culinárias, cadeias de evolução, continente das culinárias, definições de badge e totais por culinária. Sem receita nem foto. Necessário para desbloquear evolução e badge e calcular a coleção sem rede (RN02, RN03, RN07). Não contradiz "não há catálogo completo no dispositivo": receitas e fotos continuam fora, exceto o conjunto baixado. Tamanho é hipótese, a medir com o seed.
- **Conjunto baixado em três camadas:** (1) texto leve, sempre; (2) receita completa e foto das planejadas e em preparo; (3) preparadas já baixadas permanecem no aparelho e, em instalação nova, voltam sob demanda.
- **Planejamento:** criar item de plano exige rede, e a receita é baixada nesse momento. Offline continuam reagendar, remover, definir data de compra, marcar comprado e avaliar.