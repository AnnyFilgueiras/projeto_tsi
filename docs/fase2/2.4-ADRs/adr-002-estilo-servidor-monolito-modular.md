# ADR-002 — Estilo do servidor: monólito modular com Fastify

- **Status:** Aceito
- **Data:** 06/10/2026
- **Autores:** Dupla
- **Atributos:** A09, A12 (alto/baixo); A11, A13 (médios); prazo, custo zero e curva de aprendizado (critérios da 2.3)
- **Rastreio:** US18, RF18, RN19, RN20, RNF08
- **ADRs relacionados:** ADR-001, ADR-004, ADR-007, ADR-008, ADR-010, ADR-011, ADR-014

## Contexto

O ADR-001 fixou o estilo do sistema e exige um servidor próprio com endpoint
de sincronização idempotente, sugestão e busca com filtro de alérgenos,
entrega do conjunto baixado e importação do catálogo. A dupla tem experiência
com TypeScript, o prazo é de 1,5 mês e a infraestrutura deve ser gratuita
(um único processo é a opção mais barata). A escala é de 1.500 usuários
ativos no pico, hipótese ainda não medida.

Esta decisão vale porque a P1 foi escolhida (servidor TypeScript próprio).
Se o plano B (P2, Supabase) for ativado, ela é substituída pela configuração
do provedor, e o ADR-001 continua válido.

## Decisão

1. **Estilo:** monólito modular (S2): módulos por domínio, com camadas
   dentro de cada módulo. Um único processo e uma única implantação.
2. **Framework:** **Fastify** com TypeScript, com um plugin por módulo.
3. **Módulos previstos (nomes provisórios, detalhados na 2.5 e na 2.7):**
   catálogo, perfil e restrições, rotina e planejamento, progresso e
   avaliação, e importação (inclui o agente de IA e as rotas de curadoria,
   ver ADR-010 e ADR-011).
   Notificações **não** são módulo do servidor: o agendador roda no cliente
   (ADR-009). As preferências de lembrete sincronizam como dado de perfil
   ou de rotina; o módulo exato é decidido na 2.5.
4. **Regras de fronteira:** um módulo só acessa outro pela interface pública
   dele, nunca pelas tabelas ou internos. O pacote compartilhado de
   alérgenos (ADR-014) é a única dependência comum.
5. **Evolução:** se A11 deixar de ser suficiente, módulos podem ser extraídos
   em serviços. Isso é gatilho, não decisão atual.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| S1 — monólito em camadas | Atende prazo e custo, mas o acoplamento entre domínios facilita que uma mudança como a RN19 (pontuação) espalhe alterações pelo código. A12 fica média. |
| S3 — microsserviços | Prazo e custo muito baixos para 45 dias: várias implantações, observabilidade distribuída e rede entre serviços. Excede a necessidade de 1.500 usuários. Fragmenta o fluxo de importação. |
| NestJS no lugar do Fastify | Traz estrutura de módulos pronta, o que ajudaria a impor fronteiras. Por outro lado, exige aprender injeção de dependência e decoradores no mesmo prazo. Rejeitado pela curva de aprendizado; pode ser reavaliado se as fronteiras do Fastify não se sustentarem. |
| BaaS (P2, Supabase) | Substitui a D2 e fica como plano B. Perde em A05 e A06 e tem pausa após 7 dias sem uso no alvo (ver ADR-004). |

## Consequências

**Positivas**
- Um único artefato para desenvolver, testar e subir no Docker Compose.
- Custo e operação mínimos, adequados à demonstração local.
- Fronteiras de módulo mantêm a RN19 restrita a um módulo (A12), sem pagar o
  custo operacional de microsserviços.
- O pacote de alérgenos em TypeScript é compartilhado sem fricção (ADR-014).

**Negativas**
- **Ponto único de falha:** uma falha ou sobrecarga em um módulo afeta todos.
- **Fronteiras não são impostas pelo framework.** O Fastify não obriga os
  limites entre módulos; eles dependem de convenção e de verificação
  automática (a definir na 2.7). Sem isso, o monólito modular degenera em
  monólito comum.
- **Menos estrutura pronta** do que o NestJS: autenticação, validação e
  organização ficam por conta da dupla.
- **Cold start no alvo** (R5): um único processo reduz o custo, mas o tempo
  de partida no Cloud Run não foi medido.
- A escalabilidade horizontal por módulo é descartada nesta versão.

## Riscos relacionados

R4, R5.

## Pontos em aberto

- Módulo do servidor que guarda a preferência de lembretes: decidido na 2.5.
- Mecanismo de verificação das fronteiras entre módulos: 2.7.

## Verificações pendentes (H)

- A carga de 1.500 usuários ativos no pico não será medida na demo (R5).
- Mecanismo de verificação das fronteiras de módulo: definir na 2.7.

## Quando revisitar

| Gatilho | Ação |
|---|---|
| Carga acima de 1.500 usuários ativos no pico com A01 violado | Extrair o módulo mais carregado em serviço. |
| Necessidade de escalar um módulo de forma independente | Idem. |
| As fronteiras entre módulos forem violadas repetidamente | Reavaliar NestJS ou regras de lint mais rígidas. |
| Ativação do plano B (Supabase) | Marcar este ADR como "Substituído por ADR-NNN". |
| Push passa a ser requisito | Criar módulo de notificações no servidor e revisar o ADR-009. |