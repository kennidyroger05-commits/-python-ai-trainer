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

## Revisão crítica adicional e correções

A primeira tentativa completa (38 suítes configuradas) passou pelas missões, projetos, migrações e desafios reais, mas parou em `runtime-mobile-browser.cjs`: um teste ainda tentava clicar no planner com a seção avançada fechada. O teste foi corrigido para expandir a seção pela interface; não se afrouxaram critérios de execução, XP ou layout. Log preservado em `.quality-results/integration-first-attempt.log`.

Uma revisão separada do próprio agente examinou isolamento entre áreas, callbacks, estados degradados, idioma e coerência do feedback. Não é uma auditoria externa/humana. Os novos cenários foram executados contra o comportamento anterior; seis falharam antes das correções e cinco já passavam. Casos adicionais verificaram os defeitos encontrados durante a inspeção e revisão visual.

| Achado | Severidade | Correção / regressão |
| --- | --- | --- |
| Lab pendente retinha handlers essenciais | Alto | Missões são vinculadas antes de recursos opcionais; JSON tem deadline/abort. A conclusão tardia não tira o aluno da missão em andamento |
| Falha de projetos desativava Python | Alto | Runtime independente; referência de projeto só pode ser desconhecida no modo degradado explícito. Validação integral em desenvolvimento continua obrigatória |
| Glossário do Model Lab quebrava sem catálogo runtime | Alto | Termos carregados separadamente e fallback de indisponibilidade, sem acessar termo indefinido |
| Recomendação herdava retorno antigo | Médio | Abrir runtime substitui/limpa callback de retorno |
| Revisão normal herdava destino de projeto | Médio | Voltar ao início encerra contexto de revisão de projeto; timestamp de revisão inclui prática contextual |
| Erro inicial ignorava idioma salvo | Médio | Preferência e XP legados lidos antes das requisições; erro/retry sem apagar dados |
| Resposta resolvida podia mudar mantendo “Correto” | Alto pedagógico | Resposta, dicas e envio são bloqueados após acerto; handlers também recusam evento tardio/duplicado |
| Dados indisponíveis pareciam progresso zero | Médio | UI/relatório declaram desconhecido, mantendo histórico sem recomputar; IDs antigos desconhecidos não inflam contadores |
| Área ativa do menu podia ficar antiga | Médio, acessibilidade | Contexto explícito por área e aria-current verificado após cada transição; encontrado na revisão de screenshot com texto ampliado |
| Projeção descartava XP legado finito não inteiro | Baixo | Projeção preserva o mesmo valor aceito pelo carregador; não muda ledger |
| Resumo omitiria simulações do planner | Baixo | Seção própria com origem simulation; sem métricas reais inventadas |
| Aviso de revisão mantinha idioma antigo | Baixo | Estado de aviso independente do texto, renderizado no idioma atual |

`integration-edge-browser.cjs` agora executa 13 cenários reais de interface, incluindo storage negado, WASM corrompido/recuperado, toque duplo, exportações recusadas, importação malformada, troca de idioma no bootstrap, texto ampliado/redução de movimento/foco e IDs de progresso desconhecidos. Todos passaram nos testes direcionados. `content-loading.cjs` testa deadline/abort, paths relativos e modo degradado sem aceitar referências inválidas quando o catálogo existe.

Provas preservadas no workspace: `integration-edge-before.log`, `integration-edge-after.log`, `glossary-reproduction-before.json`, `solved-answer-before.json`, `integration-projection-before.log`. O erro do glossário foi confirmado interceptando somente fontes públicas do commit `52f8df4` em um navegador de teste isolado: TypeError e glossário vazio; nenhum arquivo de produção foi revertido. Uma asserção de teste foi ajustada para expandir o glossário antes de ler texto visível.

Depois das correções passaram as 22 suítes locais, as 40 missões nas três larguras, editor/Model Lab mobile, 13 cenários adicionais e o teste sob subdiretório. A primeira passagem completa sobre `215c8cb` terminou com **40 suítes aprovadas, zero reprovadas**.

Entre as passagens foi revisto o propósito das telas compartilhadas: evidências por área pertencem a Meu progresso; debugging e tutorial de testes pertencem a Praticar. O contexto passou a declarar a área explicitamente, em vez de herdar a localização técnica do renderer de projetos. O cenário adicional passou, totalizando 14 cenários adversariais de integração. A segunda passagem completa verificará esse ajuste e todas as regressões. Kaggle autenticado e Safari/iPhone físico permanecem não verificados.
