# Python AI Trainer

Uma plataforma para aprender Python aplicado a IA e inglês técnico: ler, montar, executar, testar, depurar e construir soluções guiadas. Reúne **145 missões em 14 unidades** (40 preservadas e 105 novas), quatro projetos, oito desafios de debugging, introdução a testes e 14 desafios com Python real. Funciona como site estático, com HTML, CSS e JavaScript, sem backend obrigatório, framework ou APIs de modelos.

Reconstrução pedagógica e visual em `feature/learning-experience-v4`, criada diretamente da main `57eaec8`. Esta branch não foi publicada nem integrada; o destino do PR de rascunho é main. A infraestrutura anterior foi preservada.

A expansão atual acrescenta **14 desafios executáveis**, editor por blocos/trechos/linhas/código livre e **CPython real no navegador com Pyodide**, carregado sob demanda. O **AI Model Lab** mantém seu simulador. A área **AI experiments** acrescenta notebooks autocontidos de inferência/treinamento de um modelo linear de 87 parâmetros, executados e medidos em CPU local, e um **executor Kaggle separado, desativado por padrão**. O site não autentica contas, submete jobs ou inicia treino remoto. Relatórios importados têm origem declarada. Veja [runtime](docs/PYTHON-RUNTIME.md), [Kaggle](docs/KAGGLE-INTEGRATION.md), [Model Lab](docs/MODEL-LAB.md) e [segurança](docs/SECURITY.md).

## Uma experiência integrada

A navegação móvel **Aprender · Praticar · Mais** conecta as cinco áreas: Aprender, Praticar, Projetos, Laboratório IA e Meu progresso. A home mostra a próxima unidade, seu progresso e uma atividade principal. A trilha reúne 145 missões em 14 unidades e permite explorar livremente. O tema claro é padrão; o escuro é opcional. Conexões por conceito levam da leitura ao programa real, do programa ao debugging e de projetos a experimentos. Pré-requisitos orientam sem bloquear exploração.

O progresso mostra apresentado, praticado, acertado e sugestão de revisão, além de conclusão por atividade. XP é apresentado por origem; não mede domínio ou experiência profissional. O portfólio e o resumo Markdown distinguem simulação, código executado, testes reais aprovados e preparação Kaggle. Não existe conexão Kaggle autenticada disfarçada de simulação.

Veja a [matriz das 14 unidades](docs/CURRICULUM-MATRIX.md), a [reconstrução pedagógica](docs/PEDAGOGICAL-REDESIGN.md), o [sistema visual](docs/UX-DESIGN-SYSTEM.md), os [testes mobile](docs/MOBILE-TEST-REPORT.md), a [entrega V4](docs/REDESIGN-FINAL-REPORT.md) e o [guia da jornada](docs/USER-JOURNEY.md), a [auditoria de integração](docs/INTEGRATION-AUDIT.md), a [prontidão para lançamento](docs/RELEASE-READINESS.md) e o [relatório da integração anterior](docs/REPORT-INTEGRATION.md). A branch é para revisão; Safari/iPhone físico ainda precisa de validação antes de declarar publicação pronta.

## Projetos guiados

Cada projeto tem dez etapas que interpretam, modificam ou verificam um mesmo artefato. Não são quarenta missões independentes adicionais.

| Projeto | Entrega didática |
| --- | --- |
| Roteador de modelos | Política para fast/quality/local, fallback, erro lógico e casos de teste |
| Cliente de API de IA | Requisição fictícia, texto JSON, campos, validação e respostas de erro |
| Avaliação de modelos | Dataset de quatro tarefas, acurácia, falhas, latência/custo fictícios e relatório |
| Mini pipeline de treinamento | Separação treino/validação, lotes, épocas, logs, sobreajuste e checkpoint |

O Lab mantém rascunho, dicas, respostas, etapa e fluxo ao recarregar. É possível voltar e revisitar etapas. Reiniciar uma atividade limpa suas etapas, mas conserva o XP já concedido e o histórico de dificuldade, evitando pontos duplicados.

## Recursos

- 145 missões graduais: valores, listas, condições, funções, texto, laços, dicionários/JSON, erros/testes, arquivos, APIs, ferramentas/agentes, avaliação, treinamento e integração.
- As seis modalidades das missões, três idiomas (Português, Misto padrão e English), glossário, revisão e simulações da V2.
- Workspace acumulado: respostas incorretas não alteram o artefato; decisões corretas atualizam a construção. Testes didáticos comparam esperado e obtido usando funções cadastradas.
- Oito casos novos de debugging: chave interna, conversão de tipo, retorno ausente, limite invertido, fallback inalcançável, JSON malformado, coleção vazia e denominador da métrica.
- Tutorial de testes com seis etapas: entrada/esperado, positivo, negativo, borda, asserção e vocabulário contextual.
- Fluxos de referência interativos, explicações em três camadas e glossário disponível offline depois do carregamento.
- Evidências de dez competências, sem atribuir nível profissional: apresentado, praticado, acertado e revisão sugerida, com metodologia visível.
- Revisão opcional orientada por erros: revisar uma missão, ver exemplo ou continuar. O retorno conserva o rascunho do projeto.
- “Meus projetos” com exportação Markdown local de projetos concluídos, identificados como didáticos e simulados. Sem upload automático.

## Rodar

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Abra `http://localhost:8000`. O primeiro carregamento precisa de HTTP para obter os arquivos JSON. Não há service worker: recarregar totalmente offline não é garantido. As missões e projetos guiados mantêm suas simulações. Na área “Run Python”, o código do aluno executa localmente em um worker isolado, com limites documentados. O primeiro uso precisa obter ~14 MB de recursos do próprio site; HTTPS ou localhost são necessários para verificação de integridade.

## Persistência e compatibilidade

As missões mantêm `pythonAiTrainerV2`, com migração existente da chave V1. A migração curricular acrescenta `curriculumVersion`, IDs históricos e dicas por missão, preservando XP e conclusões anteriores. Novas missões começam não concluídas. Tentativas e dicas continuam contando após reload; não é possível recuperar o prêmio de primeira tentativa recarregando. Projetos, desafios, tutorial, evidências e seu XP ficam separados em `pythonAiLabV3`. Desafios executáveis usam `pythonExecutableV1`; contratos do planner, `pythonModelLabV1`; percursos de experimentos, `pythonExperimentLearningV1`. O percurso registra etapas consultadas, sem XP ou alegação de treino concluído. Os novos dados não substituem nem recalculam XP antigo. Código livre e saídas não são persistidos automaticamente. Idioma e familiaridade continuam nas chaves anteriores. Tema e unidade usam `trainer-theme` e `trainer-unit-v4`. A V3 importa somente evidências verificáveis do histórico, sem inventar erros ou tentativas ausentes.

Registros danificados são normalizados e uma cópia local `.recovery` é preservada antes da substituição. O reset geral confirmado remove também os dados e cópias de recuperação deste app, preservando chaves de outros aplicativos. Se o armazenamento estiver bloqueado ou sem quota, a interface avisa que a sessão pode não ser salva. Downloads já salvos pelo usuário não são removidos.

## Testes

Na raiz, com Node, Python 3.12 e o servidor HTTP ativo:

```bash
node tests/validate.js
node tests/core.cjs
python3 tests/python-fixtures.py
node tests/projects-core.cjs
node tests/projects-data.cjs
node tests/storage-migration.cjs
python3 tests/projects-python.py
node tests/browser.cjs
node tests/labs-browser.cjs
node tests/projects-browser.cjs
node tests/projects-edge-browser.cjs
node tests/project-evaluation-browser.cjs
node scripts/verify-runtime.cjs
node tests/runtime-core.cjs
node tests/runtime-migration.cjs
python3 tests/runtime-python.py
node tests/runtime-browser.cjs
node tests/runtime-lessons-browser.cjs
node tests/runtime-edge-browser.cjs
node tests/runtime-mobile-browser.cjs
node tests/runtime-language-browser.cjs
node tests/model-lab.cjs
python3 tests/model-notebook.py
node tests/model-lab-browser.cjs
node tests/runtime-memory.cjs
node tests/runtime-races-browser.cjs
python3 tests/notebooks.py
python3 tests/executor.py
python3 tests/security-adversarial.py
node tests/experiments.cjs
node tests/experiments-browser.cjs
node tests/experiments-edge-browser.cjs
```

As suítes de navegador usam Playwright e Chromium já disponíveis no ambiente Codex e verificam toque/layout em 320, 375 e 390 px. A suíte de casos extremos usa 375 px. CPython executa somente soluções e fixtures confiáveis do repositório em desenvolvimento, nunca código recebido do aluno.

Em outro ambiente, uma instalação isolada das ferramentas de teste é possível:

```bash
npm install --prefix /tmp/python-ai-trainer-tests playwright
NODE_PATH=/tmp/python-ai-trainer-tests/node_modules CHROMIUM_PATH=/usr/bin/chromium node tests/projects-browser.cjs
```

Atalho: `node scripts/test.cjs` executa suítes locais. `node scripts/test.cjs --browser`, com o servidor ativo, executa também as suítes de navegador. `--list` lista os comandos sem executá-los.

Playwright não é dependência da aplicação publicada. `CHROMIUM_PATH` pode selecionar um Chromium instalado.

## Estrutura

- `curriculum/engine.js`, `view.js`, `design.css`: matriz de pré-requisitos, trilha, preparação de projetos e identidade visual.
- `curriculum/exercises.json`, `glossary.json`, `units.json`: 105 novas missões, termos e ordem estável de 145 IDs.
- `scripts/build-curriculum.py`: fonte autoral dos novos registros; gerar não substitui a revisão das alternativas.
- `app.js`, `game.js`, `core/`: missões, respostas, XP, persistência, revisão e sessões V2.
- `language.js`, `glossary-v2.json`, `exercises.json`, `labs.*`: conteúdo e laboratórios preservados da V2.
- `projects/engine.js`: estado, validação, navegação, XP, evidências e retomada das atividades.
- `projects/models.js`: transformações determinísticas das soluções cadastradas.
- `projects/catalog.json`, `debugging.json`, `testing.json`, `datasets.json`, `terms.json`: projetos, cenários, tutorial, dados e vocabulário.
- `projects/view.js`, `flow-view.js`, `portfolio.js`, `projects.css`: interface, fluxos e exportação.
- `runtime/`: CPython/Pyodide verificado, isolamento, editor, conteúdo executável e progresso independente.
- `model-lab/`: contratos, exportação de notebooks preparatórios, adaptador simulado e interface de experimentos.
- `experiments/`: contratos compartilhados, percursos bilíngues, notebooks fixos, dados/pesos e medições locais de referência.
- `executor/`: referência Python de operador, CLI, gates, SDK em processo limitado, ledger e validação de artefatos; sem servidor implantado.
- `learning/`: navegação comum, conexões por IDs, recomendações, preparação contextual, projeção de evidências e resumo didático.
- `core/download.js`: downloads locais compartilhados, com falha tratada e limpeza de recursos.
- `tests/`: regressões V1–V2, preservação de conteúdo, estado V3, fixtures e navegador.

O [relatório do runtime anterior](docs/REPORT-RUNTIME-LAB.md) separa execução real, simulações, testes e limites de integração.

Consulte a [arquitetura](docs/ARCHITECTURE.md), a [trilha de aprendizagem](docs/LEARNING-PATH.md), as [diretrizes para cadastrar conteúdo](docs/CONTENT-GUIDELINES.md), a [matriz de compatibilidade](docs/COMPATIBILITY-V3.md) e o [relatório V3](docs/REPORT-V3.md).

## Publicação e limites

GitHub Pages continua configurado para `main`. Nenhuma configuração administrativa deve ser alterada para testar estas branches. Merge e publicação dependem de aprovação explícita; esta reconstrução deve abrir PR de rascunho contra main, preservando PRs anteriores. Recursos são relativos ao documento; o teste `subdirectory-browser.cjs` verifica hospedagem sob prefixo, inclusive WASM e notebooks.

As áreas de missões e projetos usam escolhas, correções e funções previamente cadastradas. A área executável usa Python real, com subconjunto de bibliotecas e limites de tempo/saída. Fluxos anteriores, APIs, custos e o projeto guiado de treinamento permanecem simulados. As novas receitas executam um modelo linear real em CPU, com origem identificada. Concluir o currículo não demonstra competência profissional completa. O portfólio é um registro local de aprendizagem, não certificado de experiência.

Chromium com emulação de toque não equivale a iPhone real. Safari/WebKit e hardware Apple ainda precisam de validação. Recursos JavaScript modernos, como `structuredClone`, exigem Safari moderno. Antes de publicar: validar no Safari/iPhone real e revisar o consumo de memória do WASM. Integrações de voz, professor opcional, APIs externas de modelos e backend hospedado permanecem fora desta missão.


## Experimentos e executor de referência

Os dois notebooks executam de verdade um modelo linear pequeno, com stdlib e dados sintéticos incluídos. Não são LLMs. `python3 tests/notebooks.py` verifica os dois completos em CPU; `python3 tests/executor.py` testa o lifecycle com SDK falso e artefatos locais reais, sem conta Kaggle.

```bash
python3 -m executor.cli validate --job experiments/intent-inference-job.json
python3 -m executor.cli prepare --job experiments/intent-inference-job.json --workspace ../python-ai-experiments-private
python3 -m executor.cli local --job experiments/intent-inference-job.json --workspace ../python-ai-experiments-private
```

O workspace do executor é privado e deve ficar fora de qualquer diretório servido por HTTP; caminhos dentro deste repositório são recusados. Operações remotas continuam desativadas e dependem de autorização futura separada, SDK fixado e autenticação no ambiente do operador. Não há credencial no frontend. Veja [executor](executor/README.md), [capacidades Kaggle verificadas](docs/KAGGLE-INTEGRATION.md), [matriz de qualidade](docs/QUALITY-AUDIT.md) e [relatório de entrega](docs/REPORT-KAGGLE-EXECUTION.md).

## Kaggle End-to-End preparado

A infraestrutura Kaggle anterior foi preservada. O Laboratório IA exporta pacote único para o executor separado; a CLI exige autorização do notebook/configuração/conta exatos, reconcilia versões após envio incerto e gera relatórios importáveis com origem declarada. Nenhum job remoto foi executado. Veja [primeiro smoke CPU](docs/KAGGLE-FIRST-RUN.md) e [auditoria/limites](docs/KAGGLE-END-TO-END-AUDIT.md).
