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

Entre as passagens foi revisto o propósito das telas compartilhadas: evidências por área pertencem a Meu progresso; debugging e tutorial de testes pertencem a Praticar. O contexto passou a declarar a área explicitamente, em vez de herdar a localização técnica do renderer de projetos. O cenário adicional passou, totalizando 14 cenários adversariais de integração. A segunda passagem completa verificou esse ajuste e todas as regressões. Kaggle autenticado e Safari/iPhone físico permanecem não verificados.

Foi identificado ainda um reset incompleto em modo degradado: se o catálogo Python não carregasse, o objeto runtime não existia e seus dados antigos ficavam fora da limpeza. A reprodução preservou `pythonExecutableV1` após confirmar o reset. A limpeza global agora remove explicitamente todas as chaves conhecidas e backups, independentemente de módulos carregados, mantendo a confirmação e as chaves alheias. O teste verifica recusa, confirmação, remoção de recovery e recarga com histórico zerado. A fixture foi corrigida para não reinserir artificialmente os dados em toda recarga.

A execução parcial da segunda passagem foi encerrada pelo agente para incluir essa correção; não foi contada como aprovação completa. Log parcial em `.quality-results/integration-pass2-partial-before-reset.log`; reprodução em `degraded-reset-before.json`. A passagem completa foi reiniciada sobre o commit da correção, `4c72eaa`, e terminou em **2026-11-04 07:56:57 UTC com 40 suítes aprovadas e zero reprovadas**, incluindo os 15 cenários adversariais de integração. A primeira terminou em 07:25 UTC sobre `215c8cb`, também com 40/40. Evidências com comandos, versões, commits e hashes dos logs: [passagem 1](integration-pass1.json) e [passagem 2](integration-pass2.json). Os logs brutos permanecem no workspace ignorado `.quality-results/`; não são necessários para executar novamente a suíte.

## Matriz de verificação da jornada

| Requisito / fluxo | Evidência | Limite |
| --- | --- | --- |
| Primeiro acesso, missão, erro, duas dicas, glossário e XP | `journey-browser.cjs`, `browser.cjs` | Não mede aprendizagem de uma pessoa real |
| Português/Misto/English, inclusive atividade e erro inicial | `journey-browser.cjs`, `runtime-language-browser.cjs`, `integration-edge-browser.cjs` | Exceções Python continuam reais, no idioma do interpretador |
| Recarga e migrações V1/V1.5/V2/V3 | `storage-migration.cjs`, `runtime-migration.cjs`, `projects-edge-browser.cjs` | Sem sincronização transacional entre abas/dispositivos |
| Ler/montar/completar/editar/executar/testar/corrigir | `browser.cjs`, `runtime-lessons-browser.cjs`, `journey-browser.cjs` | Runtime é um subconjunto didático de Python |
| Python real, exceção, correção, casos variados e XP único | `runtime-browser.cjs`, `runtime-python.py`, `runtime-core.cjs`, jornada | Testes públicos e locais não são certificação antifraude |
| Concorrência, cancelamento, timeout, memória e estado limpo | `runtime-races-browser.cjs`, `runtime-memory.cjs`, `runtime-edge-browser.cjs` | Quota WASM não cobre todo o JS/navegador |
| Projeto iniciado, retomado, concluído e relatório | `projects-browser.cjs`, `projects-python.py`, jornada | Projeto guiado continua simulado; prática real é separada |
| Model Lab, preparação Kaggle e proveniência | `model-lab-browser.cjs`, `experiments-browser.cjs`, `experiments.cjs`, jornada | Não autentica nem submete conta Kaggle |
| Notebooks e executor preservados | `notebooks.py`, `executor.py`, `security-adversarial.py` | CPU local e SDK injetado; nenhuma execução remota real |
| Revisão determinística, elegibilidade, cooldown e retorno | `core.cjs`, `labs-browser.cjs`, integração core/edge | Sugestão por evidência registrada, sem nota de domínio |
| Reset confirmado, inclusive módulos ausentes | `integration-edge-browser.cjs`, migração/storage, jornada | Arquivos baixados/estado privado do executor não são apagados |
| Corrupção, JSON inválido e storage negado/quota | `integration-faults-browser.cjs`, `integration-edge-browser.cjs`, storage | Falha é visível; sessão sem storage não promete persistência |
| Rede limitada | Jornada offline após carga; loader/edge com falhas e abort | Não há garantia de recarga offline nem service worker |
| Prefixo GitHub Pages | `subdirectory-browser.cjs` com CPython e exportação de notebook | HTTP local emulado, sem mudança da configuração real do Pages |
| Toque, foco, área ativa, texto ampliado e redução de movimento | Jornada/edge/mobile em 320/375/390 px e altura de 620–844 px | Não é teste físico de teclado, barras ou notch do iPhone |
| Contraste e semântica | Seis pares calculados em `integration-accessibility.json`, roles/labels/foco nos testes de UI | Não é certificação WCAG completa ou teste com VoiceOver |
| Exportação recusada e importação malformada | `download.cjs`, testes faults/edge/experiments | Iniciar download não atesta salvamento no Files do iOS |

A contagem de suítes não é declaração de cobertura integral. Casos corretos/incorretos usam os verificadores reais ou CPython. Kaggle utiliza dependências injetadas; testes de falha também interceptam recursos e APIs do navegador para provocar indisponibilidade, sem substituir execuções Python aprovadas por resultados inventados. Os testes de UI concluem ações, consultam estado, capturam downloads e validam dados, em vez de apenas procurar elementos.
