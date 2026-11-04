# Python AI Trainer — Python Runtime & AI Model Lab

Aprendizado de Python aplicado a IA e inglês técnico por missões e projetos guiados. A V3 conserva as **40 missões da V2** e acrescenta quatro projetos, oito desafios de debugging e uma introdução a testes. Funciona como site estático, com HTML, CSS e JavaScript, sem backend, framework ou APIs de modelos.

Desenvolvimento contínuo em `feature/python-runtime-kaggle-lab`, baseado em `feature/v3-python-ai-lab`. Nenhuma versão desta branch foi publicada ou integrada. `main` e os PRs anteriores permanecem preservados.

A expansão atual acrescenta **14 desafios executáveis**, editor por blocos/trechos/linhas/código livre e **CPython real no navegador com Pyodide**, carregado sob demanda. O **AI Model Lab** prepara contratos/notebooks e demonstra um adaptador Kaggle simulado; não envia jobs, não autentica contas e não executa modelos ou treinamento real. Veja [runtime](docs/PYTHON-RUNTIME.md), [Kaggle](docs/KAGGLE-INTEGRATION.md), [Model Lab](docs/MODEL-LAB.md) e [segurança](docs/SECURITY.md).

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

Abra `http://localhost:8000`. O primeiro carregamento precisa de HTTP para obter os arquivos JSON. Não há service worker: recarregar totalmente offline não é garantido. As missões e projetos guiados mantêm suas simulações. Na área “Run Python”, o código do aluno executa localmente em um worker isolado, com limites documentados. O primeiro uso precisa obter ~12 MB de recursos do próprio site; HTTPS ou localhost são necessários para verificação de integridade.

## Persistência e compatibilidade

As missões mantêm `pythonAiTrainerV2`, com migração existente da chave V1. Projetos, desafios, tutorial, evidências e seu XP ficam separados em `pythonAiLabV3`. Desafios executáveis usam `pythonExecutableV1`; contratos de experimentos, `pythonModelLabV1`. Os novos dados não substituem nem recalculam XP antigo. Código livre e saídas não são persistidos automaticamente. Idioma e familiaridade continuam nas chaves anteriores. A V3 importa somente evidências verificáveis do histórico, sem inventar erros ou tentativas ausentes.

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
```

As suítes de navegador usam Playwright e Chromium já disponíveis no ambiente Codex e verificam toque/layout em 320, 375 e 390 px. A suíte de casos extremos usa 375 px. CPython executa somente soluções e fixtures confiáveis do repositório em desenvolvimento, nunca código recebido do aluno.

Em outro ambiente, uma instalação isolada das ferramentas de teste é possível:

```bash
npm install --prefix /tmp/python-ai-trainer-tests playwright
NODE_PATH=/tmp/python-ai-trainer-tests/node_modules CHROMIUM_PATH=/usr/bin/chromium node tests/projects-browser.cjs
```

Atalho: `node scripts/test.cjs` executa 14 suítes locais. `node scripts/test.cjs --browser`, com o servidor ativo, executa também onze suítes de navegador. `--list` lista os comandos sem executá-los.

Playwright não é dependência da aplicação publicada. `CHROMIUM_PATH` pode selecionar um Chromium instalado.

## Estrutura

- `app.js`, `game.js`, `core/`: missões, respostas, XP, persistência, revisão e sessões V2.
- `language.js`, `glossary-v2.json`, `exercises.json`, `labs.*`: conteúdo e laboratórios preservados da V2.
- `projects/engine.js`: estado, validação, navegação, XP, evidências e retomada das atividades.
- `projects/models.js`: transformações determinísticas das soluções cadastradas.
- `projects/catalog.json`, `debugging.json`, `testing.json`, `datasets.json`, `terms.json`: projetos, cenários, tutorial, dados e vocabulário.
- `projects/view.js`, `flow-view.js`, `portfolio.js`, `projects.css`: interface, fluxos e exportação.
- `runtime/`: CPython/Pyodide verificado, isolamento, editor, conteúdo executável e progresso independente.
- `model-lab/`: contratos, exportação de notebooks preparatórios, adaptador simulado e interface de experimentos.
- `tests/`: regressões V1–V2, preservação de conteúdo, estado V3, fixtures e navegador.

O [relatório desta expansão](docs/REPORT-RUNTIME-LAB.md) separa execução real, simulações, testes e limites de integração.

Consulte a [arquitetura](docs/ARCHITECTURE.md), a [trilha de aprendizagem](docs/LEARNING-PATH.md), as [diretrizes para cadastrar conteúdo](docs/CONTENT-GUIDELINES.md), a [matriz de compatibilidade](docs/COMPATIBILITY-V3.md) e o [relatório V3](docs/REPORT-V3.md).

## Publicação e limites

GitHub Pages continua configurado para `main`. Nenhuma configuração administrativa deve ser alterada para testar estas branches. Merge e publicação dependem de aprovação explícita; esta expansão deve abrir PR de rascunho contra V3, preservando PRs anteriores.

As áreas de missões e projetos usam escolhas, correções e funções previamente cadastradas. A área executável usa Python real, com subconjunto de bibliotecas e limites de tempo/saída. Fluxos didáticos, modelos, APIs, custos e treinamento permanecem simulados. Trinta ou quarenta respostas certas não demonstram competência profissional completa. O portfólio é um registro local de aprendizagem, não certificado de experiência.

Chromium com emulação de toque não equivale a iPhone real. Safari/WebKit e hardware Apple ainda precisam de validação manual. Recursos JavaScript modernos, como `structuredClone`, exigem Safari moderno. Antes de publicar: validar no Safari/iPhone real e revisar o consumo de memória do WASM. Integrações de voz, professor opcional, modelos reais e backend autenticado permanecem fora desta missão.
