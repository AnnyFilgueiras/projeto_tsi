# ADR-008 — Estratégia offline e sincronização (princípio)

- **Status:** Aceito com condições (ver "Verificações pendentes")
- **Data:** 06/10/2026
- **Autores:** Dupla
- **Atributos:** A08, A04 (críticos); A06, A05, A13
- **Rastreio:** US12, US14, US15, US16, RN01, RN04, RN06, RNF05, RNF09
- **ADRs relacionados:** ADR-001, ADR-002, ADR-005, ADR-006, ADR-014

## Contexto

O ADR-001 escolheu o offline-first restrito ao conjunto baixado. Salvar a
avaliação é o gatilho de coleção, evolução e badges (RN01), então ela não
pode ser perdida nem duplicada (A08), mesmo com queda de conexão e reenvio.
O mecanismo detalhado é decidido na 2.6; este ADR fixa os princípios, para
que o estilo continue válido com qualquer mecanismo.

## Decisão

1. **Sincronização por operações, não por estado.** Cada ação offline gera
   uma operação na fila (ADR-005), na mesma transação do dado local.
2. **Identificador estável gerado no cliente.** O servidor trata o reenvio
   do mesmo identificador como repetição, sem aplicá-lo duas vezes. A entrega
   é "pelo menos uma vez" e o efeito é "uma única vez".
3. **Escopo das operações  :** avaliação de prato; itens da rotina
   (planejamento); preferências de lembrete; e **alteração e revogação de
   restrição alimentar, com o consentimento**. A revogação precisa chegar ao
   servidor para cumprir o prazo de 24 h (A05). A 2.2 previa só avaliação e
   rotina; a restrição é um acréscimo desta decisão.
4. **Avaliações são acrescentadas, não sobrescritas**, e não geram conflito.
   Se a regra de negócio permitir editar uma avaliação, o tratamento do
   conflito é definido na 2.6.
5. **O servidor confirma desbloqueios e nunca revoga** (RN04). O cliente é a
   autoridade provisória do desbloqueio. Inatividade não reduz progresso
   (RNF09).
6. **O catálogo é só do servidor.** O cliente nunca altera catálogo.
7. **Uma conta, um aparelho ativo  .** A conta anônima nasce em
   um aparelho (ADR-007). Uso simultâneo em vários aparelhos não é suportado
   no MVP, o que dispensa resolução de conflito entre aparelhos.
8. **Sincronização em primeiro plano  .** Roda ao abrir o app, ao
   reconectar com o app aberto e após salvar uma operação. Não há
   sincronização em segundo plano com o app fechado no MVP.
9. **Atualização do conjunto baixado:** ao abrir com rede, o app atualiza os
   alérgenos e as receitas planejadas, e exibe a data da última atualização.
   As fotos baixam junto com as receitas (decisão de 06/10/2026).
10. **Falha permanente:** quando o servidor rejeita uma operação por
    validação, ela vai para o estado "falha", fica visível ao usuário e não
    bloqueia as demais. Toda falha de sincronização é registrada com
    identificador, **sem dado de restrição** (A13).
11. **Reenvio com espera progressiva.** Valores e limites ficam para a 2.6.
12. **Protótipo cedo,** com limite de 10 dias corridos e critérios de
    aceite: 0 avaliações perdidas e 0 duplicadas em 100 ciclos de queda e
    reenvio (A08); início da sincronização em até 60 s após a reconexão (H).

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Sincronizar o estado (última escrita vence) | Simples, mas pode perder ou duplicar avaliações em falhas e reenvios, e depende do relógio do aparelho. Não garante A08. |
| CRDTs | Resolvem conflitos entre aparelhos, mas o MVP é de um aparelho por conta. Curva alta para 45 dias. |
| Servidor primeiro, com tentativas simples e sem fila persistente | A avaliação feita sem rede se perderia ao fechar o app. É o E1 rejeitado no ADR-001. |
| Event sourcing | Rejeitado no ADR-001: conflita com a exclusão da LGPD (A05) e tem curva alta. |
| Biblioteca pronta de sincronização | Não foi avaliada na 2.3. Só será investigada se o protótipo ultrapassar os 10 dias, antes de recorrer ao plano B (P2). |

## Consequências

**Positivas**
- A08 e A04 atendidos por construção: salvar sempre funciona offline.
- A idempotência torna o reenvio seguro e simplifica a falha parcial.
- Sem conflito entre aparelhos, o mecanismo fica menor e mais testável.

**Negativas**
- **Complexidade e prazo** da fila, da idempotência e do reenvio (R4).
- **Sem sincronização em segundo plano:** uma avaliação pendente só chega ao
  servidor na próxima abertura do app. O servidor fica atrás do aparelho.
- **Um aparelho por conta:** o usuário que troca de aparelho perde o que não
  sincronizou, e o uso em dois aparelhos não é suportado. Ver ADR-007.
- **Restrição na fila:** a fila passa a carregar dado sensível; ela depende
  da cifra do ADR-005, e o log de falhas não pode vazar o conteúdo.
- **O desbloqueio local pode divergir do servidor** (A04 × A08); a RN04
  evita revogação, mas o servidor pode confirmar com atraso.
- Operações rejeitadas permanentemente exigem uma tela de tratamento, mais
  trabalho de interface.
- A fila pode crescer se o usuário ficar muito tempo offline; limites ficam
  para a 2.6.

## Riscos relacionados

R2, R4.

## Verificações pendentes (H)

- 100 ciclos com queda de conexão e reenvio: 0 perdas e 0 duplicações.
- Início da sincronização em até 60 s após a reconexão, com o app aberto.
- Salvar avaliação e desbloquear em até 1 s (A04, H).
- Confirmar com o professor ou com a Fase 1 se a avaliação pode ser editada.

## Quando revisitar

| Gatilho | Ação |
|---|---|
| Protótipo acima de 10 dias corridos ou falha nos 100 ciclos | Investigar biblioteca de sincronização; depois reavaliar P2 (ADR-001). |
| Uso em vários aparelhos virar requisito | Reabrir a regra de conflito e a conta (ADR-007). |
| Ranking (Won't) ou pontuação global (RN19) priorizados | Reavaliar a autoridade do servidor sobre o progresso. |
| Sincronização com o app fechado virar necessidade | Avaliar execução em segundo plano no Android. |