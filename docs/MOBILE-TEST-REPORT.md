# Verificação mobile V4

Ambiente disponível: Chromium automatizado, 320/375/390 px com toque; CPython local para fixtures. Não há iPhone/Safari físico. O launcher WebKit informado pelo Playwright não existe neste ambiente; não houve execução WebKit. Não se declara ergonomia física, VoiceOver, comportamento de barras/teclado/download no iOS como validado.

Testes direcionados passaram: 145 missões e 14 unidades pela interface, 40 originais em três larguras, tema claro/escuro persistente, texto raiz ampliado, foco, movimento reduzido, recuperação de storage, migração de XP e ponte de projetos. As ações principais têm 48 px mínimos e controles auxiliares, 44 px; safe areas usam env(); editor usa 16 px. A navegação inferior tem três entradas e menu das cinco áreas.

A revisão visual usou capturas reais do navegador, não mockups. Corrigiu marca com glifo ausente, título bilíngue repetido, foco inicial chamativo e controles estáticos ainda desativados. A revisão de estado corrigiu volta à unidade, scroll ao trocar de missão e preparação visível antes dos projetos.

Contraste medido em ambos os temas por tests/v4-edge-browser.cjs: [dados](v4-contrast.json). As duas passagens completas passaram; provas e logs estão ligados abaixo.

Capturas finais reais: [home 320](screenshots/v4-home-320.png), [home 375](screenshots/v4-home-375.png), [home 390](screenshots/v4-home-390.png), [missão](screenshots/v4-mission-375.png), [Python real](screenshots/v4-python-375.png), [escuro](screenshots/v4-dark-390.png), [projetos](screenshots/v4-projects-390.png). São execuções do aplicativo em Chromium, sem edição de imagem.

A auditoria do editor reproduziu deslocamento de 78 px no blur do textarea, perdendo o clique em Validar. A correção mantém a geometria da navegação; o teste de regressão verifica os alvos e a posição entre pointerdown/pointerup. A troca de tema agora não interpola cores de fundo dos botões, evitando contraste transitório reduzido. Não houve alteração no interpretador para contornar a falha visual.

## Medições locais

[v4-performance.json](v4-performance.json) registra amostras reais, com servidor local e contexto de navegador novo: trilha disponível em 188–205 ms; módulos opcionais em 249–274 ms; zero recursos do interpretador antes de executar. Primeira execução Python, incluindo carga, 2106 ms; execução interna exibida, 3 ms; três testes em ambientes limpos, 5763 ms. Isso não é benchmark de rede móvel/iPhone e pode variar com a CPU compartilhada. O runtime mantém 13.532.188 bytes de recursos sob demanda. Pico de memória física no iPhone não foi medido.

A revisão adaptativa tem contagem e conclusão próprias, sem confundir a rodada com o avanço da unidade. Onze cenários V4 verificam também saída antecipada, idioma e prêmio não duplicado; as jornadas por toque e laboratórios passaram nas três larguras após essa correção.

Primeira passagem integral concluída: **46 suítes aprovadas, zero reprovadas**, de 2026-11-04T18:22:06.524Z a 2026-11-04T18:37:46.132Z, SHA a0e34a0eaa9a1daa51e5441e4229cab05a6a4ae8. [Prova](v4-pass1.json) e [log completo](v4-pass1.log). A segunda passagem integral também foi aprovada, conforme evidência final abaixo.

## Evidência final

Duas passagens integrais de `node scripts/test.cjs --browser`, com **46 suítes aprovadas em cada uma e zero reprovadas no estado final**: 25 locais e 21 de navegador. As tentativas anteriores interrompidas não contam como aprovação.

| Passagem | Início UTC | Fim UTC | Resultado | Evidência |
| --- | --- | --- | --- | --- |
| 1 | 2026-11-04T18:22:06.524Z | 2026-11-04T18:37:46.132Z | 46/46 | [prova](v4-pass1.json) · [log](v4-pass1.log) |
| 2 | 2026-11-04T18:38:53.311Z | 2026-11-04T18:54:34.231Z | 46/46 | [prova](v4-pass2.json) · [log](v4-pass2.log) |

As duas provas têm o mesmo hash da árvore de código/testes, excluindo docs e README: `d3d43f882b8d92f0b06d50507dbdeb3cd7155d0b9d57a8c7f79a5c287378cf35`. A primeira testou `a0e34a0eaa9a1daa51e5441e4229cab05a6a4ae8`; a segunda, `52ef1382203ee18cd94cb150477a568c3466ee78` (entre elas, apenas documentação). A segunda revisão crítica conferiu preservação do runtime/executor, ausência de novas dependências/configurações administrativas e de execução dinâmica de JS nos módulos curriculares; não é auditoria externa certificada. O check adicional de [reinício guiado](v4-unit-restart.json) testou cancelamento sem alteração de bytes e confirmação com preservação de outra unidade nas três larguras. Uma inspeção dos 145 registros não encontrou alternativas que diferissem apenas por espaços colapsáveis.

Capturas adicionais: [unidade](screenshots/v4-unit-375.png) e [revisão](screenshots/v4-review-375.png).
