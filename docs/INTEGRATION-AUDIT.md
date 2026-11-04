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

## Integração implementada

`learning/` acrescenta navegação por cinco áreas, grafo por IDs estáveis, recomendações determinísticas, preparação contextual e projeção de evidências sem outra base de progresso. Os subsistemas continuam donos de seus dados; snapshots são cópias de leitura. Não há soma de XP apresentada como competência.

As 40 missões ficaram intactas. Três desafios receberam pré-requisitos explícitos adicionais (print, funções/return e igualdade); duas legendas agora explicam + e *. Os 14 IDs, soluções e testes foram preservados. Sete cartões curtos de leitura preparam listas, operadores e construções compactas; não são novas questões nem concedem XP. Projetos Roteador/Avaliação são preparação recomendada para seus desafios avançados.

Abrir conteúdo é distinto de tentar/resolver. O runtime registra apresentação e execução com versão real do Python, sem guardar código livre ou conceder XP por executar. Registros antigos são normalizados de forma aditiva; não se estimam contagens históricas ausentes. A conclusão continua exigindo os testes reais.

Defeito de orientação corrigido: continuar após revisão/exploração podia reutilizar o índice da outra atividade. A recomendação agora seleciona a primeira missão pendente elegível, sem alterar os registros anteriores ou bloquear exploração. A lista de missões dá acesso às 40; debugging deixa de bloquear rigidamente por pré-requisito.

## Evidência antes do segundo marco

Passaram os testes locais existentes, novos testes puros de grafo/estado/execução/exportação e a jornada completa em 320/375/390 px. Ela conclui as 14 missões iniciais, erra/consulta dicas e glossário, produz/corrige exceção real, valida Python, interrompe ao navegar, retoma/conclui um projeto e baixa relatórios. Também simula estados, prepara Kaggle sem envio, revisa, reseta com confirmação e recupera JSON corrompido. O teste de subdiretório executou CPython e exportou notebook mantendo todos os recursos sob o prefixo. Medições reais ficaram em `.quality-results/integration-performance.json`.

Testes antigos de laboratório foram ajustados para a nova regra de Continuar e para abrir explicitamente os controles avançados; as validações de resposta/XP não foram afrouxadas. O manifesto de conteúdo anterior, inclusive `language.js`, permanece válido.

Pendências deste marco: duas passagens completas, revisão adversarial adicional, documentação de uso/prontidão e entrega. Execução autenticada Kaggle e Safari/iPhone físico permanecem não verificados.
