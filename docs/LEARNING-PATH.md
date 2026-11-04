# Caminho pedagógico

A V2 usa uma progressão em espiral: conserva a ordem e os IDs das 15 missões da V1.5 e acrescenta preparação e desafios. Os módulos organizam assuntos e são revisitados; não são oito blocos isolados a serem executados sem retorno.

| Trilha | Foco | Missões |
| --- | --- | ---: |
| A | Fundamentos, contagem, operações e laço | 7 |
| B | Comparação, condição e fallback | 3 |
| C | Dicionários, registros, JSON e campos opcionais | 6 |
| D | Funções, parâmetros, retorno e ferramentas | 4 |
| E | Status HTTP e respostas fictícias | 3 |
| F | Índices e seis cenários de debugging | 7 |
| G | Fluxos, classificação e ferramentas permitidas | 6 |
| H | Dataset, época, loss e avaliação | 4 |

Cada missão registra um conceito principal, dificuldade e pré-requisitos anteriores. As primeiras missões introduzem atribuição, saída e seleção. As dez seguintes constroem decisões, dicionários e funções. Depois entram operações, coleções, parsing de JSON, campos opcionais e ferramentas. APIs são representadas como dados locais antes de introduzir erros e contratos.

No debugging, o aluno identifica o sintoma, escolhe uma investigação, vê o efeito da troca de uma linha e valida o resultado. Os casos distinguem sintaxe, tipos, chaves, limites, nomes e regra lógica. A ausência de exceção não basta para demonstrar correção.

Os desafios finais reutilizam essas ferramentas em roteamento e validação. As quatro missões de treinamento ensinam interpretação de registros, sem bibliotecas de ML: alvo de um dataset, passagem pelos dados, queda de loss e medição em exemplos separados. Score não é presumido como probabilidade calibrada; queda da perda de treino não garante generalização.

O modo Misto conserva traduções essenciais até o aluno declarar familiaridade ao toque. O glossário continua acessível. Português e English mantêm as mesmas respostas e dificuldade.

Estas 40 missões são fundamentos para raciocínio profissional. Não equivalem, por si, a qualificação profissional, treinamento real de um modelo ou integração real de uma API. A revisão com iniciantes em Safari/iPhone deve preceder publicação.

# V3 — aplicar conhecimentos em projetos

O caminho existente de quarenta missões permanece disponível. Os projetos são uma nova camada de aplicação, não quarenta perguntas avulsas para inflar o catálogo. Recomendações de revisão apontam para conceitos específicos das missões, sem exigir que o aluno repita tudo antes de começar.

1. **Roteador de modelos:** transforma pedido e disponibilidade em política, seleção, fallback, diagnóstico e testes. O mesmo caso pode mudar de resultado quando uma regra é invertida e reparada no workspace.
2. **Cliente de API:** constrói uma requisição fictícia e acompanha status, texto JSON, parsing, campos, falhas e resultado. Dicionário Python não é texto JSON; JSON válido também pode ser `null` e ainda precisar de validação de contrato.
3. **Avaliação:** usa quatro tarefas e dois conjuntos de previsões. Contagens, fração de acertos, falhas por ID, latência média fictícia por tarefa e custo fictício do lote são tratados como medidas distintas. O resultado não demonstra superioridade geral.
4. **Treinamento:** acompanha dataset, separação, lotes, épocas, logs e checkpoint. A perda de validação da época 2 é menor, mesmo com perda de treino menor na época 3. A divergência é indício para investigação, não prova isolada. Em trabalho real, seleção por validação ainda deve ser separada de avaliação final em dados adequados.

Cada projeto tem dez etapas ligadas ao mesmo artefato e uma conclusão. Explicações aparecem sob demanda: definição, exemplo e aplicação profissional. O código completo é uma solução de referência testada, não texto executado do aluno. Há glossário também para construções compactas novas, como `zip`, compreensão e `min(..., key=...)`.

Os oito desafios novos de debugging exigem causa, correção e teste. Casos extras rejeitam reparos que atendem só à primeira entrada, como retornar sempre 6, usar zero como máximo vazio ou ignorar uma previsão ausente no denominador.

A introdução a testes liga entrada/esperado, cenário positivo, negativo, borda e asserção. “Negativo” descreve o cenário; o teste deve passar quando a rejeição contratada ocorre. Uma asserção aprovada em zero não prova que `dobro` funciona para três.

As dez competências exibidas não recebem níveis profissionais. O painel mostra somente conceitos com evidências coletadas no navegador. O inglês técnico é contextual e uma tradução consultada não comprova compreensão; há uma questão de vocabulário ligada ao caso de teste utilizado.

O portfólio exporta projetos didáticos concluídos, identificando simulação e limites. Antes de considerar aplicação profissional, são necessárias atividades externas, revisão de código, testes em ambientes reais autorizados e prática além destes exemplos.
