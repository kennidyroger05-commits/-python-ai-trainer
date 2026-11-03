# Como cadastrar conteúdo

1. Use um ID estável, título próprio e código que resolva um problema concreto de IA.
2. Cadastre `track` A–H, `module`, `concept`, `difficulty`, `requires` e `introduces` (no máximo um conceito principal novo). Pré-requisitos devem existir antes da missão no arquivo.
3. Escreva enunciado, contexto, duas dicas progressivas, explicação e aplicação em IA. Não confunda score com probabilidade calibrada.
4. Cadastre Português, Misto e English em `translations`. O idioma nunca altera código, respostas, ordem das alternativas ou dificuldade.
5. Referencie termos de `language.js` ou `glossary-v2.json`. Cada termo tem inglês, português, definições curtas nos dois idiomas, exemplo e aplicação em IA. Legendas devem caber em uma frase.

## Modalidades

- `build`: `blocks` reutilizáveis e `answers` explícitas. Não aceite palavras-chave soltas. Se existirem alternativas equivalentes, cadastre e teste cada uma.
- `predict`, `read`, `error`: três `options` distintas e `correct` como índice de 0 a 2. Previsões devem coincidir com o resultado real da fixture Python.
- `fix`, `complete`: código original, `replacement.target`, três opções de código, índice correto e `solutionCode`. A troca da opção correta deve produzir exatamente a solução verificada. Teste também o código produzido pelas duas alternativas incorretas.

Código incompleto e código que falha devem ser identificados como tais. Para debugging, registre `debug.kind`, sintoma, duas opções de investigação e índice da investigação adequada. Mensagens de exceção devem vir de CPython e ser verificadas em testes, incluindo a versão utilizada. Erros lógicos devem declarar resultado observado e esperado, mesmo quando não há exceção.

## Traces

`simulation` contém `code` e `steps`. Cada passo informa linha com índice zero, snapshot independente de variáveis, lista cumulativa de saída, explicação nos três idiomas e `error` opcional com tipo e mensagem. Marque transições de controle como didáticas. Para funções, explique escopo e retorno. Nunca gere os estados no navegador a partir de código do aluno.

## Fixtures e testes

Os novos exemplos Python ficam em `tests/v2-python-fixtures.json`, com código confiável do repositório e saída esperada. Casos quebrados incluem classe da exceção ou saída lógica incorreta. `tests/python-fixtures.py` executa somente esses exemplos estáticos em desenvolvimento; não é parte do produto. Revise qualquer novo código antes de incluí-lo.

Execute validação, testes de core, fixtures e as duas suítes de navegador. Uma alternativa incorreta que também atende ao enunciado deve ser substituída ou a questão reformulada. A verificação automática apoia a revisão pedagógica; não prova sozinha que o texto é claro ou que o aluno aprendeu.
