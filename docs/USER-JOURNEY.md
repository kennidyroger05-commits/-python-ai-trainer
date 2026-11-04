# Uma jornada no Python AI Trainer

O app é uma plataforma única, sem cadastro. Misto é o idioma inicial: termos técnicos em inglês aparecem com tradução. Português e English continuam disponíveis no cabeçalho, sem apagar a atividade em andamento.

## Começar e continuar

Na abertura, veja sua próxima unidade, progresso e atividade. Use **Continuar meu caminho**. A primeira missão ensina a reconhecer um valor antes de escrever atribuições. Cada missão apresenta uma preparação curta, código, legenda e glossário. Você pode errar, consultar duas dicas e tentar novamente. O acerto recebe explicação e aplicação em IA. XP registra a atividade; não comprova domínio. Repetir uma conclusão não concede os mesmos pontos outra vez.

Após o acerto, a resposta validada fica protegida contra mudanças; glossário, explicação e simulação continuam acessíveis. Se uma área estiver indisponível, seus dados não são mostrados como progresso zero. O histórico fica preservado e a interface informa a limitação.

A navegação inferior **Aprender · Praticar · Mais** fica disponível durante o treino. Mais abre as cinco áreas; temas claro e escuro e idioma ficam no cabeçalho:

| Área | Para que usar |
| --- | --- |
| Aprender | Trilha de 14 unidades/145 missões; arquivo opcional das 40 originais |
| Praticar | Python executável, debugging e introdução a testes |
| Projetos | Quatro soluções guiadas e portfólio didático |
| Laboratório IA | Fluxos simulados, notebooks, preparação e relatórios |
| Meu progresso | Evidências, XP por origem, dificuldades e revisão |

A unidade mostra sua base recomendada e permite voltar ao primeiro fundamento pendente. A [matriz](CURRICULUM-MATRIX.md) explicita a ordem de 145 IDs estáveis. O catálogo permite explorar qualquer missão. Os pré-requisitos orientam; não são bloqueios rígidos. Continuar escolhe a primeira missão pendente elegível, para que uma revisão ou exploração não salte o percurso principal. As sugestões são determinísticas e usam somente os registros locais.

## Da leitura ao programa

As conexões abaixo da atividade levam a outro uso do mesmo conhecimento. Exemplo: `return-score` → `exec-return` → `debug/missing-return`. O código real é opcional e mostra seus pré-requisitos recomendados. Há cartões curtos para ler listas, operadores e construções compactas antes de praticar.

Os atalhos da unidade recomendam um modo inicial de edição: blocos, completar trecho, editar linhas ou código livre. Você pode mudar o modo sem obrigação de digitar desde o início. O teclado aparece quando você escolhe editar. **Executar exemplo** roda Python real; **Validar com todos os testes** roda entradas diferentes em ambientes limpos. Uma saída correta em um exemplo não é conclusão. Erro de sintaxe, exceção, falha de teste e falha de inicialização têm estados próprios.

Ao sair durante uma execução, o worker é encerrado. Você pode reiniciar e tentar novamente. Rascunhos de código ficam na aba e não são salvos automaticamente no dispositivo; uma recarga perde o texto livre. O histórico de validação, XP e versão do Python é persistente quando o armazenamento permite.

## Construir e explicar

Cada projeto guiado constrói um artefato por dez etapas. Etapas, respostas, dicas e ponto atual sobrevivem à recarga. Voltar não desfaz acertos. Os testes desses projetos são determinísticos e simulados; uma prática Python vinculada tem registro separado.

Depois da conclusão, **Meus projetos e portfólio** exporta o projeto didático. Se o desafio Python associado foi validado, o relatório o identifica separadamente. Em Meu progresso, o resumo Markdown também distingue missões, projetos simulados, Python executado/testado e experimentos preparados. Não é comprovação de experiência profissional nem recebe upload automático.

## Entender o laboratório

**Simulação** usa dados fictícios e estados didáticos. **Python real no navegador** executa programas locais dentro dos limites do runtime. **Kaggle preparado** gera arquivos para um operador autorizado; exportar não envia ou executa um job. **Kaggle real não está conectado** neste app.

Os notebooks de inferência e treino de um classificador linear de 87 parâmetros foram executados em CPU local de desenvolvimento. Ver essa referência não executa seu contrato. Um arquivo importado possui origem declarada, sem confirmação de conta Kaggle pelo navegador. O executor separado continua desativado por padrão e não é necessário para aprender.

## Revisar e preservar

A revisão usa erros, dicas, pré-requisitos e intervalo entre revisões. Cada lote é finito; não repete automaticamente sem fim. Apresentado, praticado e acertado são evidências distintas; um acerto não implica domínio. Reiniciar módulo/projeto segue o aviso específico de XP e histórico. O reset completo exige confirmação e preserva chaves de outros aplicativos.

O reset completo também remove dados e cópias de recuperação de áreas que não carregaram naquela sessão. Ele não cancela jobs remotos, não apaga downloads nem arquivos privados do executor separado.

Armazenamento indisponível gera aviso: a sessão continua, mas pode não sobreviver à recarga. Registros corrompidos recebem cópia local antes de serem substituídos. Sem sincronização entre dispositivos ou coordenação transacional de abas.

Uma sessão já carregada permite ler código, usar glossário e resolver escolhas com conectividade limitada. Recursos WASM precisam estar disponíveis para iniciar Python. Não há garantia de abertura ou recarga totalmente offline e não há service worker. Mensagens de falha devem permitir uma nova tentativa sem apagar progresso.

As missões ficam disponíveis antes de terminar o carregamento opcional. Uma resposta atrasada não leva o aluno de volta ao início. Requisições de conteúdo possuem limite de espera; se falharem, as outras áreas continuam utilizáveis. Problema em projetos não desativa automaticamente Python. Erro essencial usa o idioma salvo e oferece recarga.

Os testes automatizados de jornada usam Chromium com toque em 320/375/390 px. Eles não substituem validação em Safari/iPhone físico. Veja [prontidão de lançamento](RELEASE-READINESS.md).

## Revisar e retomar a trilha

Meu progresso oferece revisões baseadas nos erros/dicas registrados. A rodada informa quantas atividades restam, permite sair para Meu progresso e termina com **Concluir revisão**. Não concede XP duplicado por uma conclusão anterior e respeita o intervalo de revisão. Voltar à trilha continua pela próxima missão pendente; concluir as 145 orienta para os projetos.

Dicas e tentativas permanecem após reload. A migração conserva as conclusões e XP anteriores; novos IDs não são marcados automaticamente. Recomeçar uma unidade pede confirmação e afeta somente seus IDs/awards registrados. Reset completo também pede confirmação e mantém dados de outros aplicativos.
