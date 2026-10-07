# Atributos de Qualidade — Panelada (Fase 2.1)

> Fase 2.1 — Requisitos de qualidade. Papel da IA: arquiteto de software sênior (analista de qualidade).

> Destino: `/docs/fase2/atributos-qualidade.md`.

> Versão 1.2 — 06/10/2026 — status: priorização aprovada pela dupla; medidas (H) são hipóteses. Alterações da v1.2: revogação e backups em A05; fotos em A04; saída da IA e imagem em A09; invariantes em A13; regra de notificação em A07 (retroalimentação da 2.3 e da 2.4).

> Insumos: `requisitos.md`, `backlog.md`, `regras-de-negocio.md`, `resumo-1.4-fechamento.md`, `briefing-fase2` (seções 3, 5, 7 e 8), `diario-de-bordo-fase2.md`.

## 1. Premissas e dimensionamento

| Item | Valor | Origem |
|---|---|---|
| Prazo | MVP em 1,5 mês | Briefing, seção 2 |
| Custo | Infraestrutura gratuita; pagamento único baixo aceitável | Briefing, seção 2 |
| Escala | Até 1.500 usuários ativos em um dia de pico | Decisão da dupla (05/10/2026) |
| Catálogo (dimensionamento) | 350 pratos | Decisão da dupla (05/10/2026) |
| Catálogo (lançamento do MVP) | 100 pratos verificados, em 10 culinárias, cobrindo os 5 continentes; ao menos 1 cadeia de evolução com 2 níveis (nem todos os pratos precisam ter 2 níveis) | Decisão da dupla; cobertura derivada de US16 e RN03 |
| Dispositivo de referência (H) | Android com 4 GB de RAM, rede 4G | Hipótese, revisar na 2.3 |
| Fora do MVP | A14 (instrumentação de engajamento) | Decisão da dupla (05/10/2026) |

## 2. Conferência de "prato concluído"

- **Definição vigente (RN01):** um prato está concluído quando existe ao menos uma avaliação salva pelo usuário para ele. Histórico, coleção, badges e desbloqueio de evolução usam só pratos concluídos.
- **Decisão da dupla:** a regra é mantida. Nota 0 é válida (RN05) e também conclui o prato.
- **Efeito na lista offline:** o conjunto "preparadas" é o conjunto de pratos com avaliação salva.
- **"Em preparo":** prato que o usuário abriu no passo a passo (definição da dupla). Não existe como estado no modelo conceitual da Fase 1 (pendência de retroalimentação, seção 7).
- **Ambiguidade textual:** US12-c1 ("Dado que concluí um prato, quando registro a avaliação") e US13 ("concluí e avaliei") sugerem um passo anterior à avaliação. A lógica da RN01 não muda; a redação será corrigida via issue.
- **Consequência de qualidade:** como a avaliação é o gatilho de coleção, evolução e badges, ela precisa ser salva sem rede (A04) e sem perda (A08).

## 3. Priorização

| Faixa | Atributos | Justificativa |
|---|---|---|
| Crítico | A06, A05, A08, A04 | Risco à saúde do usuário, obrigação legal e gatilho central da gamificação |
| Alto | A09, A01, A02 | A09 sustenta a correção de A06 (o alerta só é correto se o dado do catálogo for correto); A01 e A02 têm metas já definidas na Fase 1 |
| Médio | A07, A03, A11, A13 | Importantes, mas toleram solução direta no MVP (A07 é de implementação direta) |
| Baixo | A12 | Pontuação (Could) e ranking (Won't) não estão no MVP |
| Fora do MVP | A14 | Decisão da dupla |

## 4. Cenários

Formato: Estímulo, Fonte do estímulo, Ambiente, Resposta, Medida.

### A06 — Correção da checagem de alérgenos (Crítico)
- **Estímulo:** usuário com restrição alimentar cadastrada pede sugestões, busca ou abre uma receita.
- **Fonte:** usuário (perfil com restrição).
- **Ambiente:** operação normal, online ou offline.
- **Resposta:** o sistema nunca sugere receita com alérgeno associado à restrição nem receita com estado de alérgenos "não verificado". Na busca e na visualização, essas receitas exibem aviso de compatibilidade não confirmada.
- **Medida:** 0 violações em 100% de um conjunto de teste com receitas nos três estados (verificado, declarado pela fonte, não verificado).
- **Regra do estado de alérgenos:** lista vazia significa "não verificado", nunca "sem alérgenos".
- **Escopo:** o MVP trata alérgenos. Diabetes e outras condições não são verificadas; a tela exibe aviso fixo (risco R1).
- **Rastreio:** US09, US01, RF07, RN08, RN10, RN16, RNF06.

### A05 — Privacidade e conformidade com a LGPD (Crítico)
- **Estímulo:** usuário cadastra, revoga ou exclui restrições alimentares.
- **Fonte:** usuário.
- **Ambiente:** operação normal.
- **Resposta:**  o dado só é gravado após consentimento explícito, com informação de que é dado sensível. A restrição alimentar é protegida por criptografia em trânsito (TLS) e em repouso, no dispositivo (banco local e fila de sincronização), no servidor e nos backups. Ao revogar, a restrição é removida do dispositivo imediatamente e do armazenamento ativo do servidor em até 24 h (H), contadas a partir do recebimento do pedido pelo servidor. Backups mantêm só texto cifrado e expiram conforme a retenção do provedor.
- **Medida:** 0 registros de restrição sem consentimento registrado; 100% das revogações concluídas dentro do prazo; 0 registros de restrição em texto claro no dispositivo, no servidor e nos backups, verificado por inspeção do armazenamento (os arquivos do banco e dos backups ficam ilegíveis sem a chave); 100% das comunicações que carregam restrição por TLS, no alvo. Na demo local, HTTP em rede local é limitação declarada.
- **Rastreio:** US09, RNF06, RN09; LGPD art. 46 e §2º.

### A08 — Integridade do progresso e sincronização (Crítico)
- **Estímulo:** usuário salva avaliação sem rede e fecha o app antes da sincronização.
- **Fonte:** usuário.
- **Ambiente:** offline, com conexão intermitente.
- **Resposta:** a avaliação é mantida localmente e enviada na reconexão, sem duplicar o preparo. Badges concedidos não são revogados. Inatividade não reduz progresso.
- **Medida:** 0 avaliações perdidas e 0 duplicadas em 100 ciclos de teste com queda de conexão e reenvio.
- **Rastreio:** US12, US14, US15, US16, RN01, RN04, RN06, RNF09.

### A04 — Disponibilidade offline parcial (Crítico)
- **Estímulo:** usuário sem rede abre uma receita planejada, em preparo ou preparada, ou salva uma avaliação.
- **Fonte:** usuário.
- **Ambiente:** offline; as receitas planejadas foram baixadas antes, com conexão.
- **Resposta:** a receita abre completa (ingredientes, passo a passo, utensílios, alérgenos, foto) com a data da última atualização dos alérgenos. Salvar avaliação conclui localmente, e evolução e badge são desbloqueados localmente. A sincronização inicia na reconexão. Candidatas não ficam disponíveis offline (decisão da dupla).
- **Medida (H):** abertura em até 2 s; salvar avaliação e calcular desbloqueios em até 1 s; início da sincronização em até 60 s após a reconexão; tamanho do conjunto baixado do seed, com fotos, a medir em rede 4G simulada.
- **Rastreio:** RNF05 (reescrita proposta), US05, US12, US15, US16, RN01, RN02, RN03.


### A09 — Manutenibilidade e qualidade do catálogo (Alto)
- **Estímulo:** curador importa e publica uma receita.
- **Fonte:** curador.
- **Ambiente:** operação normal.
- **Resposta:** a publicação exige nome, culinária, fonte e link da fonte, ingredientes, passo a passo, tempo, dificuldade, utensílios, imagem e estado dos alérgenos. Prato de cadeia indica o prato base.
- **Medida:** 100% das receitas publicadas com fonte, estado de alérgenos e imagem com atribuição completa (título, autor, fonte, licença); catálogo de lançamento com 100 pratos verificados, em 10 culinárias, cobrindo os 5 continentes.
- **Cenário (saída da IA na importação):** estímulo: curador envia um texto de receita ao agente. Resposta: a saída é validada por esquema e entra como proposto. Medida: 100% das receitas de origem IA validadas e passando por aprovação do curador; 0 receitas publicadas sem aprovação; 0 estados "verificado" atribuídos pelo agente.
- **Rastreio:** US18, RF18, RNF08, RN17, RN18, RN16.

### A01 — Desempenho da sugestão (Alto)
- **Estímulo:** usuário solicita sugestões.
- **Ambiente:** catálogo de 350 pratos, dispositivo de referência, rede 4G.
- **Resposta:** lista de sugestões exibida.
- **Medida:** em até 2,5 s em 95% das solicitações.
- **Rastreio:** RNF03, US01, US02.

### A02 — Tempo até o primeiro valor (Alto)
- **Estímulo:** primeiro acesso ao app.
- **Resposta:** o usuário chega à primeira sugestão sem cadastro extenso.
- **Medida:** em até 2 min, em teste com 5 pessoas.
- **Rastreio:** RNF02.

### A07 — Controle de notificações (Médio)
- **Estímulo:** chegada das datas de compra e de preparo.
- **Resposta:** envio de lembretes dentro da configuração do usuário.
- **Medida:** no máximo 2 notificações por dia em 100% dos dias simulados; 0 envios com lembretes desativados. Regra proposta (H): uma notificação por tipo por dia, no máximo 2 (a conferir com a RN13).
- **Rastreio:** US08, RNF07, RN13.

### A03 — Acesso em poucos toques (Médio)
- **Estímulo:** usuário inicia um fluxo principal.
- **Medida:** sugestões, planejamento e registro de avaliação iniciam em até 2 toques a partir da tela inicial.
- **Rastreio:** RNF04, US02.

### A11 — Escalabilidade (Médio)
- **Estímulo:** dia de pico de uso.
- **Ambiente:** infraestrutura gratuita.
- **Medida:** 1.500 usuários ativos em um dia de pico, com A01 mantido e sem custo recorrente. Os limites da camada gratuita serão verificados na 2.3.
- **Rastreio:** Briefing, seção 2.

### A13 — Observabilidade técnica (Médio)
- **Estímulo:** falha de sincronização ou de importação.
- **Resposta:** a falha é registrada com identificador, e o registro nunca contém dado de restrição alimentar.
- **Medida:** 100% das falhas de sincronização registradas; 0 registros com dado de restrição; 100% das violações de invariante do catálogo registradas.
- **Rastreio:** A08, RNF06.

### A12 — Modificabilidade (Baixo)
- **Estímulo:** inclusão futura de pontuação (RN19).
- **Medida (H):** a mudança altera no máximo um módulo e não muda o fluxo de salvar avaliação.
- **Rastreio:** US13, RN19, RN20.

### A14 — Instrumentação de engajamento (fora do MVP)
- Eventos do ciclo gatilho-ação-recompensa-investimento ficam fora do MVP. O A13 serve de gancho: eventos técnicos com nomes estáveis permitem ligar a análise depois.
- Restrições para quando entrar: consentimento próprio (RNF06), máximo de 2 notificações por dia (RNF07) e ausência de punição por inatividade (RNF09).

## 5. Conflitos entre atributos

| Conflito | Atributos | Mitigação |
|---|---|---|
| Cache desatualizado pode exibir alérgenos antigos | A04 × A06 | Data da atualização visível; atualização dos alérgenos ao abrir com rede |
| Desbloqueio local pode divergir do servidor | A04 × A08 | Regra de nunca revogar (RN04); servidor aceita a avaliação sem conflito |
| Camada gratuita limita desempenho e escala | Custo × A01 × A11 | Verificar limites na 2.3 |
| Curadoria manual de alérgenos consome o prazo | A09 × prazo | Lançar com 100 pratos verificados |
| Telemetria contra dado sensível | A13 × A05 | Logs sem dado de restrição |
| Criptografia local pode aumentar o tempo de abertura offline | A05 × A04 | Medir na 2.3 contra a meta de 2 s (H); manter a criptografia e ajustar biblioteca ou escopo |

## 6. Riscos aceitos

| ID | Risco | Mitigação |
|---|---|---|
| R1 | Diabetes e outras condições não são verificadas no MVP | Aviso fixo na tela |
| R2 | Alérgenos podem estar desatualizados durante o uso offline | Data da última atualização exibida |
| R3 | A14 fora do MVP reduz a base para decisões de engajamento | Eventos técnicos do A13 como gancho |

## 7. Retroalimentação da Fase 1 (a abrir como uma issue agrupada)

| Artefato | Alteração proposta |
|---|---|
| RNF05 | Reescrever: consultar offline as receitas planejadas, em preparo (abertas no passo a passo) e preparadas; salvar avaliação sem conexão e sincronizar depois |
| RNF novo | Ou emenda à RNF05: critérios de sincronização sem perda e sem duplicidade |
| RN08, RN10, RN16, RF18, US09 | Introduzir o estado de alérgenos (verificado, declarado pela fonte, não verificado) e a regra "lista vazia = não verificado" |
| US09 | Registrar que diabetes e outras condições não são verificadas na v1 |
| US12-c1, US13 | Corrigir a redação circular de "concluído" |
| regras-de-negocio.md | Atualizar o status das RNs ("a validar na 1.4") |
| modelo-conceitual.md | Conferir se comporta o estado de alérgenos e o conceito de "em preparo" (não verificado nesta etapa) |
| RNF06    | Explicitar a proteção por criptografia da restrição alimentar (trânsito e repouso, no dispositivo e no servidor) |
| Documentos da Fase 1 | Itens da 2.3 e da 2.4 estão na issue de retroalimentação (v1.4) |

## 8. Checagem da Definition of Done (briefing, seção 7)

- Cada atributo é cenário mensurável: sim (medidas H a revalidar na 2.3).
- Rastreado a US/RN/RNF: sim.
- Priorizado com justificativa: sim, aprovado pela dupla.
- Conflitos listados: sim.
- "Prato concluído" conferido: sim.
- Palavras-armadilha: revisadas.
