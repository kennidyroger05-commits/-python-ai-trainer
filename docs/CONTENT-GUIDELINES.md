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

# Cadastrar uma atividade V3

Projetos, desafios e tutorial compartilham o motor de `projects/engine.js`, com `kind` igual a `project`, `debug` ou `testing`. Os arquivos são `catalog.json`, `debugging.json` e `testing.json`.

## Estrutura

Uma atividade tem ID, título, objetivo, contexto, limitações e resultado nos três idiomas, `initialArtifact`, `solutionCode`, `steps` e `traces`. Projetos podem ter `cases`; desafios têm código original, chamada que reproduz o sintoma, evidência produzida por CPython e testes.

Cada etapa deve conter:

- ID estável; `requires` com IDs anteriores da mesma atividade.
- Título, enunciado, duas dicas, explicação e camadas `definition`, `example`, `professional`, em `pt`, `mixed`, `en`.
- Três escolhas com IDs próprios, rótulos nos três idiomas e um `correctId`. O ID, não a tradução ou posição, é a resposta.
- Conceito principal, lista de competências, termos do glossário e ID de missão apropriada para revisão opcional.
- Um `effect` que atualiza o artefato compartilhado somente após validação. Evite etapas sem relação com a solução final.

Se a etapa exigir execução dos casos cadastrados, use `requiresTests: true`. O resultado do teste precisa corresponder à assinatura da configuração atual. A resposta correta não deve ser dedutível apenas pela presença de uma palavra-chave. Teste reparos que parecem plausíveis em uma entrada, mas falham em bordas ou dados inválidos.

## Fluxos

`traces` contém `id`, título e `nodes`. Cada node tem ID, título, entrada, saída, explicação e marca de falha opcional. Os IDs de fluxo e node permitem retomar sem depender de títulos ou índices. Dados são snapshots previamente validados; identifique claramente que é um fluxo de referência, distinto do rascunho atual.

## Glossário, idiomas e explicações

`projects/terms.json` usa o mesmo formato de sete campos do glossário anterior: inglês, português, definição PT/EN, exemplo e aplicação PT/EN. Não sobrescreva termos existentes da V2; crie um ID novo quando a definição contextual for diferente. Forneça legenda curta também para novas construções de Python nas soluções de referência. As camadas devem ter propósitos distintos e não transformar a etapa em uma parede de texto.

## Debugging e fixtures

Reproduza `sourceEvidence` com CPython. Uma falha lógica pode ter resultado errado sem exceção. Registre pelo menos casos normais e extremos relevantes e duas `incorrectSolutions` que os testes rejeitem. Use chamadas confiáveis do repositório em desenvolvimento; não reutilize esse executor de fixtures CPython como endpoint remoto para entradas do aluno. A área opcional de execução utiliza isolamento próprio no dispositivo.

`tests/projects-python.py` confronta soluções e evidências com CPython e compara os modelos JavaScript. `tests/projects-core.cjs` percorre os estados e escolhas. `projects-data.cjs` rejeita estruturas mutadas inválidas e verifica exportação/evidências. `storage-migration.cjs` testa migração/corrupção. As suítes de navegador precisam completar atividades, retomar rascunhos, navegar fluxos e baixar o relatório de fato.

## Competências e portfólio

Associe etapas somente às competências realmente praticadas. O motor distingue apresentação, tentativa, acerto e revisão sugerida; não atribua “especialista” ou empregabilidade. Contadores históricos ausentes não devem ser estimados.

A exportação usa etapas concluídas, artefato e testes registrados. Deve declarar simulação, critério, limitações e ausência de comprovação de experiência profissional. Não exporte projeto parcial como concluído, não invente métricas e não faça upload. Identificadores técnicos e código permanecem estáveis entre idiomas para rastreabilidade.

Para um projeto de domínio novo, acrescente um adaptador puro em `projects/models.js` para workspace/testes e vincule seu dataset no exportador. Isso isola a lógica de negócio: o motor e a tela genérica continuam usando IDs e não precisam de um novo fluxo de interface. Compare o adaptador com a solução CPython e não rotule uma transformação não implementada como executada.


## Cadastrar desafio executável

Adicione um ID estável a `runtime/lessons.json`. Forneça `group`, títulos/objetivo/explicação em `pt/mixed/en`, duas dicas por idioma, `legend` curta, conceito, IDs `requires` das missões e termos existentes. `projectId` é opcional e referencia projeto real do catálogo, nunca um título/índice.

Defina `template` com um `___`, três `patches` distintos, `initialPatchId` e `starter` errado mas útil para depurar. `blocks` deve montar uma solução revisada. Disponibilizar uma construção guiada não substitui testes de comportamento. Mantenha o exemplo dentro do código visível, sem anexar chamadas invisíveis.

`demoGlobals` fornece entradas visíveis às atividades sem função. `tests` contém um caso `role: demo` e pelo menos dois `role: validation`, com IDs únicos. Tipo `call`: nome de função, args e expected; `variable`: name, globals e expected; `stdout`: expected. O contrato deve dizer como tratar vazio, ausência, limite, tipos e desempates relevantes. Não suponha que um caso aprovado valida toda solução.

Inclua solução confiável em `tests/runtime-solutions.json` (somente testes de desenvolvimento; a UI não carrega esse arquivo). Rode `runtime-core.cjs`, `runtime-python.py` e `runtime-lessons-browser.cjs`: CPython e WASM devem aceitar solução/alternativas equivalentes e rejeitar ambas as peças incorretas. A comparação é de resultado real, com tolerância numérica explícita, não presença de palavras.

`runtime/terms.json` usa os sete campos bilíngues existentes e IDs com prefixo `rt-`, sem sobrescrever glossário antigo. Misto mantém título técnico com tradução e explicações acessíveis. Não traduza nomes de funções ou mude respostas por idioma.

## Contratos de experimentos

Use `model-lab/contracts.js` para o planner anterior; valide versões, campos, modo e proveniência. Fixtures simuladas devem ter valores consistentes e origem explícita em métricas/logs/artefatos. Nunca invente duração real, treinamento executado ou inferência. Para novo dataset do mock, amplie também o adaptador e casos de teste. O notebook desse planner é apenas preparação, testada em CPython; as receitas executáveis abaixo têm contrato próprio. Consulte `MODEL-LAB.md` e `KAGGLE-INTEGRATION.md`.

## Receitas reais de experimentos

Uma receita em `experiments/` tem fonte/dados/modelo com hashes em `assets.json`, contrato fechado em JavaScript e Python, notebook autocontido e testes de CPU completos. Não aceite campos de código, URL ou caminho arbitrários no job. Ao mudar uma fonte, atualize seu hash, gere os notebooks e compare os builders com `node tests/experiments.cjs`; o runtime do aluno não é o executor de notebooks.

Registre títulos, objetivos, etapas, falhas, revisão e termos nos três idiomas. Use os dez IDs estáveis do percurso, mantendo distinção entre consulta e execução. Vincule uma prática Python existente por conceito; não prometa domínio por abrir um relatório. Dicas e conceitos de cada exercício continuam no catálogo original.

Inclua entradas normais e inválidas, resultados calculados em CPU, reprodutibilidade com seed, separação treino/validação/teste e exportação de artefatos. `tests/notebooks.py` deve executar todas as células de código, não apenas validar JSON. `tests/security-adversarial.py` precisa rejeitar métricas/splits/checkpoints adulterados. Relatórios de referência são gerados por `scripts/record-local-experiments.py`, com origem local explícita; jamais edite números para fabricar um resultado desejado.

Para novas receitas, amplie explicitamente a whitelist e o validador de artefatos, testes de falha e docs de hardware/dependências. A validação numérica atual foi feita para um modelo minúsculo: não generalize esse replay para jobs pesados sem outra estratégia. Acesso remoto ou GPU requer autorização independente e nunca decorre de uma opção no frontend público.
