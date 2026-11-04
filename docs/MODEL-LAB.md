# AI Model Lab

A área conecta conceitos de execução sem confundir suas origens:

| Modo | O que funciona | O que não acontece |
| --- | --- | --- |
| Simulação | Contratos, fila/execução/conclusão manuais, falhas, logs e artefato determinísticos | Sem modelo, rede, GPU ou medição de desempenho real |
| Python local | Abre o desafio real de acurácia; calcula sobre previsões cadastradas no CPython WASM | Sem carregar pesos, inferência ou treino |
| Kaggle remoto | Valida e exporta notebook/metadados preparatórios | Sem autenticação, envio, execução ou consulta real |

O dataset fictício tem quatro pares esperado/obtido: três coincidem, produzindo `3/4 = 0.75`. Esse resultado do **exemplo de avaliação** não é medição de um modelo, inclusive quando o contrato seleciona inferência ou fine-tuning. O adaptador não inventa duração ou progresso remoto; o usuário avança estados. Outros estados didáticos são falhou e cancelado, ambos sem métricas produzidas.

## Contratos e estado

`model-lab/contracts.js` contém esquema executável e JSDoc. `kaggle.js` implementa mock determinístico e interface remota que recusa operações sem backend. `state.js` conserva contratos revisados em `pythonModelLabV1`. `view.js` apresenta modos, parâmetros, contrato JSON, logs e downloads. Não há dependência de biblioteca de modelos.

Campos principais: ID estável, objetivo, execução, tarefa (avaliação/inferência/fine-tuning), referência de modelo, quantidade aproximada de parâmetros, quantização opcional, dataset, seed, épocas, batch, Python pretendido, CPU/GPU, internet desativada e estado. Os IDs do modelo são placeholders fictícios de 50M/100M/500M, sem vínculo obrigatório com fornecedor/biblioteca. Isso prepara o contrato, não demonstra compatibilidade de memória.

Estados: `prepared → queued → running → completed`; `queued/running → failed/cancelled`. `advance` é didático e manual. Autenticação/rede podem falhar no mock sem qualquer chamada externa. Resultados e artefatos retornam origem `simulation`; duração real é ausente. Nenhum estado simulado representa execução no Kaggle.

Ao recarregar, contratos salvos continuam disponíveis. Reabri-los volta à preparação; não há sessão remota para retomar nem ressurreição de logs/métricas como se fossem reais. O último estado simulado fica no registro local para rastreabilidade. Reiniciar cenário não muda progresso/XP de missões ou projetos. O laboratório não concede XP.

## Adicionar experimento

Use `example(mode)` como formato inicial; escolha tarefa/objetivo/dataset coerentes e passe por `validate/assert`. Não cadastre URLs, credenciais, scripts arbitrários ou campos desconhecidos. Para novo dataset, crie fixture revisada, amplie o adaptador e seus testes; o mock atual aceita somente a fixture declarada. Versões futuras de contrato devem ter migração explícita.

O exportador atual cria apenas artefato preparatório; nenhuma métrica de treino ou inferência. Um experimento real futuro precisará modelo/dataset/licenças verificáveis, ambiente fixado, recursos disponíveis, execução autorizada e validação dos resultados. Logs de perda menores não bastam para escolher modelo; dataset pequeno não comprova superioridade. Quantização e fine-tuning dependem do modelo/biblioteca e do hardware.

Teste com `node tests/model-lab.cjs`, `python3 tests/model-notebook.py` e, com servidor, `node tests/model-lab-browser.cjs`. A documentação de operações reais verificadas e de autenticação fica em [Kaggle](KAGGLE-INTEGRATION.md); decisões de isolamento em [Segurança](SECURITY.md).
