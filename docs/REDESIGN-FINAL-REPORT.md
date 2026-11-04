# Relatório V4 — reconstrução pedagógica e visual

Branch exclusiva `feature/learning-experience-v4`, base main `57eaec8b2e5f36f1b9bdaf2f2fd4b2aa676797c6`. A main não foi alterada. Não houve merge ou publicação.

Implementados: currículo de 14 unidades/145 missões, 40 originais preservadas, 105 novas, matriz de preparação de 14 desafios e quatro projetos; identidade clara com tema escuro opcional; home orientada à próxima atividade; navegação por três controles e cinco áreas; missão com preparação, código, dicas, feedback e explicação; unidades/projetos com preparação explícita; migração aditiva e persistência de tentativas/dicas sem XP duplicado após reload.

Preservados: runtime Pyodide/worker/limites, 14 desafios reais, projetos e 70 etapas totais de atividades guiadas, idiomas, glossário, revisão, laboratórios, notebooks CPU, executor e gates Kaggle, exportações/importações e portfólio. Nenhuma credencial real ou execução remota foi utilizada.

Marcos já validados: `2017d2b` currículo inicial e migração; `887e984` identidade/interface integrada e jornada. A revisão atual acrescentou uma missão necessária para fallback por valor, pré-requisitos específicos de Python e preparação explícita de projetos. Os testes direcionados passaram; duas passagens completas ainda pendentes. O relatório será atualizado somente com evidência de execução.

## Revisão da primeira tentativa

A primeira tentativa completa passou pelas 40 missões e laboratórios antigos, mas parou em `projects-browser.cjs`: o teste de isolamento encontrou JSON equivalente regravado com ordem diferente dos novos campos de migração. Não houve perda de valores. A serialização foi estabilizada e o teste de reload agora exige os mesmos bytes; os projetos passaram novamente nas três larguras.

A revisão também reproduziu trilha invisível enquanto labs.json estava pendente (Continue já funcionava, mas havia zero cartões de unidade). O currículo agora aparece antes dos módulos opcionais; estes ficam indisponíveis explicitamente enquanto carregam. Um teste segura a requisição e exige 14 unidades e uma missão em andamento preservada.

A definição compartilhada de `in` e `assert` estava sendo sobrescrita por um exemplo posterior mais específico. O glossário agora conserva a definição da primeira apresentação; cada exercício mantém sua explicação contextual. A conclusão de todas as missões também passou a orientar para os quatro projetos, em vez de sugerir outra vez a primeira missão.

Os testes direcionados atuais passaram: 25 suítes locais, 145 missões/14 unidades pela interface, 40 originais em três larguras, projetos com 70 etapas totais nas três larguras e 10 cenários novos de migração/carregamento/XP/contraste/acessibilidade. A tentativa parcial não será contada como passagem completa. Log preservado em `.quality-results/v4-attempt1-before-fixes.log`.

## Repetição da primeira passagem — defeito de toque

A repetição avançou por migrações, avaliação e testes do runtime isolado, mas encontrou um defeito real no editor redesenhado: ao sair do textarea, a barra de navegação mudava de `static` para `fixed`. O botão de validar mudava 78 px entre pointerdown e pointerup; o toque terminava em outro elemento e mantinha o resultado antigo. Isso não era uma rejeição do Python nem foi corrigido com espera artificial no teste.

A barra conserva a geometria e apenas fica invisível durante o foco de edição. O teste de todos os desafios agora exige que pointerdown e pointerup atinjam Validar e que o botão permaneça no lugar, além de verificar resultados reais certos/errados. A interpolação de cor dos botões também foi removida para impedir contraste intermediário baixo ao trocar tema. O log da tentativa interrompida permanece separado; ela não conta como passagem aprovada.

## Jornada e contexto de revisão

A terceira tentativa avançou por todo o runtime, laboratórios, experimentos e falhas de exportação; parou porque o teste legado de jornada reutilizava um details aberto dentro de uma área escondida, sem abrir novamente o arquivo de revisões. O helper foi corrigido para seguir o botão real. Na investigação, a revisão herdava os rótulos da unidade depois de reload: agora possui contagem de atividades restantes, botão de conclusão e retorno próprios a Meu progresso.

Foram reexecutadas com sucesso as jornadas completas em 320/375/390 px, revisão/laboratórios nas três larguras, 15 cenários adversariais de integração, os percursos Kaggle com SDK injetado e zero chamadas de conta, e hospedagem sob subdiretório. A suíte V4 passou a ter 11 cenários, incluindo revisão com saída antecipada, idioma e XP não duplicado. As tentativas interrompidas continuam registradas separadamente e não contam como passagens completas aprovadas.

Primeira passagem integral concluída: **46 suítes aprovadas, zero reprovadas**, de 2026-11-04T18:22:06.524Z a 2026-11-04T18:37:46.132Z, SHA a0e34a0eaa9a1daa51e5441e4229cab05a6a4ae8. [Prova](v4-pass1.json) e [log completo](v4-pass1.log). Segunda passagem integral ainda pendente neste checkpoint.
