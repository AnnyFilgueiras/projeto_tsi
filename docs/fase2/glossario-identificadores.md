# Glossário de identificadores PT→EN — Panelada (Fase 2.7)

> Destino: `/docs/fase2/glossario-identificadores.md`. Versão 1.2 — 07/10/2026 — status: **aprovado pela dupla** (seções 1 a 8 aprovadas em 07/10/2026; seções 9 e 9.1 incorporadas na v1.2).
> Fonte da tradução exigida pelo ADR-015. Termos novos entram aqui antes de entrar no código. O mapa completo do contrato está em `mapa-renomeacao-openapi.md` (identificadores) e prevalece sobre a seção 7 em caso de diferença.

## 1. Domínio

| Português | Inglês |
|---|---|
| Usuario | User |
| Conta | Account |
| SessaoRefresh | RefreshSession |
| TipoRestricao | RestrictionType |
| RestricaoDoUsuario | UserRestriction |
| Utensilio | Utensil |
| Ingrediente | Ingredient |
| Culinaria | Cuisine |
| Prato | Dish |
| Receita | Recipe |
| Sugestao | Suggestion |
| PlanoDeRotina | RoutinePlan |
| ItemDeRotina | RoutineItem |
| ListaDeCompras | ShoppingList |
| ItemDeCompra | ShoppingItem |
| Avaliacao | Rating |
| DefinicaoBadge | BadgeDefinition |
| ConquistaBadge | BadgeAward |
| DesbloqueioEvolucao | EvolutionUnlock |
| SubstituicaoIngrediente | IngredientSubstitution |
| FotoPrato | DishPhoto |
| OperacaoFila | QueuedOperation |
| OperacaoProcessada | ProcessedOperation |

## 2. Valores de enumeração

| Português | Inglês |
|---|---|
| verificado / declarado_fonte / nao_verificado | verified / source_declared / unverified |
| compativel / incompativel / nao_confirmada | compatible / incompatible / unconfirmed |
| apresentada / candidata / descartada (Sugestao) | presented / candidate / discarded |
| planejado / concluido (ItemDeRotina, servidor) | planned / completed |
| proposto / aprovado / desativado | proposed / approved / deactivated |
| pendente / confirmada / falha (fila) | pending / confirmed / failed (contrato: confirmed / rejected) |
| usuario / curador (papel) | user / curator |
| prato / culinaria / n_culinarias / todos_continentes / conjunto (marco) | dish / cuisine / n_cuisines / all_continents / set |
| manual / ia (origem) | manual / ai |
| facil / media / dificil | easy / medium / hard |
| semana / quinzena | week / fortnight |
| compra / preparo (tipo de lembrete) | purchase / preparation |

## 3. Pacote de Alérgenos

| Português | Inglês |
|---|---|
| RegraAlergenos | AllergenRules |
| InvariantesCatalogo | CatalogInvariants |
| CodigoAlergeno | AllergenCode |
| EstadoAlergenos | AllergenState |
| ResultadoCompatibilidade | CompatibilityResult |
| ReceitaParaRegra | RecipeForRules |
| Classificacao | Classification |
| classificarReceita | classifyRecipe |
| filtrarCandidatas | filterCandidates |
| substitutoPermitido | isSubstituteAllowed |
| verificarInvariantes | checkInvariants |
| semLactose | lactoseFree |
| confirmadoSemAlergenos | confirmedAllergenFree |

## 4. API: módulos, interfaces e serviços

| Português | Inglês |
|---|---|
| CatalogoLeitura / CatalogoEscrita | CatalogRead / CatalogWrite |
| PerfilCiclo / PerfilConsulta | ProfileLifecycle / ProfileQuery |
| RestricoesParaFiltro | RestrictionsForFilter |
| RotinaPublica / ProgressoPublico | RoutinePublic / ProgressPublic |
| SugestaoEBusca | SuggestionSearch |
| ServicoSincronizacao | SyncService |
| MontadorDeConjunto | DownloadSetBuilder |
| RepositorioOperacoes | OperationRepository |
| AplicadorDeOperacao | OperationApplier |
| AplicadorAvaliacao / AplicadorRotina / AplicadorPerfil | RatingApplier / RoutineApplier / ProfileApplier |
| ServicoContas / ServicoSessoes / ServicoExclusaoDeConta | AccountService / SessionService / AccountDeletionService |
| EmissorTokens | TokenIssuer |
| RotasCuradoria | CurationRoutes |
| ServicoDeProposta | ProposalService |
| ServicoDeImportacaoAssistida | AssistedImportService |
| AgenteImportacao | ImportAgent |
| ProvedorIA / ProvedorKimi / ProvedorGravado | AiProvider / KimiProvider / RecordedProvider |
| ControleConsumoIA | AiUsageGuard |
| PortaoPublicacao | PublicationGate |
| ProcessadorFotos | PhotoProcessor |
| Cifra / ProvedorDeChave | FieldCipher / KeyProvider |
| ChaveEmArquivo / ChaveSecretManager | FileKey / SecretManagerKey |
| RegistroTecnico | TechnicalLog |
| (novo na 2.7) | UnlockRules |

## 5. App

| Português | Inglês |
|---|---|
| BancoLocal / BancoLocalSqlCipher | LocalDatabase / SqlCipherDatabase |
| Migrador | Migrator |
| ArmazenamentoSeguro | SecureStorage |
| RepositorioAvaliacoes / RepositorioRotina / RepositorioReceitas / RepositorioRestricoes | RatingRepository / RoutineRepository / RecipeRepository / RestrictionRepository |
| EnfileiradorDeOperacoes / FilaPendentes / FilaSincronizacao | OperationEnqueuer / PendingOperations / SyncQueue |
| proximasPendentes | nextPending |
| Sincronizador / EnviadorDeOperacoes / AtualizadorDoConjunto | Synchronizer / OperationSender / DownloadSetUpdater |
| ClienteHttp / ApiSincronizacao / ApiCatalogo / SessaoCliente | HttpClient / SyncApi / CatalogApi / ClientSession |
| GerenciadorFotos | PhotoManager |
| CarregarReceita / AvaliarCompatibilidade / ResolverSubstituicoes | LoadRecipe / EvaluateCompatibility / ResolveSubstitutions |
| FonteDeReceita / FonteLocal / FonteRemota | RecipeSource / LocalRecipeSource / RemoteRecipeSource |
| EstadoPreparoLocal | LocalCookingState |
| RegistrarAvaliacao / CalculadoraDesbloqueio | RegisterRating / UnlockCalculator |
| CadastrarRestricao / RevogarRestricao | RegisterRestriction / RevokeRestriction |
| DefinirLembretes / AgendadorLembretes / AdaptadorNotificacoes | SetReminders / ReminderScheduler / NotificationAdapter |

## 6. Operações da fila

| Português | Inglês |
|---|---|
| avaliacao.registrar | rating.register |
| item.reagendar / item.remover | item.reschedule / item.remove |
| lista.definir_data_compra / lista.marcar_item | list.set_purchase_date / list.mark_item |
| restricao.cadastrar / restricao.revogar | restriction.register / restriction.revoke |
| lembretes.definir | reminders.set |

## 7. Contrato (resumo; ver `mapa-renomeacao-openapi.md`)

| Português | Inglês |
|---|---|
| /v1/saude | /v1/health |
| /v1/contas/anonima | /v1/accounts/anonymous |
| /v1/sessoes/entrar / renovar / sair | /v1/sessions/sign-in / refresh / sign-out |
| /v1/sincronizacao/operacoes / conjunto | /v1/sync/operations / download-set |
| /v1/receitas/{pratoId} | /v1/recipes/{dishId} |
| /v1/curadoria/... | /v1/curation/... |
| /v1/curadoria/importacoes | /v1/curation/imports |
| /v1/curadoria/propostas/{propostaId}/foto / verificar / aprovar / descartar | /v1/curation/proposals/{proposalId}/photo / verify / approve / discard |
| /v1/curadoria/consumo-ia | /v1/curation/ai-usage |
| X-Pacote-Alergenos-Versao | X-Allergen-Package-Version |
| pacoteVersaoMinima | minPackageVersion |
| fluxoManualDisponivel | manualFlowAvailable |
| chave-reutilizada | key-reused |
| repetida | repeated |

Permanecem como estão: `Idempotency-Key`, `problem+json` e os 19 códigos do vocabulário de alérgenos (ADR-015, item 4).

## 8. Componentes C4 e pastas do código

| Componente C4 (português) | Pasta no código |
|---|---|
| Catálogo | `modules/catalog` |
| Perfil e Restrições | `modules/profile` |
| Rotina e Planejamento | `modules/routine` |
| Progresso e Avaliação | `modules/progress` |
| Importação | `modules/importer` |
| Identidade e Sessões | `cross-cutting/identity` |
| Sincronização | `cross-cutting/sync` |
| Sugestão e Busca | `cross-cutting/suggestion-search` |
| Cifra de Campos Sensíveis | `support/field-encryption` |
| Registro Técnico | `support/technical-log` |
| Pacote de Alérgenos | `packages/allergen-rules` |

## 9. Atributos e métodos

| Português | Inglês |
|---|---|
| nome / descricao | name / description |
| culinariaId / pratoId / pratoBaseId | cuisineId / dishId / baseDishId |
| estadoPublicacao | publicationState |
| tempoPreparo (minutos) | prepTimeMinutes |
| dificuldade / passos | difficulty / steps |
| alergenos / estadoAlergenos / alergenosAtualizadoEm | allergens / allergenState / allergensUpdatedAt |
| fonteNome / fonteUrl / origem | sourceName / sourceUrl / origin |
| continentes | continents |
| alergenosDoSubstituto / aprovadoPor | substituteAllergens / approvedBy |
| hashArquivo / autor / urlFonte / licenca / alterada | fileHash / author / sourceUrl / license / modified |
| preferenciasCulinarias / frequenciaLembretes / tiposLembreteAtivos | culinaryPreferences / reminderFrequency / activeReminderTypes |
| codigo / alergenosAssociados | code / associatedAllergens |
| tipoCifrado / consentimentoEm / versaoChave | encryptedType / consentAt / keyVersion |
| situacao / dataHora (Sugestao) | status / presentedAt |
| periodo / dataInicio | period / startDate |
| dataPreparo / dataCompra | prepDate / purchaseDate |
| comprado | purchased |
| nota / relato / alteracoes / data (Avaliacao) | score / comment / changes / date |
| marco | milestone |
| dataDesbloqueio | unlockedAt |
| papel / senhaHash / criadaEm / ultimoAcessoEm | role / passwordHash / createdAt / lastAccessAt |
| familiaId / hashToken / expiraEm / usadoEm / sucessorId / revogadaEm | familyId / tokenHash / expiresAt / usedAt / successorId / revokedAt |
| hashPayload / resposta | payloadHash / response |
| tentativas / proximaTentativaEm / estado (fila) | attempts / nextAttemptAt / state |
| carga | payload |
| emPreparoDesde | cookingSince |
| criarContaAnonima / vincularEmail / entrar / renovar / revogarSessoes / excluir | createAnonymousAccount / linkEmail / signIn / refresh / revokeSessions / delete |
| emitirAcesso / verificar | issueAccess / verify |
| processarLote / montar | processBatch / build |
| buscar / gravar (repositório de operações) | find / save |
| tipos / aplicar | types / apply |
| marcarConfirmada / marcarFalha / enfileirar | markConfirmed / markFailed / enqueue |
| enviarPendentes / atualizar / sincronizar | sendPending / update / sync |
| requisitar / enviarLote / obterConjunto / obterReceita | request / sendBatch / getDownloadSet / getRecipe |
| baixar / caminhoLocal | download / localPath |
| executar / calcular / planejar / agendar | execute / calculate / plan / schedule |
| enviarManual / enviarTexto / editar / verificar / aprovar / descartar | submitManual / submitText / edit / verify / approve / discard |
| importarManual / anexarFoto / marcarVerificado / importar / propor / extrair | importManual / attachPhoto / markVerified / import / propose / extract |
| autorizar / registrar (consumo de IA) | authorize / record |
| receitaAprovada / candidatos / cadeiasEIndice | approvedRecipe / candidates / chainsAndIndex |
| gravarProposta / publicar | saveProposal / publish |
| criarPerfil / excluirDados | createProfile / deleteData |
| restricoesDecifradas / despensaEUtensilios | decryptedRestrictions / pantryAndUtensils |
| registrarSugestoes / aplicarOperacoesDeRotina | registerSuggestions / applyRoutineOperations |
| aplicarAvaliacao / concluidosEDesbloqueios | applyRating / completedAndUnlocks |
| VERSAO_PACOTE | PACKAGE_VERSION |
| model "gravado" | model "recorded" |

## 9.1 Acréscimos das sequências e do contrato

| Português | Inglês |
|---|---|
| /v1/curadoria/propostas/{id}/foto, /verificar, /aprovar | /v1/curation/proposals/{id}/photo, /verify, /approve |
| semLactoseConferido | lactoseFreeChecked |
| esquemaVersao | schemaVersion |
| acumuladoReais / tetoReais | accumulatedBrl / capBrl |
| duvida (em incertezas) | doubt (em uncertainties) |
