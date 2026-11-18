# Coleção Bruno — Panelada, curadoria

> Regenerada na Fase 2.7 a partir do `openapi.yaml` v1.1.0-2.7 e da estrutura da coleção da 2.6. Identificadores em inglês (ADR-015); rótulos e documentação em português.

## Como usar

1. Abra a pasta no Bruno e escolha o ambiente **Demo**.
2. Defina as variáveis de ambiente do sistema `CURATOR_EMAIL` e `CURATOR_PASSWORD` com as credenciais da conta de curador criada pelo comando de seed (ADR-007, ADR-010).
3. Coloque uma imagem JPEG em `fixtures/dish-example.jpg` (antes: `prato-exemplo.jpg`).
4. Execute as pastas na ordem numérica: sessão, catálogo base, fluxo manual, fluxo assistido, negativos e consulta.

## Variáveis criadas pela própria coleção

`accessToken`, `refreshToken`, `idemKey`, `fixedKey`, `ingMilkId`, `ingLactoseFreeMilkId`, `ingWheatId`, `ingEggId`, `ingOatId`, `utFryingPanId`, `cuiFrenchId`, `manualProposalId`, `assistedProposalId`, `noPhotoProposalId`, `userToken`, `idemIngredientId`.

## Cobertura

Cobre 13 das 14 operações da curadoria. `discardProposal` (descartar proposta) não tem requisição, como na 2.6.
