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
