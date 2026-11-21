# Glossário de Armadilhas de Domínio — Panelada

> **Leia quando:** uma palavra de domínio parecer familiar ou dois conceitos parecerem sinônimos ao escrever código, testes ou contratos.
> **Fonte única de traduções PT→EN (ADR-015):** [`docs/fase2/04-contratos/glossario-identificadores.md`](../fase2/04-contratos/glossario-identificadores.md) — **nunca copie tabelas de lá para cá**; consulte-a diretamente sempre que nomear um símbolo novo.

---

## Armadilhas que mais geram bugs

### `Dish` vs. `Recipe` vs. `Proposal`
- **`Dish` (`Prato`)** é a entidade cultural/colecionável na Pokédex (ex.: *Pad Thai*), ligada a uma `Cuisine` e opcionalmente a uma cadeia de evolução (`baseDishId`).
- **`Recipe` (`Receita`)** é o preparo concreto de um `Dish`, com ingredientes, passos, tempo, dificuldade e `allergens`/`allergenState`.
- **`Proposal` (`Proposta`)** é um rascunho de curadoria no módulo `importer` (manual ou assistido por IA). Só vira `Dish` + `Recipe` no catálogo após passar por `PublicationGate` e aprovação humana (`RN21`, `UC12`). Nunca leia `Proposal` nas telas de sugestões do usuário.

### `AllergenState` vs. `CompatibilityResult`
- **`AllergenState`** é um atributo da **receita** no catálogo: `verified`, `source_declared` ou `unverified`.
- **`CompatibilityResult`** é o resultado calculado por `packages/allergen-rules` cruzando uma receita com as restrições de um usuário: `compatible`, `incompatible` ou `unconfirmed`.
- **Regra inegociável (`RN08`, `RN22` — *fail-closed*):** receita `unverified` ou ingrediente sem confirmação nunca retorna `compatible` quando o usuário possui restrições alimentares.

### `completed` (servidor) vs. `"em preparo"` (apenas local)
- No servidor (`RoutineItem`), o item só assume `planned` ou `completed`.
- O estado `"em preparo"` (`LocalCookingState` / `cookingSince`) existe **exclusivamente no SQLCipher do aparelho** para manter a receita disponível offline na cozinha — nunca crie coluna ou enum `"in_progress"` na API ou no Postgres.

### Exceção bilíngue dos 19 códigos de alérgenos (`ADR-015`)
- Todo código, rota, enum e coluna de banco usa **inglês** (`verified`, `planned`, `adaptation_count`, `prepTimeMinutes`).
- **Única exceção:** os **19 códigos de `AllergenCode` / `RestrictionType`** (18 da ANVISA RDC nº 727/2022 Anexo III + `lactose`, ex.: `leite`, `lactose`, `trigo_centeio_cevada_aveia`) permanecem em **português** para rastreabilidade direta com a norma sanitária.

### `UnlockCalculator` (App) vs. `UnlockRules` (API)
- São **duas implementações** da mesma regra de desbloqueio dos 8 tipos de marco (`RN03 a–h`, `ADR-016`: `dish`, `cuisine`, `n_cuisines`, `all_continents`, `set`, `total_dishes`, `evolution_level`, `adaptation_count`), validadas pela **mesma suíte de vetores JSON** na CI.
- O app calcula localmente para feedback imediato; o servidor recalcula na sincronização e **só acrescenta** conquistas (`RN04` — nunca remove badge já conquistada).

### `Rating` (`Avaliacao`) e conclusão de prato
- O marco de progresso/gamificação dispara quando uma **`Rating` é salva** (com `score` de 0 a 10 — `RN05`), não quando o usuário abre a receita ou clica em "começar preparo".

### `OperationEnqueuer` Estágio 1 vs. Estágio 2 (`ADR-008`)
- Casos de uso do app **sempre** chamam a interface `OperationEnqueuer` (`P04`).
- No **Estágio 1 do MVP**, a raiz de composição injeta `DirectOnlineOperationEnqueuer` (mutações exigem rede; leitura offline de receitas planejadas já funciona via `SqlCipherDatabase`).
- No **Estágio 2**, troca-se o adaptador na raiz de composição para `OutboxOperationEnqueuer` + `Synchronizer` sem alterar nenhuma tela nem caso de uso.
