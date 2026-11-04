## Problema e resultado

A aplicação preparava notebooks Kaggle sem um executor autorizado ou evidência de execução de modelos. Esta branch acrescenta duas receitas autocontidas de inferência/treinamento de um classificador linear de 87 parâmetros, executadas integralmente em CPU local, e um executor Python separado com SDK oficial opcional, autorização por job, ledger e validação de artefatos. O frontend permanece estático; não recebe credenciais nem inicia jobs remotos.

AI experiments oferece dois percursos de dez etapas em Português/Misto/English, parâmetros por toque, inspeção de código, exports e importação local com origem declarada. Mantém as 40 missões, quatro projetos, 14 desafios Python e o Model Lab simulado. Consolida o runtime CPython 3.14.2/Pyodide 314.0.7 e corrige defeitos de concorrência, limite WASM, persistência do executor, relatórios e acessibilidade encontrados pela auditoria adversarial.

## Validação

- Primeira passagem completa: 31 suítes aprovadas; segunda passagem final em verificação.
- Dois notebooks completos em CPU; 54 casos Python de notebooks/executor/segurança e sete novos cenários adversariais de navegador aprovados nos testes direcionados.
- Chromium com toque em 320/375/390 px; migrações, progresso/XP, desafios certos/errados, interrupção, memória contida, falhas de SDK injetadas, artefatos/paths e exportação/importação.
- Fontes/capacidades oficiais Kaggle pesquisadas; nenhuma autenticação, conta, GPU ou execução remota usada. WebKit/iPhone físico não testados.

Relatório: [REPORT-KAGGLE-EXECUTION.md](https://github.com/kennidyroger05-commits/-python-ai-trainer/blob/feature/kaggle-execution-quality/docs/REPORT-KAGGLE-EXECUTION.md). Matriz de testes/riscos: [QUALITY-AUDIT.md](https://github.com/kennidyroger05-commits/-python-ai-trainer/blob/feature/kaggle-execution-quality/docs/QUALITY-AUDIT.md). Fontes oficiais e limites: [KAGGLE-INTEGRATION.md](https://github.com/kennidyroger05-commits/-python-ai-trainer/blob/feature/kaggle-execution-quality/docs/KAGGLE-INTEGRATION.md).

## Limites para revisão

Executor desativado por padrão, POSIX, com workspace privado fora da raiz HTTP; não há backend implantado. Importações não são atestados criptográficos. Teto WASM não limita toda a heap JS/overhead. A primeira execução Kaggle autorizada e validação física Safari/iPhone continuam pendentes. Este PR é rascunho contra `feature/python-runtime-kaggle-lab`; não fazer merge ou publicação.
