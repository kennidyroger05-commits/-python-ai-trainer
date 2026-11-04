# Prontidão para revisão — V4

A implementação está pronta para revisão; **não foi publicada nem integrada**. A base main e sua configuração GitHub Pages não foram alteradas.

| Critério | Evidência atual |
| --- | --- |
| Progressão | 145 missões/14 unidades, 105 novas e 40 preservadas; [matriz](CURRICULUM-MATRIX.md) e fixtures CPython |
| Experiência integrada | Trilha, preparação, seis modalidades, cinco áreas, temas e idiomas; jornadas nas três larguras |
| Dados anteriores | Migrações, XP, dicas, tentativas, projetos e evidências; [preservação](v4-preservation.json) |
| Python real | 14 desafios em CPython 3.14.2, casos corretos/incorretos, isolamento, interrupção, integridade e limites |
| Projetos e laboratórios | Quatro projetos, 70 etapas totais de atividades guiadas, fluxos, portfólio, exportação/importação |
| Experimentos | Dois notebooks executados integralmente em CPU local; Kaggle autenticado continua desativado |
| GitHub Pages | Caminhos relativos, inclusive WASM e notebooks, testados sob subdiretório |
| Duas passagens completas | 46 suítes aprovadas em cada, zero reprovadas: [1](v4-pass1.json), [2](v4-pass2.json) |
| Mobile e acessibilidade disponível | Chromium 320/375/390, toque, foco, texto ampliado, movimento reduzido, temas; [relatório](MOBILE-TEST-REPORT.md) |

Antes de declarar publicação pronta: validar Safari/iPhone físico, VoiceOver, barras, safe areas, teclado, downloads e pressão total de memória. WebKit não está instalado neste ambiente. Emulação e contraste de pares selecionados não são certificação WCAG nem validação física.

A memória linear WASM tem teto, mas JS/buffers/navegador não possuem quota total rígida. O runtime não é sandbox absoluta, mantém imports/tempo/saída restritos e pode enfrentar pressão de memória no dispositivo. Sem service worker, recarga offline não é garantida. Rascunho livre continua apenas na aba.

Não há conexão Kaggle autenticada no frontend, tokens ou backend implantado. Uma execução remota exige autorização específica e ambiente separado; não é necessária para a jornada básica. Projetos simulados, Python real, notebooks preparados e origem declarada de resultados permanecem distintos.

Os achados corrigidos e os limites de validação estão no [relatório final](REDESIGN-FINAL-REPORT.md). Os relatórios `integration-pass*.json` pertencem ao marco anterior e não foram contados como validação V4. Merge e publicação dependem de aprovação futura explícita.
