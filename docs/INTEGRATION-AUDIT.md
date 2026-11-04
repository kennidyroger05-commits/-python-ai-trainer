# Auditoria de integração

Base real: `feature/kaggle-execution-quality`, commit `2ceb711e5d2fb0fac7ec5e49f57ea393704f1785`. Branch exclusiva: `feature/integrated-learning-experience`. Workspace preservado e limpo na abertura; main confirmado em `7fe0b80`. Nenhum merge, publicação ou execução remota autorizada.

## Estado inicial e dependências

As 19 suítes locais da base passaram novamente. Conteúdo e estado anteriores foram lidos antes de alterações. O runtime já usa origem opaca/worker e recursos relativos a document.baseURI; o executor separado e os notebooks permanecem protegidos e sem conta.

| Área existente | Dependências | Lacuna de integração inicial |
| --- | --- | --- |
| Missões | glossário, conteúdo, sessão, game/progress | Home com controles dispersos; sem catálogo livre nem ponte direta ao código |
| Revisão | tentativas/conceitos, lote e cooldown | Descoberta pelo botão isolado; ponto de treino pode ficar misturado ao índice de revisão |
| Python real | catálogo, progress, runtime isolado | Poucas ligações de missões; retorno rotulado sempre como projeto |
| Projetos/portfólio | engine, models, datasets, evidências | Competências/portfólio escondidos no menu interno; XP diferente com cabeçalho ambíguo |
| Laboratórios | labs, model-lab, experiments | Três entradas sem orientação única sobre simulado, preparado e real |
| Exportação | quatro implementações de download | Falhas podem escapar sem feedback; anchors não anexados em alguns caminhos |
| Persistência | chaves independentes e migrações | Não existe resumo comum de estados/proveniência |

## Defeitos reproduzidos antes das correções

- **Alto — inicialização:** resposta 503 em `labs.json` interrompe init antes dos handlers de missão. `integration-faults-browser.cjs` reproduziu timeout aguardando Continuar. O laboratório opcional agora falha isoladamente.
- **Médio — exportação:** recusa de URL.createObjectURL não gerava feedback e lançava erro no clique. O novo helper compartilhado trata falha, remove anchor/revoga URL e mantém o estado.

Logs de reprodução: `.quality-results/integration-faults-before.log`. Uma primeira tentativa de teste encontrou o servidor HTTP desligado; foi corrigida a preparação do ambiente e a reprodução foi refeita, sem contar esse erro de infraestrutura como defeito do app.

## Continuidade

Próximos marcos internos: navegação/estado agregado e ligações pedagógicas; jornada completa e falhas em subdiretório; auditoria de conteúdo/acessibilidade/desempenho; duas passagens completas e relatório. Os resultados finais substituirão as pendências, com limites explícitos.
