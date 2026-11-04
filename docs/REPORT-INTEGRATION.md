# Relatório de integração e estabilização

Branch: `feature/integrated-learning-experience`. Base real: `feature/kaggle-execution-quality`, `2ceb711e5d2fb0fac7ec5e49f57ea393704f1785`. O workspace foi encontrado preservado e sem alterações locais. A branch foi criada a partir desse commit, sem copiar versões antigas ou alterar main.

## Integração

O app passou a organizar Aprender, Praticar, Projetos, Laboratório IA e Meu progresso em um menu compacto, sem cinco ícones na barra inferior. A home orienta o primeiro acesso e mostra uma próxima atividade. Controles avançados do planner ficam sob uma seção explícita; todas as funções anteriores continuam acessíveis.

`learning/engine.js` calcula conexões, recomendações e projeções de estado; `learning/view.js` renderiza navegação, catálogo, evidências e resumo exportável. `links.json` usa IDs, não títulos ou índices. Sete cartões contextuais preparam leitura de construções relevantes. Os módulos existentes continuam donos de seu progresso; snapshots são cópias de leitura. Não foi criado outro banco de progresso ou uma nota de competência.

As conexões reutilizam conhecimento entre missão, desafio Python, projeto/debugging e experimento. Exemplos: return → execução de função → retorno ausente; JSON → leitura real → cliente de API; avaliação → métrica real → experimento; loss → checkpoint → treino pequeno.

## Preservação e revisão pedagógica

Permanecem 40 missões, seis modalidades, quatro projetos com dez etapas, oito desafios de debugging e tutorial de testes, 14 desafios executáveis, três idiomas/Misto padrão, glossário, simuladores, laboratórios, portfólio, XP e migrações. Não foram adicionadas dezenas de questões.

A auditoria leu objetivos, pré-requisitos, conceitos, código, respostas, dicas e explicações, além dos validadores/fixtures CPython. Os dados das 40 missões ficaram intactos. Três desafios tiveram pré-requisitos explícitos corrigidos: `exec-score`, `exec-select-model`, `exec-response-field`. Duas legendas passaram a explicar + e *. Projetos Roteador/Avaliação preparam os desafios mais compactos, com exemplos contextuais de expressão condicional, in, zip e generator. As soluções e os IDs foram preservados.

## Estado e portfólio

A projeção distingue disponível, iniciado, concluído, conceitos apresentados/praticados/com acerto/revisão, projeto simulado, código realmente executado, testes completos aprovados e experimento preparado. XP aparece por origem e não como domínio. O catálogo libera exploração sem marcar conclusão automática.

O runtime acrescenta `openedAt`, contagem de resultados reais, momento/estado/versão da execução. A migração é aditiva; não inventa execuções históricas nem grava código livre. Validação continua exigindo testes reais em VMs novas, sem XP duplicado. Relatórios Markdown preservam proveniência e não fazem afirmações de experiência profissional ou execução remota confirmada.

## Falhas e correções

- Falha de laboratório opcional interrompia a inicialização das missões: isolada, com mensagem e controle indisponível.
- Recusa de exportação podia gerar exceção sem feedback: helper único anexa anchor, trata erro e faz limpeza; estado é preservado.
- Continuar após revisão/exploração podia reutilizar o índice errado: usa a primeira missão pendente elegível.
- XP do cabeçalho tinha escopo pouco claro: origem “missões” agora é visível; os demais pontos aparecem separados.
- Pré-requisitos de funções/return e igualdade não apareciam em alguns desafios: corrigidos sem reescrever soluções.

Uma revisão crítica separada encontrou carregamento essencial preso em recurso opcional, dependência indevida de Python em projetos, glossário quebrado sem runtime, retornos antigos, contexto de revisão vazando, erro inicial no idioma errado e alteração de resposta já validada. Também corrigiu dados desconhecidos apresentados como zero, indicador da área ativa, avisos sem tradução e omissão de simulações no resumo. [INTEGRATION-AUDIT.md](INTEGRATION-AUDIT.md) registra severidade, causa, correção e reprodução.

## Testes e medições

Antes do segundo marco passaram 21 suítes locais, testes de falhas iniciais/exportação, jornada completa em 320/375/390 px e teste sob subdiretório com Python real e notebook. A primeira tentativa completa parou em um teste legado que não expandia o novo menu avançado; foi corrigido sem alterar critérios de resultado. A revisão adversarial inicial teve seis reprovações em 11 cenários, que motivaram correções.

Após ampliar os casos, passou a primeira passagem final: **40 suítes aprovadas, zero reprovadas**, sobre `215c8cb`. A revisão entre passagens ajustou a classificação das telas compartilhadas no menu (evidências em Meu progresso; debugging/testes em Praticar). O novo cenário passou, totalizando 14 cenários adversariais de integração.

Na segunda revisão também foi reproduzido reset incompleto quando uma área não carregava. A limpeza global foi desacoplada da existência dos módulos, incluindo suas cópias de recuperação e preservando outras chaves. A segunda execução parcial foi encerrada para essa correção e não é contada como passagem completa. O cenário adicional verifica cancelamento/confirmação/recarga; total de 15 cenários adversariais de integração.

A segunda passagem completa terminou em **2026-11-04 07:56:57 UTC**, sobre `4c72eaa20833534a72dd431aa6f3907599f4de44`: **40 suítes aprovadas, zero reprovadas**, incluindo os 15 cenários adversariais de integração. Cada passagem executou 22 suítes locais e 18 de navegador; as suítes Python de notebooks, executor e segurança contêm respectivamente 8, 27 e 19 casos. Não são contagens de todos os casos da aplicação. As listas de comandos, versões, commits e hashes dos logs estão em [integration-pass1.json](integration-pass1.json) e [integration-pass2.json](integration-pass2.json). As tentativas anteriores e a execução parcial continuam explicitadas; não foram contadas como passagens aprovadas.

As duas passagens executaram novamente os dois notebooks completos em CPU local, as 40 missões, quatro projetos, 14 soluções Python corretas e reparos incorretos, migrações, persistência, revisão, idiomas, segurança e jornadas em 320/375/390 px. Não houve uso de conta Kaggle.

Medições reais de `subdirectory-browser.cjs` estão em [integration-performance.json](integration-performance.json). No último ensaio: prontidão inicial observada em 215 ms, 832.314 bytes retornados até esse marco, execução Python fria em 1.833 ms e quente em 1.742 ms, incluindo inicialização e overhead do teste. O interpretador informou aproximadamente 2/3 ms somente de execução. Navegação automatizada entre áreas levou 64–74 ms. Os recursos do runtime somam 13.532.188 bytes e não foram carregados na abertura. A observação de heap JS foi 18,8 MB, sem abranger toda a memória WASM/processo. Os números são de uma execução em HTTP local/Chromium emulado, não benchmark de iPhone nem garantia de desempenho. Recursos verificados são reutilizados em memória; cada execução/caso continua com VM nova.

## Segurança, Kaggle e compatibilidade

Runtime permanece CPython 3.14.2/Pyodide 314.0.7, com origem opaca, worker, watchdog, limite real de memória linear, captura de saída e política anterior. Não houve relaxamento do isolamento. O teto WASM não controla toda a heap JS/buffers e não é prova de sandbox absoluta.

Os dois notebooks e o executor de referência foram preservados. Kaggle autenticado continua desativado; nenhuma credencial, job remoto, GPU, custo ou backend externo foi utilizado. Referências de CPU são de desenvolvimento. Arquivos importados têm origem declarada; o navegador não autentica a conta ou confirma execução remota.

Mobile automatizado usa Chromium com toque, sem teclado automático em escolhas, 320/375/390 px, redução de movimento e caminhos de retorno. Subdiretório também foi executado. WebKit não está instalado; nenhum Safari/iPhone físico foi testado. O app **não está declarado pronto para publicação**.

## Commits e continuidade

| Commit | Marco |
| --- | --- |
| `6c1685d` | Falhas opcionais isoladas e exportação compartilhada com regressões |
| `52f8df4` | Navegação, pontes pedagógicas, evidências e jornada completa |
| `215c8cb` | Carregamento parcial, retornos, respostas imutáveis e regressões adversariais |
| `02c1f76` | Classificação semântica das áreas, contraste observado e primeira revisão completa |
| `4c72eaa` | Reset completo de módulos indisponíveis e prova da primeira passagem |

Os marcos foram enviados incrementalmente à branch. As duas passagens completas terminaram; as alterações posteriores ao commit funcional testado são somente documentação/evidências. A entrega utiliza PR rascunho contra `feature/kaggle-execution-quality`, ou comparação e corpo preparado se a API recusar sua criação. Nenhum merge ou publicação.

O guia de uso está em [USER-JOURNEY.md](USER-JOURNEY.md); requisitos restantes para lançamento em [RELEASE-READINESS.md](RELEASE-READINESS.md). O link de PR ou comparação e o resultado da tentativa serão registrados na entrega.

## Decisões e limites de arquitetura

- Menu de áreas e cartões, em vez de cinco abas inferiores com rótulos bilíngues comprimidos em 320 px.
- Projeção por cópia, em vez de outro armazenamento/ledger que substitua o histórico existente.
- Grafo por IDs e metadados de preparação, em vez de duplicar perguntas ou inferir relações por título.
- Preparação contextual e recomendações, em vez de bloquear rigidamente exploração ou atribuir níveis profissionais.
- Isolar falhas opcionais e tratar recursos indisponíveis como desconhecidos, em vez de recalcular progresso zero.
- Downloads locais e origem declarada, sem backend, uploads automáticos ou suposta autenticação Kaggle.

Código livre permanece somente em memória; dados locais são editáveis e não são atestados externos. A sessão já carregada suporta parte da jornada offline, mas recursos ainda não obtidos podem falhar. Testes/medições de desktop emulado não provam ergonomia, safe areas, memória total ou comportamento de downloads no iPhone. Esses pontos continuam na avaliação de lançamento.
