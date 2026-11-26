# Coleção Bruno — Panelada, curadoria

> Regenerada na Fase 2.7 a partir do `openapi.yaml` v1.1.0-2.7 e da estrutura da coleção da 2.6. Identificadores em inglês (ADR-015); rótulos e documentação em português.

## Como usar

1. Abra a pasta no Bruno e escolha o ambiente **Demo**.
2. Defina as variáveis de ambiente do sistema `CURATOR_EMAIL` e `CURATOR_PASSWORD` com as credenciais da conta de curador criada pelo comando de seed (ADR-007, ADR-010).
3. Coloque uma imagem JPEG em `fixtures/dish-example.jpg` (antes: `prato-exemplo.jpg`).
4. Execute as pastas na ordem numérica: sessão, catálogo base, fluxo manual, negativos e consulta. A pasta `03-assisted-flow` (importação assistida) depende do `MVP-05` e ainda não tem rota na API: pule-a.

A coleção roda sobre um banco **com seed** e pode ser repetida: o que ela cria leva o sufixo `· bru-<id da execução>` (os nomes de catálogo são únicos), e as receitas usam ingredientes, culinária e utensílio do seed. Pela CLI:

```bash
npx @usebruno/cli run 00-session 01-base-catalog 02-manual-flow 04-negatives 05-query --env Demo
```

Cada execução publica um novo "Crepe simples" no catálogo.

**Nuvem (Cloud 4C):** escolha o ambiente **Cloud** e defina também `PANELADA_CLOUD_API_URL` (ex.: `https://panelada-api.onrender.com`). As credenciais são as da curadora criada pelo seed da nuvem. Passo a passo em [`docs/dev/DEPLOY.md`](../../../../dev/DEPLOY.md).

## Variáveis criadas pela própria coleção

`accessToken`, `refreshToken`, `idemKey`, `fixedKey`, `ingMilkId`, `ingLactoseFreeMilkId`, `ingWheatId`, `ingEggId`, `ingOatId`, `utFryingPanId`, `cuiFrenchId`, `manualProposalId`, `assistedProposalId`, `noPhotoProposalId`, `userToken`, `idemIngredientId`.

## Cobertura

Cobre 13 das 14 operações da curadoria. `discardProposal` (descartar proposta) não tem requisição, como na 2.6.
