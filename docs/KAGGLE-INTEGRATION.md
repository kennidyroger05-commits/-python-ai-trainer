# Kaggle — executor de referência e limites verificados

Pesquisa atualizada em 2026-11-04. **Nenhuma conta foi autenticada e nenhum job remoto foi enviado/executado.** O site público prepara arquivos, interpreta referências locais e importa relatórios. O executor Python separado existe e foi testado com dependências injetadas; a rede fica desativada por padrão. Não há backend implantado.

## Evidência oficial

- [CLI/SDK Kaggle oficial](https://github.com/Kaggle/kaggle-cli), revisão `c10bff4bc13c6790e0914a8add3df33ac5e7510f`.
- [Kernels/notebooks](https://github.com/Kaggle/kaggle-cli/blob/c10bff4bc13c6790e0914a8add3df33ac5e7510f/docs/kernels.md), [metadados](https://github.com/Kaggle/kaggle-cli/blob/c10bff4bc13c6790e0914a8add3df33ac5e7510f/docs/kernels_metadata.md), [datasets](https://github.com/Kaggle/kaggle-cli/blob/c10bff4bc13c6790e0914a8add3df33ac5e7510f/docs/datasets.md).
- PyPI `kaggle==2.2.5`, wheel SHA-256 `711901cf1dfe9133d83ffed6f09972d97ce87adafc2b24f9a91038828a6393d7`.
- PyPI `kagglesdk==0.1.38`, wheel SHA-256 `ec9cb3cb2acaa92106f7c0334b7374e022bd6e6d1176a6780fec5606f6bc568d`.

Foram lidos `kaggle/api/kaggle_api_extended.py`, o CLI e os tipos oficiais em `kagglesdk/kernels/types/kernels_api_service.py` e `kernels_enums.py`. Os hashes foram conferidos antes de inspecionar os wheels. Não se importou/autenticou Kaggle para pesquisar: o pacote executa autenticação na importação de `kaggle`, por isso a importação do executor é tardia e protegida.

`www.kaggle.com/docs/api` e a API autenticada não são destinos liberados na política deste ambiente. Não se contornou essa política. As fontes foram consultadas via GitHub/PyPI. Quotas e comportamento de uma conta real não foram observados.

## Matriz de capacidades

“Fonte” significa verificado na documentação/código oficial. “Teste” distingue mocks, CPU e chamadas remotas.

| Operação / suporte | Como / dependências | Auth | Limites e evidência | Teste nesta missão |
| --- | --- | --- | --- | --- |
| Autenticação: suportada | CLI documenta OAuth, API token e formatos legados | Sim para conta | README oficial; ref usa somente token já configurado no ambiente do operador, sem login público | Ausência/invalidade injetadas; nenhum segredo/conta real |
| Preparar: suportado localmente | `kernels init` / metadados; nosso builder gera notebook fixo | Não | `kernels_initialize`; arquivos precisam seguir contrato | Dois notebooks completos em CPU e comparação JS/Python |
| Criar/atualizar e executar | `kernels_push(folder, timeout, acc, no_run=False)` chama `save_kernel` | Sim | Por padrão salva **e roda**; `--no-run`/QUICK_SAVE salva sem rodar | Mapeamento de argumentos/respostas com SDK falso; sem chamada real |
| Versão de submissão | `ApiSaveKernelResponse.ref` e `version_number` | Sim | Campo ausente/inconsistente produz submissão incerta, sem reenvio automático | Respostas válidas/inesperadas/timeout injetados |
| Status por versão | `kernels_status(owner/slug/version)` usa `version_label` | Sim/acesso ao recurso | `KernelWorkerStatus`: QUEUED/RUNNING/COMPLETE/ERROR/CANCEL_REQUESTED/CANCEL_ACKNOWLEDGED/NEW_SCRIPT | Máquina de estados, throttling e falhas simuladas |
| Logs por versão | `kernels_logs(owner/slug/version)` retorna string de log | Sim/acesso | Fonte 2.2.5; stream existe mas não é usado. Só eventos estruturados permitidos chegam ao relatório | Logs seguros, linhas omitidas e falhas injetados |
| Recuperar notebook | `kernels_pull` e metadados | Conforme acesso | Código/metadados podem ser baixados pela CLI; não é endpoint de inferência | Pesquisado, não implementado como ação da interface |
| Listar artefatos | `kernels_list_files`, itens `name/size`, paginação | Conforme acesso | Versão explícita; executor limita páginas, nomes e bytes | SDK falso e testes adversariais |
| Baixar outputs | `kernels_output`, regex de whitelist e paginação | Conforme acesso | Retorna `(outfiles, next_page_token)`; usa URLs assinadas internamente no SDK, nunca expostas ao frontend | SDK falso, diretórios temporários e validação de artefatos reais locais |
| Datasets | CLI create/version/files/download e SDK correspondente | Escrita exige conta | O código limita operações anônimas; dataset privado não é presumido acessível | Fonte pesquisada; não foram criados/baixados datasets Kaggle |
| GPU/TPU | Metadados `enable_gpu/machine_shape`, argumento `acc`; `quota_view()` consulta quota da conta | Sim | Solicitação não garante disponibilidade. Quota é dinâmica e específica da conta | Fonte e tipos inspecionados; nenhum acelerador/quota real consultado |
| Cancelar execução | Nenhuma mutação de cancelamento confirmada no contrato usado | — | Enum de cancelamento não prova API para solicitar cancelamento; `delete` não é stop | Recurso remoto ausente; teste prova que stop-following só altera estado local |
| Frequência | HTTP 429 e mensagens de erro existem no SDK | Conforme operação | Não há uma taxa universal confirmada; respeitamos Retry-After limitado e intervalos ≥15 s | 429/timeouts/rede injetados, sem medir rate limit real |
| Armazenamento | SDK publica tamanho de outputs e operações de datasets | Conforme acesso | Não confirmamos uma quota universal de disco/conta. Referência limita total de artefatos a 1 MiB e só baixa arquivos permitidos | Tamanhos, ausência, JSON, symlinks e traversal testados |

O guia de metadados e o código inspecionado divergem em defaults de internet. Exportamos explicitamente notebook privado, internet/GPU/TPU desativados e fontes externas vazias. As receitas são autocontidas e não dependem desses defaults.

## Três componentes

1. **Interface:** `experiments/` no GitHub Pages. Sem credenciais, endpoints privados, polling ou submissão de conta. Exporta job/notebook/metadados e importa arquivos por ação explícita.
2. **Adaptador:** contratos fechados e serialização comum; hashes/fingerprints conferidos entre JavaScript e Python. O Model Lab anterior mantém seu mock explicitamente simulado.
3. **Executor autorizado:** pacote `executor/`, CLI de operador, SDK oficial em processo limitado e importação tardia. Não escuta HTTP e não é instalado ou implantado automaticamente.

Contrato v2 inclui receita, modelo, dataset, objetivo, ambiente/versões, hardware, configuração, recursos e proveniência. Ledger separado guarda estado, versão remota, erros, eventos e relatório. Credenciais/URLs/scripts/caminhos não pertencem ao job. Os dados antigos do aplicativo não são migrados destrutivamente.

## Ciclo de vida seguro

`prepared → submitting → submitted → queued/running → remote_complete → completed`. `COMPLETE` significa que o SDK observou o fim daquela versão; o executor só marca `completed` após validar os arquivos. Uma versão salva sem execução tem estado `saved_only`. Falhas e cancelamentos observados têm estados próprios.

Antes de contato externo, política deve habilitar rede, especificar dono autorizado e aprovar o SHA-256 exato do job. `--run` é permissão adicional. Por padrão, submit usa `no_run=True`. A permissão do frontend não pode habilitar essas flags em um executor hospedado.

O ledger usa lock e escrita atômica. Repetição não produz uma nova submissão. Timeout de escrita é ambíguo: `submission_unknown` bloqueia repetição até reconciliação manual, evitando duplicar treino. Configuração alterada precisa de novo ID/aprovação. Acompanhamento tem orçamento de consultas e timeout por operação; parar acompanhamento não envia cancelamento remoto.

A intenção de executar é durável: NEW_SCRIPT inesperado após envio não autoriza novo job. Uma versão salva deliberadamente sem execução pode ser enviada uma única vez com a permissão adicional. Estado antigo recupera a intenção de seus eventos registrados. Job aprovado, notebook e recibo compartilham o mesmo snapshot.

O workspace privado é obrigatório e fica fora de qualquer raiz HTTP; caminhos dentro deste repositório são recusados. Não sirva o diretório do operador, nem um ancestral dele. Arquivos novos têm 0600 e diretórios 0700. O executor não corrige permissões de pastas existentes silenciosamente.

Resultados são fixados em `owner/slug/version`, validam fingerprint, schema, valores finitos, arquivos/tamanhos, splits e coerência do checkpoint. Logs do SDK não são despejados: linhas desconhecidas são omitidas para evitar tokens e dados sensíveis. Erros retornam códigos estáveis, sem headers, URLs assinadas ou corpo bruto de resposta.

Somente a whitelist de artefatos é baixada; um notebook auxiliar normal da plataforma não impede esse download, enquanto traversal/symlinks continuam recusados. Hashes descrevem o mesmo snapshot de bytes validado. Os cálculos das receitas pequenas são reproduzidos para conferir valores, incluindo métricas anteriores ao treino. O cache de relatórios concluídos também passa por validação fechada na releitura.

O transporte de testes produz origem `injected-transport`; CPU local produz `local-cpu`. Somente o transporte SDK autorizado pode registrar `kaggle-sdk`. Mesmo assim, um arquivo importado no frontend tem **origem declarada**, não confirmação criptográfica ou nova autenticação no navegador.

## Primeira execução Kaggle futura

Os comandos e gates estão em [executor/README.md](../executor/README.md). A sequência requer autorização externa futura, ambiente do operador com SDK fixado/rede permitida e autenticação configurada fora do app; não há pedido de segredos nesta missão.

1. Validar o job e revisar seu SHA, receita, dados e recursos.
2. Gerar/inspecionar o notebook; executar localmente se necessário.
3. Autorizar explicitamente conta e operação. Salvar sem rodar e solicitar execução são ações diferentes.
4. Consultar a versão retornada, com backoff. Respostas inesperadas impedem avanço automático.
5. Após conclusão, recuperar artefatos, validar e gerar `report.json`.
6. Importar o relatório no aplicativo, mantendo os rótulos de origem. Para estado ainda não concluído, o CLI `report` gera `status-report.json` sem métricas inventadas.

Não é API síncrona de inferência, GPU permanente ou recurso gratuito ilimitado. O primeiro ensaio autenticado ainda precisa ocorrer em ambiente autorizado; testes locais e SDK falso não o substituem.
