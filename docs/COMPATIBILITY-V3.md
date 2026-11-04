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

## Expansão Runtime / Model Lab

Base: V3 `5705485b630bbb2177147590117b75a7c68f7e43`. Branch exclusiva `feature/python-runtime-kaggle-lab`. Nenhuma alteração nos dados V2, branches anteriores ou configuração do Pages.

| Área | Verificação atual |
| --- | --- |
| V1/V1.5/V2/V3 | Suítes anteriores + `runtime-migration.cjs`: chaves antigas e XP conservados, novos registros separados |
| 40 missões / 70 etapas V3 | Regressões completas nas três larguras, conteúdo preservado por hash |
| Quatro projetos | Percurso simulado preservado; prática Python opcional e retorno ao ponto anterior |
| Editor/runtime | 14 desafios com soluções certas e 28 peças erradas em CPython e CPython WASM |
| Toque / teclado / layout | 320/375/390 px; montagem, saída real, limites dos botões, ausência de foco automático em textarea |
| Persistência nova | Ledger sem duplicação, cópia de corrupção, quota negada, reset confirmado e dados alheios preservados |
| Portfólio | Seção simulada mantida; anexo real somente após testes aprovados, sem fonte persistida |
| Kaggle | Documentação/código oficiais pesquisados; mock e notebook preparatório verificados; nenhuma operação autenticada |
| Segurança do runtime | VM limpa por caso, watchdog, cancelamento, output limitado, integridade, origem opaca e rede bloqueada por CSP |

Testes antigos que exigiam zero textareas em todo o DOM foram ajustados para exigir zero campos visíveis e nenhum foco de digitação nas missões/projetos. O editor opcional em outra tela torna a antiga premissa estrutural inadequada; a garantia de uso sem teclado nessas atividades foi preservada e reforçada.

A matriz não declara Safari/iPhone real verificados. Consumo de memória WASM, comportamento do sandbox/worker no WebKit e ergonomia física permanecem riscos antes de publicação. Veja `REPORT-RUNTIME-LAB.md`.
