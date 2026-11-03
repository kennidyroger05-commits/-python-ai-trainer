# Python AI Trainer V1.5

Base preservada: `7fe0b8099c8e63e0f96a4fd00a3a921293e63d23`.
Branch: `feature/v1-5-learning`.

## Entrega

15 missões originais: 3 de montagem, 5 de leitura, 6 de previsão e 1 de identificação de erro. As cinco da V1 preservam IDs, enunciados e respostas. A progressão e os registros existentes permanecem na mesma chave de localStorage.

As dez novas missões apresentam comparação, if, else/fallback, dicionário, acesso por chave, nomes em inglês, função, return e dois exercícios integradores. Os pré-requisitos são explícitos e cada missão nova introduz no máximo uma unidade conceitual; as integrações reutilizam o conteúdo anterior. Scores são contextualizados como pontuações, sem presumir calibração probabilística.

Três idiomas com traduções estáticas: Português, Misto (padrão) e English. A troca conserva código, resposta, dicas e estado do simulador. A tradução só é omitida no Misto quando o usuário marca explicitamente o termo como conhecido.

12 termos bilíngues: variable/variável, print/mostrar, maximum/máximo, index/índice, comparison/comparação, condition/condição, fallback/alternativa, dictionary/dicionário, key/chave, model/modelo, function/função e return/retornar. Cada termo tem definição, exemplo e uso em IA, acessível ao toque e sem rede após o carregamento.

Simulações predefinidas nas missões 3 (max), 8 (fallback) e 14 (seleção em múltiplas linhas). Controles de avanço, retorno e reinício, destaque da linha, variáveis e saída. O passo else é uma transição explicativa de controle. Nenhum Python é executado no navegador.

## Validação

- `node tests/validate.js`: 15 IDs/títulos únicos; quatro modalidades; respostas corretas e incorretas; dados, pré-requisitos, idiomas e glossário; preservação dos cinco exercícios da base; XP, persistência, reset de módulo e entradas inválidas.
- `python3 tests/python-fixtures.py`: resultados das 15 missões conferidos com CPython; IndexError intencional; estados intermediários e finais das três simulações conferidos por rastreamento de linhas.
- `node tests/browser.cjs`: fluxos das 15 missões em 320, 375 e 390 px com toque no Chromium. Traduções e dicas; resposta/código preservados; glossário offline; todas as etapas das três simulações; navegação, XP sem duplicação, persistência, reinício de módulo, reset confirmado e cancelado; sem campos de digitação e sem transbordamento horizontal. Capturas inspecionadas no ambiente.
- Sintaxe JavaScript, JSON e `git diff --check` passaram.

## Arquivos

Alterados: `app.js`, `game.js`, `index.html`, `style.css`, `exercises.json`, `README.md`, `tests/validate.js`, `tests/browser.cjs`.
Criados: `language.js`, `tests/python-fixtures.py`, `tests/v1-fixture.json`, este relatório.

## Limitações e revisão

Testes mobile foram realizados em Chromium com emulação de viewport/toque, sem Safari ou iPhone real. O WebKit do Playwright não está instalado. Não há teste de proficiência linguística: familiaridade é declarada pelo aluno. Validação de blocos aceita apenas soluções explícitas cadastradas, com tolerância a espaços externos; não interpreta equivalências gerais de Python. Não há migração automática de progresso do antigo MVP de dez questões; a base compacta V1 é preservada.

A criação do PR via CLI ficou bloqueada: acesso a `https://api.github.com` retornou Forbidden e o domínio não está permitido na política ativa. A inclusão de `api.github.com` foi salva no rascunho das configurações do ambiente; salvar o rascunho não aplica nem publica essa mudança. Não houve merge nem mudança na configuração do GitHub Pages.

Próxima etapa recomendada: revisão humana no Safari/iPhone, com iniciantes, antes de aprovar o PR. Depois, avaliar clareza dos termos técnicos e dos passos simulados.
