# Sequência — UC10, Registrar avaliação (com UC13 e UC11)

> Fase 2.6 — Classes, sequências e contratos. Papel da IA: arquiteto, designer de componentes e de padrões (SOLID).
> Destino: `/docs/fase2/sequencia-uc10.md`. Versão 1.0 — 07/10/2026 — status: a revisar pela dupla.
> Rastreio: UC10 (fluxo principal, FA1, FA2, FE1), UC13, UC11; RN01 a RN07; US12, US14, US15, US16; A04, A08; ADR-001, ADR-005, ADR-008.
> Os participantes seguem os componentes do `c4-componentes.md` v1.1 e as classes do `diagrama-classes.md`.

## 1. Salvar offline

```mermaid
sequenceDiagram
  actor U as Usuário
  participant AV as Avaliação e Coleção (App)
  participant RA as RegistrarAvaliacao
  participant CD as CalculadoraDesbloqueio
  participant BL as Acesso ao Banco Local
  participant FI as Fila de Sincronização
  participant SY as Sincronizador

  U->>AV: informa nota, relato e alterações
  AV->>RA: executar(pratoId, nota, relato, alteracoes, itemId)
  alt nota ausente ou fora de 0 a 5 em passos de 0,5 (FE1, RN05)
    RA-->>AV: erro de validação, nada é gravado
    AV-->>U: impede o salvamento
  else nota válida
    RA->>CD: calcular(avaliacao, índice leve, estado local)
    CD-->>RA: evoluções diretas e badges novos (RN02, RN03, RN04)
    RA->>BL: iniciar transação local
    RA->>BL: grava Avaliacao com id = opId (RN06)
    opt avaliação iniciada de um item do plano (FA2)
      RA->>BL: item passa a concluído e limpa o "em preparo" local
    end
    RA->>BL: grava desbloqueios e conquistas locais
    RA->>FI: enfileirar avaliacao.registrar com o mesmo opId
    FI->>BL: grava OperacaoFila, estado pendente
    RA->>BL: confirmar transação
    RA-->>AV: avaliação salva e desbloqueios
    AV-->>U: prato concluído e novidades da coleção (RN01)
    RA-)SY: sinaliza para sincronizar
  end
```

- A avaliação, os desbloqueios e a operação da fila entram na **mesma transação** local (ADR-005). Se qualquer gravação falhar, nada fica gravado.
- O `opId` é gerado uma vez e é o `id` da `Avaliacao` e da operação.
- Repetir um prato gera novo `opId`, sem sobrescrever avaliações anteriores (FA1, RN06). Evolução já desbloqueada não gera novo desbloqueio (RN02).
- Nada aqui usa rede. Medida (H): salvar e desbloquear em até 1 s (A04).

## 2. Sincronizar

```mermaid
sequenceDiagram
  participant SY as Sincronizador
  participant EN as EnviadorDeOperacoes
  participant FI as Fila de Sincronização
  participant CR as Cliente de Rede e Sessão
  participant SS as Sincronização (API)
  participant RO as RepositorioOperacoes
  participant AA as AplicadorAvaliacao (Progresso e Avaliação)
  participant DB as Banco do Servidor

  SY->>EN: enviarPendentes()
  EN->>FI: proximasPendentes(n)
  FI-->>EN: operações em ordem de criação
  EN->>CR: enviarLote(ops)
  CR->>SS: POST /v1/sincronizacao/operacoes
  loop para cada operação do lote
    SS->>RO: buscar(contaId, opId)
    alt já processada com mesmo hash
      RO-->>SS: resposta gravada
      SS-->>CR: resultado com repetida = true, sem reaplicar
    else mesmo opId com hash diferente
      SS-->>CR: operação recusada (422, chave-reutilizada)
    else nova
      SS->>DB: iniciar transação
      SS->>AA: aplicar(contaId, op)
      AA->>DB: grava Avaliacao e recalcula desbloqueios, só acrescenta
      alt validação falha (prato inexistente ou nota inválida)
        AA-->>SS: rejeição permanente
      else aplicada
        AA-->>SS: desbloqueios confirmados
      end
      SS->>RO: gravar(OperacaoProcessada)
      SS->>DB: confirmar transação
      SS-->>CR: resultado confirmada ou rejeitada
    end
  end
  CR-->>EN: resultados por opId
  loop para cada resultado
    alt confirmada ou repetida
      EN->>FI: marcarConfirmada(opId)
    else rejeitada permanente
      EN->>FI: marcarFalha(opId, motivo), visível, sem reenvio
    end
  end
  Note over SY,CR: erro de rede ou 5xx não muda o estado: tentativas e espera progressiva
```

- Erro de rede ou 5xx incrementa as tentativas e reagenda (5 s, 30 s, 2 min, 10 min, 1 h). Ao reconectar, o mesmo `opId` é reenviado e o servidor trata como repetição.
- O aplicador e a gravação de `OperacaoProcessada` ficam na mesma transação do servidor.
- O servidor **recalcula** os desbloqueios pelo `CatalogoLeitura` e só acrescenta. Nunca revoga (RN04).
- Rejeição permanente deixa a operação visível como falha, sem bloquear as demais. O usuário só pode descartá-la (sem reenvio na v1). O desbloqueio local feito antes permanece (RN04). Prato aprovado nunca é apagado, só desativado, o que torna essa rejeição rara.
- Log da falha leva só `opId` e motivo (A13).
- Medidas (H): início da sincronização em até 60 s após a reconexão; 0 avaliações perdidas e 0 duplicadas em 100 ciclos de queda e reenvio (A08).
