# ADR-003 — Stack móvel: React Native com TypeScript; demo em Android

- **Status:** Aceito
- **Data:** 06/10/2026
- **Autores:** Dupla
- **Atributos:** A04, A05, A06 (críticos); prazo, custo zero, curva de aprendizado e demonstrabilidade local (critérios da 2.3)
- **Rastreio:** RNF05, RNF06, US05, US12
- **ADRs relacionados:** ADR-001, ADR-002, ADR-004, ADR-005, ADR-014

## Contexto

O ADR-001 exige banco local cifrado, fila de sincronização e checagem de
alérgenos no cliente. A dupla tem experiência com React e TypeScript, o prazo
é de 45 dias e não há Mac disponível. A entrega acadêmica é uma demonstração
local. O iOS, quando existir, é parte do alvo.

## Decisão

1. **Cliente:** React Native com TypeScript, usando Expo com *development
   build* (não Expo Go). Organização por feature (diretriz da 2.2).
2. **Plataforma da demo:** Android, no emulador (`expo run:android`), com o
   emulador configurado como o dispositivo de referência (4 GB de RAM). O
   app acessa a API do host por `10.0.2.2`.
3. **iOS** fica só na arquitetura-alvo, sem build nem teste na demo.
4. **Build:** local. O plano gratuito do EAS (15 builds Android e 15 iOS por
   mês) é dispensável na demo.
5. **Regra de alérgenos** compartilhada com o servidor (ADR-014); **banco
   local cifrado** definido no ADR-005.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Flutter com Drift (P3) | Mesma pontuação em A04, A05 e A08, mas perde em prazo (2 contra 4) e em curva (2 contra 5): Dart é novo para a dupla. A regra de alérgenos seria duplicada (Dart e TypeScript), com nota menor em A06. Total 111 contra 126. |
| React Native com Expo Go | Não é possível: o SQLCipher não roda no Expo Go, e a criptografia local é requisito. |
| Supabase como backend (P2) | Não substitui o cliente: o SDK não resolve o banco local nem a fila. Fica como plano B de backend (ADR-004). |

## Consequências

**Positivas**
- Reaproveita a stack conhecida, com a menor curva entre as opções.
- Mesmo idioma no cliente e no servidor viabiliza o pacote de alérgenos
  (ADR-014).
- A demo é reproduzível com o emulador e o Compose.

**Negativas**
- **Configuração nativa do SQLCipher** é risco de prazo e não existe no
  Expo Go. Cada mudança de módulo nativo exige novo *development build*.
- **A medida de desempenho é feita em emulador**, não em aparelho real. A
  abertura em 2 s (A04, H) pode não refletir um Android de 4 GB real.
- **iOS não é testado.** Se o iOS entrar no alvo, o custo é de US$ 99 por
  ano e a compatibilidade do SQLCipher e das bibliotecas no iOS é
  desconhecida.
- **Tráfego HTTP local na demo** pode exigir configuração específica do
  Android para texto claro (a verificar). A limitação de TLS já está
  declarada (ADR-006).
- As fotos baixam junto com as planejadas (decisão de 06/10/2026), o que
  pesa no armazenamento do emulador (ADR-012).

## Riscos relacionados

R4, R7.

## Verificações pendentes (H)

- Abertura offline em até 2 s com SQLCipher no emulador de referência.
- Configuração de rede para HTTP local no emulador.
- Compatibilidade do workspace com o bundler (ADR-014).

## Quando revisitar

| Gatilho | Ação |
|---|---|
| Protótipo de sincronização acima de 10 dias corridos | Reavaliar P2 (ADR-001). |
| Abertura offline acima de 2 s no emulador de referência | Trocar a biblioteca de SQLCipher ou reduzir o escopo local. |
| A dupla ganhar um Mac e quiser iOS | Registrar US$ 99 por ano (ADR-013) e validar as bibliotecas. |
| A dupla decidir implantar de verdade | Testar em aparelho real e medir as hipóteses do alvo. |