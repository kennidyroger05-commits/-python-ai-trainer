## Python executável e laboratório preparatório de modelos

Permite editar e executar pequenos programas Python reais no navegador, com stdout/erros e testes por entradas diferentes. Acrescenta 14 desafios e prática opcional nos quatro projetos, preservando as 40 missões, XP, idiomas e simulações anteriores.

O runtime Pyodide/CPython carrega sob demanda e usa worker em origem opaca, CSP sem rede, VM nova por caso, verificação de integridade, interrupção e limites. O AI Model Lab inspeciona contratos e exporta notebook/metadados preparatórios; Kaggle permanece um adaptador simulado/testado, sem autenticação, backend ou jobs reais.

Validação: 14 suítes locais e 11 de navegador aprovadas, CPython e CPython WASM, todas as soluções/reparos incorretos, migrações V1–V3, persistência/XP, isolamento, projetos/portfólio e toque/layout 320/375/390 px. WebKit/iPhone físico indisponíveis; WASM sem quota rígida de memória e integração Kaggle real permanecem limitações documentadas.

Detalhes: `docs/REPORT-RUNTIME-LAB.md`, `PYTHON-RUNTIME.md`, `KAGGLE-INTEGRATION.md` e `SECURITY.md`.

PR de rascunho contra `feature/v3-python-ai-lab`. Não fazer merge nem publicar.
