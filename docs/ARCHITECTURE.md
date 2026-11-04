# Arquitetura — missões, projetos e execução

Aplicação estática, servida por HTTP ou GitHub Pages. HTML, CSS e JavaScript sem build de frontend; o runtime opcional possui artefatos WASM redistribuídos. Os módulos pequenos usam uma exportação compatível com navegador e Node para compartilhar lógica entre produto e testes.

| Responsabilidade | Arquivo |
| --- | --- |
| Carregamento e validação estrutural | `core/content.js` |
| Sessões de missão em memória | `core/session.js` |
| Persistência, migração e revisão | `core/progress.js` |
| Validação específica e XP | `game.js` |
| Renderização e orquestração de eventos | `app.js` |
| Idiomas, glossário original e termos novos | `language.js`, `glossary-v2.json` |
| Navegação e renderização de traces | `core/simulation.js` |
| Fluxos de IA simulada | `labs.js`, `labs.json` |
| Conteúdo pedagógico e debugging | `exercises.json` |

O estado da sessão guarda resposta, tentativas, dicas, feedback, investigação e posição do simulador por ID. Alternar telas ou idioma conserva esse estado. Recarregar a página conserva o progresso e as preferências, mas não a resposta parcial em memória.

## Persistência

`pythonAiTrainerV2` contém `version`, missão atual, IDs concluídos, XP, módulos, tentativas, XP efetivamente concedido por missão e métricas por conceito. A leitura migra `pythonAiTrainerV1` se não houver registro V2 válido. A migração copia dados e não apaga a chave anterior; novas alterações são gravadas só na chave V2. Preferências continuam em `trainer-language` e `trainer-known`.

Históricos anteriores não contêm os erros por conceito, portanto não inventamos essas métricas retroativamente. Reinício de módulo remove conclusões e o XP registrado daquele módulo, mantendo o histórico de dificuldade. O reset geral com confirmação remove os registros de progresso V1/V2 e preferências. Os IDs das 15 missões-base são estáveis.

## Revisão

A seleção utiliza taxa de erro, erros nas últimas cinco respostas e dicas por tentativa. Exige que a missão tenha sido tentada e que todos os pré-requisitos estejam concluídos. Cada lote contém até três conceitos distintos; não adiciona itens enquanto o aluno o percorre. Um conceito recém-revisado tem intervalo mínimo de um minuto antes de nova seleção. Revisão não concede XP duplicado por ID concluído. Cliques repetidos após o acerto não contam como novos acertos.

## Simulação e laboratórios

Traces são snapshots cadastrados: linha, variáveis, saída, explicação e exceção opcional. Esses traces não utilizam o interpretador opcional. O passo `else` é uma transição didática, e a explicação de função distingue escopo local de retorno ao chamador.

O laboratório de debugging reutiliza seis missões com investigação, erro/sintoma, alternativas de correção e preview da substituição. Pré-requisitos bloqueiam saltos na sequência. O laboratório de IA usa cinco cenários com oito etapas e uma escolha de ação validada. Dados são fictícios, nenhuma API é chamada e nenhuma ferramenta externa executa. O laboratório de IA é exploratório e não concede XP.

## Evolução

Uma integração futura pode consumir ID da missão, conceito, idioma e tentativa a partir dos módulos existentes. Um professor ou SDK de modelos permanece uma camada futura opcional com limites próprios. O executor adicionado nesta expansão é independente das simulações; não existem serviços de modelos nem credenciais.

# Extensão V3 — projetos guiados

A V3 coexiste com a V2. `exercises.json`, `labs.json`, glossários e idiomas anteriores são preservados por hashes de bytes. O app integra a nova área sem transferir o XP das missões para os projetos.

| Responsabilidade V3 | Implementação |
| --- | --- |
| Dados e contratos das atividades | `projects/catalog.json`, `debugging.json`, `testing.json`, `datasets.json` |
| Validação, estado e navegação | `projects/engine.js` |
| Soluções determinísticas simuladas | `projects/models.js` |
| Renderização e integração | `projects/view.js`, ponte em `app.js` |
| Fluxos com IDs estáveis | `projects/flow-view.js`, `traces` dos dados |
| Relatórios e download local | `projects/portfolio.js` |
| Armazenamento defensivo | `core/storage.js` e carregadores das versões |
| Evidências por conceito | `projects/engine.js`, instrumentação de missões e etapas |

## Estado e isolamento

Uma atividade é identificada por `kind/id`, e cada etapa por ID dentro dela. A posição visual é usada apenas para navegar uma lista ordenada; não identifica progresso. A chave `pythonAiLabV3` contém versão 3, atividades, ledger de XP e evidências. O registro de atividade mantém etapa, rascunhos, dicas, tentativas, conclusão, testes e posição do fluxo. A normalização verifica IDs e dependências, conserva etapas válidas e não transforma rascunho em conclusão.

O artefato é reconstruído a partir de `initialArtifact` e dos `effect` das etapas validadas. Respostas erradas ficam registradas como tentativas, mas não aplicam efeitos. Voltar ou revisitar não desfaz etapas corretas. Reiniciar limpa a construção atual; os IDs do ledger mantêm o XP anterior. O reset geral confirmado é a ação que zera também ledger, evidências e portfólio atual.

O carregamento V3 não reescreve o histórico de missões em um formato novo. V1/V1.5 continuam sendo lidas pelo carregador de missões; as evidências de conclusões/tentativas existentes são importadas sem estimar erros desconhecidos. Os dados anteriores ficam preservados. Erros de JSON/esquema têm cópia local de recuperação antes de uma gravação corretiva. Uma falha de armazenamento não impede a sessão em memória, mas gera aviso visível.

## Testes e modelos de referência

O botão de teste usa funções JavaScript cadastradas e entradas conhecidas. Os resultados são confrontados com soluções CPython em desenvolvimento. Etapas que exigem testes verificam sucesso e assinatura da configuração, evitando reaproveitar um resultado de um rascunho diferente. JSON é comparado por estrutura, sem depender da ordem de chaves.

O workspace mostra a construção atual. Os fluxos são rotulados como referência da solução: não fingem interpretar o código do aluno. Cada fluxo guarda snapshots de entrada/saída e uma transformação explicada, inclusive falhas. Nesses projetos guiados, APIs e treinamento são simulados e não executam chamadas ou ajustes reais de pesos.

## Competências e revisão

A metodologia conta conceitos distintos com evidência local: apresentação registrada, tentativa, ao menos um acerto e sugestão de revisão. O rótulo de revisão usa erro nas três tentativas recentes ou duas dicas na unidade. Essas categorias podem coexistir; um acerto não equivale a domínio. Tradução consultada conta como apresentação em inglês, não como acerto ou proficiência.

Uma dificuldade pode abrir uma missão de revisão ou um exemplo. Isso é opcional e não cria bloqueio de competência. As etapas continuam exigindo suas respostas/testes definidos. Revisar uma missão por um projeto não avança silenciosamente o ponto normal do treino; o botão de retorno restaura o rascunho do projeto.

## Alternativas deliberadamente rejeitadas

- Reescrever as quarenta missões ou misturar seus IDs/XP com projetos: arriscaria o histórico validado.
- Reinterpretar todos os projetos guiados como código livre: a execução real é uma área opcional e isolada, preservando o percurso por escolhas.
- Backend, sincronização ou geração de explicações por LLM: não foram autorizados nesta versão e criariam novas dependências/custos.
- “Nota de empregabilidade” ou nível profissional: os dados locais não sustentam essa inferência.

A exportação produz Markdown apenas após conclusão, com etapas e testes registrados, solução de referência e limites. Um Blob local é baixado por ação explícita; não há upload ou credenciais. O estado é por navegador/aba, sem coordenação de escrita entre múltiplas abas. Não é certificado verificável externamente.


## Python Runtime e AI Model Lab

| Camada | Contrato/implementação |
| --- | --- |
| Catálogo executável | `runtime/lessons.json`, `content.js`, fixtures `tests/runtime-solutions.json` |
| Estado independente e XP por ID | `runtime/progress.js`, chave `pythonExecutableV1` |
| Editor e feedback | `runtime/view.js`, sem editor externo, rascunhos em memória |
| Execução real | `runtime/client.js → frame.js → worker.js → runner.py` |
| Recursos verificáveis sob demanda | `runtime/manifest.json`, `vendor/pyodide` |
| Contratos de experimentos e bundle | `model-lab/contracts.js` |
| Adaptadores Kaggle mock/preparatório | `model-lab/kaggle.js` |
| Contratos locais e interface | `model-lab/state.js`, `view.js`, chave `pythonModelLabV1` |

O catálogo executável tem testes de variáveis, funções ou stdout com entradas e valores esperados. O harness executa asserções reais. A montagem/seleção no editor apenas produz fonte; não concede acerto. Cada caso tem worker novo. Resultados são ligados ao snapshot executado; edição posterior recebe aviso. Conceitos praticados são observados no painel existente a partir das validações reais, sem reclassificar simulações.

As novas chaves não migram nem sobrescrevem XP de V1/V1.5/V2/V3: a migração é aditiva. Contratos antigos continuam sendo lidos pelos carregadores anteriores. O portfólio mantém a seção de projeto simulado e anexa, somente quando concluído, o registro independente do desafio Python associado. Nenhum treino/inferência real é inferido desse anexo.

Decisões: textarea e seletores em vez de editor pesado; artefatos do próprio site em vez de CDN no runtime; worker clássico em origem opaca em vez de enfraquecer sandbox para aceitar module worker; VMs novas em vez de reaproveitar estado na avaliação; contrato preparatório em vez de token Kaggle público ou backend não autorizado. Os detalhes e limites estão em `PYTHON-RUNTIME.md`, `KAGGLE-INTEGRATION.md` e `SECURITY.md`.

## Experimentos verificáveis e executor separado

| Responsabilidade | Implementação |
| --- | --- |
| Receitas, dez etapas e vocabulário em três idiomas | `experiments/catalog.json`, `terms.json` |
| Contratos fechados, notebook e fingerprint equivalentes | `experiments/contracts.js`, `executor/contracts.py`, `notebooks.py` |
| Percurso local independente, sem XP por leitura | `experiments/state.js`, `pythonExperimentLearningV1` |
| Interface, inspeção, downloads e relatórios de origem declarada | `experiments/view.js` |
| Modelo linear e runner reais, autocontidos | `experiments/recipes/`, `data/` |
| Relatórios e traces medidos em desenvolvimento local | `experiments/evidence/` |
| Ledger, autorização, idempotência e acompanhamento | `executor/service.py`, `files.py` |
| SDK oficial opcional em subprocesso autorizado | `executor/transport.py`, `sdk_worker.py` |
| CPU local limitada e validação semântica de artefatos | `executor/local.py`, `artifacts.py` |

O frontend continua estático. Não conversa com um endpoint executor, não recebe segredos e não faz polling. O CLI separado usa workspace privado externo ao diretório HTTP. Os contratos incluem somente duas receitas fixas, recursos e configuração; não incluem código arbitrário, URL de serviço ou credenciais. Uma nova receita requer revisão explícita do builder/validador e testes, em vez de um parâmetro que aceite qualquer notebook.

Notebooks e job specs são exportados por ação local. Ler um relatório mantém a origem declarada, distinguindo `local-cpu`, `injected-transport`, `operator-state` e `kaggle-sdk`. Nenhuma origem é convertida em certificação pelo navegador. O progresso das dez etapas guarda consulta, não conclusão de treino. Importações brutas permanecem em RAM; o reset não cancela jobs nem apaga arquivos externos.

A integração real segue um caminho de operador autorizado: autorização por SHA/dono, SDK, versão remota, estado remoto observado, recuperação e validação. O envio fica desativado por padrão. A referência não implementa login, HTTP, implantação, cancelamento remoto ou sincronização; os limites estão em `KAGGLE-INTEGRATION.md` e `SECURITY.md`.
