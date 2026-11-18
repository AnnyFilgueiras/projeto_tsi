# ADR-007 — Autenticação: conta anônima, e-mail e senha opcionais

- **Status:** Aceito com condições (ver "Verificações pendentes")
- **Data:** 06/10/2026
- **Autores:** Dupla
- **Atributos:** A02, A05 (alto/crítico); A13, A11
- **Rastreio:** RNF02, RNF06, US09, UC12
- **ADRs relacionados:** ADR-002, ADR-006, ADR-008, ADR-010

## Contexto

O usuário deve chegar à primeira sugestão sem cadastro extenso, com no
máximo 3 campos obrigatórios (A02, RNF02). Ao mesmo tempo, o servidor guarda
dados de usuário, inclusive a restrição alimentar cifrada (ADR-006), e
precisa saber de quem são. Existe também o papel de curador (UC12), que
importa e aprova receitas (ADR-010). O servidor é Fastify (ADR-002), e a
regra do ADR-008 é "uma conta, um aparelho ativo".

## Decisão

1. **Conta anônima:** no primeiro uso, o app pede ao servidor uma conta sem
   dados pessoais. O servidor devolve um identificador de usuário e os
   tokens. O usuário não preenche nada.
2. **E-mail e senha opcionais:** vinculam-se à conta anônima já existente,
   preservando o progresso, e permitem entrar de novo em outro aparelho.
3. **Tokens:**
   - *Acesso:* JWT assinado pelo servidor (`@fastify/jwt`), de vida curta
     (valor a definir na 2.6, hipótese de 15 minutos).
   - *Refresh:* valor opaco e aleatório, guardado **com hash** no banco,
     rotativo e revogável, com vida longa (hipótese: semanas). No app, fica
     em `expo-secure-store`.
   - O JWT carrega só identificador do usuário e papel (usuário ou
     curador). **Nunca** carrega e-mail, restrição ou qualquer dado sensível.
4. **Senha:** hash com **Argon2id**, em configuração igual ou acima do
   mínimo recomendado pelo OWASP (19 MiB, 2 iterações, paralelismo 1). A
   biblioteca é escolhida na implementação.
5. **Um aparelho ativo (ADR-008):** um novo login em outro aparelho revoga
   as sessões anteriores da conta.
6. **Papel de curador:** contas de curador são criadas pela dupla (seed ou
   comando), nunca por cadastro aberto. As rotas de curadoria exigem o papel.
7. **Proteção contra abuso:** limite de tentativas no login e na criação de
   contas anônimas (detalhe na 2.6).
8. **Recuperação de senha:** **fora do MVP** . Sem envio de e-mail
   transacional, não há "esqueci minha senha".
9. **Exclusão de conta:** a conta e seus dados podem ser eliminados a pedido
   do usuário. Se a Fase 1 não tiver US ou RNF para isso, entra na issue de
   retroalimentação.
10. **Contas anônimas abandonadas** seguem uma política de retenção a definir
    na 2.6 (minimização de dados).

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Cadastro obrigatório com e-mail e senha | Fere RNF02 e A02: mais campos antes da primeira sugestão. |
| Sessão opaca em banco, sem JWT | Revogação mais simples, mas toda requisição consulta o banco. É uma opção válida; o JWT curto foi preferido por manter o servidor sem estado na maior parte das chamadas. |
| Supabase Auth (plano B, P2) | Substitui o backend próprio; só se o plano B for ativado. |
| Provedor de identidade gerenciado (não avaliado na 2.3) | Colocaria dado de usuário sob terceiro (A05) e adicionaria dependência e custo a verificar. |
| Só conta anônima, sem e-mail | Mais simples, mas o usuário perde tudo ao trocar de aparelho. |

## Consequências

**Positivas**
- A02 atendido: o usuário chega à primeira sugestão sem cadastro.
- A restrição alimentar fica vinculada a um identificador, não a e-mail.
- O mecanismo é pequeno e fica no monólito (ADR-002).

**Negativas**
- **Perda de conta:** quem não vincula e-mail e perde ou troca o aparelho
  perde acesso à conta. O dado de restrição fica no servidor, mas sem
  caminho para o usuário.
- **Sem recuperação de senha:** quem esquecer a senha também perde a conta.
- **Um aparelho:** o novo login derruba o antigo, e operações pendentes no
  aparelho antigo se perdem (ADR-008).
- **JWT de acesso não pode ser revogado** antes de expirar [66]; a vida
  curta reduz a janela, mas não elimina.
- **A dupla assume a segurança das senhas:** hash, limites de tentativa,
  rotação de tokens e correção de falhas.
- **Contas anônimas acumulam** e abrem espaço para criação em massa.
- Na demo local, os tokens trafegam em HTTP (limitação declarada, ADR-006).

## Riscos relacionados

R4, R6.

## Verificações pendentes (H)

- Vida do token de acesso e do refresh token.
- Custo do Argon2id no servidor da demo e no alvo (tempo por login).
- Teste de rotação: reuso de um refresh token antigo é rejeitado e revoga a
  sessão.
- A02: primeira sugestão em até 2 min, em teste com 5 pessoas.
- Existência de US ou RNF de exclusão de conta na Fase 1.

## Quando revisitar

| Gatilho | Ação |
|---|---|
| Recuperação de senha ou login social virarem requisito | Avaliar e-mail transacional ou provedor de identidade. |
| Uso em vários aparelhos virar requisito | Reabrir a regra de sessões e o ADR-008. |
| Ativação do plano B (Supabase) | Marcar como "Substituído por ADR-NNN". |
| Incidente de abuso nas contas anônimas | Endurecer limites ou exigir prova de uso do app. |
| Implantação real | Revisar vida de tokens, rotação de chaves de assinatura e retenção de contas. |

## Detalhamento
- **Valores:** JWT de acesso de **45 minutos** (carrega só `contaId` e papel). Refresh de 30 dias, opaco, de uso único, rotativo, com hash.
- **Tolerância (R17):** reenvio do mesmo refresh dentro de 60 s do primeiro uso devolve o mesmo par (campos `usadoEm` e `sucessorId`). Reuso fora da janela revoga a família (`familiaId`).
- **Conta e perfil:** `Usuario` e `Conta` são tabelas separadas com a mesma chave primária; a criação ocorre em uma transação.
- **Retenção:** conta anônima sem sincronização por 12 meses é excluída com seus dados. Quem vinculou e-mail não é excluído por inatividade.
- **Limites:** 5 tentativas de login por 15 minutos por conta e IP; criação de contas anônimas limitada por IP.
- **Curador:** a conta de curador precisa ter e-mail e senha, porque o login é por `POST /v1/sessoes/entrar`. O seed ou comando define as duas coisas.