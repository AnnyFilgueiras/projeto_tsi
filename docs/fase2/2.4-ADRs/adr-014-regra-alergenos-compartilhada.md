# ADR-014 — Regra de alérgenos em pacote TypeScript compartilhado

- **Status:** Aceito
- **Data:** 06/10/2026
- **Autores:** Dupla
- **Atributos:** A06 (crítico); A05, A13 (apoio); A12
- **Rastreio:** US01, US09, US10, RF07, RN08, RN10, RN16, RN22
- **ADRs relacionados:** ADR-001, ADR-002, ADR-003, ADR-006, ADR-011

## Contexto

Para o usuário com restrição, o sistema nunca deve sugerir receita com
alérgeno associado nem receita com estado "não verificado" (A06). A regra
precisa rodar em dois lugares: no servidor, para sugestão e busca, e no
cliente, para abrir receita já baixada sem rede (ADR-001). O estado dos
alérgenos tem três valores (verificado, declarado pela fonte, não
verificado), e lista vazia significa "não verificado", nunca "sem
alérgenos". A RN22 estende a regra aos substitutos: um substituto sem
alérgenos declarados fica "não verificado" e não é sugerido a quem tem
restrição.

Cliente e servidor são TypeScript (ADR-002 e ADR-003), o que permite um
único código para a regra.

## Decisão

1. A regra de alérgenos é implementada **uma única vez**, em um pacote
   TypeScript compartilhado pelo cliente e pelo servidor (workspace do
   repositório).
2. O pacote contém **funções puras**, sem acesso a banco, rede, disco ou
   log. Entrada: restrições do usuário e dados da receita (alérgenos por
   ingrediente, estado, substitutos). Saída: compatível, incompatível ou
   não confirmada, com o motivo. A assinatura exata é definida na 2.6.
3. Operações previstas: classificar receita, filtrar sugestões e busca, e
   decidir se um substituto é permitido (RN22).
4. Os **casos de teste ficam em um arquivo de dados** (tabela de vetores)
   com receitas e substitutos nos três estados, executado pela mesma suíte
   nos dois ambientes de execução. Esse arquivo é o contrato da regra.
5. O pacote tem versão, e o cliente e o servidor expõem a versão em uso.
   O uso dessa informação na sincronização é decidido na 2.6.
6. Nenhuma função do pacote registra a restrição em log (A13 × A05).
7. **Invariantes verificáveis do catálogo.** Um comando de auditoria e a
   própria publicação checam, sem consultar dado de usuário:
   - receita publicada sempre com estado de alérgenos (A09);
   - estado "verificado" nunca com lista de alérgenos vazia (RN08);
   - alérgenos da receita consistentes com a união dos alérgenos dos
     ingredientes, quando a receita não os declara de outra forma;
   - substituto sem alérgenos declarados nunca marcado como "verificado"
     (RN22).
   Violações são registradas com identificador da receita ou do
   substituto, e bloqueiam a publicação.
8. **Registro da regra em uso.** Servidor e cliente registram a versão do
   pacote, e o servidor registra contagens agregadas por resultado
   (compatível, incompatível, não confirmada), sem ligar o resultado a
   usuário nem a restrição. Isso permite notar mudanças bruscas, como um
   aumento de "não confirmada" depois de uma importação.
9. **Proibição:** nenhum log, métrica ou erro do pacote contém restrição,
   alérgeno do perfil ou identificador de usuário junto de resultado
   (A13 × A05).

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Duas implementações (cliente e servidor), com vetores de teste comuns | É o que P2 e P3 exigiriam. A regra duplicada pode divergir, e a A06 perde um ponto na matriz [20]. Fica como saída de emergência (ver "Quando revisitar"). |
| Só no servidor | Receita baixada abriria offline sem checagem, o que viola a A06 em ambiente offline. É o ponto fraco do E1. |
| Servidor calcula a compatibilidade e a envia junto com a receita baixada | Funciona até o usuário mudar a restrição offline: o dado fica velho e sem revalidação. Reabre o risco R2. |
| Regras como dados (tabela interpretada) | Excesso para um conjunto de regras pequeno; acrescenta uma camada de interpretação sem ganho no prazo. |

## Consequências

**Positivas**
- Uma única fonte de verdade da regra mais crítica do sistema (A06).
- A suíte única reduz esforço de teste e de manutenção.
- O arquivo de vetores é reaproveitável se for necessário passar a duas
  implementações.
- Dado de catálogo inconsistente é detectado antes de chegar ao usuário.
- Divergência de versão da regra entre cliente e servidor fica visível.

**Negativas**
- **Falha correlacionada:** um defeito na regra afeta cliente e servidor ao
  mesmo tempo. A mitigação é uma suíte baseada em vetores escritos
  independentemente do código, com os três estados e a RN22.
- **Clientes desatualizados offline** continuam usando a versão antiga da
  regra até atualizarem o app. A versão do pacote e o aviso na sincronização
  mitigam, mas não eliminam.
- **Configuração do workspace** com o bundler do app é risco de prazo, a
  validar cedo (H).
- Acoplamento de cliente e servidor ao mesmo ciclo de versão do pacote.
- Compartilhar código não elimina o risco de dado errado: se o estado dos
  alérgenos da receita estiver incorreto, a regra obedece ao dado errado
  (R8).
- A observabilidade não detecta um erro de classificação em um caso
  individual, porque a restrição não pode ser registrada. Um alérgeno
  errado no catálogo que respeite as invariantes passa despercebido.
- Contagens agregadas só ajudam em mudanças de padrão, não em erros únicos.
- O comando de auditoria é mais um item de trabalho no prazo.

## Riscos relacionados

R2, R8.

## Verificações pendentes (H)

- 0 violações em 100% dos vetores com os três estados (A06).
- O pacote roda no Node e no motor JavaScript do app, sem dependências de
  plataforma.
- O workspace funciona com o bundler do app em um *development build*.

## Quando revisitar

| Gatilho | Ação |
|---|---|
| O workspace compartilhado atrasa o prazo ou não funciona com o app | Passar a duas implementações com os mesmos vetores (reabre este ADR). |
| Ativação do plano B (Supabase) | A regra passa a rodar em função de borda ou SQL e no cliente; usar os vetores como contrato. Marcar como "Substituído por ADR-NNN". |
| Diabetes ou outras condições entrarem no escopo (R1) | Estender o pacote e os vetores. |
| Incidente de divergência entre cliente e servidor | Tornar a versão mínima do pacote obrigatória na sincronização. |

## Detalhamento

- **Vocabulário v1 (19 códigos):** os 18 itens da lista da ANVISA (RDC 26/2015, consolidada pela RDC 727/2022; conferir a lista vigente) mais `lactose`. O item de cereais agrupa trigo, centeio, cevada e aveia.
- **Assinaturas:** `classificarReceita(receita, restricoes)`, `filtrarCandidatas(receitas, restricoes)`, `substitutoPermitido(substituto, restricoes)`, constante `VERSAO_PACOTE`. A função `verificarInvariantes(receita, ingredientes)` fica em ponto de entrada separado, usado só pelo servidor.
- **Sem restrição cadastrada:** `compativel`, com o estado dos alérgenos visível (RN16).
- **Invariantes novas:** (a) ingrediente com `leite` e sem `lactose` só com `semLactose = true`; (b) `verificado` com lista de alérgenos vazia só com `confirmadoSemAlergenos`, afirmado pelo curador.
- **Versão:** o app envia `X-Pacote-Alergenos-Versao` e a API responde `pacoteVersaoMinima`. O app avisa e não bloqueia (a avaliação offline não pode ser impedida).