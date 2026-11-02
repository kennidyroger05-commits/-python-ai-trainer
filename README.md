# Python AI Trainer

MVP de uma web app inspirada em Duolingo para aprender Python aplicado a IA, automação e resolução de problemas.

## Objetivo

Treinar Python por meio de missões curtas em que o usuário monta código usando blocos clicáveis. O foco é aprender conceitos úteis para IA: scores, confiança, modelos, fallback, listas, dicionários e respostas estruturadas.

## Tecnologias

- HTML
- CSS
- JavaScript puro
- JSON
- localStorage

## Arquivos

- `index.html` — interface principal
- `style.css` — layout responsivo e mobile-first
- `app.js` — lógica do jogo, XP e progresso
- `exercises.json` — banco inicial de 10 missões

## Como usar localmente

Por segurança do navegador, `exercises.json` deve ser carregado por HTTP. Uma forma simples é executar um servidor local dentro da pasta do projeto.

Com Python instalado:

```bash
python -m http.server 8000
```

Depois abra:

```text
http://localhost:8000
```

## GitHub Pages

O projeto foi preparado para funcionar como site estático pelo GitHub Pages.

No GitHub:

1. Abra **Settings** do repositório.
2. Entre em **Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**.
4. Selecione a branch `main`.
5. Selecione a pasta `/ (root)`.
6. Salve.

Depois de alguns instantes o GitHub mostrará a URL pública do site.

## Conteúdo do MVP

As 10 primeiras missões introduzem gradualmente:

1. variáveis
2. listas
3. `print()`
4. `max()`
5. índices
6. comparações
7. `if`
8. strings
9. dicionários
10. acesso a valores de dicionário

## Próximas etapas planejadas

- modo leitura de código
- repetição adaptativa de conceitos com erro
- níveis e trilhas
- JSON e APIs
- tratamento de erros
- tool calling
- roteamento e fallback
- agentes simples
- FastAPI

O MVP propositalmente não possui backend, login, banco de dados ou geração de exercícios por IA.
