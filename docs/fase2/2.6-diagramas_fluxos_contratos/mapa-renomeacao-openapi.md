# Mapa de renomeação do contrato — openapi.yaml v1.0.0-2.6 → v1.1.0-2.7

> Gerado na 2.7 (ADR-015, escopo B). Status: a aprovar pela dupla. Os 19 códigos de alérgenos (`amendoim`, `leite`, `trigo_centeio_cevada_aveia` etc.) permanecem (ADR-015, item 4). Textos de `summary` e `description` permanecem em português; só os identificadores dentro deles foram trocados.

### segmentos_de_rota

| Português | Inglês |
|---|---|
| `saude` | `health` |
| `contas` | `accounts` |
| `anonima` | `anonymous` |
| `sessoes` | `sessions` |
| `entrar` | `sign-in` |
| `renovar` | `refresh` |
| `sair` | `sign-out` |
| `conta` | `account` |
| `sincronizacao` | `sync` |
| `operacoes` | `operations` |
| `conjunto` | `download-set` |
| `receitas` | `recipes` |
| `fotos` | `photos` |
| `perfil` | `profile` |
| `despensa` | `pantry` |
| `utensilios` | `utensils` |
| `preferencias` | `preferences` |
| `sugestoes` | `suggestions` |
| `aprovar` | `approve` |
| `descartar` | `discard` |
| `busca` | `search` |
| `planos` | `plans` |
| `itens` | `items` |
| `lista-de-compras` | `shopping-list` |
| `curadoria` | `curation` |
| `ingredientes` | `ingredients` |
| `culinarias` | `cuisines` |
| `substituicoes` | `substitutions` |
| `importacoes` | `imports` |
| `propostas` | `proposals` |
| `foto` | `photo` |
| `verificar` | `verify` |
| `consumo-ia` | `ai-usage` |

### parametros_de_rota

| Português | Inglês |
|---|---|
| `pratoId` | `dishId` |
| `sugestaoId` | `suggestionId` |
| `planoId` | `planId` |
| `propostaId` | `proposalId` |

### operationId

| Português | Inglês |
|---|---|
| `verificarSaude` | `checkHealth` |
| `criarContaAnonima` | `createAnonymousAccount` |
| `entrar` | `signIn` |
| `renovarSessao` | `refreshSession` |
| `sair` | `signOut` |
| `vincularEmail` | `linkEmail` |
| `excluirConta` | `deleteAccount` |
| `enviarOperacoes` | `sendOperations` |
| `obterConjuntoBaixado` | `getDownloadSet` |
| `obterReceita` | `getRecipe` |
| `obterFoto` | `getPhoto` |
| `atualizarDespensa` | `updatePantry` |
| `atualizarUtensilios` | `updateUtensils` |
| `atualizarPreferenciasCulinarias` | `updateCulinaryPreferences` |
| `obterSugestoes` | `getSuggestions` |
| `aprovarSugestao` | `approveSuggestion` |
| `descartarSugestao` | `discardSuggestion` |
| `buscarReceitas` | `searchRecipes` |
| `criarPlano` | `createPlan` |
| `criarItemDeRotina` | `createRoutineItem` |
| `gerarListaDeCompras` | `generateShoppingList` |
| `cadastrarIngrediente` | `registerIngredient` |
| `cadastrarUtensilio` | `registerUtensil` |
| `cadastrarCulinaria` | `registerCuisine` |
| `cadastrarSubstituicao` | `registerSubstitution` |
| `enviarReceitaManual` | `submitManualRecipe` |
| `importarAssistido` | `importAssisted` |
| `listarPropostas` | `listProposals` |
| `obterProposta` | `getProposal` |
| `editarProposta` | `editProposal` |
| `anexarFoto` | `attachPhoto` |
| `marcarAlergenosVerificados` | `markAllergensVerified` |
| `aprovarProposta` | `approveProposal` |
| `descartarProposta` | `discardProposal` |
| `consultarConsumoIA` | `getAiUsage` |

### tags

| Português | Inglês |
|---|---|
| `Sistema` | `System` |
| `Sessão e contas` | `Sessions and accounts` |
| `Sincronização` | `Sync` |
| `Catálogo` | `Catalog` |
| `Perfil` | `Profile` |
| `Sugestão e busca` | `Suggestion and search` |
| `Rotina` | `Routine` |
| `Curadoria` | `Curation` |

### schemas

| Português | Inglês |
|---|---|
| `CodigoAlergeno` | `AllergenCode` |
| `EstadoAlergenos` | `AllergenState` |
| `Continente` | `Continent` |
| `EstadoPublicacao` | `PublicationState` |
| `LicencaFoto` | `PhotoLicense` |
| `Dificuldade` | `Difficulty` |
| `Problema` | `Problem` |
| `ProblemaPortao` | `PublicationGateProblem` |
| `ParTokens` | `TokenPair` |
| `CargaAvaliacao` | `RatingPayload` |
| `CargaReagendar` | `ReschedulePayload` |
| `CargaRemoverItem` | `RemoveItemPayload` |
| `CargaDataCompra` | `PurchaseDatePayload` |
| `CargaMarcarItem` | `MarkItemPayload` |
| `CargaCadastrarRestricao` | `RegisterRestrictionPayload` |
| `CargaRevogarRestricao` | `RevokeRestrictionPayload` |
| `CargaLembretes` | `RemindersPayload` |
| `OpAvaliacao` | `RatingOp` |
| `OpReagendar` | `RescheduleOp` |
| `OpRemoverItem` | `RemoveItemOp` |
| `OpDataCompra` | `PurchaseDateOp` |
| `OpMarcarItem` | `MarkItemOp` |
| `OpCadastrarRestricao` | `RegisterRestrictionOp` |
| `OpRevogarRestricao` | `RevokeRestrictionOp` |
| `OpLembretes` | `RemindersOp` |
| `Operacao` | `Operation` |
| `Desbloqueios` | `Unlocks` |
| `ResultadoOperacao` | `OperationResult` |
| `ItemDeRotina` | `RoutineItem` |
| `ListaDeCompras` | `ShoppingList` |
| `Plano` | `RoutinePlan` |
| `Ingrediente` | `Ingredient` |
| `IngredienteEntrada` | `IngredientInput` |
| `Utensilio` | `Utensil` |
| `Culinaria` | `Cuisine` |
| `Substituicao` | `IngredientSubstitution` |
| `FotoPrato` | `DishPhoto` |
| `IngredienteDaReceita` | `RecipeIngredient` |
| `Receita` | `Recipe` |
| `ResumoPrato` | `DishSummary` |
| `SugestaoItem` | `SuggestionItem` |
| `ResumoPratoBusca` | `SearchDishSummary` |
| `Marco` | `Milestone` |
| `DefinicaoBadge` | `BadgeDefinition` |
| `TipoRestricao` | `RestrictionType` |
| `Avaliacao` | `Rating` |
| `ConjuntoBaixado` | `DownloadSet` |
| `PropostaEntrada` | `ProposalInput` |
| `PropostaEdicao` | `ProposalEdit` |
| `ChecklistVerificacao` | `VerificationChecklist` |
| `SaidaAgente` | `AgentOutput` |
| `ResumoProposta` | `ProposalSummary` |
| `Proposta` | `Proposal` |

### responses

| Português | Inglês |
|---|---|
| `Invalida` | `InvalidRequest` |
| `NaoAutenticado` | `Unauthenticated` |
| `CredenciaisInvalidas` | `InvalidCredentials` |
| `RefreshInvalido` | `InvalidRefresh` |
| `ProibidoPapel` | `ForbiddenRole` |
| `NaoEncontrado` | `NotFound` |
| `EmAndamento` | `InProgress` |
| `ChaveReutilizada` | `KeyReused` |
| `RegraDeNegocio` | `BusinessRule` |
| `EmailEmUso` | `EmailInUse` |
| `LoteGrande` | `BatchTooLarge` |
| `LimiteExcedido` | `RateLimitExceeded` |

### parameters_componentes

| Português | Inglês |
|---|---|
| `PratoId` | `DishId` |
| `SugestaoId` | `SuggestionId` |
| `PlanoId` | `PlanId` |
| `PropostaId` | `ProposalId` |
| `PacoteVersao` | `PackageVersion` |

### nomes_de_parametro

| Português | Inglês |
|---|---|
| `pratoId` | `dishId` |
| `sugestaoId` | `suggestionId` |
| `planoId` | `planId` |
| `propostaId` | `proposalId` |
| `X-Pacote-Alergenos-Versao` | `X-Allergen-Package-Version` |
| `pagina` | `page` |
| `tamanho` | `size` |
| `versao` | `version` |
| `limite` | `limit` |
| `usarDespensa` | `usePantry` |
| `culinariaId` | `cuisineId` |
| `ingredienteId` | `ingredientId` |
| `tempoMaximoMinutos` | `maxPrepMinutes` |
| `estado` | `state` |

### propriedades

| Português | Inglês |
|---|---|
| `acumuladoReais` | `accumulatedBrl` |
| `alergenos` | `allergens` |
| `alergenosAssociados` | `associatedAllergens` |
| `alergenosAtualizadoEm` | `allergensUpdatedAt` |
| `alergenosDoSubstituto` | `substituteAllergens` |
| `alteracoes` | `changes` |
| `alterada` | `modified` |
| `aprovadoEm` | `approvedAt` |
| `aprovadoPor` | `approvedBy` |
| `ativo` | `active` |
| `atualizadoEm` | `updatedAt` |
| `autor` | `author` |
| `avaliacoes` | `ratings` |
| `avisoAtivo` | `warningActive` |
| `bloqueado` | `blocked` |
| `campo` | `field` |
| `carga` | `payload` |
| `codigo` | `code` |
| `compatibilidade` | `compatibility` |
| `comprado` | `purchased` |
| `confirmadoSemAlergenos` | `confirmedAllergenFree` |
| `conquistas` | `badgeAwards` |
| `consentimentoEm` | `consentAt` |
| `contaId` | `accountId` |
| `continentes` | `continents` |
| `criadaEm` | `createdAt` |
| `culinaria` | `cuisine` |
| `culinariaId` | `cuisineId` |
| `culinariaIds` | `cuisineIds` |
| `culinarias` | `cuisines` |
| `dados` | `data` |
| `data` | `date` |
| `dataCompra` | `purchaseDate` |
| `dataDesbloqueio` | `unlockedAt` |
| `dataInicio` | `startDate` |
| `dataPreparo` | `prepDate` |
| `definicaoId` | `definitionId` |
| `definicoesBadge` | `badgeDefinitions` |
| `desbloqueios` | `unlocks` |
| `desbloqueiosEvolucao` | `evolutionUnlocks` |
| `descricao` | `description` |
| `despensa` | `pantry` |
| `dificuldade` | `difficulty` |
| `duvida` | `doubt` |
| `erro` | `error` |
| `erros` | `errors` |
| `esquemaVersao` | `schemaVersion` |
| `estadoAlergenos` | `allergenState` |
| `estadoPublicacao` | `publicationState` |
| `evolucoes` | `evolutions` |
| `expiraEm` | `expiresAt` |
| `fluxoManualDisponivel` | `manualFlowAvailable` |
| `fonteNome` | `sourceName` |
| `fonteUrl` | `sourceUrl` |
| `foto` | `photo` |
| `fotoHash` | `photoHash` |
| `frequencia` | `frequency` |
| `geradoEm` | `generatedAt` |
| `idiomaOrigem` | `sourceLanguage` |
| `imagem` | `image` |
| `incertezas` | `uncertainties` |
| `indiceCatalogo` | `catalogIndex` |
| `ingredienteId` | `ingredientId` |
| `ingredienteIds` | `ingredientIds` |
| `ingredienteOriginal` | `originalIngredient` |
| `ingredientes` | `ingredients` |
| `ingredientesConferidos` | `checkedIngredients` |
| `ingredientesFaltantes` | `missingIngredients` |
| `itens` | `items` |
| `lembretes` | `reminders` |
| `licenca` | `license` |
| `listaDeCompras` | `shoppingList` |
| `marco` | `milestone` |
| `mensagem` | `message` |
| `modelo` | `model` |
| `nome` | `name` |
| `nota` | `score` |
| `novaData` | `newDate` |
| `operacoes` | `operations` |
| `origem` | `origin` |
| `pacoteAlergenosVersao` | `allergenPackageVersion` |
| `pacoteVersaoMinima` | `minPackageVersion` |
| `pagina` | `page` |
| `passos` | `steps` |
| `percentual` | `percentage` |
| `perfil` | `profile` |
| `periodo` | `period` |
| `planoId` | `planId` |
| `planos` | `plans` |
| `prato` | `dish` |
| `pratoBaseId` | `baseDishId` |
| `pratoId` | `dishId` |
| `pratos` | `dishes` |
| `preferenciasCulinarias` | `culinaryPreferences` |
| `quantidade` | `quantity` |
| `receitasParaBaixar` | `recipesToDownload` |
| `refreshExpiraEm` | `refreshExpiresAt` |
| `relato` | `comment` |
| `repetida` | `repeated` |
| `restricoes` | `restrictions` |
| `resultados` | `results` |
| `saidaBruta` | `rawOutput` |
| `segundaFonteConsultada` | `secondSourceChecked` |
| `segundaFonteDescricao` | `secondSourceDescription` |
| `semLactose` | `lactoseFree` |
| `semLactoseConferido` | `lactoseFreeChecked` |
| `semResultado` | `noResult` |
| `senha` | `password` |
| `situacao` | `status` |
| `substituicoes` | `substitutions` |
| `substituto` | `substitute` |
| `substitutoId` | `substituteId` |
| `substitutoNome` | `substituteName` |
| `substitutosPropostos` | `proposedSubstitutes` |
| `sugestoes` | `suggestions` |
| `tempoPreparoMinutos` | `prepTimeMinutes` |
| `texto` | `text` |
| `tipo` | `type` |
| `tipoRestricao` | `restrictionType` |
| `tipos` | `types` |
| `tiposRestricao` | `restrictionTypes` |
| `titulo` | `title` |
| `tokenAcesso` | `accessToken` |
| `tokensEntrada` | `inputTokens` |
| `tokensSaida` | `outputTokens` |
| `totalPratos` | `totalDishes` |
| `uniaoConferida` | `unionChecked` |
| `unidade` | `unit` |
| `urlFonte` | `sourceUrl` |
| `urlLicenca` | `licenseUrl` |
| `utensilioIds` | `utensilIds` |
| `utensilios` | `utensils` |
| `utensiliosAusentes` | `missingUtensils` |
| `verificadoEm` | `verifiedAt` |
| `verificadoPor` | `verifiedBy` |
| `versao` | `version` |
| `violacoes` | `violations` |

### valores_de_enum_e_const

| Português | Inglês |
|---|---|
| `declarado_fonte` | `source_declared` |
| `nao_verificado` | `unverified` |
| `verificado` | `verified` |
| `aprovado` | `approved` |
| `desativado` | `deactivated` |
| `proposto` | `proposed` |
| `europa` | `europe` |
| `autoria_propria` | `own_work` |
| `dominio_publico` | `public_domain` |
| `dificil` | `hard` |
| `facil` | `easy` |
| `media` | `medium` |
| `compra` | `purchase` |
| `preparo` | `preparation` |
| `confirmada` | `confirmed` |
| `rejeitada` | `rejected` |
| `concluido` | `completed` |
| `planejado` | `planned` |
| `quinzena` | `fortnight` |
| `semana` | `week` |
| `ia` | `ai` |
| `apresentada` | `presented` |
| `candidata` | `candidate` |
| `descartada` | `discarded` |
| `compativel` | `compatible` |
| `incompativel` | `incompatible` |
| `nao_confirmada` | `unconfirmed` |
| `campo_faltante` | `missing_field` |
| `estado_alergenos_ausente` | `allergen_state_missing` |
| `fonte_ausente` | `source_missing` |
| `foto_sem_atribuicao` | `photo_without_attribution` |
| `invariante_leite_sem_lactose` | `invariant_milk_without_lactose` |
| `invariante_substituto_verificado_sem_alergenos` | `invariant_verified_substitute_without_allergens` |
| `invariante_uniao_alergenos` | `invariant_allergen_union` |
| `invariante_verificado_sem_alergenos` | `invariant_verified_without_allergens` |
| `avaliacao.registrar` | `rating.register` |
| `item.reagendar` | `item.reschedule` |
| `item.remover` | `item.remove` |
| `lista.definir_data_compra` | `list.set_purchase_date` |
| `lista.marcar_item` | `list.mark_item` |
| `restricao.cadastrar` | `restriction.register` |
| `restricao.revogar` | `restriction.revoke` |
| `lembretes.definir` | `reminders.set` |
| `prato` | `dish` |
| `culinaria` | `cuisine` |
| `n_culinarias` | `n_cuisines` |
| `todos_continentes` | `all_continents` |
| `conjunto` | `set` |
| `usuario` | `user` |
| `curador` | `curator` |
| `gravado` | `recorded` |

### tipos_de_problema

| Português | Inglês |
|---|---|
| `validacao` | `validation` |
| `regra-de-negocio` | `business-rule` |
| `chave-reutilizada` | `key-reused` |
| `nao-autenticado` | `unauthenticated` |
| `credenciais-invalidas` | `invalid-credentials` |
| `refresh-invalido` | `invalid-refresh` |
| `proibido-papel` | `forbidden-role` |
| `nao-encontrado` | `not-found` |
| `em-andamento` | `in-progress` |
| `email-em-uso` | `email-in-use` |
| `lote-grande` | `batch-too-large` |
| `limite-excedido` | `rate-limit-exceeded` |
| `portao-publicacao` | `publication-gate` |
