# Entrega — Python executável, AI Model Lab e preparação Kaggle

Branch: `feature/python-runtime-kaggle-lab`. Base preservada: V3 `5705485b630bbb2177147590117b75a7c68f7e43`. Esta entrega não modifica main, não faz merge de PRs e não publica o aplicativo.

## Resultado

Pronto para revisão técnica no ambiente Chromium disponível: Python real local, editor mobile, 14 desafios com testes reais e laboratório de experimentos didáticos/preparatórios. A integração Kaggle **não executa operações autenticadas**. Safari/WebKit e iPhone físico não foram validados. Não se declara implantação em produção nem integração remota concluída.

O workspace e o histórico V3 estavam presentes e limpos na auditoria. A nova branch foi criada a partir da V3 remota/local coincidente; não foi necessário reconstruir o projeto. As funcionalidades anteriores foram conservadas, com regressões de conteúdo, lógica e interface.

## Implementação e arquitetura

- **Runtime:** Pyodide 0.29.3, CPython 3.13.2 observado em Chromium. Distribuição oficial verificada, cinco artefatos sem alterações, 12.284.602 bytes, licenças incluídas e hashes conferidos antes do uso.
- **Isolamento:** iframe de origem opaca, CSP sem rede e worker clássico. Assets chegam por memória; não há acesso ao storage do app ou credenciais. VM nova por execução e por caso de teste, watchdog e encerramento explícito.
- **Editor:** blocos, completar trecho, editar/adicionar/apagar linhas e código livre. Rascunhos por ID/modo em memória; troca de idioma/tela preserva a sessão. Restaurar código confirma a ação. Fonte livre não é salva automaticamente.
- **Painel:** snapshot da tentativa, stdout/stderr reais, versão, duração aproximada e distinção de sintaxe, exceção, assertion do aluno, resultado incorreto, política, inicialização e interrupção.
- **Progresso:** novo ledger sem duplicação em `pythonExecutableV1`, dicas progressivas, tentativas/casos, primeira conclusão e evidência do último snapshot aprovado. Chaves V1/V1.5/V2/V3 e XP anteriores permanecem preservados.
- **Projetos/portfólio:** prática Python opcional nos quatro projetos após cinco etapas ou na conclusão; retorno ao projeto sem perder etapa. Relatório mantém a parte simulada e anexa evidência independente de Python real, somente quando validada.
- **Model Lab:** contratos de modelo/dataset/configuração/ambiente/tarefa, seleção de parâmetros de referência, inspeção de JSON, estados, logs, métricas/artefatos fictícios e downloads. Nenhum peso de modelo ou treinamento é executado.

As responsabilidades estão separadas em `runtime/{content,progress,client,frame,worker,view}.js`, `runtime/runner.py` e `model-lab/{contracts,kaggle,state,view}.js`. O frontend continua estático e compatível com o caminho relativo do GitHub Pages, sem framework, backend ou dependência de editor.

## Conteúdo efetivamente verificado

As **40 missões**, seis modalidades e **quatro projetos com 40 etapas** continuam disponíveis. Há também oito cenários V3 de debugging com 24 etapas e tutorial com seis etapas: 70 etapas preservadas no total. Os dados V2 continuam iguais aos hashes da base.

| Desafio executável | Grupo | Comportamento verificado | Casos |
| --- | --- | --- | ---: |
| `exec-score` | A | Ajustar entrada variável, sem retorno constante | 3 |
| `exec-list` | A | Primeiro modelo em listas com conteúdos diferentes | 3 |
| `exec-threshold` | A | Comparação inclusiva, inclusive no limite | 3 |
| `exec-return` | A | Retorno de função, positivo/zero/outro valor | 3 |
| `exec-select-model` | B | Seleção por prioridade e caso padrão | 3 |
| `exec-response-field` | B | Extração da chave obrigatória model | 3 |
| `exec-validate-dict` | B | Contrato de tipo textual, número e ausência | 4 |
| `exec-missing-data` | B | Chave ausente diferente de texto vazio | 3 |
| `exec-token-tool` | C | Ferramenta de soma com dois argumentos | 3 |
| `exec-json` | C | Parsing de JSON e extração de label | 3 |
| `exec-fallback` | C | Fallback para ausência/vazio | 3 |
| `exec-router` | C | Preferência, disponibilidade, fallback e lista vazia | 4 |
| `exec-evaluation` | Projetos | Denominador inclui previsões ausentes; dataset vazio | 4 |
| `exec-checkpoint` | Projetos | Menor loss de validação, empate e logs vazios | 4 |
| **Total** | **4 + 4 + 4 + 2** | **14 soluções, 28 peças incorretas rejeitadas** | **46** |

Código não é aceito por palavras-chave ou texto rígido. Asserções reais conferem resultados e entradas diferentes; implementações equivalentes de soma/retorno também passaram. Um teste demonstrativo é separado dos demais casos. O frontend contém expectativas públicas e limitadas: não é mecanismo antifraude ou certificado.

Português, Misto padrão e English foram preservados. Os 14 títulos, objetivos e legendas foram conferidos nos três modos. O glossário contextual traduz execução, testes, erros, saída esperada, estado de job, inferência, treinamento e checkpoint. Pré-requisitos mostram títulos compreensíveis, sem depender de IDs técnicos na interface.

## Kaggle: o que foi verificado e implementado

A documentação oficial e o pacote `kaggle` 2.2.5 foram inspecionados. Operações confirmadas no contrato/código: init, push/versionamento e solicitação de execução, `--no-run`, pull, status, arquivos/output, logs e operações de datasets; solicitação de acelerador é condicionada a disponibilidade/quota. Fontes, revisão, hash e limites estão em `KAGGLE-INTEGRATION.md`.

Um achado relevante: push pode executar por padrão; exportação preparatória não deve ser confundida com submissão. Outro: documentação e código inspecionados divergem em defaults de internet, por isso o exportador a desativa explicitamente. Cancelamento remoto seguro não foi confirmado; não usamos delete como substituto.

O mock implementa preparação, submissão local, consulta, avanço manual, cancelamento/falha locais, logs, métricas e artefatos determinísticos. Testes injetam autenticação/rede indisponíveis. O adaptador remoto só prepara bundle; enviar/consultar lança `BACKEND_REQUIRED`. Não existem tokens no frontend nem pedido de segredos.

Notebook/metadados exportados são reais e verificáveis como arquivos, mas somente **preparam** um experimento. CPython confirmou que a célula escreve `preparation.json` com `model_executed: false`. Dono precisa ser revisado, notebook privado, internet desativada e GPU desligada por padrão. Nenhum job foi enviado. Kaggle não é tratado como endpoint permanente de inferência.

## Testes executados

**25 suítes aprovadas**, executadas por grupos e novamente nos componentes alterados: 14 locais e 11 de navegador. Comandos reproduzíveis: `node scripts/test.cjs` e, com HTTP na porta 8000/Playwright/Chromium, `node scripts/test.cjs --browser`. Não houve uma alegação de execução em Safari/iPhone real.

| Suítes | Resultado observado |
| --- | --- |
| Estrutura estática + integridade runtime | HTML com tags/IDs/labels/assets consistentes, JSON parseável, sintaxe JS, hashes/tamanhos dos cinco arquivos; não é certificação integral W3C |
| `validate.js`, `core.cjs` | 40 missões, alternativas, pré-requisitos, seis modalidades, idiomas, XP, revisão e V1/V1.5 preservadas |
| `projects-core.cjs`, `projects-data.cjs`, `storage-migration.cjs` | 70 etapas, escolhas, artefatos, evidências, exportação, XP, corrupção/quota e migrações anteriores |
| `python-fixtures.py`, `projects-python.py` | CPython 3.12.14: missões, soluções, reparos, exceções e consistência Python/JS/traces |
| `runtime-core.cjs`, `runtime-migration.cjs`, `runtime-python.py` | 14 soluções, 46 casos, 28 reparos rejeitados, equivalências, dicas, XP, snapshots e migração aditiva das quatro gerações |
| `model-lab.cjs`, `model-notebook.py` | Contratos fechados, estados, falhas simuladas, recusa de operação remota, bundle e execução preparatória em CPython |
| `browser.cjs`, `labs-browser.cjs` | 40 missões e laboratórios V2 completos em 320/375/390 px, navegação, modos, revisão, dicas, persistência e reset |
| `projects-browser.cjs`, `projects-edge-browser.cjs`, `project-evaluation-browser.cjs` | Projetos/70 etapas nas três larguras; retomada, evidências, fluxo, testes, exportação, corrupção e storage negado |
| `runtime-browser.cjs` | CPython WASM 3.13.2 real, stdout, exceções/assertions, política, VM limpa por caso, mutação de módulo sem contaminar o próximo caso, limites/timeout/stop/recovery e rejeição de recurso corrompido |
| `runtime-lessons-browser.cjs` | Todas as 14 soluções e 28 peças erradas executadas no navegador, equivalente alternativo, dicas, XP, editores, idiomas e recarga sem persistir código |
| `runtime-edge-browser.cjs` | Projeto/retorno/portfólio, saída HTML exibida como texto, stop/reset, origem opaca sem storage do app, CSP bloqueando rede, dados corrompidos/quota e reset confirmado |
| `runtime-mobile-browser.cjs` | Toque + Python real em 320/375/390 px, stdout/validação, botões ≥44 px dentro da tela, editores, redução de movimento e Model Lab; screenshots gerados e inspecionados |
| `runtime-language-browser.cjs` | 14 desafios em três idiomas, glossário, títulos de pré-requisitos, IDs únicos e labels associados |
| `model-lab-browser.cjs` | Modos, parâmetros, contrato, simulação/falhas, downloads, retorno de Python, idioma, persistência e layout nas três larguras |

As primeiras execuções de regressão encontraram premissas antigas de “zero textarea no DOM”, incompatíveis com o editor novo em outra tela. Os testes agora exigem zero campos **visíveis** e nenhum foco de digitação nas atividades de toque. Expectativas de título/newline e scripts de preparação aplicados indevidamente aos frames também foram corrigidos; não se ocultaram falhas de produto para obter aprovação.

## Problemas corrigidos e decisões

- Preservação de conclusão/XP quando o aluno revisita e falha depois; snapshot aprovado não é substituído pelo código errado.
- Separação entre primeiro acerto e último snapshot aprovado, com datas, hash e versão.
- Recuperação por campo sem descartar ledger válido; registros danificados recebem backup antes da gravação reparada.
- Assertion do aluno distinguida da comparação incorreta do resultado; mensagens/tracebacks vêm do Python real.
- Isolamento por VM em cada caso, evitando estado global/módulos contaminados.
- Erros de inicialização/política não fingem código executado ou aprendizado errado.
- Editor/glossário/ajuda em seções progressivas, opções que cabem no mobile e XP Python identificado separadamente.
- Prática Python indisponível não cria botão de projeto que deixa de funcionar; missões/projetos/simulações continuam utilizáveis.

Decisões técnicas: vendor local verificável em vez de CDN; worker clássico em origem opaca em vez de enfraquecer sandbox para usar a distribuição mais recente; textarea em vez de editor pesado; VMs novas em vez de reutilização na avaliação; chaves aditivas em vez de reescrever histórico; adaptador preparatório em vez de backend/credenciais públicos.

## Limitações e riscos antes de publicação

- WebKit não instalado e nenhum iPhone físico disponível. Layout/toque automatizado Chromium não prova compatibilidade Safari nem ergonomia física.
- WASM não é sandbox absoluta; não existe quota rígida de memória. Alocações excessivas podem pressionar/encerrar a aba no celular.
- ~12.3 MB sob demanda e custo de inicializar várias VMs. Cache HTTP/memória não garante offline; rascunho livre se perde ao recarregar.
- Subconjunto restrito de Python/bibliotecas; sem input interativo, arquivos do dispositivo, pacotes externos ou rede. Só pequenos programas.
- Versão Pyodide fixada por compatibilidade de isolamento; atualizações precisam repetir auditoria, testes e revisão upstream.
- Progresso local, sem sincronização/multiaba transacional; dados editáveis pelo usuário não são prova externa de competência.
- Nenhum modelo real, inferência, treino ou fine-tuning foi executado. Métricas do Model Lab são fictícias e identificadas. Um pequeno dataset não demonstra superioridade geral.
- Nenhuma chamada autenticada Kaggle validada. A página web oficial foi bloqueada pelo proxy; documentação/código foram verificados via GitHub/PyPI. Backend, autenticação, quotas e execução real continuam para autorização/infraestrutura futuras.

Recomendação: revisar o diff, executar o percurso em Safari/iPhone antes de publicar e revisar limites/versões de segurança. Uma integração Kaggle real exigirá serviço intermediário autorizado separado; não é trabalho iniciado nesta entrega.

## Arquivos e entrega Git

Principais arquivos criados: `runtime/`, `model-lab/`, fixtures/suítes novas em `tests/`, `scripts/test.cjs`, `scripts/check-static.py`, `docs/PYTHON-RUNTIME.md`, `KAGGLE-INTEGRATION.md`, `MODEL-LAB.md`, `SECURITY.md` e este relatório. Integração em `app.js`, `index.html`, `projects/view.js`, README e documentos existentes. Configuração do GitHub Pages e dados V2 não foram alterados.

Commits de marcos já enviados: `9c228d8` (runtime isolado verificável) e `d9bb52b` (14 desafios/editor/Model Lab). O marco final acrescenta testes de regressão, recuperação, clareza mobile e documentação; o histórico da branch contém o SHA exato da revisão de entrega.

Destino do PR de rascunho: `feature/v3-python-ai-lab`. Sem merge/publicação. O resultado da tentativa de abertura e o link de revisão serão registrados abaixo; o texto preparado fica em `docs/PR-RUNTIME-LAB.md`.
