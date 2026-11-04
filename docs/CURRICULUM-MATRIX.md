# Matriz curricular V4

Total: **145 missões** (40 originais e 105 novas), com 14 desafios executáveis adicionais e quatro projetos preservados. Os desafios e etapas de projetos não foram contados como novas missões.

A ordem usa IDs estáveis. O pré-requisito de cada missão é a missão anterior na trilha; a unidade depende da anterior. São recomendações sem bloqueio de exploração. O JSON contém as arestas explícitas e o validador recusa ausências/ciclos/duplicatas. O catálogo original permanece byte a byte em exercises.json; o app aplica a matriz sem reutilizar IDs. A biblioteca de originais é um arquivo de revisão, com acesso de volta à unidade atual.

| Unidade | Foco | Originais | Novas | Python real |
| --- | --- | ---: | ---: | --- |
| 1 · Primeiros passos | Valores, nomes e saída. | 3 | 10 | exec-score |
| 2 · Listas e índices | Encontre e atualize itens. | 4 | 6 | exec-list |
| 3 · Condições | Decida por regras explícitas. | 3 | 8 | exec-threshold |
| 4 · Funções | Receba entradas e devolva resultados. | 4 | 8 | exec-return |
| 5 · Texto e transformação | Prepare textos de prompts e respostas. | 0 | 8 | Preparação |
| 6 · Laços | Processe coleções passo a passo. | 1 | 11 | Preparação |
| 7 · Dicionários e JSON | Leia e valide dados estruturados. | 6 | 10 | exec-response-field, exec-missing-data, exec-json |
| 8 · Erros e testes | Investigue, corrija e verifique. | 6 | 9 | exec-validate-dict |
| 9 · Arquivos e dados | Leia texto, CSV e JSON com segurança. | 0 | 8 | Preparação |
| 10 · APIs | Entenda contratos e falhas de serviço. | 3 | 5 | exec-select-model, exec-fallback |
| 11 · Ferramentas e agentes | Conecte funções com regras verificáveis. | 6 | 5 | exec-token-tool, exec-router |
| 12 · Modelos e avaliação | Compare resultados sem extrapolar. | 2 | 7 | exec-evaluation |
| 13 · Treinamento e experimentação | Interprete logs e prepare experimentos. | 2 | 6 | exec-checkpoint |
| 14 · Projetos integradores | Aplique e explique o que aprendeu. | 0 | 4 | Preparação |

## Sequência verificável por unidade

### 1 · Primeiros passos

`v4-recognize-value` → `score-variable` → `print-score` → `v4-number` → `v4-float` → `v4-string` → `v4-boolean` → `v4-print-pair` → `v4-addition` → `token-budget` → `v4-conversion` → `v4-multiply` → `v4-division`

### 2 · Listas e índices

`v4-list` → `v4-zero` → `read-index` → `v4-length` → `count-models` → `max-scores` → `v4-append` → `v4-replace-index` → `v4-empty` → `find-index-error`

### 3 · Condições

`compare-scores` → `v4-less` → `v4-equality` → `v4-inclusive` → `minimum-confidence` → `choose-fallback` → `v4-and` → `v4-or` → `v4-not` → `v4-elif` → `v4-inline-if`

### 4 · Funções

`v4-def` → `v4-parameter` → `v4-argument` → `define-tool` → `v4-return` → `return-score` → `v4-default` → `v4-none` → `v4-unpack` → `v4-compose` → `trace-selection` → `fallback-challenge`

### 5 · Texto e transformação

`v4-concat` → `v4-strip` → `v4-lower` → `v4-upper` → `v4-split` → `v4-join` → `v4-text-in` → `v4-text-pipeline`

### 6 · Laços

`v4-for` → `visit-tools` → `v4-range` → `v4-materialize` → `v4-accumulator` → `v4-while` → `v4-break` → `v4-continue` → `v4-zip` → `v4-enumerate` → `v4-list-sum` → `v4-boolean-sum`

### 7 · Dicionários e JSON

`v4-dict-create` → `response-dictionary` → `read-response-field` → `english-variable-names` → `v4-dict-membership` → `v4-dict-nested` → `model-records` → `parse-json` → `v4-json-dumps` → `v4-dict-get` → `optional-field` → `v4-isinstance` → `v4-dict-type` → `v4-or-value` → `v4-dict-items` → `v4-module-import`

### 8 · Erros e testes

`v4-try` → `v4-catch-two` → `v4-json-error` → `debug-syntax` → `v4-float-convert` → `debug-types` → `debug-key` → `debug-index` → `debug-name` → `debug-logic` → `v4-assert` → `v4-assert-fail` → `v4-truthiness` → `v4-empty-test` → `v4-negative-test`

### 9 · Arquivos e dados

`v4-file-text` → `v4-file-lines` → `v4-file-cursor` → `v4-file-seek` → `v4-with` → `v4-json-file` → `v4-csv-reader` → `v4-csv-dict`

### 10 · APIs

`v4-request` → `v4-headers` → `v4-auth-concept` → `http-status` → `response-envelope` → `handle-api-error` → `v4-api-failure` → `v4-retry`

### 11 · Ferramentas e agentes

`keyword-tool` → `deterministic-tool` → `v4-tool-name` → `v4-tool-input` → `v4-tool-pure` → `tool-call-contract` → `validate-field-type` → `classify-route` → `v4-tool-allowlist` → `unknown-tool-fallback` → `v4-agent-state`

### 12 · Modelos e avaliação

`training-example` → `v4-accuracy` → `v4-latency` → `v4-cost` → `v4-list-comprehension` → `v4-generator` → `v4-filtered-list` → `heldout-evaluation` → `v4-small-dataset`

### 13 · Treinamento e experimentação

`epoch-log` → `training-loss` → `v4-validation-split` → `v4-overfit` → `v4-minimum` → `v4-lambda` → `v4-min-key` → `v4-prepared-not-running`

### 14 · Projetos integradores

`v4-mini-router` → `v4-mini-client` → `v4-mini-evaluation` → `v4-mini-training`

## Preparação para os projetos

| Projeto | Unidades recomendadas |
| --- | --- |
| model-router | unit-03, unit-04, unit-07, unit-08, unit-11 |
| api-client | unit-04, unit-05, unit-07, unit-08, unit-10 |
| model-evaluation | unit-04, unit-06, unit-07, unit-08, unit-12 |
| training-pipeline | unit-02, unit-03, unit-04, unit-07, unit-12, unit-13 |

Os códigos completos dos quatro projetos foram inspecionados. Def/parâmetros/default/return são ensinados na unidade 4; texto na 5; zip/desempacotamento/enumerate/soma na 6; dicionários/JSON/get/items/tipos na 7; exceções/assert/coleções vazias na 8; compreensões/geradores na 12; lambda/key/min na 13. A unidade 14 consolida os quatro fluxos antes dos projetos completos. `tests/curriculum-python.py` verifica os comandos usados pelos projetos e os pontos de entrada dos 14 desafios.

Distribuição real de modalidades: build: 6, complete: 15, error: 2, fix: 14, predict: 96, read: 12.

O inglês é apoio: prompts em Português no modo Misto, termo inglês curto nos títulos/legendas e tradução contextual. English tem suas versões completas. Nenhuma pronúncia ou serviço de IA é exigido.

As competências novas têm taxonomia declarada em `skills` por atividade; o painel conta apresentado/praticado/acertado/revisão por evidências. XP não define habilidade. A classificação não é avaliação científica nem certificação profissional.
