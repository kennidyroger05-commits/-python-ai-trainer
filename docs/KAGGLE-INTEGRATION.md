# Kaggle: preparação verificada, sem execução remota

Pesquisa em 2026-11-04. Nenhuma autenticação, conta, job real ou configuração do Kaggle foi utilizada. O aplicativo público oferece exportação preparatória e um adaptador **simulado**, não uma integração remota concluída.

## Fontes oficiais e limites da verificação

- [Kaggle CLI oficial](https://github.com/Kaggle/kaggle-cli), HEAD consultado `c10bff4bc13c6790e0914a8add3df33ac5e7510f`.
- [Comandos de notebooks/kernels](https://github.com/Kaggle/kaggle-cli/blob/c10bff4bc13c6790e0914a8add3df33ac5e7510f/docs/kernels.md).
- [Metadados de kernels](https://github.com/Kaggle/kaggle-cli/blob/c10bff4bc13c6790e0914a8add3df33ac5e7510f/docs/kernels_metadata.md).
- [Datasets](https://github.com/Kaggle/kaggle-cli/blob/c10bff4bc13c6790e0914a8add3df33ac5e7510f/docs/datasets.md) e [autenticação/CLI](https://github.com/Kaggle/kaggle-cli/blob/c10bff4bc13c6790e0914a8add3df33ac5e7510f/README.md).
- [Pacote oficial PyPI `kaggle` 2.2.5](https://pypi.org/project/kaggle/2.2.5/): wheel baixado, SHA-256 `711901cf1dfe9133d83ffed6f09972d97ce87adafc2b24f9a91038828a6393d7`, fonte `kaggle/api/kaggle_api_extended.py` e `kaggle/cli.py` inspecionadas sem instalar/autenticar o pacote.

A documentação e o código oficiais foram lidos de GitHub/PyPI. `www.kaggle.com/docs/api` foi bloqueado pela política de rede do ambiente (CONNECT 403). Chamadas autenticadas e disponibilidade efetiva por conta **não foram verificadas**. Não derivamos endpoints REST próprios da documentação; um backend futuro deve utilizar o SDK/CLI oficial suportado.

| Operação | Verificado em documentação/código oficial | Limite |
| --- | --- | --- |
| Preparar notebook/script | `kernels init`, `kernels_initialize`, `kernel-metadata.json` | Preparação local; não implica execução |
| Criar/atualizar versão e solicitar execução | `kernels push`, `kernels_push(folder, timeout, acc, no_run=False)` | **Por padrão salva e executa**; requer autenticação, permissões e recursos |
| Salvar sem executar | `kernels push --no-run` (`QUICK_SAVE` no SDK) | Não roda células; não é um endpoint de inferência |
| Baixar código/metadados | `kernels pull`, opção de metadados | Acesso depende do notebook/conta |
| Consultar execução | `kernels status`, `kernels_status` | Estado da execução mais recente, não resposta instantânea de modelo |
| Listar/baixar artefatos | `kernels files`, `kernels output`, `kernels_output` | Resultados disponíveis após geração; paginação e permissões |
| Logs | `kernels_output` grava log quando retornado; `kernels_logs`/`kernels_logs_stream` e comandos correspondentes existem no código 2.2.5 | O guia de kernels não lista todas essas opções; nenhuma sessão real/stream foi testada |
| Datasets | Comandos create/version/files/download e métodos correspondentes | Upload/versionamento são ações autenticadas; o CLI limita operações anônimas; não se presume que todo dataset seja público |
| GPU/acelerador | `enable_gpu`, `machine_shape`, `push --accelerator` | Solicitação depende de quota, disponibilidade e compatibilidade; não reserva GPU permanente |
| Cancelar uma execução remota | Não confirmado como operação segura deste contrato | `kernels delete` apaga recursos e **não** é tratado como cancelamento |

Há divergência de defaults: o guia de metadados diz `enable_internet=false` quando omitido; o código 2.2.5 inspecionado usa `true` na inicialização/leitura de alguns metadados. O exportador define **explicitamente** internet desativada, notebook privado e GPU desativada por padrão. Não depende desses defaults.

## O que o produto implementa

`model-lab/contracts.js` valida um contrato fechado (versão, ID, nome, objetivo, modo, tarefa, modelo 50M–500M de referência, dataset fictício, configuração, ambiente e estado). Não carrega pesos. Identificadores de modelo são placeholders declarados, não promessas de que um modelo existe ou cabe na GPU.

`notebookBundle(job)` gera:

- Um `.ipynb` válido, sem outputs/execução prévia. Sua única célula de código escreve `/kaggle/working/preparation.json` com `model_executed: false`. CPython verifica o comportamento equivalente em pasta temporária.
- `kernel-metadata.json`, com dono `YOUR_USERNAME` a revisar, privacidade explícita, fontes vazias, internet desativada e GPU solicitada somente quando escolhida no contrato.

Os dois arquivos são baixados por ações locais explícitas. Não há upload. O usuário deve revisar dono, recursos e privacidade antes de usar ferramentas oficiais; um envio futuro sem intenção de executar precisa usar `--no-run`. Não automatizamos esse comando.

`model-lab/kaggle.js` expõe dois adaptadores:

| Método | Mock local | Remoto preparatório |
| --- | --- | --- |
| `prepare(job)` | Valida contrato e fixture suportada | Valida contrato remoto e prepara bundle |
| `submit(job)` | Registra cenário local `queued` | Lança `BACKEND_REQUIRED`; nada enviado |
| `status(id)` | Retorna estado rotulado `simulation` | Lança `BACKEND_REQUIRED` |
| `logs(id)` | Logs fictícios cadastrados | Lança `BACKEND_REQUIRED` |
| `results(id)` | Métricas/artefatos fictícios, com origem | Lança `BACKEND_REQUIRED` |
| `advance/cancel/fail` | Ações didáticas manuais, somente locais | Não implementados como operações remotas |

Falhas `AUTH_REQUIRED`/`NETWORK_FAILURE` são injetáveis no mock, testadas e explicitamente simuladas. Não pedem tokens, não acionam rede e não provam tratamento de uma sessão Kaggle real.

## Integração futura segura

GitHub Pages permanece frontend público. Nenhum token Kaggle deve estar em JavaScript, localStorage, notebook exportado ou repositório. O CLI atual documenta OAuth, API token e formas legadas; qualquer fluxo futuro pertence a uma camada autenticada separada, não instalada nesta missão.

Um serviço intermediário autorizado deverá autenticar o usuário, associar jobs ao dono, validar esquema e permissões, manter credenciais em armazenamento de segredos, aplicar quotas e auditoria e chamar o SDK oficial. O frontend receberia somente IDs/estados/resultados permitidos, com origem real identificada. Status do SDK precisariam de mapeamento explícito e tratamento de estados desconhecidos. Resultados exigem validação de tamanho/caminho/tipo antes de oferecer download.

Envio, execução, acesso a dados privados e custos nunca podem ser inferidos de uma simulação aprovada. Kaggle é infraestrutura de notebooks/experimentos em lote, com disponibilidade variável, **não API permanente de inferência**. Não há promessas de GPU gratuita ilimitada, sessão contínua, execução sem autenticação ou latência instantânea.
