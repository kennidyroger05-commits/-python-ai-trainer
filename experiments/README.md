# Experimentos reais pequenos, offline

Dois notebooks autocontidos executam um **classificador linear softmax de 87 parâmetros**, não um LLM. O dataset sintético tem 18 exemplos de treino, seis de validação e seis de teste, em inglês simples para rotas de cobrança, suporte e agenda. Não há download de pesos, dados privados, dependência de rede, GPU ou biblioteca externa.

- `notebooks/intent-inference.ipynb`: carrega pesos JSON, tokeniza palavras ASCII, calcula scores/saída, latência e pico de RSS do processo quando disponível. Tokens de palavra não equivalem a tokens de um LLM. Scores não são calibrados.
- `notebooks/intent-training.ipynb`: inicializa pesos por seed, treina com gradientes/batches/épocas, registra training/validation loss, seleciona checkpoint por validação e avalia em teste separado. Isso é treinamento de um modelo linear; não fine-tuning de um LLM.

Ambos foram integralmente executados localmente em CPU, dentro de subprocesso com limites de memória, CPU, arquivo e tempo. `python3 tests/notebooks.py` repete os componentes e os dois notebooks, incluindo duas execuções determinísticas do treinamento. Esse teste não é execução Kaggle.

O exemplo padrão mediu acurácia de validação 0.5 antes e 1.0 depois, em **apenas seis exemplos sintéticos**, e selecionou a época 20. Esses valores não provam generalização nem habilidade profissional. Latência e memória são medições do processo em que o notebook é executado, sem estimativa de GPU/modelo isolado.

`assets.json` fixa SHA-256 dos fontes, dataset e pesos. `executor/notebooks.py` gera somente receitas cadastradas e verifica os hashes. O job não recebe script, URL, caminho arbitrário ou credenciais. `scripts/build-experiments.py` regenera exports após uma revisão do código confiável; os testes exigem correspondência entre arquivos e builder.

Sem submissão automática. A futura primeira execução Kaggle requer autorização externa explícita, SDK oficial em ambiente separado e credenciais mantidas fora do frontend. A camada de referência e seus limites ficam em `../docs/KAGGLE-INTEGRATION.md`.
