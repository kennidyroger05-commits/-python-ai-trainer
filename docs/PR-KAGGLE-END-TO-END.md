## Problema e resultado

O executor existente não completava a ponte operacional entre arquivos preparados no app e recuperação após envio incerto. Esta branch adiciona pacote JSON fechado, autorização específica do notebook/configuração/conta/modo, recibo privado, reconciliação de versão explícita e persistência de arquivos validados e identificadores. O fluxo é manual por arquivos; não há conexão automática, backend implantado ou autenticação Kaggle no frontend.

A CLI usa SDK oficial fixado, com rede desativada por padrão. A intenção é autorizar futuramente um smoke CPU pequeno, depois acompanhar e importar um relatório com origem declarada. Nada foi submetido ao Kaggle nesta missão.

## Alterações

- Reutiliza o executor de artefatos/estado, com Workflow operacional e gates mais fortes. A antiga entrada direta com SDK não aceita aprovação somente por hash do job.
- Envelope inclui SHA-256 de job, notebook e metadados, conta, intenção e versões do SDK. Edição posterior é recusada.
- Fence durável com fsync de arquivo/diretório antes da chamada; timeout impede retry cego, inclusive após reinício. Reconciliação verifica código/metadados da versão observada.
- Outputs validados são retidos com bytes/hash e permissões privadas. Logs são filtrados. Estado remoto desconhecido não é sucesso.
- Aplicativo exporta pacote e importa relatórios; histórico limitado de referência/versão/estado conserva origem declarada após recarregar, sem XP por submissão/importação.
- Preserva 40 missões, quatro projetos, 14 desafios Python, idiomas, revisão, XP, migrações, simuladores e notebooks anteriores.

## Validação

Primeira passagem completa: 42 suítes aprovadas, zero reprovadas. Após revisão adversarial, passaram 26 casos específicos do workflow, as suítes anteriores de executor/segurança e o novo E2E em 320/375/390 px. Segunda passagem completa: **42 suítes aprovadas, zero reprovadas**, sobre `56bc725`, após as correções. Evidências em `docs/kaggle-e2e-pass1.json` e `docs/kaggle-e2e-pass2.json`.

E2E local exporta pelo Chromium, passa o pacote ao executor Python, usa transporte Kaggle injetado com artefatos produzidos realmente em CPU local e importa o relatório de volta. Não é teste autenticado no Kaggle. O smoke mínimo foi executado integralmente em CPU local, sem dependências externas ou GPU.

Procedimento: [KAGGLE-FIRST-RUN.md](https://github.com/kennidyroger05-commits/-python-ai-trainer/blob/feature/kaggle-end-to-end/docs/KAGGLE-FIRST-RUN.md). Auditoria, matriz e limitações: [KAGGLE-END-TO-END-AUDIT.md](https://github.com/kennidyroger05-commits/-python-ai-trainer/blob/feature/kaggle-end-to-end/docs/KAGGLE-END-TO-END-AUDIT.md).

## Limites

Primeiro smoke Kaggle autenticado ainda pendente de autorização por job/conta e ambiente do operador configurado. O navegador não autentica relatórios; origem é declarada, não atestado criptográfico. Deduplicação é por ledger privado, sem chave de idempotência documentada do provedor. Não há cancelamento remoto implementado. WebKit/Safari/iPhone físico não foram testados nesta missão.

PR rascunho contra `feature/integrated-learning-experience`. Não fazer merge nem publicar; main permanece preservada.
