# Verificação mobile V4

Ambiente disponível: Chromium automatizado, 320/375/390 px com toque; CPython local para fixtures. Não há iPhone/Safari físico. WebKit será conferido antes da entrega. Não se declara ergonomia física, VoiceOver, comportamento de barras/teclado/download no iOS como validado.

Testes direcionados passaram: 145 missões e 14 unidades pela interface, 40 originais em três larguras, tema claro/escuro persistente, texto raiz ampliado, foco, movimento reduzido, recuperação de storage, migração de XP e ponte de projetos. Os controles têm 48 px mínimos; safe areas usam env(); editor usa 16 px. A navegação inferior tem três entradas e menu das cinco áreas.

A revisão visual usou capturas reais do navegador, não mockups. Corrigiu marca com glifo ausente, título bilíngue repetido, foco inicial chamativo e controles estáticos ainda desativados. A revisão de estado corrigiu volta à unidade, scroll ao trocar de missão e preparação visível antes dos projetos.

Evidência de contraste medida é coletada por tests/v4-edge-browser.cjs, em ambos os temas. Os relatórios das duas passagens completas e capturas finais serão adicionados após execução. Os resultados não serão inventados por contagem de arquivos.
