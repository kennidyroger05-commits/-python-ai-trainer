## Problema e resultado

O aplicativo já possuía missões, projetos, Python real e experimentos, mas as áreas eram apresentadas como entradas isoladas. Esta branch integra Aprender, Praticar, Projetos, Laboratório IA e Meu progresso com navegação compacta, recomendações determinísticas, conexões pedagógicas por IDs, evidências com origem e resumo Markdown exportável.

Preserva 40 missões, quatro projetos, 14 desafios executáveis, debugging, idiomas/Misto padrão, glossário, XP, migrações, simuladores, notebooks CPU e executor Kaggle separado. Corrige falhas de inicialização parcial, dependência indevida entre módulos, callbacks de retorno, revisão, exportação, feedback após acerto e estados indisponíveis apresentados como zero. Não há novo backend, autenticação Kaggle, merge ou publicação.

## Validação

- Testes direcionados: 22 suítes locais, 40 missões nas três larguras, editor/Model Lab mobile, jornada completa, subdiretório com Python real e 15 cenários adversariais de integração, incluindo reset de módulos indisponíveis.
- Primeira passagem completa: 40 suítes aprovadas. Segunda após revisão final das áreas ainda em verificação; resultado será atualizado após conclusão real.
- Os dois notebooks continuam sendo executados integralmente em CPU local pelos testes, sem conta ou GPU.
- Paleta observada passou nos cálculos de contraste; foco, roles, texto ampliado, redução de movimento e overflow são testados no Chromium.

Matriz e evidências: [INTEGRATION-AUDIT.md](https://github.com/kennidyroger05-commits/-python-ai-trainer/blob/feature/integrated-learning-experience/docs/INTEGRATION-AUDIT.md). Relatório: [REPORT-INTEGRATION.md](https://github.com/kennidyroger05-commits/-python-ai-trainer/blob/feature/integrated-learning-experience/docs/REPORT-INTEGRATION.md). Guia: [USER-JOURNEY.md](https://github.com/kennidyroger05-commits/-python-ai-trainer/blob/feature/integrated-learning-experience/docs/USER-JOURNEY.md).

## Limites

Chromium emulado em 320/375/390 px não equivale a Safari/iPhone físico; WebKit não está instalado. Consumo total de memória no hardware, VoiceOver e salvamento de downloads precisam de validação antes de publicação. O teto WASM não controla todo o overhead JS/navegador. Kaggle autenticado permanece desativado; relatórios importados têm origem declarada.

PR rascunho contra `feature/kaggle-execution-quality`. Não fazer merge nem publicar. [Prontidão para lançamento](https://github.com/kennidyroger05-commits/-python-ai-trainer/blob/feature/integrated-learning-experience/docs/RELEASE-READINESS.md).
