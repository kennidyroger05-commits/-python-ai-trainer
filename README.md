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
