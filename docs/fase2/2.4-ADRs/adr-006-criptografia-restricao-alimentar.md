# ADR-006 — Criptografia da restrição alimentar (dispositivo, servidor, backups)

- **Status:** Aceito com condições (ver "Verificações pendentes")
- **Data:** 06/10/2026
- **Autores:** Dupla
- **Atributos:** A05 (crítico); A04, A06, A13
- **Rastreio:** US09, RNF06, RN09; LGPD art. 46 e §2º
- **ADRs relacionados:** ADR-001, ADR-002, ADR-005, ADR-007, ADR-013

## Contexto

A restrição alimentar é tratada como dado sensível (A05). A criptografia é
requisito, e não risco aceito: o estilo exige proteção em trânsito, em
repouso no dispositivo (banco local, fila e backups) e no servidor (inclui
backups). O servidor precisa ler a restrição para filtrar sugestão e busca
(ADR-014), então a proteção não pode impedir o uso. A demonstração roda
localmente, sem TLS (limitação declarada).

## Decisão

1. **Trânsito:** TLS em todas as comunicações que carregam restrição, no
   alvo. Na demo local (HTTP em rede local), a ausência de TLS é limitação
   declarada, não requisito atendido.
2. **Dispositivo:** SQLCipher com chave de 256 bits protegida pelo Keystore
   via `expo-secure-store` (ADR-005). A fila fica na mesma base.
3. **Servidor:** cifra de aplicação **AES-256-GCM** nos campos de restrição.
   - IV de 12 bytes aleatório e novo a cada gravação; etiqueta de 16 bytes
     guardada junto ao texto cifrado.
   - Cabeçalho com **identificador da versão da chave**, para permitir
     rotação.
   - O identificador do usuário entra como dado adicional autenticado, para
     que um texto cifrado não possa ser movido para outra linha.
   - **A chave fica fora do banco.** Demo: segredo local do Compose, fora do
     repositório. Alvo: Secret Manager (Cloud Run).
   - O servidor decifra em memória para filtrar sugestão e busca, e nunca
     registra o valor em log (A13).
4. **Backups do servidor:** *dumps* e backups contêm só o texto cifrado dos
   campos de restrição, em qualquer provedor.
5. **Backup do Android:** desativar o backup automático **e** configurar
   `dataExtractionRules` (e `fullBackupContent` para versões anteriores),
   excluindo o banco local e as preferências onde fica a chave, para backup
   em nuvem e transferência entre aparelhos.
6. **Revogação:** o app apaga banco, fila e chave na hora; o servidor remove
   o dado em até 24 h após receber o pedido (H).
7. **Logs:** nenhum log, erro ou métrica contém restrição (A13 × A05).

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Só a cifra de disco do provedor (Neon, AES-256) | Protege a mídia, mas um *dump* ou um acesso lógico ao banco devolve o dado em claro. A5 exige 0 registros em claro nos backups. Fica como camada adicional, não como única. |
| Cifra no banco (pgcrypto) | A chave passaria pelas consultas SQL e poderia aparecer em logs do banco. A verificar na documentação antes de reconsiderar. |
| Chave por usuário (apagar a chave destrói o dado, inclusive em backups) | Resolveria a revogação em backups antigos, mas adiciona gestão de chaves por usuário. Excede o prazo do MVP. |
| Serviço de chaves (Cloud KMS) | Melhor gestão e auditoria, mas mais configuração e possível custo. Fora do MVP; vale reavaliar se houver implantação real. |
| Backup do Android ativado, com banco cifrado | A chave não acompanha a restauração, o banco ficaria ilegível, e a fila não sincronizada se perderia. Mais simples e seguro excluir. |

## Consequências

**Positivas**
- Atende a A05 em três camadas com mecanismos auditáveis na demo
  (inspeção do arquivo e das colunas).
- Dumps e backups do servidor não expõem a restrição.
- A rotação de chave é possível sem migração de formato.

**Negativas**
- **O servidor vê a restrição em claro em memória.** Um comprometimento da
  aplicação em execução expõe o dado; a cifra não protege contra isso.
- **Dados revogados persistem cifrados nos backups** até o fim da retenção
  (o Neon retém de 1 a 30 dias, conforme o plano). A promessa de "em até
  24 h" vale para o armazenamento ativo, não para backups antigos.
- **Troca de aparelho:** sem backup do Android, o dado local é refeito a
  partir do servidor. Com conta anônima sem e-mail, o usuário que perde o
  aparelho perde a conta (ver ADR-007).
- **Gestão da chave do servidor é manual** na demo; perder a chave inutiliza
  os campos cifrados.
- **Custo de prazo:** configuração de cifra, de rotação mínima e dos testes.
- Cifrar campos impede filtrar por eles em SQL; o filtro ocorre em memória,
  com custo por requisição não medido (H).
- Reutilizar IV com a mesma chave quebra a segurança do GCM; um erro de
  implementação é o ponto mais perigoso. Um teste dedicado é obrigatório.
- A demo local sem TLS não comprova a camada de trânsito.

## Riscos relacionados

R2, R4, R6.

## Verificações pendentes (H)

- Inspeção do arquivo do banco local e da fila: ilegíveis sem a chave.
- Colunas de restrição no Postgres do Compose: só texto cifrado.
- Restaurar um *dump* e inspecionar: continua cifrado.
- Teste de adulteração: o GCM rejeita texto alterado.
- Teste de restauração no Android: banco e chave fora do backup.
- Retenção real de backups no alvo; criptografia em repouso e backups do
  Azure e do Cloud Run (não verificados).
- Parecer jurídico sobre a LGPD: não fornecido; a dupla não substitui
  assessoria.

## Quando revisitar

| Gatilho | Ação |
|---|---|
| A dupla decidir implantar de verdade | Avaliar Cloud KMS e chave por usuário. |
| Requisito de apagar também os backups | Reavaliar chave por usuário. |
| Abertura offline acima de 2 s por causa da cifra | Trocar biblioteca ou escopo local (ADR-005); a cifra permanece. |
| Escolha do Azure como alvo | Verificar criptografia e backups do Azure Database for PostgreSQL. |
| Plano B (Supabase) | Marcar como "Substituído por ADR-NNN"; a cifra de aplicação pode continuar. |