# Sistema visual V4

A identidade combina papel claro, tinta verde profunda, superfícies brancas e acento verde. A marca `py` é tipográfica e local. O tema escuro é opcional, persistido e não altera progresso.

A home dá prioridade à próxima unidade, próxima atividade e progresso real. A trilha usa cartões numerados, estados textuais e contagens; não depende apenas de cor. Uma unidade abre sua lista de atividades e as aplicações em Python. A navegação móvel possui Aprender, Praticar e Mais; Mais dá acesso explícito às cinco áreas. Não há cinco abas bilíngues comprimidas.

A tela de missão tem uma orientação curta, conceito de preparação, código contrastante, alternativas grandes, dicas progressivas e explicação opcional após o acerto. Símbolos e vocabulário permanecem disponíveis. O conteúdo técnico avançado fica nas áreas próprias; projetos exibem unidades recomendadas sem bloqueio.

Tokens: `--bg`, `--panel`, `--card`, `--text`, `--muted`, `--border`, `--accent`, `--accent-2`, `--focus`, `--code`, `--code-text`. A base está em style.css; currículo e unificação dos módulos preservados em curriculum/design.css. Fontes de sistema, código monoespaçado, texto de edição ≥16 px, ações principais ≥48 px e controles auxiliares ≥44 px. Há safe areas, foco visível, quebra de texto e redução de movimento. Não há fonte, imagem ou serviço pago externo.

A revisão visual inicial em Chromium identificou um glifo de marca indisponível, títulos bilíngues repetidos e controles estáticos de revisão/biblioteca ainda desativados pelo carregador antigo. Foram corrigidos. A validação física de Safari/iPhone e VoiceOver continua dependendo de acesso real; emulação não será descrita como teste físico.

A barra inferior não altera a geometria do documento ao focar/sair do editor; fica invisível durante edição para não disputar espaço com o teclado. A transição de tema troca as cores imediatamente, evitando contraste intermediário baixo; somente bordas e progresso têm animação discreta.
