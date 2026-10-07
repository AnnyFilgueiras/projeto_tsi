# ADR-013 — Custos e ferramentas: gratuito, pagamento único e pagamento por uso

- **Status:** Aceito
- **Data:** 06/10/2026
- **Autores:** Dupla
- **Atributos:** A11, A09; prazo e custo zero (critérios da 2.3)
- **Rastreio:** briefing da Fase 2 (seção 2 e convenção de ferramentas)
- **ADRs relacionados:** ADR-003, ADR-004, ADR-009, ADR-011, ADR-012

## Contexto

A convenção do projeto aceita apenas ferramentas gratuitas, ou de pagamento
único baixo quando justificado em ADR. A demonstração é local. A API de IA
é paga por uso e é exigida pelo professor (ADR-011). O alvo de lançamento
é só documentado, e traz taxas de loja e possível consumo de serviços
gerenciados. A dupla definiu o teto de **R$ 20** para a IA.

## Decisão

1. **Demonstração:** custo de infraestrutura **zero** (Docker Compose,
   emulador Android, build local). O único gasto previsto é a API de IA, com
   teto de **R$ 20**, controlado no servidor (ADR-011).
2. **Pagamento por uso da IA, exceção justificada:** é exigência do
   professor, é custo pontual por carga de catálogo e não recorrente por
   usuário, e tem alternativa sem custo (fluxo manual, ADR-010).
3. **Nenhuma decisão depende de benefício, crédito ou desconto de
   estudante.** Se existirem, são bônus: reduzem o gasto, mas não mudam a
   arquitetura nem o orçamento deste ADR. O crédito de estudante é
   temporário e não conta como custo zero.
4. **Custos do alvo, apenas documentados:** Google Play, US$ 25 únicos;
   App Store, US$ 99 por ano (só se houver iOS e Mac); Cloud Run e Neon nas
   franquias gratuitas, com conta de faturamento e alerta de orçamento (R6).
5. **Lançamento da IA acima do teto:** carregar 100 ou 350 pratos pela IA
   excede R$ 20. Essa carga só ocorre com um novo teto, registrado como
   atualização deste ADR, depois da medição de tokens (ADR-011). O padrão é
   completar o catálogo pelo fluxo manual.
6. **Gasto real:** após cada carga assistida, o consumo acumulado é lido da
   tabela de consumo e registrado no diário.
7. **Ferramentas de desenvolvimento** (Bruno, Docker, Mermaid, editores)
   são gratuitas. Assistentes de IA usados pela dupla no desenvolvimento
   ficam fora do orçamento do produto.

## Quadro de custos

| Item | Camada | Tipo | Valor | Situação |
|---|---|---|---|---|
| Infraestrutura da demo (Compose, emulador, build local) | Demo | Gratuito | R$ 0 | Decidido |
| API de IA, seed de 20 pratos (K3) | Demo | Por uso, pontual | ≈ R$ 16 (hipótese), teto R$ 20 | Tokens não medidos |
| API de IA, 100 pratos (K3) | Lançamento | Por uso, pontual | ≈ R$ 81 (hipótese) | Fora do teto atual |
| API de IA, 350 pratos (K3) | Dimensionamento | Por uso, pontual | ≈ R$ 284 (hipótese) | Fora do teto atual |
| Alternativa mais barata (`kimi-k2.6`) | Demo e lançamento | Por uso, pontual | ≈ R$ 4 / R$ 22 / R$ 77 (hipótese) | Não testada |
| Cloud Run e Neon (franquia gratuita) | Alvo | Gratuito até a franquia | R$ 0 dentro da cota | Cota em São Paulo a confirmar no console |
| Conta de faturamento com cartão | Alvo | Exigência | n/a | R6 |
| Google Play | Alvo | Pagamento único | US$ 25 | Fonte da 2.3 |
| App Store | Alvo, fora da demo | Anual | US$ 99 por ano | Exige Mac |
| Hospedagem de fotos | Alvo | A verificar | n/a | Não verificado (ADR-012) |
| Impostos e taxas de pagamento internacional | IA e lojas | n/a | n/a | Não verificado; os preços da IA não incluem impostos |

Os valores em reais seguem a cotação da 2.3 (1 CNY ≈ R$ 0,75; 1 USD ≈ R$ 5,00)
e as hipóteses de 4.000 tokens de entrada e 10.000 de saída por receita.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Depender de crédito ou benefício de estudante | Temporário e não verificado; deixaria o projeto sem custo previsível quando acabasse. |
| Exigir custo absoluto zero, sem IA paga | O professor exige IA via API. Opções gratuitas de API ou modelo local não foram avaliadas e exigiriam outra decisão. |
| Sem teto, pagando conforme o uso | Risco de estouro, com o K3 no raciocínio máximo (ADR-011). |
| Subir já o alvo pago | Fora do escopo acadêmico (demo local) e traz custo recorrente. |

## Consequências

**Positivas**
- O custo da demo é previsível e limitado a R$ 20.
- A arquitetura não depende de benefício externo.
- O quadro único evita surpresas entre ADRs.

**Negativas**
- **O gasto sai do bolso da dupla,** e a margem entre a estimativa (R$ 16) e
  o teto (R$ 20) é de apenas 25%, com tokens ainda não medidos.
- **A estimativa depende da cotação e do preço do provedor,** que podem mudar
  (R9).
- **Taxas e impostos de pagamento internacional** podem aumentar o valor
  efetivo; não foram verificados.
- **Se o teto estourar,** a carga para e o catálogo precisa ser completado
  manualmente, o que custa prazo (A09 × prazo).
- **No alvo,** o consumo além da franquia do Cloud Run gera cobrança, e o
  alerta de orçamento avisa, mas não é limite rígido (não confirmado).
- **iOS** implica custo anual e um Mac que a dupla não tem.
- O custo das fotos no alvo e a cota do Cloud Run em São Paulo seguem sem
  confirmação final.

## Riscos relacionados

R6, R9.

## Verificações pendentes (H)

- Medir tokens e atualizar o quadro com o custo real por receita.
- Confirmar se a conta do provedor de IA é pré-paga e quais formas de
  pagamento aceita.
- Confirmar a franquia do Cloud Run em São Paulo e o alerta de orçamento.
- Verificar impostos e taxas de pagamento internacional.
- Verificar custo de hospedagem de fotos no alvo.

## Quando revisitar

| Gatilho | Ação |
|---|---|
| Consumo real acima do teto de R$ 20 ou preço do provedor mudar | Testar o modelo mais barato, reduzir esforço de raciocínio ou usar o fluxo manual; atualizar o quadro. |
| A dupla decidir implantar de verdade | Medir custo no provedor e confirmar franquias. |
| Dupla ganhar um Mac e quiser iOS | Incluir US$ 99 por ano e reavaliar o orçamento. |
| Aparecer benefício de estudante aprovado e verificado | Registrar como bônus, sem alterar as decisões. |
| Carga de 100 ou 350 pratos pela IA | Definir novo teto, com a medição de tokens. |