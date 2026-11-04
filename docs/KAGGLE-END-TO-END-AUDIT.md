# Kaggle End-to-End — auditoria e entrega

Base confirmada: `d392beb1d237f826bf8c3d9d072c74540787e886`, branch `feature/integrated-learning-experience`. Workspace limpo na abertura; `feature/kaggle-end-to-end` foi criada sobre esse commit. A missão anterior não foi refeita.

## Escopo implementado

- `executor/package.py`: pacote fechado JSON, igualdade com builder verificado, envelope de execução com hashes de job/notebook/metadados, conta, intenção e versões do SDK.
- `executor/workflow.py`: recibo offline por execução, operações autorizadas sobre o executor existente, reconciliação somente de versão explícita, logs filtrados persistidos e estados portáveis.
- `executor/cli.py`: aceita job ou pacote, fornece hash de execução, `authorize` e `reconcile`; mantém demais operações locais/remotas desativadas por padrão.
- SDK: `kernels_pull` usa arquivo fixo pré-criado em temporário privado; não aceita nome de saída escolhido por slug remoto.
- Aplicativo: exportação única de pacote; importação com estados legíveis e configuração distinta identificada; histórico aditivo e limitado de identificadores/versões com origem declarada. Missões, projetos, runtime, XP e migrações anteriores permanecem preservados.
- Smoke `experiments/kaggle-smoke-job.json`: CPU, stdlib, um pedido e dataset sintético, sem internet/GPU/conta. Executado localmente pelos testes; não submetido ao Kaggle.

O fluxo operacional usa arquivos locais escolhidos pelo usuário. Não há backend implantado ou conexão automática disfarçada. Guia de execução futura: [KAGGLE-FIRST-RUN.md](KAGGLE-FIRST-RUN.md).

## SDK oficial verificado

Em 2026-11-04 foram consultados novamente PyPI e documentação oficial no GitHub: Kaggle **2.2.5**, kagglesdk **0.1.38**. Os wheels oficiais preservados foram comparados aos hashes publicados atuais; assinaturas foram extraídas por AST, sem importar/autenticar Kaggle. Evidência: [kaggle-e2e-sdk.json](kaggle-e2e-sdk.json). A matriz completa anterior continua em [KAGGLE-INTEGRATION.md](KAGGLE-INTEGRATION.md).

| Operação | Método / formato confirmado no código oficial | Limite / teste |
| --- | --- | --- |
| Autenticação | `KaggleApi.authenticate()`; token configurado no ambiente do operador | Nenhuma credencial ou conta real utilizada |
| Criar/atualizar e solicitar execução | `kernels_push(folder, timeout='300', acc=None, no_run=...)`; `ref`, `version_number`, `error` | Um fence local antes de enviar; SDK injetado nos testes |
| Status | `kernels_status(owner/slug/version)`; `response.status.name` | Sem inferência síncrona; enum desconhecido impede avanço |
| Reconciliação/código | `kernels_pull(version_ref, fixed_file, metadata=True, quiet=True)` | Verifica source e metadados; requer versão observada pelo operador |
| Logs | `kernels_logs(version_ref)` retorna string | Só eventos estruturados permitidos; sem mensagens/headers/segredos brutos |
| Outputs | `kernels_list_files` e `kernels_output`; arquivos e token de paginação; retorno `(outfiles, token)` | Whitelist, páginas/bytes limitados e validação real de artefatos locais |
| Datasets | `dataset_create_new`, `dataset_create_version`, `dataset_download_files` | Fonte inspecionada; nenhuma escrita/download em conta. Smoke embutido não depende deles |
| CPU/GPU | `acc`, `enable_gpu/enable_tpu`, `machine_shape`; `quota_view()` | Sem garantia de GPU/quota, não utilizados; smoke CPU/sem internet |
| Cancelamento | Enums observáveis, nenhuma mutação de cancelamento confirmada no contrato usado | Stop-following é local. Não usa delete como cancelamento |

Não há endpoint inventado, polling no frontend, inferência síncrona, promessa de GPU permanente ou recursos ilimitados. Consulta privada `www.kaggle.com`/API e autenticação real não foram feitas.

## Estados e recuperação

| Código | Significado |
| --- | --- |
| `prepared` | Contrato e arquivos preparados localmente |
| `awaiting_authorization` | Sem recibo válido para o conteúdo/conta/modo atual |
| `authorized` | Recibo local gravado; nada enviado |
| `submitting` | Fence durável gravado antes da chamada |
| `submission_unknown` | Envio pode ter ocorrido; bloqueia reenvio |
| `submitted` | SDK retornou referência e versão, sem afirmar conclusão |
| `saved_only` | Versão salva deliberadamente sem execução |
| `queued` / `running` | Estado observado daquela versão |
| `unknown` | Estado remoto desconhecido ou incompatível |
| `remote_complete` | Execução concluída; falta recuperar/validar resultados |
| `failed` | Falha remota observada |
| `completed` | Resultado recuperado e validado, com métricas/artefatos |

O ledger anterior continua atomicamente escrito e bloqueado por job. O recibo adicional é fechado e comparado ao envelope reconstruído em cada operação. Não é login nem assinatura de uma pessoa. Atualizar conteúdo pode invalidar recibo; não resetamos histórico para liberar um envio incerto. Reconciliação somente lê uma versão explícita, compara código e metadados e registra a associação, sem reenviar. Se a resposta continuar ambígua, a intervenção manual externa é necessária.

## Auditoria de limites e testes

Os 15 novos casos Python iniciais verificaram pacote alterado, falta/adulteração de recibo, intenção/configuração/notebook alterados, reinício, duplicação, timeout, reconciliação correta/incorreta, download interrompido, corrupção, logs e ZIP recusado. O E2E novo em 320/375/390 px exporta pelo navegador, passa o pacote ao executor Python, executa o ciclo com transporte injetado e artefatos produzidos por CPython real, importa o resultado, recusa traversal forjado e recarrega identificadores. Isso é E2E local com SDK injetado, **não E2E autenticado no Kaggle**.

As suítes anteriores de executor/segurança incluem autenticação ausente/inválida, 429, rede, resposta malformada, concorrência, symlinks, JSON duplicado e métricas adulteradas. Testes perigosos mantêm contenção de processo/memória/tempo. ZIP/TAR não são suportados: nenhum extrator de arquivo foi introduzido.

As duas passagens completas da nova missão serão registradas após execução. Resultados da missão anterior não serão reutilizados como se tivessem testado estas mudanças.

## Riscos e gates restantes

- Nenhuma execução autenticada Kaggle ocorreu. Formatos/valores reais da conta, limites, disponibilidade e normalizações do servidor ainda exigem o primeiro smoke autorizado. Divergência de contrato deve falhar fechada.
- Um arquivo importado no navegador não é atestado criptográfico. Adulterações estruturais/semânticas são recusadas; um arquivo plausível fabricado não comprova conta/execução. A UI preserva a origem como declarada.
- Quem controla o usuário/diretório privado do operador pode alterar ledger/recibos. Permissões POSIX, locks e escrita atômica não defendem contra comprometimento desse usuário. Não exponha o workspace por HTTP.
- Reconciliação não descobre automaticamente versão perdida, não prova que um job inexistente nunca foi enviado e não autoriza retry cego. Há dependência operacional do histórico da conta.
- SDK opcional fixado e importado somente após gates. Tokens permanecem no ambiente separado; não são persistidos/exportados/logados. Não existe endpoint público.
- Safari/iPhone físico, VoiceOver e WebKit continuam sem validação disponível. A nova UI é testada em Chromium com toque nas três larguras; não se declara lançamento pronto.
- Não houve merge, alteração de main, publicação, custo ou instalação de backend externo.
