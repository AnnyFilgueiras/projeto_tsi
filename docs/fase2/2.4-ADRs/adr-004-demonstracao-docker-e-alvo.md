# ADR-004 — Demonstração em Docker Compose, arquitetura-alvo e plano B

- **Status:** Aceito com condições (ver "Verificações pendentes")
- **Data:** 06/10/2026
- **Autores:** Dupla
- **Atributos:** A01, A11, A13, A05; prazo, custo zero e demonstrabilidade local
- **Rastreio:** RNF03, RNF06; briefing da Fase 2 (seção 2)
- **ADRs relacionados:** ADR-001, ADR-002, ADR-006, ADR-012, ADR-013

## Contexto

A entrega acadêmica é uma demonstração local; a implantação real é
opcional. A 2.3 separou duas camadas: o ambiente de demonstração, que roda de
verdade, e a arquitetura-alvo, só documentada. O custo é gratuito, com
pagamento único baixo aceitável. A dupla não tem Mac. A hospedagem do alvo e
o banco foram deixados para este ADR.

## Decisão

### Demonstração (executa de verdade)

1. **Docker Compose** com dois serviços: **API** (Fastify, com o módulo de
   importação e o agente de IA, ADR-002 e ADR-010) e **PostgreSQL**.
2. O app roda no **emulador Android** e acessa a API do host por `10.0.2.2`.
3. **Seed** de cerca de 20 pratos, produzido pelo fluxo manual ou assistido.
4. **Segredos** (chave AES do ADR-006, chave da API do provedor de IA)
   ficam em arquivo de ambiente fora do repositório.
5. **Fotos** servidas pela própria API (detalhes no ADR-012).
6. **Medições da demo:** A04, A08, A06 e A05 (inspeção do banco local e do
   Postgres) e A09 (importação). A01 mede só a lógica da sugestão, não rede
   nem provedor; A11 não é medido.

### Arquitetura-alvo (apenas documentada)

7. **Hospedagem da API:** Google **Cloud Run**, região de São Paulo
   (`southamerica-east1`), com a **mesma imagem de contêiner** da demo.
8. **Banco:** **Neon** (PostgreSQL), região de São Paulo (`aws-sa-east-1`).
9. **Chave AES:** Secret Manager, entregue ao Cloud Run (ADR-006).
10. **Faturamento:** conta com cartão; alerta de orçamento configurado (R6).
11. **Azure** (App Service e PostgreSQL com crédito de estudante) fica como
    alternativa registrada, sem depender de crédito temporário.
12. **Plano B de backend:** Supabase (P2), ativado só se o protótipo de
    sincronização ultrapassar 10 dias (ADR-001).
13. **Publicação:** Google Play (US$ 25 únicos); iOS só no alvo (ADR-013).

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Azure como alvo principal | Atrativo por não exigir cartão para maiores de 18 anos, mas depende de crédito temporário e de verificação de estudante. Fica como alternativa. |
| Supabase (P2) | Dado sensível sob terceiro (A05) e pausa após 7 dias sem uso no plano gratuito. Plano B. |
| Render | Descartado na 2.3: o serviço gratuito religa em cerca de 1 minuto e o Postgres gratuito expira em 30 dias. |
| Demo sem contêineres (Node e Postgres instalados) | Menos reproduzível para a banca e para a dupla; o Compose garante o mesmo ambiente e reaproveita a imagem do alvo. |
| Implantar de verdade já no MVP | Excede o escopo e traz cartão, cold start e cotas. Mantido como opção (ver gatilhos). |

## Consequências

**Positivas**
- A demo roda sem conta, cartão ou internet (exceto para a API de IA).
- A mesma imagem serve à demo e ao alvo, o que reduz surpresa no deploy.
- Cloud Run e Neon, ambos em São Paulo, mantêm a latência entre si baixa.
  Isso é benefício de desempenho, não exigência legal, e não é parecer
  jurídico.

**Negativas**
- **A01 e A11 ficam como hipótese:** cold start, cotas e latência de rede não
  são medidos na demo (R5).
- **Conta de faturamento com cartão no alvo** (R6). O alerta de orçamento
  avisa, mas a documentação consultada não confirma um limite rígido de
  gasto.
- **A franquia do Cloud Run e o plano do Neon podem mudar,** e fontes
  secundárias divergem sobre a cota; a confirmação fica para o console.
- **HTTP local na demo** (limitação de TLS declarada no ADR-006).
- **A demo no emulador** não representa um aparelho real (ADR-003).
- Dois ambientes para documentar e manter coerentes: o risco de a
  arquitetura-alvo descrever algo que nunca foi executado.
- A API de IA exige internet na demo do fluxo assistido; o plano B é uma
  execução gravada ou o fluxo manual (ADR-011).

## Riscos relacionados

R5, R6, R7.

## Verificações pendentes (H)

- Cota gratuita do Cloud Run em `southamerica-east1`, no console de
  faturamento.
- Cold start do Cloud Run e comportamento de suspensão do plano gratuito do
  Neon (não verificados).
- Tempo limite de requisição do Cloud Run para uma chamada de importação.
- Criptografia e backup do Azure só se for escolhido como alvo.
- Compose sobe API e banco do zero com um único comando e o seed.

## Quando revisitar

| Gatilho | Ação |
|---|---|
| A dupla decidir implantar de verdade | Medir A01 e A11 no provedor; confirmar cota, cold start e alerta de orçamento. |
| Protótipo de sincronização acima de 10 dias | Ativar o plano B (Supabase) e marcar este ADR como "Substituído por ADR-NNN". |
| Cota ou preço do Cloud Run ou do Neon mudarem | Reavaliar o alvo; considerar o Azure. |
| Importação exceder o tempo limite de requisição | Mover a importação para tarefa assíncrona. |
| Dupla ganhar um Mac e quiser iOS | Registrar US$ 99 por ano (ADR-013). |