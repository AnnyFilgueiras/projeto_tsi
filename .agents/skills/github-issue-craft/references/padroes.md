# Padrões de escrita de issues

Índice:
- [Títulos](#títulos)
- [Anatomia por tipo](#anatomia-por-tipo)
- [Critérios de aceite](#critérios-de-aceite)
- [Fatiamento e tamanho](#fatiamento-e-tamanho)
- [Épicos e sub-issues](#épicos-e-sub-issues)
- [Metadados](#metadados)
- [Definition of Ready](#definition-of-ready)

---

## Títulos

O título é lido em uma lista de 200 linhas, fora de contexto, por alguém procurando outra coisa. Ele precisa funcionar sozinho.

Regras:
- **Específico o suficiente para ser buscável.** Inclua o termo que alguém digitaria: nome da tela, do endpoint, do erro.
- **≤ 72 caracteres.** Além disso o GitHub trunca em várias telas.
- **Descreve o problema ou o resultado, não a solução.** Exceção: tasks técnicas, onde a ação *é* o resultado.
- **Sem prefixo redundante** se o repositório usa issue types (`Bug`, `Feature`, `Task`). Use `[Área]` só se o repo já faz isso.
- **Sem pontuação decorativa**, sem "Erro:", sem "URGENTE".
- Voz ativa, presente. "Upload falha com arquivo >5MB" — não "Falhou o upload ontem".

| Ruim | Bom | Por quê |
|---|---|---|
| Bug no login | Login com SSO retorna 500 após expiração do token | Buscável, específico, aponta a condição |
| Melhorar performance | Listagem de usuários leva 8s acima de 10k registros | Tem número, tem gatilho |
| Adicionar índice em `users.email` | Busca por e-mail faz full scan em `users` | Problema, não solução |
| Refatorar auth | Extrair validação de sessão de `AuthController` para serviço | Resultado observável |
| Não funciona no mobile | Menu lateral não fecha ao tocar fora no iOS Safari | Reproduzível |

## Anatomia por tipo

Cada tipo tem um **núcleo obrigatório** (sem isso a issue não serve) e extensões opcionais. Corte o opcional que não se aplica.

### Bug

Núcleo: **passos → esperado → obtido → ambiente**. Os quatro juntos; três dos quatro não permitem reproduzir.

```markdown
## Resumo
Uma frase: o que quebra, em que condição.

## Passos para reproduzir
1. A partir de <estado conhecido: usuário novo, banco limpo, branch main>
2. ...
3. ...

## Comportamento esperado
## Comportamento obtido
## Evidência
<log/stack/print — trecho relevante em bloco de código>

## Ambiente
Versão/commit · SO/navegador · ambiente (local/staging/prod)

## Frequência
Sempre | Intermitente (n de m tentativas) | Uma vez

## Impacto
Quem é afetado, com que gravidade, existe contorno?

## Decisões
O comportamento correto quando o esperado admite mais de uma leitura
(status/código de erro, o que acontece com dados já gravados).

## Contexto técnico
Arquivos/símbolos suspeitos, comando que reproduz, PR que introduziu.
```

Extensões úteis: **exemplo mínimo reproduzível** (o menor snippet/repo que falha — vale mais que qualquer descrição), **regressão** (`git log -S`, versão em que funcionava), **hipótese de causa** claramente marcada como hipótese.

### Feature

Núcleo: **quem → que dor → como saber que resolveu**.

```markdown
## Problema
Quem sente, em que situação, qual o custo hoje. Evidência se houver
(ticket de suporte, métrica, pesquisa).

## Resultado esperado
O que passa a ser possível. Opcionalmente como história:
"Como <papel>, quero <ação> para <benefício>."

## Critérios de aceite
- [ ] ...

## Fora de escopo
O que este trabalho explicitamente NÃO cobre.

## Decisões
- Regra de negócio, contrato (rota, resposta, códigos de erro), comportamento
  na borda — uma linha cada, com o porquê quando não é óbvio.

## Alternativas consideradas (opcional)
## Dependências / riscos
## Contexto técnico
Arquivos prováveis (ponto de partida, não roteiro), comandos de validação, links.
```

**Fora de escopo** é a seção mais subestimada: é o que impede o escopo de crescer durante a implementação e o que evita a discussão "achei que isso estava incluído" na review.

**Decisões** é vinculante: quem implementa segue o que está ali sem reabrir a discussão. Por isso só entra o que foi de fato decidido com o usuário ou é imposto pelo código — e por isso não entra o passo a passo arquivo a arquivo, que é plano de implementação e envelhece com o código.

### Task / Chore

Núcleo: **o que muda → por que agora → como validar**.

```markdown
## Objetivo
## Motivação
Por que agora — dívida que trava algo, CVE, deprecação com data, atrito recorrente.

## Escopo
Arquivos/módulos/serviços afetados.

## Critérios de aceite
- [ ] Comportamento externo inalterado (se refactor)
- [ ] <verificação concreta>

## Decisões
O que a mudança preserva e o que pode mudar (contratos, nomes, compatibilidade).

## Risco e reversão
O que pode quebrar, como reverter.

## Contexto técnico
```

### Spike

Núcleo: **pergunta → timebox → entregável**. Spike sem timebox vira projeto paralelo.

```markdown
## Pergunta a responder
Uma pergunta fechada.

## Contexto
Por que a dúvida existe e o que depende dela.

## Timebox
Ex.: 1 dia.

## Entregável
Documento/ADR/protótipo descartável + recomendação.

## Critérios de encerramento
- [ ] Pergunta respondida com evidência
- [ ] Issues de implementação criadas OU recomendação de não seguir

## Fora de escopo
- Implementação em produção
```

### Epic

Só existe para agrupar. Se não tem sub-issues, não é épico — **as fatias são definidas junto com o épico**, não depois. As duas únicas exceções (descrição já completa, ou fatiamento bloqueado por falta de informação) estão na regra 6 do `SKILL.md`.

```markdown
## Objetivo
## Por que agora
## Métrica de sucesso
Como saberemos que valeu a pena (número, prazo).

## Fatias
- [ ] #101 ...
- [ ] #102 ...

## Fora de escopo
## Riscos e dependências
## Decisões abertas
- ❓ A confirmar: <o quê> — bloqueia o início? sim/não
```

A seção **Fatias** é obrigatória e não é uma lista de tarefas: cada linha é uma sub-issue real, com título próprio e escopo próprio. Enquanto os números não existirem, escreva o título da fatia e o escopo em uma linha; troque pelos `#N` depois de publicar e vincular.

## Critérios de aceite

Um critério de aceite é uma **afirmação verificável por terceiro sem conversar com o autor**. Teste: outra pessoa consegue dizer "passou" ou "não passou" só lendo? Se precisa de interpretação, reescreva.

Dois formatos. Escolha por natureza, não por gosto:

**Checklist** — para condições independentes, mudanças técnicas, tarefas de infra.

```markdown
- [ ] Arquivos acima de 5 MB são rejeitados com mensagem "Arquivo excede 5 MB"
- [ ] Arquivos até 5 MB continuam subindo normalmente
- [ ] O limite vem de configuração, não de constante no código
- [ ] Teste automatizado cobre o limite e o valor imediatamente abaixo
```

**Gherkin (Given/When/Then)** — para comportamento com estado e fluxo, onde a pré-condição importa.

```gherkin
Cenário: Upload acima do limite
  Dado um usuário autenticado na tela de upload
  Quando ele seleciona um arquivo de 6 MB
  Então o upload é recusado
  E a mensagem "Arquivo excede 5 MB" é exibida
  E nenhum registro é criado em `uploads`
```

Boas práticas em ambos:
- Cubra o **caminho feliz, o limite e o erro**. Critério que só descreve o caminho feliz deixa metade do trabalho implícito.
- Uma asserção por linha.
- Sem advérbios de qualidade — "rapidamente", "de forma intuitiva", "corretamente". Se for performance, ponha número e percentil (`p95 < 400 ms`).
- Inclua o observável, não a implementação: "retorna 429 com `Retry-After`", não "usa Redis para rate limit".

## Fatiamento e tamanho

**INVEST** como diagnóstico rápido:

| Letra | Pergunta | Sinal de problema |
|---|---|---|
| **I**ndependent | Dá pra fazer sem esperar outra issue? | "Depende de #x, #y e #z" |
| **N**egotiable | Descreve o problema, deixando espaço de solução? | Issue é uma especificação técnica fechada |
| **V**aluable | Alguém percebe o resultado? | Só entrega uma camada (só o schema, só o endpoint sem uso) |
| **E**stimable | Dá pra estimar a ordem de grandeza? | "Depende do que a gente descobrir" → vire spike |
| **S**mall | Cabe em poucos dias de trabalho? | Mais de ~8 critérios de aceite; título com "e" |
| **T**estable | Os critérios são verificáveis? | Critérios subjetivos |

**Fatie na vertical, não na horizontal.** "Criar tabela", "criar API", "criar tela" são três issues que só entregam valor juntas — e nenhuma delas pode ser fechada com confiança sozinha. Prefira cortar por:

- **Regra de negócio**: cadastro sem validação de CPF → depois com validação
- **Fluxo**: caminho feliz → depois tratamento de erro → depois casos de borda
- **Interface**: um formato de entrada → depois os outros
- **Volume/escala**: funciona para 1 → depois para lote
- **Público**: um perfil de usuário → depois os demais

Cada fatia deve poder ser mergeada e liberada sem esperar as irmãs (flag de funcionalidade resolve quando a fatia não faz sentido sozinha para o usuário final).

## Épicos e sub-issues

Sub-issues nativas do GitHub (`gh api ... /sub_issues`) são superiores a checklist de links: o progresso é calculado automaticamente e a hierarquia aparece nos projetos. Ver `gh-cli.md`.

Ordem de trabalho ao criar um épico — as fatias saem no mesmo esforço, não em uma rodada futura:

1. Fatie o épico (critérios abaixo) e liste as fatias na seção **Fatias** do corpo.
2. Escreva cada fatia como issue inteira, com critérios de aceite e decisões próprios (com `--review`, um rascunho por fatia em `.pending-issues/`, com `pai:` apontando o épico).
3. Publique o épico, depois as filhas, vincule com `/sub_issues` e troque os placeholders pelos `#N`.

Quando quebrar:
- mais de ~8 critérios de aceite
- mais de uma pessoa vai trabalhar em paralelo
- partes com prioridades diferentes
- parte pode ser liberada antes das outras

Quando **não** quebrar: trabalho de 2 horas que virou 4 sub-issues de 30 minutos. Overhead de coordenação passa a custar mais que o trabalho.

Dependências reais (bloqueia/bloqueado por) devem virar relação explícita, não um parágrafo no corpo — assim aparecem na triagem.

## Metadados

| Campo | Uso |
|---|---|
| **Issue type** | Se a org tem issue types configurados, prefira-os a labels de categoria (`bug`, `enhancement`). É o eixo canônico do GitHub e evita duplicidade de sinal. |
| **Labels** | Área (`area:auth`), prioridade (`P1`), estado de triagem (`needs-info`, `needs-repro`), convites (`good first issue`, `help wanted`). Siga o padrão que os itens do projeto já praticam. Use só labels existentes no repo — ou, se o padrão pede uma que só outro repo do projeto tem, copie-a de lá (regra 8 do `SKILL.md`). Não invente label nova. |
| **Milestone** | Só se o repo usa ativamente. |
| **Assignee** | Só quando há acordo. Atribuir sem combinar cria falso senso de compromisso. |
| **Projeto** | Repo em um só projeto: adicionar é parte de "criar a issue", sempre. Em vários, pergunte qual (regra 8 do `SKILL.md`). |

## Definition of Ready

Antes de mover uma issue para "pronta para pegar", verifique:

- [ ] Título faz sentido isolado numa lista
- [ ] O problema está descrito, com evidência ou justificativa
- [ ] Critérios de aceite verificáveis por terceiro
- [ ] Escopo delimitado, com o que está fora
- [ ] Cabe em uma iteração (ou está fatiada)
- [ ] Dependências e bloqueios explícitos
- [ ] Metadados corretos: tipo, labels do repo, relações
- [ ] Decisões fechadas: quem pega não precisa perguntar nada ao autor para planejar
- [ ] Sem `❓ A confirmar` que bloqueie o início

**Extensão para execução por agente** (Claude Code e afins). Se a issue vai ser executada por um agente, ela precisa também de:

- [ ] Caminhos de arquivo ou pistas de onde mexer
- [ ] Comando que reproduz o problema ou valida o resultado
- [ ] Como rodar os testes e o lint do projeto
- [ ] Restrições explícitas: o que **não** tocar, padrões a seguir, compatibilidade a preservar

Sem isso o agente gasta metade do orçamento redescobrindo o repositório — e frequentemente escolhe a camada errada para a mudança.
