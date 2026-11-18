# Sequência — UC08, Cadastrar restrições alimentares

> Fase 2.6 — Classes, sequências e contratos; revisão da 2.7. Papel da IA: arquiteto, designer de componentes e de padrões (SOLID).
> Destino: `/docs/fase2/sequencia-uc08.md`. Versão 1.1 — 07/10/2026 — status: a revisar pela dupla.
> Rastreio: UC08 (fluxo principal, FA1, FA2); RN08, RN09, RN16; US09; RNF06; A05, A08; ADR-005, ADR-006, ADR-008 (item 3), ADR-015.
> Os participantes seguem os componentes do `c4-componentes.md` v1.1 (nomes em português) e as classes do `diagrama-classes.md` v1.1 (identificadores em inglês, ADR-015).
> Alterações da v1.1: identificadores em inglês pelo glossário e `Tx` na aplicação no servidor (T01).

## 1. Cadastrar e revogar no aparelho

```mermaid
sequenceDiagram
  actor U as Usuário
  participant PR as Perfil e Restrições (App)
  participant CR as RegisterRestriction
  participant RV as RevokeRestriction
  participant BL as Acesso ao Banco Local
  participant FI as Fila de Sincronização
  participant SY as Synchronizer

  U->>PR: escolhe um tipo de restrição do catálogo
  PR-->>U: informa que é dado sensível e pede consentimento (RN09)
  alt consentimento negado (FA1)
    PR-->>U: nada é persistido, nem na fila
  else consentimento dado
    PR->>CR: execute(type, consent)
    CR->>BL: iniciar transação local
    CR->>BL: grava UserRestriction com consentAt
    CR->>FI: enqueue restriction.register com novo opId
    FI->>BL: grava QueuedOperation no banco cifrado
    CR->>BL: confirmar transação
    CR-->>PR: restrição ativa
    PR-->>U: aviso fixo de que só alérgenos são verificados
    CR-)SY: sinaliza para sincronizar
  end

  U->>PR: remove a restrição (FA2)
  PR->>RV: execute(type)
  RV->>BL: iniciar transação local
  RV->>BL: apaga a restrição local e o consentimento
  RV->>FI: enqueue restriction.revoke com novo opId
  RV->>BL: confirmar transação
  RV-->>PR: filtragem deixa de aplicar a restrição
  PR-->>U: revogação feita, com "pendente de envio" enquanto houver fila
  RV-)SY: sinaliza para sincronizar
```

- O efeito local é imediato e não depende de rede.
- A restrição entra na fila cifrada pelo SQLCipher; a chave fica em `expo-secure-store` (ADR-005, ADR-006). A carga nunca vai para log.
- Sem consentimento, nada é gravado, nem na fila (RN09).
- Cadastrar e revogar a mesma restrição antes de sincronizar gera duas operações, enviadas em ordem de criação.
- Se um `restriction.register` for rejeitado permanentemente, a restrição **continua ativa no aparelho** e a operação fica visível como falha (lado seguro, A06).
- O aviso fixo cobre condições não verificadas, como o diabetes (R1).
- Os casos de uso recebem `OperationEnqueuer` (não a fila de pendentes) e usam o repositório de restrições, nunca SQL direto (regras A3 e A4).

## 2. Sincronizar e cumprir as 24 h

```mermaid
sequenceDiagram
  participant SY as Synchronizer
  participant SS as Sincronização (API)
  participant RO as OperationRepository
  participant AP as ProfileApplier
  participant PE as Perfil e Restrições (API)
  participant CF as Cifra de Campos Sensíveis
  participant DB as Banco do Servidor

  SY->>SS: lote com restriction.register e restriction.revoke
  SS->>RO: find(accountId, opId)
  RO-->>SS: já processada com mesmo hash? (repeated) ou nova
  SS->>DB: iniciar transação (tx)
  alt restriction.register
    SS->>AP: apply(accountId, op, tx)
    AP->>PE: registerRestriction(accountId, type, consentAt, tx)
    PE->>CF: encrypt(type, accountId como dado autenticado, versão da chave)
    CF-->>PE: texto cifrado, IV novo e etiqueta
    PE->>DB: grava UserRestriction com encryptedType (tx)
  else restriction.revoke
    SS->>AP: apply(accountId, op, tx)
    AP->>PE: revokeRestriction(accountId, type, tx)
    PE->>DB: apaga a linha da restrição (tx)
    Note over PE,DB: se a restrição não existir, resultado é sucesso sem efeito
  end
  SS->>RO: save(ProcessedOperation, tx)
  SS->>DB: confirmar transação
  SS-->>SY: confirmed
  SY->>SY: marca confirmed e remove a carga da fila
  Note over SS,DB: o prazo de 24 h conta do recebimento pelo servidor
```

- Cifra: AES-256-GCM, IV de 12 bytes novo a cada gravação, etiqueta de 16 bytes, versão da chave e a conta como dado adicional autenticado. A chave vem de `KeyProvider`, fora do banco.
- O servidor só decifra em memória, nas rotas de sugestão e busca, por `RestrictionsForFilter`. Nunca registra a restrição em log.
- A revogação é **idempotente**: apagar o que não existe devolve sucesso.
- O `tx` é aberto por `SyncService` e passado ao aplicador, ao módulo dono e a `OperationRepository.save`: o efeito e o registro idempotente saem na mesma transação (T01, P05).
- Sem sincronização em segundo plano (ADR-008, item 8), o prazo de 24 h vale **a partir do recebimento pelo servidor**. Com o aparelho offline ou o app fechado, a cópia no servidor existe até a próxima abertura com rede. Isso é consequência aceita do ADR-008 e deve constar do texto de consentimento.
- Depois da confirmação, a carga sai da fila. A tabela de idempotência guarda o `payloadHash`, não o conteúdo da restrição.
