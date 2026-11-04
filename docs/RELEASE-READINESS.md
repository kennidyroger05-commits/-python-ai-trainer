# Prontidão para lançamento

Esta branch é para revisão, **não para publicação automática**. Main e a configuração do GitHub Pages permanecem preservados. Não foi feito merge.

| Critério | Estado / evidência |
| --- | --- |
| Aplicação anterior preservada | 40 missões e dados-base com manifesto; quatro projetos, 14 desafios, labs, idiomas, glossário e migrações mantidos |
| Navegação integrada | Cinco áreas em menu compacto, catálogo livre e ligações por IDs; testes de jornada nas três larguras passaram no marco funcional |
| Progresso e XP | Estados e pontos permanecem com seus subsistemas; projeção comum sem inventar domínio ou execução |
| Python real | CPython 3.14.2/Pyodide 314.0.7 em origem opaca/worker; políticas e limites anteriores preservados |
| Experimentos | Simulação, Python local, preparação e origem declarada de relatórios distinguíveis; sem conexão Kaggle ativa |
| Notebooks CPU | Dois notebooks completos e reproduzíveis, testes locais sem credenciais ou GPU |
| GitHub Pages em subdiretório | Teste automatizado executou Python e exportou notebook sob prefixo, sem caminhos escapando para a raiz |
| Acessibilidade disponível | Foco, roles, área ativa, texto do corpo ampliado a 24 px, movimento reduzido e controles de toque testados; seis pares de paleta com contraste calculado em `integration-accessibility.json` |
| Duas passagens completas | Primeira e segunda: 40 suítes aprovadas em cada, zero reprovadas. A segunda foi executada integralmente após corrigir o reset com área indisponível; provas em `integration-pass1.json` e `integration-pass2.json` |
| Safari/WebKit | WebKit não instalado; não foi declarado aprovado |
| iPhone físico | Não testado; comportamento, teclado, safe areas e pressão de memória precisam de validação no hardware |
| Kaggle autenticado | Desativado e não testado em conta real; requer autorização e ambiente separado |
| Backend público | Não implantado, nem necessário para a jornada básica; não há tokens no frontend |

## Bloqueios para declarar publicação pronta

Não declarar compatibilidade física com Safari/iPhone sem executar os testes nesse ambiente. A memória linear WASM tem teto, mas o consumo total de JS/buffers/navegador não possui quota rígida; fechamento de aba sob pressão no dispositivo ainda é risco. O bootstrap utiliza opção experimental publicada e fixada do Pyodide, exigindo nova regressão em upgrades.

A verificação de paleta não é certificação WCAG completa. VoiceOver, teclado virtual, barras do Safari, safe areas físicas, orientação do aparelho e salvamento de downloads no iOS não foram testados no hardware. CSS/semântica e emulação não substituem esses testes.

As falhas críticas/altas reproduzidas nesta missão foram corrigidas com regressões passando, incluindo reset de áreas indisponíveis. Isso não comprova ausência de outros bugs. Falhas de persistência não são ocultadas como sucesso de gravação. O app não promete certificação, domínio técnico ou generalização de modelos em dataset sintético pequeno.

O primeiro ensaio Kaggle é uma validação externa futura, somente com autorização explícita, SDK fixado e credenciais fora do frontend. Não é necessário habilitá-lo para utilizar missões, projetos, simuladores ou Python local. A ausência de autenticação não deve ser disfarçada por resultados simulados.

Antes de qualquer publicação autorizada: revisar as evidências finais, validar Safari/iPhone, revisar os limites de segurança e manter as origens de relatórios visíveis. Publicar, fazer merge ou habilitar conta remota continua fora desta missão.
