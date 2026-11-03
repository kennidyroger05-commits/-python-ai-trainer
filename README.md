# Python AI Trainer

Um jogo curto, sem dependências externas, para praticar Python aplicado a scores e seleção de modelos. A versão atual tem cinco missões em HTML, CSS e JavaScript puro. Não executa Python no navegador: respostas são verificadas contra soluções explícitas e opções cadastradas em `exercises.json`.

## Missões

1. Guardar um score em uma variável.
2. Mostrar o score com `print()`.
3. Prever a seleção do maior score com `max()`.
4. Ler o segundo modelo de uma lista usando índice.
5. Encontrar um índice fora dos limites da lista.

Cada missão apresenta duas dicas, explicação, aplicação em IA e legenda contextual. O app oferece montagem por blocos, previsão, leitura e identificação de erro. O progresso e o XP ficam no `localStorage` do navegador.

## Rodar localmente

Na raiz do projeto, execute:

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000`. O projeto também é compatível com GitHub Pages, servindo os arquivos estáticos da raiz.

## Validar

```bash
node tests/validate.js
node tests/browser.cjs
```

O teste de navegador usa Playwright e Chromium já disponíveis no ambiente de desenvolvimento. Não são dependências da aplicação publicada.

## Estrutura

- `index.html`: interface do jogo.
- `style.css`: layout responsivo e controles de toque.
- `app.js`: renderização e eventos da interface.
- `game.js`: validação das respostas e funções puras de progresso e XP.
- `exercises.json`: conteúdo das cinco missões.
- `tests/`: validação de conteúdo, lógica e interação no navegador.

## Próximo passo

Depois de revisar as cinco missões com estudantes iniciantes, ampliar o conteúdo em pequenos lotes e validar cada lote antes de publicar.

## V1.5 em desenvolvimento

A branch V1.5 amplia o jogo para **15 missões**: 3 de montagem, 5 de leitura, 6 de previsão e 1 de identificação de erro. As cinco missões da V1 mantêm IDs, conteúdo e respostas; a chave de progresso permanece `pythonAiTrainerV1`.

O seletor oferece Português, Misto (padrão) e English. As traduções são cadastradas em `exercises.json` e `language.js`. Trocar o idioma mantém a resposta selecionada ou montada. No modo Misto, traduções só deixam de aparecer junto ao termo depois de o aluno marcar explicitamente que o conhece. Elas continuam disponíveis ao toque no glossário. Idioma e familiaridade ficam em chaves próprias do localStorage.

As missões 3, 8 e 14 oferecem simulação didática com estados predefinidos. É possível avançar, voltar e reiniciar; não existe interpretador Python no app. A marcação de `else` representa uma transição de controle, não uma instrução executável. As variáveis e saídas são snapshots, sem executar código enviado pelo aluno.

```bash
node tests/validate.js
python3 tests/python-fixtures.py
node tests/browser.cjs
```

O teste Python usa CPython apenas no desenvolvimento para conferir os exemplos confiáveis do repositório e os estados intermediários. O teste de navegador requer servidor local na porta 8000 e Playwright com Chromium (`CHROMIUM_PATH` pode selecionar o executável). A aplicação publicada continua sem dependências externas.

`language.js` contém textos da interface e o glossário bilíngue. `tests/v1-fixture.json` registra a base preservada. Consulte `REPORT-V1.5.md` para resultados e limitações.
