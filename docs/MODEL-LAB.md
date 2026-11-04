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

## Experimentos verificáveis

A área “AI experiments” coexiste com o planner/simulador anterior e oferece duas receitas **reais em CPU**: inferência e treinamento de um classificador linear de intenções, 87 parâmetros. O modelo usa tokenização de palavras ASCII e softmax; não é um LLM ou fine-tuning. Dados são sintéticos, com 18 exemplos de treino, seis de validação e seis de teste. Pesos/dados/código ficam no repositório com hashes e são incorporados ao notebook, sem downloads ou GPU.

Os dois notebooks foram integralmente executados localmente, em subprocessos limitados. Os relatórios em `experiments/evidence/` registram medições locais de desenvolvimento e dizem isso na interface. Não são jobs do usuário nem Kaggle. A referência padrão treinou por 20 épocas/seed 7/batch 4, medindo 0.5 → 1.0 de acurácia de validação em seis exemplos e loss de validação final ~0.02281. Esses valores não são benchmark geral ou evidência de superioridade. A latência é medida dentro da inferência após carregamento; memória é pico do processo.

Cada receita possui um percurso de dez etapas: objetivo, código, parâmetros, entradas, execução, logs, métricas, falhas, relatório e revisão. Os textos distinguem parâmetros de inferência e de treino. O aluno pode mudar configuração por toque, inspecionar código verificado, exportar job/notebook/metadados e abrir desafios Python existentes. Mudar parâmetros cria revisão do job e não produz métricas novas.

Não há botão de submissão fictício nem polling no site. A execução remota está desativada; o executor separado exige autorização. Um relatório importado é lido localmente, validado e renderizado como texto, com **origem declarada**: o navegador não confirma autenticação/execução Kaggle. Relatórios parciais de acompanhamento não ganham métricas. Relatórios importados brutos ficam apenas em memória; não são salvos automaticamente ou enviados.

Progresso do percurso usa `pythonExperimentLearningV1`; conta etapas consultadas, sem XP por leitura nem inferência de domínio. Não muda o XP anterior. Reset local confirmado não cancela jobs remotos nem remove arquivos já salvos pelo operador. O estado do executor é independente do localStorage.

Arquivos: `experiments/contracts.js` e `executor/contracts.py` validam o mesmo job; testes comparam fingerprint e geração do notebook entre as linguagens. `state.js` preserva/repara o percurso; `view.js` mostra os dados sem executar Python na origem principal. `executor/` prepara/acompanha/coleta em um contexto separado, não implantado. Veja [Kaggle](KAGGLE-INTEGRATION.md), [auditoria](QUALITY-AUDIT.md) e [executor](../executor/README.md).
