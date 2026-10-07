# ADR-009 — Notificações locais, com limite de duas por dia

- **Status:** Aceito com condições (ver "Verificações pendentes")
- **Data:** 06/10/2026
- **Autores:** Dupla
- **Atributos:** A07 (médio); A04, A05, A13
- **Rastreio:** US08, RNF07, RN13, RNF09
- **ADRs relacionados:** ADR-001, ADR-002, ADR-003, ADR-008

## Contexto

O usuário recebe lembretes nas datas de compra e de preparo que ele mesmo
define (US08). O limite é de 2 notificações por dia (RNF07), nenhum envio
com lembretes desativados (A07) e nenhuma punição por inatividade (RNF09).
As datas já estão no aparelho (rotina baixada e sincronizada), e o app é
offline-first, então os lembretes devem funcionar sem rede.

## Decisão

1. **Notificações locais agendadas pelo app**, com `expo-notifications`. Não
   há push e, portanto, não há módulo de notificações no servidor
   (ADR-002).
2. **Escopo:** apenas lembretes de compra e de preparo, definidos pelo
   usuário. **Nenhuma notificação de reengajamento ou de inatividade** (A14
   está fora do MVP; RNF09).
3. **Agendador no cliente,** como função pura e testável: dados a rotina,
   a configuração e o dia, devolve no máximo 2 notificações por dia local.
   Regra proposta: no máximo uma de compra e uma de
   preparo por dia; o excedente do mesmo tipo é agrupado em um texto único.
4. **Janela de agendamento:** o app agenda os próximos dias (hipótese: 14) e
   reagenda ao abrir, ao mudar a rotina e ao alterar a configuração. Cancela
   todas as pendentes antes de reagendar, para não duplicar.
5. **Horário inexato.** Não será usada a permissão de alarme exato. O lembrete
   pode atrasar alguns minutos.
6. **Permissão:** pedida no momento em que o usuário ativa os lembretes
   (Android 13+), nunca na abertura. Se for negada, o app mostra os
   lembretes do dia dentro do app e não envia notificação.
7. **Conteúdo:** nunca cita restrição alimentar nem alérgeno (A05).
8. **Configuração desativada:** nenhuma notificação é agendada e as
   pendentes são canceladas.
9. **Observabilidade:** falhas de agendamento são registradas sem dado de
   restrição (A13).

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Push (FCM) | As datas são do usuário e já estão no aparelho. Exigiria servidor com agendador, credenciais do FCM, token de push como dado pessoal e *development build* [84]. Complexidade sem ganho. |
| Alarmes exatos locais | Exigem acesso especial no Android 14+ e navegação do usuário até as configurações do sistema [82][87]. Excesso para lembretes de nível de dia. |
| Lembretes só dentro do app, sem notificação do sistema | Não cumpre a intenção de lembrar quando o app está fechado (US08). Fica como degradação quando a permissão é negada. |
| Tarefa em segundo plano própria, com módulo nativo | Mais código nativo e mais risco de prazo. Não necessário. |

## Consequências

**Positivas**
- Funciona offline, coerente com o ADR-001.
- Sem servidor, sem credencial externa e sem custo.
- O agendador puro é testável com dias simulados (A07).

**Negativas**
- **Sem garantia de entrega:** se o usuário forçar a parada do app, ele
  precisa reabri-lo para os lembretes voltarem [85]. Fabricantes com
  economia de bateria agressiva podem atrasar notificações (hipótese, não
  verificada).
- **Permissão negada = sem notificação.** A experiência cai para o
  lembrete dentro do app.
- **Horário inexato:** pode haver atraso.
- **O limite de 2 por dia é garantido só pelo agendador do cliente;** o
  servidor não o impõe. A verificação é por simulação.
- **Troca de aparelho:** os lembretes só voltam após a rotina ser baixada e
  o app ser aberto no novo aparelho.
- A janela de agendamento exige reagendar com frequência, e erro de
  reagendamento pode duplicar ou perder lembretes.
- A demo no emulador pode não refletir o comportamento de um aparelho real
  (não verificado).

## Riscos relacionados

R4.

## Verificações pendentes (H)

- 0 dias simulados com mais de 2 notificações e 0 envios com lembretes
  desativados (A07).
- Lembretes sobrevivem ao reinício do emulador.
- Fluxo de permissão negada no Android 13+.
- Comportamento das notificações agendadas no emulador de referência.
- Janela de 14 dias e reagendamento ao abrir.
- Leitura da RN13 sobre a regra "uma de cada tipo".

## Quando revisitar

| Gatilho | Ação |
|---|---|
| Lembretes precisarem chegar com o app fechado de forma garantida | Avaliar alarme exato ou push, com o custo de servidor e credenciais. |
| Push virar requisito (por exemplo, avisos do catálogo) | Criar módulo de notificações no servidor (ADR-002) e revisar este ADR. |
| Mais de dois tipos de lembrete | Rever a regra de agrupamento. |
| A14 entrar no escopo | Reavaliar notificações de engajamento, com consentimento (RNF06) e dentro do limite (RNF07, RNF09). |
| iOS entrar no alvo | Verificar limites e permissões no iOS. |

## Detalhamento
- As preferências de lembrete sincronizam como a operação `lembretes.definir` (campos `ativo`, `tipos`, `frequencia`). Os valores de `frequencia` são definidos na implementação; o RNF07 limita a 2 notificações por dia.