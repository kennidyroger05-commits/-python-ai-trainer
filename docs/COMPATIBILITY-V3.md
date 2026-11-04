# Auditoria e matriz de compatibilidade V3

Base inspecionada: V2 `eb813511d255994d994b0c9adac5af76c93beee8`. A referência remota coincide com a local. A branch V3 foi criada a partir dela, sem mudanças em main, V1.5 ou V2.

## Auditoria antes da implementação

Passaram as três suítes de conteúdo/lógica/CPython e as duas suítes mobile da V2 em 320, 375 e 390 px. As 40 missões têm respostas verificadas, seis modalidades e pré-requisitos anteriores. A progressão é em espiral e algumas perguntas de leitura exigem simultaneamente contexto de listas e índices; a V3 oferece exemplos/revisão contextual, sem reescrever ou inflar essas missões.

Defeitos encontrados no código: nomes de alguns módulos permaneciam em português no modo English; métricas de conceitos com formato local corrompido podiam quebrar a revisão; salvar após um JSON inválido podia substituir o registro sem cópia recuperável. A V3 corrige esses pontos e testa os casos danificados. A lista linear de pré-requisitos da V2 é mantida para compatibilidade, mas os projetos usam recomendações específicas e não bloqueios rígidos.

| Área | Preservação | Teste de regressão |
| --- | --- | --- |
| 40 missões / conteúdo | Arquivo original imutável | Hash da base e `validate.js`, CPython |
| Seis modalidades / XP | Mesmo motor e IDs | `browser.cjs` nas três larguras |
| V1 / V1.5 | Migração e IDs anteriores | `core.cjs`, manifesto V1.5 |
| Persistência V2 | Mesma chave, cópia antes de reparar corrupção | Testes storage e migração V3 |
| Idiomas / glossário | Mesmo seletor e preferência Misto | V2 browser e V3 browser |
| Traces V2 | Mesmos dados e controles | CPython e V2 browser |
| Labs V2 | Mesmos cinco fluxos e seis cenários | `labs-browser.cjs` |
| Revisão V2 | Elegibilidade, lote finito e cooldown | `core.cjs`, navegador |
| Projetos V3 | Estado separado das missões | Projeto unitário e navegador |
| Competências | Evidências rotuladas por origem | Migração e testes de evidência |
| Portfólio | Exportação local e sem upload | Conteúdo Markdown e download no navegador |

Safari/WebKit e iPhone real não estavam disponíveis na auditoria inicial. Chromium com viewport e toque não equivale a teste físico no iPhone.

## Resultado após recuperação e integração

As regressões de quarenta missões e laboratórios V2 passaram novamente em 320/375/390 px. O percurso V3 completou 70 etapas nas três larguras, incluindo recarga, idiomas, revisão opcional, fluxos e download real. Casos extremos de V1/V1.5/V2, registros inválidos e armazenamento negado passaram em navegador. A última correção da avaliação, relativa à listagem de previsões ausentes, recebeu verificação focada com CPython/JavaScript e exportação nas três larguras.

O relatório final detalha escopo, metodologia, problemas corrigidos e riscos: `REPORT-V3.md`. A auditoria não substitui validação manual no Safari/iPhone.
