# Reconstrução pedagógica V4

Base real: main em `57eaec8b2e5f36f1b9bdaf2f2fd4b2aa676797c6`. A main já continha todas as entregas anteriores na abertura desta missão. Branch exclusiva `feature/learning-experience-v4`; sem merge/publicação.

A sequência anterior saltava de atribuição/print para max sobre uma lista ainda não ensinada e, depois, para projetos com geradores, compreensões, lambda e key. A home apresentava entradas de ferramentas em cartões igualmente importantes. O novo desenho une preparação por unidades e uma atividade principal por tela.

O catálogo preserva os 40 exercícios originais, sem reusar IDs para outro conteúdo. Acrescenta **105 atividades autorais**, total de **145 missões**, além dos 14 desafios Python já existentes. Os quatro projetos, runtime, worker e Kaggle permanecem em seus módulos. O conteúdo novo é escrito em `scripts/build-curriculum.py`; helpers serializam registros individuais, não multiplicam perguntas.

`curriculum/units.json` fornece 14 unidades, ordem por IDs e matriz explícita de pré-requisitos. O arquivo original continua intacto; a matriz curricular atualiza somente a orientação no aplicativo. Registros históricos de conclusão e XP não se transformam em conclusões das novas atividades. A migração é aditiva e conserva a proveniência das conclusões anteriores para revisão.

São ensinados separadamente argumentos, parâmetros, retorno, composição, texto, laços, desempacotamento, zip, enumerate, sum, dicionários, conversão JSON, exceções, testes, arquivos, contratos de API e critérios de avaliação. Antes dos projetos aparecem compreensão de listas, expressão geradora, lambda e key; esses elementos foram identificados nos códigos completos dos projetos. APIs e arquivos são exemplos determinísticos/simulados ou em memória; não há rede, credenciais ou escrita externa do aluno.

Os testes CPython executam os exemplos confiáveis e cada alternativa de reparo, recusando alternativas equivalentes indevidas. Os testes de dados verificam IDs, traduções, seis modos, dependências e preservação de progresso. Durante a construção detectaram três strings de arquivo com escape incorreto, um alvo de reparo duplicado e duas alternativas iguais; as causas foram corrigidas nos registros autorais.

O currículo e a interface estão integrados. A revisão dos desafios acrescentou a semântica de `or` como valor alternativo, e uma matriz própria de pré-requisitos do runtime. As validações completas serão registradas após execução real.

Na revisão do motor foi corrigido XP de primeira tentativa indevido após recarregar uma resposta errada, e perda da contagem de dicas por missão. Novos campos são aditivos. A recuperação dos projetos também passou a importar a taxonomia explícita de novos conceitos sem criar evidência inválida para tracks desconhecidos. Os testes cobrem a indisponibilidade temporária desse módulo.
