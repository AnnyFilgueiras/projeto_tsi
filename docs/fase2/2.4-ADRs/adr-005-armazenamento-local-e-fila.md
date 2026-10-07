# ADR-005 — Armazenamento local cifrado e fila de sincronização

- **Status:** Aceito com condições (ver "Verificações pendentes")
- **Data:** 06/10/2026
- **Autores:** Dupla
- **Atributos:** A04, A05, A08 (críticos); A06
- **Rastreio:** RNF05, RNF06, RN01, RN04, US05, US12, US14; LGPD art. 46 e §2º
- **ADRs relacionados:** ADR-001, ADR-003, ADR-006, ADR-008, ADR-012

## Contexto

O ADR-001 exige banco local com o conjunto baixado e uma fila de operações
que sobrevive ao fechamento do app. A restrição alimentar é dado sensível e
fica replicada no dispositivo, então o banco local e a fila devem estar
ilegíveis sem a chave (A05). A abertura offline deve levar até 2 s (A04, H).
O app roda em *development build*, nunca no Expo Go.

## Decisão

1. **Banco local:** SQLite com SQLCipher, via `expo-sqlite` com a opção
   `useSQLCipher` no config plugin.
2. **Chave:** 256 bits, gerada aleatoriamente no primeiro uso e guardada com
   `expo-secure-store` (Android: `SharedPreferences` cifrado por chave do
   Keystore). A chave nunca é gravada em log, constante ou arquivo de código.
3. **Abertura:** a chave é definida imediatamente após abrir o banco, antes
   de qualquer leitura ou migração. Um banco criado antes de habilitar o
   SQLCipher não é cifrado e deve ser recriado.
4. **Fila de sincronização na mesma base cifrada.** A avaliação e a
   operação da fila são gravadas na **mesma transação**, o que evita avaliação
   salva sem operação pendente (A08). Campos mínimos, provisórios:
   identificador estável gerado no cliente, tipo, carga, data de criação,
   número de tentativas e estado. O mecanismo de idempotência fica para a 2.6.
5. **Fotos** ficam como arquivos no armazenamento do app, **fora do banco
   cifrado**, com o caminho no banco. Não são dado sensível; blobs no
   SQLCipher pesariam na abertura (A04, hipótese). Formato e origem: ADR-012.
6. **Migrações do banco local** são versionadas; o detalhe fica para a 2.6.
7. O banco local e a fila ficam fora do backup automático do Android
   (ADR-006).

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| `op-sqlite` com SQLCipher | Também cifra o banco e exige *development build*. Rejeitado por configuração a mais: o `package.json` da raiz do monorepo, e a dupla já terá o workspace do ADR-014. Continua como plano B de biblioteca. A promessa de desempenho vem da própria documentação e não foi medida. |
| SQLite sem cifra, com AES por campo na aplicação | Mais simples de configurar, mas deixa estrutura e metadados legíveis e exige código de cifra em cada acesso. O critério de A05 é o banco ilegível sem a chave. |
| `AsyncStorage` ou chave-valor | Não é relacional, não tem transação entre avaliação e fila, e não é cifrado por padrão. |
| Fila separada do banco (arquivo próprio) | Perde a transação conjunta e cria um segundo armazenamento a cifrar e a apagar na revogação. |

## Consequências

**Positivas**
- Um único armazenamento cifrado, com transação entre dado e fila.
- A revogação pode apagar banco, fila e chave de uma vez.
- Usa a biblioteca do próprio ecossistema Expo, com configuração documentada.

**Negativas**
- **Banco sem cifra por engano:** a cifra só vale se a chave for definida
  logo após a abertura. Um banco criado antes da cifra fica em texto claro.
  Exige um teste automatizado que inspecione o arquivo.
- **Dependência de módulo nativo:** `useSQLCipher` exige `prebuild` e novo
  build a cada mudança. Fora do Expo Go.
- **Perda da chave = perda do banco:** se a chave for apagada ou o aparelho
  for restaurado de backup sem ela, o banco fica ilegível e as operações
  ainda não sincronizadas se perdem. Mitigar mantendo o banco fora do backup
  e sincronizando assim que houver rede.
- **Chave protegida por camada do `expo-secure-store`**, e não gravada
  diretamente no Keystore; em aparelho com root, o nível de proteção depende
  do dispositivo.
- **Biblioteca criptográfica nativa:** uma discussão pública do projeto Expo
  indica que o `expo-sqlite` usa `libcrypto.so` do OpenSSL 1.1.1q-beta
  para o SQLCipher [41]. Isso é de fonte secundária e deve ser conferido
  na versão em uso.
- **Sobrecarga de abertura** do SQLCipher sobre a meta de 2 s não medida (H).
- Fotos fora do banco cifrado dependem do ADR-012 para tamanho e política de
  limpeza.

## Riscos relacionados

R2, R4.

## Verificações pendentes (H)

- Abertura offline em até 2 s, em 30 aberturas, com o seed baixado.
- Teste automatizado: o arquivo do banco e da fila não contém texto claro
  de restrição.
- Versão da biblioteca criptográfica nativa usada pelo `expo-sqlite` na
  versão do projeto.
- Comportamento de restauração: banco fora do backup e sem a chave.

## Quando revisitar

| Gatilho | Ação |
|---|---|
| Abertura offline acima de 2 s | Trocar para `op-sqlite` com SQLCipher ou reduzir o que fica no dispositivo. Abrir mão da cifra não é opção. |
| Falha de configuração do SQLCipher no build | Idem. |
| Falha do protótipo de sincronização (ADR-001) | Reavaliar o escopo da fila. |
| Fotos ou conjunto baixado pesam no armazenamento | Rever a estratégia de pacotes (ADR-001, ADR-012). |
| Ativação do plano B (Supabase) | O banco local e a fila continuam; revisar só o que depender do servidor. |

## Detalhamento
- **Operação da fila:** `opId` (UUID v7), `tipo`, `carga`, `criadaEm`, `tentativas`, `proximaTentativaEm`, `estado` (`pendente`, `confirmada`, `falha`). Tipos: `avaliacao.registrar`, `item.reagendar`, `item.remover`, `lista.definir_data_compra`, `lista.marcar_item`, `restricao.cadastrar`, `restricao.revogar`, `lembretes.definir`.
- **Limites:** no máximo 500 operações pendentes e 90 dias de idade (hipóteses a medir).
- **Falha permanente:** só rejeição de validação. Erro de rede e 5xx nunca mudam o estado. A operação com falha só pode ser descartada (sem reenvio na v1).
- **Estado "em preparo":** marca local no aparelho, fora da fila.