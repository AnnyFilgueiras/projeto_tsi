# ADR-012 — Fotos das receitas: licença aberta, atribuição e download offline

- **Status:** Aceito com condições (ver "Verificações pendentes")
- **Data:** 06/10/2026
- **Autores:** Dupla
- **Atributos:** A09 (alto); A04 (crítico); A05; custo zero
- **Rastreio:** A09 (imagem obrigatória), US05, RNF08, RN17
- **ADRs relacionados:** ADR-001, ADR-004, ADR-005, ADR-010, ADR-013

## Contexto

A publicação de uma receita exige imagem (A09). As fotos vêm de fontes com
licença aberta (decisão da dupla) e devem baixar junto com as receitas
planejadas, para funcionar offline (decisão de 06/10/2026). Fotos de
usuário não existem na v1. A demo usa cerca de 20 pratos; o lançamento, 100;
o dimensionamento, 350. A hospedagem do alvo ficou em aberto na 2.3.

## Decisão

1. **Licenças aceitas [CONFIRMAR]:** domínio público e CC0; CC BY; CC BY-SA;
   e foto de autoria própria da dupla. **Recusadas:** variantes NC e ND
   (ND impede redimensionar e recortar), licenças próprias de bancos de
   imagens e qualquer imagem sem licença identificada. Preferência: CC0 e
   CC BY, para evitar a obrigação de compartilhamento do BY-SA.
2. **Metadados obrigatórios por imagem (TASL):** título, autor, URL da fonte,
   licença com link, e se foi alterada (por exemplo, redimensionada). A
   publicação é bloqueada sem eles (ADR-010). O app exibe a atribuição na
   receita ou em uma tela de créditos.
3. **Uma imagem principal por receita** na v1.
4. **Processamento na curadoria:** a imagem é redimensionada (largura máxima
   proposta de 1.024 px) e recomprimida no servidor, em **WebP**, com
   JPEG como alternativa se a renderização falhar. O nome do arquivo usa o
   hash do conteúdo, o que torna a troca de imagem e o download idempotentes.
5. **Hospedagem:**
   - **Demo:** a própria API serve os arquivos de um volume do Compose.
   - **Alvo:** armazenamento de objetos estático do mesmo provedor (Cloud
     Storage), com custo e cota gratuita **a verificar**. Se não houver
     opção gratuita, servir pela API.
6. **Offline:** as fotos baixam junto com as receitas planejadas e ficam
   como arquivos no armazenamento persistente do app, fora do banco cifrado
   (ADR-005). O app não depende do cache de imagem, que pode ser limpo.
7. **Sem foto de usuário e sem foto gerada por IA.**

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Fotos geradas por IA | Podem não corresponder ao prato real; a dupla decidiu por licença aberta. |
| Fotos próprias para todo o catálogo | Segurança de direitos máxima, mas inviável para 100 pratos em 45 dias. Aceitas como exceção. |
| Referenciar a imagem diretamente na fonte | Depende de terceiros, não funciona offline e sobrecarrega o provedor da imagem. |
| Bancos de imagens gratuitos com licença própria | Termos podem mudar e não são licença aberta. |
| Imagens como blobs no SQLCipher | Pesa na abertura do banco (A04) e cresce a base cifrada (ADR-005). |
| Fotos sempre online | Contradiz a decisão de baixar com as planejadas e a A04. |
| Sem foto | Viola a A09 e prejudica a experiência. |

## Consequências

**Positivas**
- Direitos e atribuição rastreáveis por imagem, o que reduz o R10.
- Download idempotente e troca de imagem sem conflito (hash no nome).
- O offline funciona com foto, sem depender do cache do sistema.

**Negativas**
- **Trabalho de curadoria:** encontrar, conferir licença e registrar TASL
  para cada prato. Pratos de culinárias menos fotografadas podem não ter
  imagem com licença aberta, o que ameaça a meta de 10 culinárias em 5
  continentes (A09).
- **Os metadados de licença podem estar errados** na fonte; a conferência é
  humana e não elimina o risco (R10).
- **Peso do download e do armazenamento:** as fotos aumentam o conjunto
  baixado (ADR-001). O tamanho por foto é hipótese (a medir).
- **BY-SA** impõe que a imagem adaptada seja compartilhada sob CC BY-SA. Isso
  não é parecer jurídico.
- **Custo do alvo não verificado** para hospedagem de imagens.
- Telas e dados de atribuição aumentam o trabalho de interface.
- Preparadas acumulam no aparelho: sem limite, o armazenamento cresce.

## Riscos relacionados

R10 (estendido às imagens).

## Verificações pendentes (H)

- O WebP renderiza no *development build* e no emulador de referência.
- Tamanho médio por foto e do conjunto baixado do seed de 20 pratos.
- Tempo de download das planejadas em rede 4G simulada.
- Atribuição exibida corretamente no app, com os quatro elementos.
- Custo e cota gratuita da hospedagem de imagens no alvo.
- Disponibilidade de imagem com licença aberta para as culinárias do seed.

## Quando revisitar

| Gatilho | Ação |
|---|---|
| Faltar imagem aberta para culinárias do seed | Usar foto própria nessas receitas ou reduzir o escopo de culinárias. |
| O conjunto baixado pesar no dispositivo de referência | Reduzir resolução, ou baixar fotos sob demanda para preparadas. |
| WebP falhar no *development build* | Passar para JPEG. |
| Hospedagem gratuita de imagens indisponível no alvo | Servir pela API ou reavaliar o provedor. |
| Fotos de usuário entrarem no escopo | Reabrir (moderação, LGPD, armazenamento). |

## Detalhamento (2.5)

- **Alvo:** o app baixa as fotos direto do armazenamento de objetos, por URL estática com hash no nome. Na demo, o download é pela API. Se não houver opção gratuita no alvo, volta a ser pela API (item 5).
- **Preparadas:** as já baixadas permanecem no aparelho; em instalação nova, voltam sob demanda. A política de limpeza do armazenamento local continua em aberto.
- **Licenças:** enum do contrato `dominio_publico`, `cc0`, `cc_by`, `cc_by_sa`, `autoria_propria`. O `[CONFIRMAR]` do item 1 continua aberto até a verificação do R10.
- **Metadados TASL:** a publicação é bloqueada sem autor, URL da fonte, licença e indicação de alteração.