# Executor de referência separado

Não é um backend instalado nem serviço HTTP. Nenhuma execução remota está habilitada por padrão. Importar o pacote não importa/autentica Kaggle. O CLI aceita somente receitas fixas e contratos fechados, nunca Python arbitrário recebido do frontend.

## Operações offline verificadas

```bash
python3 -m executor.cli validate --job experiments/intent-inference-job.json
python3 -m executor.cli prepare --job experiments/intent-inference-job.json --workspace ../python-ai-experiments-private
python3 -m executor.cli local --job experiments/intent-inference-job.json --workspace ../python-ai-experiments-private
```

`local` executa o notebook inteiro em CPU, em subprocesso sem credenciais herdadas e com limites de 256 MiB de espaço de endereços, 10 s de CPU, 15 s de parede e 2 MiB por arquivo. Só usa stdlib. O relatório fica em `<workspace>/<job>/local-report.json`. A execução não marca um job Kaggle como concluído.

Todas as operações, exceto `validate`, exigem `--workspace` explícito. Use um diretório do operador fora de qualquer raiz pública HTTP, incluindo seus ancestrais: o guard recusa caminhos dentro deste repositório, mas não conhece a configuração de outros servidores. O executor cria diretórios com modo 0700 e arquivos 0600; diretórios existentes compartilhados ou symlinks são recusados sem alterar suas permissões. Não sirva o workspace pelo GitHub Pages ou pelo servidor de desenvolvimento.

## Workflow operacional com autorização individual

O CLI agora usa `Workflow` sobre o executor anterior. Consulte [primeiro smoke](../docs/KAGGLE-FIRST-RUN.md) e [auditoria E2E](../docs/KAGGLE-END-TO-END-AUDIT.md). O CLI aceita tanto job.json quanto o pacote JSON exportado do site. ZIP/TAR não são extraídos.

## Futuro uso remoto autorizado

Requer ambiente separado autorizado, rede permitida, dono correto e autenticação do SDK configurada no servidor/estação do operador. Não coloque credenciais em argumentos, frontend, notebook, localStorage ou Git. O transporte de referência suporta somente token do SDK já configurado no ambiente do operador; OAuth/credenciais legadas são capacidades oficiais pesquisadas, mas não implementadas como login deste app.

Instalar `requirements-kaggle.txt` é opcional e não foi necessário para os testes locais. Versões do SDK são fixadas e a importação fica atrás dos gates. O script `sdk_worker.py` usa processo com limite de tempo/memória/arquivo e descarta stdout/stderr do SDK; erros retornam códigos estáveis, sem valores de credenciais.

Exemplo **para autorização futura, não executado nesta missão**:

```bash
python3 -m executor.cli submit --job experiments/intent-inference-job.json \
  --workspace ../python-ai-experiments-private \
  --allow-network --owner AUTHORIZED_OWNER --approve EXECUTION_SHA_FROM_VALIDATE_WITH_OWNER_AND_RUN
```

Antes de submit, execute `validate --owner ... [--run]` e `authorize --owner ... [--run] --approve EXECUTION_SHA`; a autorização é offline e específica para o notebook, configuração, metadados, conta, modo e versões. O hash do job sozinho não serve como recibo. Use o mesmo modo também nas consultas.

Por padrão, `submit` chama `kernels_push(..., no_run=True)`: salva uma versão, sem rodar células. Para solicitar execução, um operador autorizado deve adicionar explicitamente `--run`. Essa permissão é vinculada ao SHA-256 do envelope de execução completo. O dono vem da política do executor, não do frontend.

`status`, `logs`, `follow` e `collect` precisam dos mesmos argumentos de autorização de rede/dono/SHA. As consultas usam `owner/slug/version`, não “latest”. `follow` tem orçamento de consultas, intervalo mínimo de 15 s e backoff; 429 respeita Retry-After limitado. `stop-following` é local e não cancela a execução remota. Não há operação de delete/cancel remoto.

O ledger usa escrita atômica e lock por job. Toque/submit repetido não cria outra chamada. Timeout/falha incerta de submissão gera `submission_unknown`; a repetição é bloqueada até `reconcile --remote-version N`, que verifica a versão observada externamente, suas fontes e metadados sem reenviar. Não se pode tratar uma resposta perdida como autorização para submeter outra vez. IDs com configuração diferente também são recusados.

`COMPLETE` do SDK vira `remote_complete`. Só após recuperar a versão correta e validar fingerprint, schemas, tamanhos, nomes, métricas e artefatos o estado vira `completed`. Arquivos fora da whitelist, symlinks, path traversal, JSON inválido/duplicado e outputs ausentes são rejeitados. Estado local corrompido é preservado e impede novas ações; não é zerado automaticamente, pois isso poderia reenviar um job já criado.

Um transporte injetado retorna proveniência `injected-transport`, nunca evidência real de Kaggle. Relatórios locais declaram `local-cpu`. O arquivo exportado não é atestado criptográfico; o frontend o rotula como relatório importado com origem declarada.

Testes: `python3 tests/executor.py` (SDK/transportes falsos e artefatos reais locais), `python3 tests/notebooks.py`. Nenhuma conta, GPU ou job remoto participa desses testes.
