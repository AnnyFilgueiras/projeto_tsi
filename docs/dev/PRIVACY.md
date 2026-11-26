# Privacidade (LGPD) e Segurança Alimentar — Checklist Operacional

> **Leia quando:** tocar em restrições alimentares, perfil, autenticação, exclusão de conta, logs técnicos, filtro de sugestões, pacote `allergen-rules`, importação por IA ou deploy em nuvem (Supabase/PaaS).
> **Fontes canônicas:** [`ADR-005`](../fase2/02-adr/adr-005-armazenamento-local-e-fila.md), [`ADR-006`](../fase2/02-adr/adr-006-criptografia-restricao-alimentar.md), [`ADR-007`](../fase2/02-adr/adr-007-autenticacao.md), [`ADR-011`](../fase2/02-adr/adr-011-agente-ia-importacao.md) e [`ADR-014`](../fase2/02-adr/adr-014-regra-alergenos-compartilhada.md).

---

## 1. Dados Sensíveis — Restrição Alimentar (`A05`, LGPD)

1. **Cifra em repouso no servidor (`ADR-006`):**
   - Toda restrição alimentar é cifrada na camada de aplicação pelo `FieldCipher` (**AES-256-GCM**, IV único por gravação, `accountId` como AAD, texto claro completado com `0x00` em blocos de 32 bytes para não revelar o tamanho da restrição) **antes** de qualquer `INSERT`/`UPDATE` no PostgreSQL.
   - A chave de criptografia vem de `KeyProvider` (fora do banco de dados) e suporta rotação via `keyVersion`.
   - Somente `modules/profile` pode importar `support/field-encryption` (`S5`); somente `cross-cutting/suggestion-search` pode importar `profile/public/restrictions-for-filter` (`S3`).
2. **Cifra em repouso no aparelho (`ADR-005`):**
   - Banco local protegido com **SQLCipher**, chave guardada em `expo-secure-store` (fora do backup automático do Android).
3. **Consentimento e exclusão completa (`RN09`, `RNF06`, `UC08-FA3`):**
   - Gravar restrição exige registro de `consentAt`.
   - Revogar restrição **apaga a linha** (não faz soft-delete com flag).
   - `DELETE /v1/account` remove conta, sessões, perfil, restrições, rotina e progresso de forma definitiva.
4. **Uso estrito do Supabase na Cloud Gratuita (Opção 4C):**
   - Supabase é usado **exclusivamente** como PostgreSQL gerenciado e Object Storage (atrás da API Fastify).
   - **Proibido** conectar o app mobile direto ao Supabase via SDK BaaS. As colunas sensíveis jamais chegam em texto claro ao Postgres.

---

## 2. Zero Vazamento em Logs e Provedor de IA (`A13`, `RNF06`)

- **Logs técnicos (`support/technical-log`):** nunca registre payload de restrição alimentar, lista de alergias do usuário, tokens JWT/refresh ou chaves de cifra — nem em mensagens de erro nem em stack traces de validação.
- **Provedor de IA (`modules/importer`, `ADR-011`):** o `ImportAgent` / `KimiProvider` recebe **apenas** texto público de receita em curadoria. Jamais envie `accountId`, perfil, despensa ou restrições de qualquer usuário ao provedor externo.

---

## 3. Segurança Alimentar — Alérgenos (`A06`, `RN08`, `RN10`, `RN16`, `RN22`)

1. **Fonte única de verdade (`packages/allergen-rules`):**
   - App e API executam exatamente a mesma lógica pura (`classifyRecipe`, `filterCandidates`, `isSubstituteAllowed`) validada por 100% dos vetores JSON compartilhados (`0` violações aceitas).
2. **Vocabulário fechado (19 códigos em português):**
   - 18 alérgenos da **ANVISA RDC nº 727/2022 (Anexo III)** + `lactose`. Nunca aceite string livre fora desse enum.
3. **Política *fail-closed*:**
   - Receita com `allergenState !== 'verified'` ou ingrediente sem `confirmedAllergenFree` nunca pode ser classificada como segura para quem declarou restrição.
   - Substituição de ingrediente (`isSubstituteAllowed`) só é sugerida quando os `substituteAllergens` também são compatíveis com as restrições do usuário.
   - Toda alteração na regra de alérgenos exige versão atualizada em `PACKAGE_VERSION` (`X-Allergen-Package-Version`).
