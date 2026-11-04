# Auditoria de qualidade — Kaggle Execution

Base auditada: `ef817adc8b1859bfe780a9b8264f5b33160a598e`, branch `feature/kaggle-execution-quality`. Os arquivos anteriores foram encontrados intactos. Nenhuma mudança em main ou configuração do Pages. Esta auditoria distingue código testado localmente, SDK pesquisado e execução remota não autorizada.

## Auditoria inicial

Foram lidos módulos de conteúdo/progresso/persistência, runtime/iframe/worker/harness, editor, projetos/revisão/exportação e contratos/mock do Model Lab. As 14 suítes locais da base passaram. A regressão completa será repetida em duas passagens após a implementação.

| ID | Severidade | Achado | Evidência / tratamento |
| --- | --- | --- | --- |
| Q01 | Alto | Cancelar sincronamente no callback `running` deixa `active=null`, mas o listener continua lendo `active.timer` | Reproduzido no Chromium: `Cannot read properties of null (reading 'timer')`. Corrigido ordenando o watchdog antes do callback. `runtime-races-browser.cjs` passou após a correção |
| Q02 | Médio | O request é lido novamente após downloads; mutação do objeto altera o código submetido | Inspeção do fluxo assíncrono; novo teste exige snapshot imutável antes do primeiro await |
| Q03 | Médio | Timeout de inicialização não cobre downloads pendentes e inputs inválidos podem lançar erros fora do protocolo | Deadline/abort no carregamento; validação de JSON finito/tamanho/tipos; testes de request nulo, casos ausentes e download bloqueado |
| Q04 | Alto corrigido; residual médio | A memória linear WASM podia crescer sem orçamento pedagógico | Construtor de memória limitado a 64 MiB antes do bootstrap, sem alterar o vendor. Tentativa limitada de 128 MiB devolveu MemoryError real e o runtime recuperou. A alocação aceita de 1 MiB também passou. O teto não limita toda a heap JS nem o overhead do navegador; sem alegação de sandbox absoluta |
| Q05 | Médio, lacuna de integração | Contrato preparatório anterior não possui versão remota, proveniência de artefatos ou ledger de submissão | Será ampliado em contrato separado, preservando os dados anteriores; envio continuará desativado por padrão |
| Q06 | Médio, lacuna de evidência | Não há execução autenticada Kaggle verificada | Nenhuma credencial configurada, host Kaggle não permitido pelo ambiente. SDK/documentação oficial pesquisados; testes usarão injeção de dependências, sem conta |

Não foram encontrados segredos ou chamadas remotas de conta ativas na aplicação base. O contrato anterior se declara preparatório e não é tratado como modelo realmente executado.

## Política de evidências

Não contar suites como prova de cobertura integral. Cada requisito crítico terá teste e limite registrado na matriz final. Mensagens Python vêm do interpretador. Falhas injetadas do SDK serão identificadas como testes simulados; treino/inferência em CPU não serão rotulados Kaggle. Uma submissão não prova conclusão. Interromper acompanhamento não cancela job remoto.

## Passagens finais

Pendente nesta revisão inicial: implementar executor/notebooks/fluxo pedagógico e executar duas passagens completas (funcionalidade/integração; segurança/casos extremos/regressão). Os resultados e achados adicionais serão registrados antes da entrega.
