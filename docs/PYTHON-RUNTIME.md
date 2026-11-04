# Python real no navegador

O motor usa Pyodide 0.29.3 com CPython 3.13.2 em WebAssembly. A versão foi executada e observada no Chromium. Os arquivos oficiais, sem alteração, ficam em `runtime/vendor/pyodide`; tamanhos, SHA-256 e SRI original estão em `runtime/manifest.json`.

São aproximadamente 12.3 MB de recursos, carregados e verificados **sob demanda**, apenas após executar Python. Não há CDN nem código do aluno enviado a terceiros. O cache HTTP normal e uma cópia dos recursos verificados na memória podem evitar novos downloads; não há promessa de disponibilidade offline irrestrita.

## Isolamento e ciclo de vida

O app cria um iframe `sandbox="allow-scripts"`, sem `allow-same-origin`, e dentro dele um worker clássico. O iframe tem origem opaca e CSP `connect-src 'none'`. Os recursos públicos do runtime são transferidos em memória; o fetch de bootstrap só pode ler WASM/stdlib já verificados. O código não recebe armazenamento do app, credenciais, DOM ou APIs de rede. O Python recebe uma ponte JS vazia e uma política restrita de imports/builtins. Isso é defesa em camadas, não uma alegação de sandbox Python absoluta ou proteção contra toda vulnerabilidade de navegador/WebAssembly.

Cada clique de execução cria um novo worker/interpretador. **Cada caso de validação também usa um worker novo**, incluindo estado de módulos e builtins. Resultados e progresso atravessam um canal com token aleatório, validação de origem/source e renderização como texto. O worker termina após concluir. Interromper ou exceder o tempo encerra o worker; reiniciar permite um novo programa sem estado anterior.

Limites atuais: 24 mil caracteres de código; stdout/stderr limitados a 32 mil caracteres; cinco segundos de execução por caso, além da inicialização. O watchdog fica na interface principal. Não existe limite rígido de memória por código: uma alocação excessiva ainda pode pressionar o navegador, principalmente no celular. Use programas pequenos. Não há instalação de pacotes, acesso a rede, arquivos do dispositivo ou input interativo.

Bibliotecas permitidas: json, math, re, statistics, collections, itertools, functools e decimal. Classes/introspecção interna, pontes JS e módulos não previstos não são objetivos deste ambiente inicial. A política pode rejeitar Python válido fora desse subconjunto; a interface deve distinguir política de erro real de Python.

## Saídas e testes

`runtime/runner.py` compila e executa código real. Captura stdout, stderr, SyntaxError, exceções e AssertionError. Validação chama funções/lê variáveis e executa asserções reais para entradas cadastradas. Não compara o texto da solução. Números usam tolerância explícita de 1e-9; booleanos não são aceitos como números por equivalência acidental.

Testes demonstrativos e de validação devem ser identificados. Dados no frontend não são segredos nem mecanismo de certificação contra adversários. O verificador não deve ser tratado como sistema antifraude. Um resultado é associado ao snapshot de código executado; editar depois não prova que o novo rascunho foi validado.

Verificação do motor: `node scripts/verify-runtime.cjs` e, com servidor local, `node tests/runtime-browser.cjs`. A auditoria inclui programa real, JSON/função/assert, erros, limpeza por VM, timeout, cancelamento, recuperação e rejeição de recurso corrompido.

## Editor e integração pedagógica

Há quatro formas opcionais de trabalhar no mesmo desafio: blocos tocáveis, completar um trecho entre alternativas, editar/adicionar/apagar linhas e textarea de código livre. Nenhum modo recebe foco automático de digitação. Cada modo conserva seu rascunho em memória ao alternar idioma/tela. Restaurar o exemplo pede confirmação e conserva o progresso; reiniciar o ambiente descarta recursos em memória e encerra a execução.

As 14 atividades ficam em `runtime/lessons.json`, com `starter`, `template`, peças, blocos, objetivo/legenda/hints/explicação nos três idiomas, conceitos, termos, pré-requisitos, entradas demonstrativas e testes. `runtime/content.js` valida contratos; `tests/runtime-solutions.json` contém soluções confiáveis de desenvolvimento e não é carregado pela UI.

Cada teste tem ID e papel `demo` ou `validation`. Pode conferir variável com entradas `globals`, chamar função com `args` ou comparar stdout. O exemplo demonstrativo é inspecionável; outras entradas aparecem como casos de validação, sem despejar a solução completa no feedback. São testes públicos limitados, não testes secretos. stdout de uma validação reúne os prints efetivamente produzidos em cada caso, antes das chamadas de verificação.

O resultado mostra snapshot do código, versão Python observada, stdout/stderr, classificação da falha, resultados por caso e duração aproximada do processamento Python. Download/inicialização ficam fora dessa duração. A saída é entregue ao terminar, sem console interativo/streaming. Um timeout/interrupção não produz traceback do programa encerrado. Falha de integridade/inicialização tem rótulo distinto de erro Python; uma `assert` do aluno que falha tem traceback real, enquanto a comparação incorreta de um resultado recebe `wrong_result`.

Os quatro projetos preservam seus percursos e oferecem uma prática Python opcional após cinco etapas ou na conclusão: roteador → `exec-router`, cliente → `exec-json`, avaliação → `exec-evaluation`, treinamento simulado → `exec-checkpoint`. A prática não transforma a API simulada em serviço real nem a leitura de logs em treinamento real.

## Progresso e evidência

`pythonExecutableV1` guarda tentativas de validação, dicas, testes aprovados/falhos/não executados, última classificação, primeira conclusão, último snapshot aprovado (hash, data, versão e quantidade de testes) e ledger independente. Não grava fonte ou stdout. Cancelamento, falha de inicialização e política não são pontuados como erro conceitual; uma validação executada com erro/timeout conta como tentativa.

A primeira aprovação de todos os casos concede 10 XP, 5 após tentativa anterior ou 2 com dica. O ID no ledger impede duplicação em novas execuções, troca de editor ou recarga. Falha posterior não apaga a evidência do último snapshot aprovado. O portfólio simulado pode anexar essa evidência em seção explicitamente real/local. Fonte livre ainda não salva deve ser copiada pelo usuário antes de recarregar; não há autosave de código.

O código aprovado alimenta evidências de conceito do Lab, sem atribuir domínio, empregabilidade ou treinamento de modelo realizado. A evolução das chaves é aditiva: V1/V1.5/V2/V3 continuam sendo lidas pelos carregadores anteriores. Testes verificam preservação literal dos registros anteriores ao usar os novos módulos.

## Testar e atualizar

- `node scripts/test.cjs`: 14 suítes locais de integridade, lógica, migração e CPython.
- Com servidor HTTP e Playwright/Chromium, `node scripts/test.cjs --browser`: acrescenta onze suítes de interface; inclui CPython WASM real, todos os desafios certos/errados, isolamento, mobile, migrações e projetos.
- `runtime-mobile-browser.cjs` usa emulação de toque em 320/375/390 px; não é iPhone físico. WebKit não estava instalado no ambiente desta missão.

Para atualizar Pyodide, obtenha distribuição oficial, confira SRI, licenças, versões e recursos, atualize manifesto e repita os testes reais dentro da origem opaca. Não habilite `allow-same-origin` para fazer uma distribuição incompatível funcionar. A política restrita pode recusar bibliotecas ou Python válido fora do escopo; alterações de política exigem revisão dos limites e testes de isolamento. Servir o site em HTTPS (ou localhost) é necessário para `crypto.subtle`, workers e integridade.
