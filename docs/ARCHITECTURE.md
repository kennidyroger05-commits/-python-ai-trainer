# Arquitetura V2

Aplicação estática, servida por HTTP ou GitHub Pages. HTML, CSS e JavaScript sem compilação ou dependências de produção. Os módulos pequenos usam uma exportação compatível com navegador e Node para compartilhar lógica entre produto e testes.

| Responsabilidade | Arquivo |
| --- | --- |
| Carregamento e validação estrutural | `core/content.js` |
| Sessões de missão em memória | `core/session.js` |
| Persistência, migração e revisão | `core/progress.js` |
| Validação específica e XP | `game.js` |
| Renderização e orquestração de eventos | `app.js` |
| Idiomas, glossário original e termos novos | `language.js`, `glossary-v2.json` |
| Navegação e renderização de traces | `core/simulation.js` |
| Fluxos de IA simulada | `labs.js`, `labs.json` |
| Conteúdo pedagógico e debugging | `exercises.json` |

O estado da sessão guarda resposta, tentativas, dicas, feedback, investigação e posição do simulador por ID. Alternar telas ou idioma conserva esse estado. Recarregar a página conserva o progresso e as preferências, mas não a resposta parcial em memória.

## Persistência

`pythonAiTrainerV2` contém `version`, missão atual, IDs concluídos, XP, módulos, tentativas, XP efetivamente concedido por missão e métricas por conceito. A leitura migra `pythonAiTrainerV1` se não houver registro V2 válido. A migração copia dados e não apaga a chave anterior; novas alterações são gravadas só na chave V2. Preferências continuam em `trainer-language` e `trainer-known`.

Históricos anteriores não contêm os erros por conceito, portanto não inventamos essas métricas retroativamente. Reinício de módulo remove conclusões e o XP registrado daquele módulo, mantendo o histórico de dificuldade. O reset geral com confirmação remove os registros de progresso V1/V2 e preferências. Os IDs das 15 missões-base são estáveis.

## Revisão

A seleção utiliza taxa de erro, erros nas últimas cinco respostas e dicas por tentativa. Exige que a missão tenha sido tentada e que todos os pré-requisitos estejam concluídos. Cada lote contém até três conceitos distintos; não adiciona itens enquanto o aluno o percorre. Um conceito recém-revisado tem intervalo mínimo de um minuto antes de nova seleção. Revisão não concede XP duplicado por ID concluído. Cliques repetidos após o acerto não contam como novos acertos.

## Simulação e laboratórios

Traces são snapshots cadastrados: linha, variáveis, saída, explicação e exceção opcional. Não há interpretador no frontend. O passo `else` é uma transição didática, e a explicação de função distingue escopo local de retorno ao chamador.

O laboratório de debugging reutiliza seis missões com investigação, erro/sintoma, alternativas de correção e preview da substituição. Pré-requisitos bloqueiam saltos na sequência. O laboratório de IA usa cinco cenários com oito etapas e uma escolha de ação validada. Dados são fictícios, nenhuma API é chamada e nenhuma ferramenta externa executa. O laboratório de IA é exploratório e não concede XP.

## Evolução

Uma integração futura pode consumir ID da missão, conceito, idioma e tentativa a partir dos módulos existentes. Um professor, executor isolado ou SDK de modelos deve ser uma camada opcional com limites próprios. Não existem integrações, credenciais, botões de funcionalidades futuras ou serviços nesta versão.
