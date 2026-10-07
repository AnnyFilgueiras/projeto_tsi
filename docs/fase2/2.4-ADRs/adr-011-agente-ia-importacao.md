# ADR-011 — Agente de IA na importação do catálogo (Kimi K3)

- **Status:** Aceito com condições (ver "Verificações pendentes")
- **Data:** 06/10/2026
- **Autores:** Dupla
- **Atributos:** A09 (alto); A06, A05 (críticos); A13; custo
- **Rastreio:** US10, US18, UC12, RNF08, RN15, RN17, RN21, RN22; exigência do professor (IA via API no uso da aplicação)
- **ADRs relacionados:** ADR-002, ADR-004, ADR-007, ADR-010, ADR-013, ADR-014

## Contexto

O professor exige IA no desenvolvimento e no uso da aplicação, via API. A
dupla confirmou que o uso pelo curador, na importação, conta como "uso na
aplicação". O agente é **assistente opcional**: o fluxo manual (ADR-010)
permanece. A IA propõe; o curador aprova; só o curador marca "verificado". A
RN15 proíbe inventar substituição. O agente não navega na web. O teto de
gasto definido pela dupla é de **R$ 20**. Nenhum dado de usuário vai ao
provedor.

## Decisão

1. **Provedor e modelo:** Kimi K3 (`kimi-k3`), por API compatível com o
   protocolo da OpenAI (`https://api.moonshot.ai/v1`), atrás de uma
   **interface de provedor** (porta e adaptador). Modelo, endereço e chave
   ficam em configuração; há um adaptador falso para testes e para a execução
   gravada da demo.
2. **Entrada:** só o texto da receita fornecido pelo curador, fonte e link,
   mais a lista de ingredientes canônicos do catálogo (nome e identificador),
   para o mapeamento. Nenhum dado de usuário, nenhuma restrição.
3. **Saída:** JSON Mode, com o formato descrito no prompt e validado por
   **esquema no servidor**. Uma tentativa de correção em caso de falha de
   validação; depois, falha e fluxo manual. Esboço do esquema (final na 2.6):
   nome, culinária, idioma de origem, ingredientes (original, quantidade,
   unidade, identificador canônico ou nulo, alérgenos propostos), utensílios,
   tempo, dificuldade, passos, alérgenos da receita, substitutos propostos
   (com os alérgenos do substituto) e incertezas.
4. **O modelo não define estado nem fonte.** O servidor atribui o estado
   "não verificado" a todo alérgeno proposto (RN08, A06) e preenche a fonte
   e o link a partir do que o curador informou (RN17). Identificadores
   canônicos que não existam no catálogo são descartados.
5. **Tradução:** para português do Brasil. Quantidades e unidades são
   preservadas como na origem, com sinalização de dúvida; não há conversão
   automática.
6. **Substitutos:** o agente propõe, com alérgenos; os sem alérgenos ficam
   "não verificados" e não são sugeridos a quem tem restrição (RN22).
7. **Texto colado é conteúdo não confiável.** Salvaguardas: separação entre
   instruções e texto da receita; o agente não tem ferramentas nem
   efeitos colaterais; saída validada por esquema; limites de tamanho dos
   campos; campos de texto tratados como texto simples; nada é publicado sem
   aprovação (ADR-010).
8. **Controle de custo (teto de R$ 20, configurável):**
   - Cada chamada registra tokens de entrada e de saída (lidos da resposta),
     o custo estimado e a data em uma tabela de consumo.
   - Antes de cada chamada, o servidor soma o acumulado e o pior caso da
     chamada (o `max_tokens` configurado); recusa se passar do teto.
   - Aviso a 80% do teto; bloqueio a 100%.
   - `reasoning_effort` e `max_tokens` configuráveis, e a escolha do esforço
     é decidida pela medição.
   - Uma receita por chamada.
   - Taxas e cotação em configuração, marcadas como hipótese.
9. **Registro:** cada receita de origem IA guarda a saída bruta, o modelo, a
   versão do esquema e os tokens consumidos (ADR-010).
10. **Plano B de demonstração:** execução gravada, repetida pelo adaptador
    falso, se a rede ou a API falhar.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| `kimi-k2.6` (mesmo provedor) | Cerca de 3,75 vezes mais barato na saída [111]; qualidade e JSON Mode não verificados. É a primeira alternativa a testar se o K3 estourar o teto. |
| Outros provedores de IA | Não foram comparados formalmente na 2.3; o K3 foi escolha da dupla. A interface de provedor permite trocar. |
| IA sob demanda no app, para o usuário final | A RN15 proíbe inventar troca, e a checagem de alérgenos exige determinismo. |
| Agente com busca na web | Sem navegação, o escopo e a superfície de ataque ficam menores. Agrava a questão de termos de uso (R10). |
| Fluxo sem IA | Continua como alternativa real (ADR-010), mas não atende à exigência do professor. |
| Saída livre, sem esquema | A saída precisa ser verificável; o JSON Mode só garante JSON válido, não o conteúdo. |

## Consequências

**Positivas**
- Atende à exigência do professor sem entregar decisão de segurança à IA.
- A interface de provedor limita a dependência de um fornecedor.
- O controle de custo é feito na aplicação, e não depende do console.

**Negativas**
- **Não é custo zero:** estimativa de R$ 16 para 20 pratos (hipótese não
  medida). A margem para o teto de R$ 20 é de 25%. Os preços não incluem
  impostos [111].
- **O JSON Mode só garante sintaxe,** não que os alérgenos estejam certos.
  Erros de tradução, alérgenos e substitutos continuam possíveis (R8).
- **Dados saem do país:** o texto da receita vai a servidores da Moonshot.
  As fontes divergem sobre uso para treinamento (R11, ver abaixo).
- **Latência:** com raciocínio alto, a resposta pode demorar; a importação é
  síncrona (ADR-004).
- **Mudança de oferta** do provedor (preço, modelo, termos) é risco (R9).
- **Prompt injection não é eliminada,** só contida: a IA não tem poder de
  ação, mas um texto malicioso pode induzir uma proposta ruim, que o curador
  precisa perceber.
- O limite do console não foi confirmado; o teto rígido é o do servidor.
- Para 100 ou 350 pratos, o teto atual não basta (ADR-013).

## Riscos relacionados

R8, R9, R10, **R11** (novo).

- **R11:** as fontes divergem sobre o uso de dados da API para treinamento
  (a central de ajuda diz que não treina com dados da API; a política de
  privacidade fala em analisar o uso para melhorar produtos). Aceito porque o
  fluxo envia só texto de receita, sem dado de usuário. Mitigação: nunca
  enviar dado de usuário; revisar os termos antes de qualquer expansão de uso.

## Verificações pendentes (H)

- Medir tokens com 3 a 5 receitas (entrada com a lista de ingredientes
  incluída e saída), comparando `reasoning_effort` baixo e alto.
- Testar o JSON Mode com receitas em outro idioma e a taxa de falha de
  validação.
- Confirmar se o console permite limite de gasto ou se a conta é pré-paga.
- Testar o `kimi-k2.6` como alternativa de custo.
- Teste de injeção: um texto de receita com instruções maliciosas não muda o
  estado nem os campos protegidos.
- Confirmar que a cotação e as taxas estão em configuração.

## Quando revisitar

| Gatilho | Ação |
|---|---|
| Consumo real muito acima da hipótese, ou preço do console diferente | Testar `kimi-k2.6`, reduzir o esforço de raciocínio ou usar mais o fluxo manual. |
| Taxa de falha de validação alta | Ajustar prompt e esquema; avaliar outro modelo. |
| Mudança de preço, termos ou disponibilidade | Trocar o provedor pela interface. |
| Professor passar a exigir IA diante do usuário final | Reabrir a abordagem A (alteraria a RN15 e exigiria checagem determinística de alérgenos). |
| Importação exceder o tempo limite da requisição | Tornar a importação assíncrona (ADR-004). |