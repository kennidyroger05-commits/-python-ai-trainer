# Reconstruir a aprendizagem e a experiência mobile

A sequência anterior saltava de poucos fundamentos para projetos com construções ainda não preparadas. Esta mudança integra 145 missões em 14 unidades (40 preservadas e 105 novas), pré-requisitos explícitos, introdução gradual de Python real e preparação dos quatro projetos. A home orienta a próxima atividade e o redesign unifica as cinco áreas com navegação móvel compacta, tema claro/escuro, explicações e glossário contextual.

Preserva IDs, XP e histórico; corrige recompensa após reload, serialização, recuperação de evidências, carregamento opcional e toque perdido ao sair do editor. Runtime isolado, 14 desafios executáveis, projetos, laboratórios, notebooks e executor Kaggle permanecem preservados. Nenhum job remoto, credencial, merge ou publicação.

Validação completa e evidências: [relatório V4](https://github.com/kennidyroger05-commits/-python-ai-trainer/blob/feature/learning-experience-v4/docs/REDESIGN-FINAL-REPORT.md), [matriz curricular](https://github.com/kennidyroger05-commits/-python-ai-trainer/blob/feature/learning-experience-v4/docs/CURRICULUM-MATRIX.md), [mobile e capturas reais](https://github.com/kennidyroger05-commits/-python-ai-trainer/blob/feature/learning-experience-v4/docs/MOBILE-TEST-REPORT.md). O relatório registra somente rodadas efetivamente concluídas. Safari/iPhone físico e VoiceOver permanecem pendentes; WebKit não está instalado neste ambiente.

PR de rascunho contra main, para revisão; não publicar automaticamente.

Validação executada: duas passagens integrais de `node scripts/test.cjs --browser`, **46 suítes aprovadas em cada e zero reprovadas**, com o mesmo código funcional. Incluem 105 fixtures CPython novas, 145 missões pela interface, regressão dos quatro projetos/14 desafios, migrações, segurança e Chromium em 320/375/390 px. Provas e logs estão no relatório final.

Abertura automática tentada ao final: GitHub GraphQL retornou `Forbidden`. Comparação: https://github.com/kennidyroger05-commits/-python-ai-trainer/compare/main...feature/learning-experience-v4?expand=1
