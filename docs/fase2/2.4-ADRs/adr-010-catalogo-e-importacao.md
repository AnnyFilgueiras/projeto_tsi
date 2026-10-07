# ADR-010 — Catálogo e importação: fluxo manual e fluxo assistido

- **Status:** Aceito com condições (ver "Verificações pendentes")
- **Data:** 06/10/2026
- **Autores:** Dupla
- **Atributos:** A09 (alto); A06 (crítico); A05, A13
- **Rastreio:** US18, UC12, RF18, RNF08, RN15, RN16, RN17, RN18, RN21, RN22
- **ADRs relacionados:** ADR-002, ADR-007, ADR-011, ADR-012, ADR-013, ADR-014

## Contexto

O catálogo é curado e importado; o usuário não submete receita na v1. A
publicação exige nome, culinária, fonte e link da fonte, ingredientes, passo
a passo, tempo, dificuldade, utensílios, imagem e estado dos alérgenos, e
prato de cadeia indica o prato base (A09). O lançamento tem 100 pratos
verificados em 10 culinárias e 5 continentes; o dimensionamento é de 350
pratos; a demo usa cerca de 20.
As fontes pesquisadas têm custo alto ou dados em outro idioma, então a
importação é manual ou assistida por IA (2.3). A IA propõe e o curador
aprova (RN21); só o curador marca "verificado" (A06).

## Decisão

1. **Dois fluxos, um único ponto de entrada.** Ambos terminam em uma receita
   `proposto`, validada pelo **mesmo esquema**:
   - **Manual (principal):** o curador envia a receita já estruturada.
   - **Assistido (opcional):** o curador envia o texto da receita, em
     qualquer idioma, com fonte e link; o agente (ADR-011) devolve a
     receita estruturada, que entra como `proposto` com `origem = ia`.
2. **Interface do curador: endpoints de curadoria usados pelo Bruno,** sem
   tela. Rotas restritas ao papel de curador (ADR-007): enviar receita manual,
   enviar texto para importação assistida, listar `proposto`, editar,
   aprovar, marcar alérgenos como verificados e descartar.
3. **Carga inicial (seed):** um script lê arquivos estruturados do
   repositório e chama o mesmo serviço do fluxo manual. Não existe segundo
   caminho de gravação.
4. **Estados:** `proposto` → `aprovado` (publicado). Só `aprovado` chega ao
   usuário (RN21).
5. **Estado dos alérgenos:** verificado, declarado pela fonte ou não
   verificado; lista vazia significa "não verificado" (RN08). A IA nunca marca
   "verificado". Nesse fluxo, só o curador marca (A06).
6. **Portão de publicação (aprovação):** bloqueia se faltar qualquer campo da
   A09, se a fonte não for registrada (RN17) ou se alguma invariante do
   ADR-014 for violada.
7. **Ingredientes e substitutos:** ingredientes mapeados para os
   canônicos do catálogo; ingrediente novo exige alérgenos declarados e
   revisão do curador. Substitutos globais (D5) têm seus alérgenos, e os
   sem alérgenos ficam "não verificados" (RN22, ADR-014).
8. **Rastreabilidade:** cada receita guarda origem (manual ou IA), data,
   aprovador, fonte e link. Na origem IA guarda também a saída bruta do
   agente e a versão do modelo e do esquema (ADR-011).
9. **Direitos e termos de uso (R10) [CONFIRMAR]:** a fonte é sempre
   atribuída, e o curador reescreve o passo a passo com palavras próprias,
   conferindo os termos da fonte antes de aprovar. Isso não é parecer
   jurídico. Imagens seguem o ADR-012.
10. **Revisão de receita publicada:** alterar altera a data de atualização
    dos alérgenos e chega aos aparelhos pelo ADR-008 (item 9). O mecanismo
    de versão fica para a 2.6.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| API ou base de dados paga de receitas | Custo alto ou dados em outro idioma (2.3). |
| Fluxo misto: fonte estruturada e IA só para alérgenos e substitutos | Descartado na 2.3 pelos mesmos motivos. |
| Agente navegando na web e coletando receitas | Fora do escopo da abordagem A; agrava termos de uso e direitos autorais (R10); amplia a superfície de entrada de texto não confiável. |
| IA publica direto | Viola a RN21 e a A06. |
| Curadoria por arquivos no Git, revisada por pull request, sem endpoints | É simples e deixa histórico, mas tira a aprovação do sistema e enfraquece o "uso da IA pela aplicação", que o professor exige (confirmado pela dupla). O formato de arquivo continua útil no seed. |
| Tela administrativa | Custo de prazo alto; fica como Could. |
| Usuário submete receitas | Fora da v1. |

## Consequências

**Positivas**
- Um único funil de entrada, com um único esquema e um único portão.
- O fluxo manual é uma alternativa real quando a IA falha ou o custo pesa.
- A rastreabilidade de origem e aprovação atende à A09 e ao R8.

**Negativas**
- **A curadoria é trabalho técnico e braçal** (Bruno, sem tela). 100 pratos
  verificados em 10 culinárias disputam o prazo (A09 × prazo).
- **"Verificado" depende da competência da dupla,** que não é nutricionista.
  Sem critério explícito, "verificado" pode virar carimbo.
- **O vocabulário de alérgenos ainda não está definido** (quais alérgenos
  são reconhecidos). Uma referência a verificar é a lista da ANVISA
  (RDC 26/2015); não foi confirmada.
- **A IA não resolve a verificação:** economiza digitação e tradução, mas o
  curador precisa conferir tudo. Com o teto de R$ 20 do console, só o seed
  de cerca de 20 pratos está coberto; 100 pratos (≈ R$ 81 na hipótese) exigem
  nova decisão (ADR-013).
- **A RN22 reduz a oferta de substitutos,** porque muitos ficam "não
  verificados" (A06 × usabilidade).
- **Direitos autorais e termos de uso** continuam como risco (R10) mesmo com
  atribuição e reescrita.
- A importação assistida é síncrona, e uma resposta lenta do provedor trava
  a requisição (ADR-004).

## Riscos relacionados

R8, R9, R10.

## Verificações pendentes (H)

- Importar 3 a 5 receitas, em outro idioma, de ponta a ponta (texto →
  `proposto` → aprovado).
- O portão de publicação bloqueia receita sem fonte, sem estado dos
  alérgenos e com invariante violada.
- O papel de curador só é obtido pelo seed (ADR-007).
- Definir o vocabulário controlado de alérgenos e o critério de "verificado".
- Conferir termos de uso das fontes escolhidas para o seed.

## Quando revisitar

| Gatilho | Ação |
|---|---|
| Curadoria manual consumir mais prazo do que o previsto | Ampliar o uso do fluxo assistido (custo, ADR-013) ou reduzir o lançamento. |
| Aparecer fonte estruturada com custo e idioma adequados | Reavaliar o fluxo misto. |
| Curadoria por endpoints se mostrar inviável | Priorizar a tela administrativa (Could). |
| Usuário passar a submeter receitas | Rever moderação e fluxo de importação. |
| Professor passar a exigir IA diante do usuário final | Reabrir a abordagem A (propostas, seção 10). |