# Sequência — UC08, Cadastrar restrições alimentares

> Fase 2.6 — Classes, sequências e contratos. Papel da IA: arquiteto, designer de componentes e de padrões (SOLID).
> Destino: `/docs/fase2/sequencia-uc08.md`. Versão 1.0 — 07/10/2026 — status: a revisar pela dupla.
> Rastreio: UC08 (fluxo principal, FA1, FA2); RN08, RN09, RN16; US09; RNF06; A05, A08; ADR-005, ADR-006, ADR-008 (item 3).
> Os participantes seguem os componentes do `c4-componentes.md` v1.1 e as classes do `diagrama-classes.md`.

## 1. Cadastrar e revogar no aparelho

```mermaid
sequenceDiagram
  actor U as Usuário
  participant PR as Perfil e Restrições (App)
  participant CR as CadastrarRestricao
  participant RV as RevogarRestricao
  participant BL as Acesso ao Banco Local
  participant FI as Fila de Sincronização
  participant SY as Sincronizador

  U->>PR: escolhe um tipo de restrição do catálogo
  PR-->>U: informa que é dado sensível e pede consentimento (RN09)
  alt consentimento negado (FA1)
    PR-->>U: nada é persistido, nem na fila
  else consentimento dado
    PR->>CR: executar(tipo, consentimento)
    CR->>BL: iniciar transação local
    CR->>BL: grava RestricaoDoUsuario com consentimentoEm
    CR->>FI: enfileirar restricao.cadastrar com novo opId
    FI->>BL: grava OperacaoFila no banco cifrado
    CR->>BL: confirmar transação
    CR-->>PR: restrição ativa
    PR-->>U: aviso fixo de que só alérgenos são verificados
    CR-)SY: sinaliza para sincronizar
  end

  U->>PR: remove a restrição (FA2)
  PR->>RV: executar(tipo)
  RV->>BL: iniciar transação local
  RV->>BL: apaga a restrição local e o consentimento
  RV->>FI: enfileirar restricao.revogar com novo opId
  RV->>BL: confirmar transação
  RV-->>PR: filtragem deixa de aplicar a restrição
  PR-->>U: revogação feita, com "pendente de envio" enquanto houver fila
  RV-)SY: sinaliza para sincronizar
```

- O efeito local é imediato e não depende de rede.
- A restrição entra na fila cifrada pelo SQLCipher; a chave fica em `expo-secure-store` (ADR-005, ADR-006). A carga nunca vai para log.
- Sem consentimento, nada é gravado, nem na fila (RN09).
- Cadastrar e revogar a mesma restrição antes de sincronizar gera duas operações, enviadas em ordem de criação.
- Se um `restricao.cadastrar` for rejeitado permanentemente, a restrição **continua ativa no aparelho** e a operação fica visível como falha (lado seguro, A06).
- O aviso fixo cobre condições não verificadas, como o diabetes (R1).

## 2. Sincronizar e cumprir as 24 h

```mermaid
sequenceDiagram
  participant SY as Sincronizador
  participant SS as Sincronização (API)
  participant AP as AplicadorPerfil
  participant PE as Perfil e Restrições (API)
  participant CF as Cifra de Campos Sensíveis
  participant DB as Banco do Servidor

  SY->>SS: lote com restricao.cadastrar e restricao.revogar
  SS->>SS: confere idempotência por contaId e opId
  alt restricao.cadastrar
    SS->>AP: aplicar(contaId, op)
    AP->>PE: registrarRestricao(contaId, tipo, consentimentoEm)
    PE->>CF: cifrar(tipo, contaId como dado autenticado, versão da chave)
    CF-->>PE: texto cifrado, IV novo e etiqueta
    PE->>DB: grava RestricaoDoUsuario com tipoCifrado
  else restricao.revogar
    SS->>AP: aplicar(contaId, op)
    AP->>PE: revogarRestricao(contaId, tipo)
    PE->>DB: apaga a linha da restrição
    Note over PE,DB: se a restrição não existir, resultado é sucesso sem efeito
  end
  SS->>DB: grava OperacaoProcessada na mesma transação
  SS-->>SY: confirmada
  SY->>SY: marca confirmada e remove a carga da fila
  Note over SS,DB: o prazo de 24 h conta do recebimento pelo servidor
```

- Cifra: AES-256-GCM, IV de 12 bytes novo a cada gravação, etiqueta de 16 bytes, versão da chave e a conta como dado adicional autenticado. A chave vem de `ProvedorDeChave`, fora do banco.
- O servidor só decifra em memória, nas rotas de sugestão e busca, por `RestricoesParaFiltro`. Nunca registra a restrição em log.
- A revogação é **idempotente**: apagar o que não existe devolve sucesso.
- Sem sincronização em segundo plano (ADR-008, item 8), o prazo de 24 h vale **a partir do recebimento pelo servidor**. Com o aparelho offline ou o app fechado, a cópia no servidor existe até a próxima abertura com rede. Isso é consequência aceita do ADR-008 e deve constar do texto de consentimento.
- Depois da confirmação, a carga sai da fila. A tabela de idempotência guarda o `hashPayload`, não o conteúdo da restrição.
