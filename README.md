# Python AI Trainer — V2 em desenvolvimento

Jogo mobile de Python aplicado a IA e inglês técnico, com 40 missões originais, seis modalidades, depuração, revisão e laboratórios simulados. HTML, CSS e JavaScript; sem backend, banco, frameworks ou APIs externas.

A V2 está em `feature/v2-debug-training`, baseada em `feature/v1-5-learning`. Não está publicada. `main` e o PR #1 não são integrados por este trabalho.

## Aprendizado e funcionalidades

- Montar código, prever saída, ler, encontrar erros, corrigir linhas e completar trechos, sem digitação obrigatória.
- Português, Misto (padrão) e English; resposta e código preservados ao trocar idioma.
- Glossário bilíngue com 37 termos, duas dicas por missão e explicações práticas.
- Seis traces didáticos com variáveis, saída, fluxo de condições/funções e erro.
- Seis cenários de debugging: SyntaxError, TypeError, KeyError, IndexError, NameError e erro lógico.
- Cinco fluxos de IA fictícios: classificação, extração JSON, roteamento, fallback e erro HTTP.
- XP por ID, progresso local, migração da V1/V1.5, reinício de módulo e reset confirmado.
- Revisões em lotes finitos de até três conceitos, respeitando pré-requisitos e desempenho.
- Layout para toque e redução de movimento.

## Módulos

| Trilha | Assunto | Quantidade |
| --- | --- | ---: |
| A | Fundamentos aplicados | 7 |
| B | Decisões e roteamento | 3 |
| C | Dados de IA | 6 |
| D | Funções e ferramentas | 4 |
| E | APIs simuladas | 3 |
| F | Debugging | 7 |
| G | Fluxos de IA | 6 |
| H | Treinamento e avaliação | 4 |

Distribuição por modalidade: 3 montagem, 16 previsão, 10 leitura, 1 identificação de erro, 6 correção e 4 completar. O percurso revisita módulos mantendo as 15 missões-base; consulte [caminho pedagógico](docs/LEARNING-PATH.md).

## Rodar

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Abra `http://localhost:8000`. É necessário HTTP para carregar os arquivos JSON. Depois do carregamento, glossário, missões e laboratórios funcionam sem rede; não há suporte a recarregamento offline completo por service worker.

## Testes

Na raiz, com Node e Python 3.12:

```bash
node tests/validate.js
node tests/core.cjs
python3 tests/python-fixtures.py
node tests/browser.cjs
node tests/labs-browser.cjs
```

As duas últimas suítes exigem o servidor local, Playwright e Chromium. No ambiente Codex já estão disponíveis. Fora dele, uma opção de instalação isolada é:

```bash
npm install --prefix /tmp/python-ai-trainer-tests playwright
NODE_PATH=/tmp/python-ai-trainer-tests/node_modules CHROMIUM_PATH=/usr/bin/chromium node tests/browser.cjs
NODE_PATH=/tmp/python-ai-trainer-tests/node_modules CHROMIUM_PATH=/usr/bin/chromium node tests/labs-browser.cjs
```

`CHROMIUM_PATH` seleciona o navegador instalado. Playwright é ferramenta de desenvolvimento e não é enviado como dependência do site. CPython só executa fixtures confiáveis do repositório durante os testes, nunca respostas de usuários.

## Estrutura e conteúdo

- `app.js`: interface e eventos do jogo.
- `game.js`: respostas e XP.
- `core/`: conteúdo, sessões, persistência/revisão e traces.
- `language.js`, `glossary-v2.json`: idiomas e termos.
- `exercises.json`: 40 missões e metadados de debugging/simulação.
- `labs.js`, `labs.json`: interface e cinco fluxos de IA.
- `tests/`: lógica, mutações inválidas, migração, fixtures Python e interação mobile.

Para adicionar missões, traduções e traces, siga [as regras de conteúdo](docs/CONTENT-GUIDELINES.md). A [arquitetura](docs/ARCHITECTURE.md) explica estado, persistência e limites. Os IDs anteriores não devem ser renomeados. Novas traduções usam a mesma resposta e o mesmo código.

## GitHub Pages

O site funciona servido pela raiz do repositório. A configuração atual de Pages permanece na branch `main`. A V2 só deve ser integrada e publicada após revisão explícita; este trabalho envia apenas uma branch e solicita um PR de rascunho contra V1.5.

## Limitações e próximos passos

Simulações usam snapshots predefinidos. Validação aceita soluções cadastradas e substituições específicas; não interpreta Python arbitrário nem prova equivalência geral de programas. Dados e respostas de APIs são fictícios. Os testes mobile usam Chromium; Safari/iPhone real ainda precisa ser validado. As preferências e o histórico são locais ao navegador.

Antes de publicar: revisar no Safari, acompanhar iniciantes e aprovar conteúdo/PRs. Professor opcional, voz, executor isolado, APIs reais, Kaggle/Colab e experimentos de modelos são possibilidades futuras, sem integrações ou botões nesta versão. Consulte [relatório V2](docs/REPORT-V2.md).
