# Primeiro smoke Kaggle: procedimento para execução futura autorizada

Nenhuma submissão real foi feita nesta missão. Os comandos remotos abaixo são um procedimento para um operador autorizado, não instruções para o site executá-los automaticamente. GitHub Pages não autentica contas nem conversa com o executor. A ponte operacional é um pacote JSON exportado e relatórios importados por escolha do usuário. Uma conexão automática exigiria serviço intermediário autenticado, autorização individual, política de origem e implantação separadamente aprovados.

## Preparação sem conta

No Laboratório IA → Experimentos, escolha a receita, inspecione objetivo, código e parâmetros, e use **Exportar pacote para o executor**. `kaggle-package.json` contém job, notebook e metadados. O executor compara todo o pacote com sua própria receita verificada. Não extrai ZIP/TAR nem executa código fornecido pelo arquivo.

Para usar o pacote exportado nos comandos abaixo, substitua o valor de `--job` por `kaggle-package.json`; não descompacte ou execute seu conteúdo manualmente.

Para o primeiro smoke use `experiments/kaggle-smoke-job.json`: inferência de um classificador linear de 87 parâmetros, um pedido, dados sintéticos embutidos, stdlib, CPU, sem GPU/internet/download. Não é um LLM. A execução local completa produz três artefatos reais: `result.json`, `metrics.json`, `events.json`. Não se atribui generalização a esse exemplo.

```bash
python3 -m executor.cli validate --job experiments/kaggle-smoke-job.json
python3 -m executor.cli prepare --job experiments/kaggle-smoke-job.json --workspace ../pat-private
python3 -m executor.cli local --job experiments/kaggle-smoke-job.json --workspace ../pat-private
```

O workspace precisa ser privado, fora de qualquer diretório servido por HTTP. Nunca sirva seu ancestral. Estado corrompido é preservado e bloqueia envio; não apague o ledger para tentar novamente.

## Revisão e autorização individual

Somente em um ambiente de operador futuramente autorizado: instale `executor/requirements-kaggle.txt` e configure autenticação pelo mecanismo oficial do SDK, fora do frontend e dos argumentos do CLI. Esta referência suporta `KAGGLE_API_TOKEN` já configurado pelo operador; não pede nem grava seu valor. O SDK oficial também documenta OAuth e formatos legados, que não são login do aplicativo.

Substitua `seu-usuario` pela conta revisada. Os comandos de validação e autorização não utilizam rede:

```bash
python3 -m executor.cli validate --job experiments/kaggle-smoke-job.json --owner seu-usuario --run
```

Revise job, notebook preparado, `execution` e `execution_sha256` retornados. O hash de execução inclui hash do job, notebook inteiro, metadados privados/CPU/sem internet, conta, intenção de executar e versões do SDK. **Não use `spec_sha256` como aprovação.** Alterar dados, parâmetros, código do builder, conta ou modo de execução invalida o recibo. Confira o fingerprint novamente após atualizar o aplicativo/executor.

Após autorização explícita externa para aquele experimento, use o hash revisado no lugar de `HASH_DE_EXECUCAO`:

```bash
python3 -m executor.cli authorize --job experiments/kaggle-smoke-job.json --workspace ../pat-private --owner seu-usuario --run --approve HASH_DE_EXECUCAO
```

Isso grava o notebook/metadados aprovados e `authorization.json` no workspace privado. Alterar os arquivos depois da aprovação impede submit, sem substituir silenciosamente a edição. O recibo não é identidade criptográfica de uma pessoa; quem pode editar o diretório do operador controla essa confiança. A aplicação pública não pode criar essa autorização no executor.

## Envio e acompanhamento futuros

Somente após a autorização do usuário para a execução remota específica:

```bash
python3 -m executor.cli submit --job experiments/kaggle-smoke-job.json --workspace ../pat-private --owner seu-usuario --run --approve HASH_DE_EXECUCAO --allow-network
python3 -m executor.cli status --job experiments/kaggle-smoke-job.json --workspace ../pat-private --owner seu-usuario --run --approve HASH_DE_EXECUCAO --allow-network
python3 -m executor.cli follow --job experiments/kaggle-smoke-job.json --workspace ../pat-private --owner seu-usuario --run --approve HASH_DE_EXECUCAO --allow-network --max-checks 10
```

O `--run` nas consultas descreve o modo aprovado; consultar não inicia execução. Sem `--run`, a autorização e o envio correspondem a **salvar sem executar** (`no_run=True`), com outro hash. O SDK padrão salvaria e executaria; nossa referência passa a opção explicitamente.

A chamada de gravação ocorre depois de um fence atômico no ledger. Toques/CLI repetidos e processos concorrentes não geram outra submissão conhecida. Timeout, falha ou resposta inesperada após o envio deixam `submission_unknown`; **não reenviar nem apagar estado**.

## Reconciliação de um envio incerto

Identifique a versão exata no histórico oficial da conta. Não presumimos um endpoint de busca por chave de idempotência ou que uma ausência momentânea prove falha. Use o número observado no lugar de `7`:

```bash
python3 -m executor.cli reconcile --job experiments/kaggle-smoke-job.json --workspace ../pat-private --owner seu-usuario --run --approve HASH_DE_EXECUCAO --allow-network --remote-version 7
```

A operação lê `owner/slug/7` via `kernels_pull(..., metadata=True)` e `kernels_status`, verifica todas as células/fontes e os metadados de segurança. Ignora somente decoração de execução e segmentação de source em lista/string, como faz o SDK. Se código, conta, hardware ou estado forem inesperados, o fence permanece. Nenhuma nova submissão é feita. Se não for possível identificar/verificar a versão, o estado continua desconhecido para investigação manual. Não há autorização para retry cego.

## Recuperação e retorno ao aluno

```bash
python3 -m executor.cli logs --job experiments/kaggle-smoke-job.json --workspace ../pat-private --owner seu-usuario --run --approve HASH_DE_EXECUCAO --allow-network
python3 -m executor.cli collect --job experiments/kaggle-smoke-job.json --workspace ../pat-private --owner seu-usuario --run --approve HASH_DE_EXECUCAO --allow-network
python3 -m executor.cli report --job experiments/kaggle-smoke-job.json --workspace ../pat-private --owner seu-usuario --run --approve HASH_DE_EXECUCAO
```

`COMPLETE` vira `remote_complete`: execução concluída, resultados ainda não validados. `collect` baixa somente a whitelist de arquivos da versão explícita, verifica tamanho, JSON, hashes e cálculos determinísticos, preserva os bytes validados em `artifacts/` (0600) e grava `report.json` com estado `completed` (resultado recuperado). Falha no download mantém o estado recuperável, sem reenviar job. Os hashes do relatório descrevem os mesmos bytes retidos. Diretórios são 0700; arquivos são 0600. Logs filtrados ficam em `logs.json`; não são despejadas mensagens brutas do SDK.

Importe `report.json` (ou `status-report.json`, sem métricas para estados intermediários) na receita de inferência do aplicativo. Identificador remoto, versão, estado e origem declarada ficam no histórico local, até dez registros por receita. Métricas completas permanecem no arquivo/aba; nenhum upload automático ocorre. Job editado e relatório com outra configuração são identificados separadamente.

O navegador valida contratos e fingerprint, mas **não autentica a conta e não atesta criptograficamente um arquivo importado**. `injected-transport` é teste, `local-cpu` é CPU local, `kaggle-sdk` é origem declarada pelo executor autorizado. A existência de um relatório não conecta o Kaggle ao site.

`stop-following` apenas para o acompanhamento local. Não implementamos cancelamento remoto: os enums do SDK não comprovam uma operação pública de cancelamento.

## Antes do primeiro envio real

Confirmar autorização por job/conta, SDK fixado, rede permitida, privacidade e recursos. Verificar limite/quota da conta e disponibilidade; CPU não significa execução garantida ou instantânea. O campo de memória do contrato é descritivo, não uma reserva ou quota remota; limites RLIMIT pertencem aos subprocessos locais do executor. Não configurar GPU para o smoke. Registrar a versão retornada, logs/artefatos e resultado da importação. Essa validação autenticada permanece pendente; os testes locais não a substituem.
