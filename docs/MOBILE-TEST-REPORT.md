# Verificação mobile V4

Ambiente disponível: Chromium automatizado, 320/375/390 px com toque; CPython local para fixtures. Não há iPhone/Safari físico. O launcher WebKit informado pelo Playwright não existe neste ambiente; não houve execução WebKit. Não se declara ergonomia física, VoiceOver, comportamento de barras/teclado/download no iOS como validado.

Testes direcionados passaram: 145 missões e 14 unidades pela interface, 40 originais em três larguras, tema claro/escuro persistente, texto raiz ampliado, foco, movimento reduzido, recuperação de storage, migração de XP e ponte de projetos. As ações principais têm 48 px mínimos e controles auxiliares, 44 px; safe areas usam env(); editor usa 16 px. A navegação inferior tem três entradas e menu das cinco áreas.

A revisão visual usou capturas reais do navegador, não mockups. Corrigiu marca com glifo ausente, título bilíngue repetido, foco inicial chamativo e controles estáticos ainda desativados. A revisão de estado corrigiu volta à unidade, scroll ao trocar de missão e preparação visível antes dos projetos.

Evidência de contraste medida é coletada por tests/v4-edge-browser.cjs, em ambos os temas. Os relatórios das duas passagens completas e capturas finais serão adicionados após execução. Os resultados não serão inventados por contagem de arquivos.

Capturas finais reais: [home 320](screenshots/v4-home-320.png), [home 375](screenshots/v4-home-375.png), [home 390](screenshots/v4-home-390.png), [missão](screenshots/v4-mission-375.png), [Python real](screenshots/v4-python-375.png), [escuro](screenshots/v4-dark-390.png), [projetos](screenshots/v4-projects-390.png). São execuções do aplicativo em Chromium, sem edição de imagem.

A auditoria do editor reproduziu deslocamento de 78 px no blur do textarea, perdendo o clique em Validar. A correção mantém a geometria da navegação; o teste de regressão verifica os alvos e a posição entre pointerdown/pointerup. A troca de tema agora não interpola cores de fundo dos botões, evitando contraste transitório reduzido. Não houve alteração no interpretador para contornar a falha visual.

## Medições locais

[v4-performance.json](v4-performance.json) registra amostras reais, com servidor local e contexto de navegador novo: trilha disponível em 188–205 ms; módulos opcionais em 249–274 ms; zero recursos do interpretador antes de executar. Primeira execução Python, incluindo carga, 2106 ms; execução interna exibida, 3 ms; três testes em ambientes limpos, 5763 ms. Isso não é benchmark de rede móvel/iPhone e pode variar com a CPU compartilhada. O runtime mantém 13.532.188 bytes de recursos sob demanda. Pico de memória física no iPhone não foi medido.
