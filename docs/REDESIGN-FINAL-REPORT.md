# Entrega V4 — aprendizagem progressiva e redesign mobile

Implementação pronta para revisão na branch `feature/learning-experience-v4`, criada da main `57eaec8b2e5f36f1b9bdaf2f2fd4b2aa676797c6`. A main não foi alterada por esta missão. Sem merge, publicação, credenciais reais ou execução Kaggle remota. A validação em iPhone/Safari físico continua pendente; não se declara prontidão para publicação.

## Currículo implementado

**145 missões em 14 unidades: 40 originais preservadas e 105 novas**, além de **14 desafios executáveis e quatro projetos**. Desafios e etapas de projeto não foram somados artificialmente ao número de missões. A [matriz curricular](CURRICULUM-MATRIX.md) contém contagens por unidade, sequência completa de IDs, arestas de pré-requisitos e preparação do runtime/projetos.

Valores → listas → condições → funções → texto → laços → dicionários/JSON → erros/testes → arquivos/dados → APIs → ferramentas/agentes → avaliação → treinamento → integração. Antes dos códigos completos dos projetos, são apresentados também desempacotamento, `zip`, `enumerate`, compreensões, geradores, `lambda` e `key`. Quatro mini-integrações consolidam os fluxos antes dos projetos.

As seis modalidades continuam ativas: **6 montar, 15 completar, 2 identificar erro, 14 corrigir, 96 prever e 12 ler**. Os exercícios autorais têm cenários próprios, uma novidade principal, definição antes da tentativa, duas dicas, solução verificável, explicação, contexto e vocabulário traduzido. Não foram criadas cópias por multiplicação. A auditoria usa fixtures CPython, validação de alternativas, análise de sintaxe/pré-requisitos e revisão dos códigos completos dos projetos; não depende de um modelo de IA como única autoridade.

## Experiência e arquitetura

- Home orientada à próxima atividade e progresso da unidade; trilha explorável, sem bloqueios permanentes.
- Identidade clara com tema escuro opcional, cartões e tipografia consistentes, código contrastante e ações por toque. Navegação Aprender · Praticar · Mais dá acesso às cinco áreas.
- Missão com preparação curta, glossário, dicas, feedback útil, explicação após o acerto e retorno à unidade. Revisão informa quantas atividades restam e volta a Meu progresso.
- Atalhos de unidade introduzem blocos → trechos → linhas → código livre. Projetos mostram preparação, dez etapas, objetivo e resultado esperado.
- `curriculum/engine.js`: validação, ordem, orientação, migração e reset por IDs. `curriculum/view.js`: home/unidades e preparação. `app.js`: integração dos estados já existentes. `style.css` e `curriculum/design.css`: sistema visual comum. Sem framework ou dependência nova de produção.

O catálogo original, dados de projetos, mecanismos do runtime, experimentos e executor foram comparados com a base: [58 arquivos preservados byte a byte](v4-preservation.json). `runtime/view.js` só acrescenta recomendação inicial de modo, sem alterar worker, políticas, limites ou avaliação. A fonte autoral e os dados novos ficam em `scripts/build-curriculum.py` e `curriculum/`.

A chave de missões permanece `pythonAiTrainerV2`, com campos aditivos; projetos/runtime/experimentos mantêm suas próprias chaves. XP, conclusões e histórico anteriores são conservados. Exercícios novos começam não concluídos. Tentativas e dicas sobrevivem ao reload, sem recuperar indevidamente o prêmio de primeira tentativa. A serialização é estável. Reinício de unidade e reset geral exigem confirmação; dados de outros aplicativos permanecem.

## Validação executada

Duas passagens integrais de `node scripts/test.cjs --browser`, com **46 suítes aprovadas em cada uma e zero reprovadas no estado final**: 25 locais e 21 de navegador. As tentativas anteriores interrompidas não contam como aprovação.

| Passagem | Início UTC | Fim UTC | Resultado | Evidência |
| --- | --- | --- | --- | --- |
| 1 | 2026-11-04T18:22:06.524Z | 2026-11-04T18:37:46.132Z | 46/46 | [prova](v4-pass1.json) · [log](v4-pass1.log) |
| 2 | 2026-11-04T18:38:53.311Z | 2026-11-04T18:54:34.231Z | 46/46 | [prova](v4-pass2.json) · [log](v4-pass2.log) |

As duas provas têm o mesmo hash da árvore de código/testes, excluindo docs e README: `d3d43f882b8d92f0b06d50507dbdeb3cd7155d0b9d57a8c7f79a5c287378cf35`. A primeira testou `a0e34a0eaa9a1daa51e5441e4229cab05a6a4ae8`; a segunda, `52ef1382203ee18cd94cb150477a568c3466ee78` (entre elas, apenas documentação). A segunda revisão crítica conferiu preservação do runtime/executor, ausência de novas dependências/configurações administrativas e de execução dinâmica de JS nos módulos curriculares; não é auditoria externa certificada. O check adicional de [reinício guiado](v4-unit-restart.json) testou cancelamento sem alteração de bytes e confirmação com preservação de outra unidade nas três larguras. Uma inspeção dos 145 registros não encontrou alternativas que diferissem apenas por espaços colapsáveis.

O conjunto inclui: dados/traduções/IDs, respostas certas e erradas, 105 fixtures novas em CPython, pré-requisitos das 145 missões e códigos completos dos projetos, regressão das 40 originais, 70 etapas de atividades guiadas, 14 desafios com 28 reparos incorretos rejeitados por Python real, simulações, exportação/importação, persistência/migrações, dicas, XP, reset, concorrência e isolamento. O percurso das 145 missões/14 unidades foi concluído pela interface em 375 px; os percursos de início, temas, idiomas, preparação, projetos e prática também foram testados em 320 e 390 px.

As jornadas por toque cobrem erro/dica/acerto/XP, reload, execução real, exceção e correção, testes, projeto retomado/concluído/exportado, laboratório, preparação Kaggle, revisão, conectividade limitada, reset e recuperação. Foram executados 15 cenários adversariais de integração e 11 V4. As suítes de executor/Kaggle usam SDK injetado e artefatos locais reais, com zero chamadas a conta Kaggle. Os dois notebooks anteriores foram executados integralmente em CPU local pela suíte; isso não é execução remota.

[Relatório mobile](MOBILE-TEST-REPORT.md), [capturas reais](screenshots/), [contraste medido](v4-contrast.json) e [desempenho local](v4-performance.json). Os pares de paleta medidos ficaram acima de 4,5:1 nos dois temas; não é certificação WCAG completa. Abertura da trilha em 188–205 ms e primeira execução Python em 2106 ms são amostras locais no commit indicado no JSON, sem equivalência com rede móvel/iPhone. O interpretador não foi carregado na abertura. Pico de memória física no iPhone não foi medido.

## Falhas identificadas e corrigidas

| Problema | Correção e regressão |
| --- | --- |
| XP de primeira tentativa reaparecia após reload; dicas não eram preservadas por missão | Cálculo usa tentativas/dicas persistidas; casos com erro, reload, dicas e acerto verificam o prêmio real |
| Campos aditivos regravavam JSON equivalente com ordem diferente | Serialização canônica e save/load/save com mesmos bytes; isolamento de XP dos projetos revalidado |
| Trilha esperava módulos opcionais | Currículo disponível antes dos labs; requisição retida verifica 14 unidades e missão ativa preservada |
| Toque em Validar era perdido ao sair do editor | Barra inferior conserva geometria; pointerdown/pointerup devem atingir o mesmo botão; todos os desafios reais reexecutados |
| Revisão herdava os rótulos da trilha | Rodada com contagem/conclusão próprias, saída, idioma e retorno a Meu progresso, sem XP duplicado |
| Conclusão de todas as missões sugeria novamente a primeira | Próxima atividade leva aos quatro projetos |
| Glossário compartilhado era sobrescrito por contexto posterior | Conserva primeira definição e explicações específicas por exercício |
| Evidência nova podia falhar quando projetos voltavam a carregar | Taxonomia explícita de skills e teste de indisponibilidade/recuperação |
| Glifo ausente, título duplicado, contraste transitório e foco/scroll inadequados | Marca local, hierarquia de texto, troca de tema sem interpolação de fundo e foco/scroll revistos |
| Fixture autoral com escape incorreto, reparo com alvo duplicado e alternativa repetida | Dados corrigidos após falha de CPython/validação, antes da entrega |

Três tentativas anteriores da suíte completa foram interrompidas por falhas e não contam como aprovações: serialização, toque no editor e navegação antiga no teste de jornada. O helper legado foi adaptado ao arquivo original acessível pela UI, mantendo as verificações de atividade, resultados e XP. A investigação da jornada também originou a correção real dos rótulos de revisão.

## Limitações e riscos restantes

- WebKit não está instalado; não houve teste físico em Safari/iPhone, VoiceOver, barras, notch, teclado virtual ou download no iOS. São validações antes de publicação.
- O runtime mantém limites de memória linear/tempo/saída e origem opaca/worker; não é sandbox absoluta nem interpretador com toda a stdlib. Pressão total de memória no aparelho continua um risco a medir.
- Arquivos/CSV são exemplos em memória e fixtures confiáveis de desenvolvimento; responder uma missão não registra execução Python do aluno. Montagem estática aceita soluções cadastradas; equivalências gerais são avaliadas somente nos desafios com testes reais e limitados.
- Sem service worker, recarga totalmente offline não é garantida. Glossário/dados já carregados funcionam na aba; rascunho livre continua apenas na sessão.
- Kaggle autenticado permanece desativado. Exportar/preparar/importar não comprova execução real; o executor separado e a autorização por job permanecem preservados. Sem backend implantado ou tokens no frontend.
- Auditoria de pré-requisitos e jornada automatizada não é estudo de eficácia com iniciantes. XP e conclusões não atestam domínio profissional.

## Entrega e continuidade

Branch `feature/learning-experience-v4`, base main. [Comparação](https://github.com/kennidyroger05-commits/-python-ai-trainer/compare/main...feature/learning-experience-v4?expand=1) e [corpo preparado do PR](PR-LEARNING-V4.md). A criação foi tentada com `gh pr create --draft --base main --head feature/learning-experience-v4`; a API retornou `Post https://api.github.com/graphql: Forbidden`. Nenhum PR foi criado por esta tentativa. O corpo está preparado e a comparação permite abrir o rascunho posteriormente. Não foram solicitadas credenciais nem alteradas restrições de acesso.

Commits incrementais anteriores ao fechamento documental:

- `2017d2b` — Build a 14-unit curriculum with 104 validated lessons and preserve legacy progress
- `887e984` — Integrate the curriculum with a complete mobile learning interface and persistent practice hints
- `01eb499` — Close executable and project learning gaps and harden mobile state recovery
- `32361ff` — Stabilize migration bytes, prioritize curriculum loading and guide completion into projects
- `5002e66` — Keep mobile execution controls stable across editor blur and consolidate learning guides
- `090ffca` — Record measured mobile captures and exact preservation of existing learning infrastructure
- `a0e34a0` — Give adaptive reviews explicit round controls and preserve the learner journey through mobile navigation
- `52ef138` — Record the first complete V4 validation pass and the current mobile learning journey

Arquivos centrais e autoria estão explicados no [README](../README.md), [arquitetura](ARCHITECTURE.md), [trilha](LEARNING-PATH.md), [diretrizes](CONTENT-GUIDELINES.md), [reconstrução pedagógica](PEDAGOGICAL-REDESIGN.md) e [sistema visual](UX-DESIGN-SYSTEM.md). Não foi iniciada outra missão. Próxima ação recomendada: revisar esta branch no Safari/iPhone real e registrar os achados antes de autorizar merge/publicação.
