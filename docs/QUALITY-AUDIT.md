# Auditoria de qualidade — Kaggle Execution

Base auditada: `ef817adc8b1859bfe780a9b8264f5b33160a598e`, branch `feature/kaggle-execution-quality`. Os arquivos anteriores foram encontrados intactos. Nenhuma mudança em main ou configuração do Pages. Esta auditoria distingue código testado localmente, SDK pesquisado e execução remota não autorizada.

## Auditoria inicial

Foram lidos módulos de conteúdo/progresso/persistência, runtime/iframe/worker/harness, editor, projetos/revisão/exportação e contratos/mock do Model Lab. As 14 suítes locais da base passaram. A implementação foi seguida pela primeira passagem completa e por uma revisão adicional orientada a abusos, com novos testes de regressão.

| ID | Severidade | Achado | Evidência / tratamento |
| --- | --- | --- | --- |
| Q01 | Alto | Cancelar sincronamente no callback `running` deixa `active=null`, mas o listener continua lendo `active.timer` | Reproduzido no Chromium: `Cannot read properties of null (reading 'timer')`. Corrigido ordenando o watchdog antes do callback. `runtime-races-browser.cjs` passou após a correção |
| Q02 | Médio | O request é lido novamente após downloads; mutação do objeto altera o código submetido | Inspeção do fluxo assíncrono; novo teste exige snapshot imutável antes do primeiro await |
| Q03 | Médio | Timeout de inicialização não cobre downloads pendentes e inputs inválidos podem lançar erros fora do protocolo | Deadline/abort no carregamento; validação de JSON finito/tamanho/tipos; testes de request nulo, casos ausentes e download bloqueado |
| Q04 | Alto corrigido; residual médio | A memória linear WASM podia crescer sem orçamento pedagógico | A declaração da memória no WASM verificado é limitada a 64 MiB antes da instanciação; construtores JS adicionais também são limitados. Vendor distribuído intacto. Tentativa contida de 128 MiB devolveu MemoryError real e recuperou; 1 MiB foi aceito. Heap JS e overhead não têm quota rígida |
| Q05 | Médio, lacuna corrigida | Contrato preparatório anterior não possui versão remota, proveniência de artefatos ou ledger de submissão | Novo contrato separado, validado em JS/Python; ledger, versão e artefatos testados sem conta. Dados anteriores preservados; envio desativado por padrão |
| Q06 | Médio, lacuna de evidência | Não há execução autenticada Kaggle verificada | Nenhuma credencial configurada, host Kaggle não permitido pelo ambiente. SDK/documentação oficial pesquisados; testes usarão injeção de dependências, sem conta |

Não foram encontrados segredos ou chamadas remotas de conta ativas na aplicação base. O contrato anterior se declara preparatório e não é tratado como modelo realmente executado.

## Política de evidências

Não contar suites como prova de cobertura integral. Cada requisito crítico terá teste e limite registrado na matriz final. Mensagens Python vêm do interpretador. Falhas injetadas do SDK serão identificadas como testes simulados; treino/inferência em CPU não serão rotulados Kaggle. Uma submissão não prova conclusão. Interromper acompanhamento não cancela job remoto.

## Primeira passagem completa

Em 2026-11-04, `node scripts/test.cjs --browser` concluiu com **31 suítes aprovadas, zero falhas**: 18 locais e 13 de navegador. Incluiu 8 casos unittest de notebooks e 27 do executor, execução real de todas as soluções/reparos em CPython WASM 3.14.2, 40 missões/70 etapas anteriores, novos percursos e toque/layout em 320/375/390 px.

A atualização do runtime exigiu uma correção adicional: o WASM atual define memória internamente e não passava pelo construtor JavaScript. A regressão de alocação retornou success indevidamente. `runtime/memory.js` agora limita a declaração do módulo em memória e falha fechado em formato não suportado; o mesmo teste passou com MemoryError real e recuperação. Artefatos vendor distribuídos permanecem sem alteração e com SRI/SHA verificados.

A revisão das notas oficiais do CPython identificou correções posteriores ao antigo 3.13.2. O runtime foi atualizado para a distribuição oficial atual, sem relaxar origem opaca ou CSP. O bootstrap usa factory ESM por import dinâmico local em worker clássico. Não se executou exploit de corrupção de memória.

O log integral desta passagem ficou no workspace em `.quality-results/pass1.log` (não contém credenciais). O sumário verificável está em `docs/quality-pass1.json`. Este primeiro resultado não é alegação de cobertura total.

## Segunda revisão crítica: defeitos reproduzidos e corrigidos

A revisão foi feita pelo próprio agente em uma passagem separada, procurando falhas após a integração; não é parecer de um auditor externo. Os testes adversariais foram executados primeiro contra o comportamento defeituoso, depois contra as correções. Exemplos sintéticos com aparência de segredo são canários de teste, nunca credenciais reais.

| ID | Severidade | Defeito / correção | Regressão |
| --- | --- | --- | --- |
| Q07 | Alto | NEW_SCRIPT podia apagar a intenção anterior e permitir novo envio. Intenção durável com recuperação de eventos antigos; save-only pode ser executado uma única vez | `security-adversarial.py` casos 01 e 19 |
| Q08 | Alto | Mutação do job pelo chamador podia divergir aprovação, notebook e recibo. Snapshot JSON antes de autorizar/construir | Caso 02 |
| Q09 | Alto | Contagens corretas escondiam splits trocados, parâmetros extras e métricas anteriores inventadas. Replay numérico do pequeno modelo, schemas fechados e separação por IDs | Casos 03–06, `notebooks.py`, `executor.py` |
| Q10 | Médio | Hash calculado ao reabrir um caminho podia não descrever bytes validados. Hash do mesmo descritor/snapshot | Caso 15 |
| Q11 | Alto | Workspace compartilhado ou dentro da raiz HTTP podia expor estado. CLI exige caminho explícito externo; proprietário/permissões verificados sem chmod de pasta existente | Casos 16–17; guarda não conhece outros servidores do host |
| Q12 | Alto | Campos desconhecidos no ledger e no cache de relatório podiam reaparecer na exportação. Revalidação fechada dos objetos internos e códigos estáveis | Casos 08–09 e 18 |
| Q13 | Médio | Notebook auxiliar legítimo da plataforma era tratado como falha mesmo usando download filtrado. Permitir arquivos auxiliares seguros na listagem; baixar apenas whitelist | Caso 07; traversal continua recusado |
| Q14 | Médio | Relatório de treino podia aparecer na receita de inferência. Exigir recipe_id da área selecionada | `experiments-edge-browser.cjs`, cenário 1 |
| Q15 | Baixo | XP visível mudava, mas aria-label mantinha valor anterior. Renderização única atualiza texto/title/aria-label | Cenário 7 |
| Q16 | Médio | Runtime antigo continha CPython anterior a correções upstream. Distribuição oficial atual fixada, licenças/SRI/hashes e bootstrap revalidado | `verify-runtime.cjs`, `runtime-browser.cjs`; sem executar exploit nativo |
| Q17 | Médio | Booleanos podiam passar por contagens Python; checkpoint malformado escapava como erro interno | Casos 13–14; tipos exatos e erro de domínio |

Logs de reprodução preservados em `.quality-results/`: `adversarial-expanded-before.log` registrou 10 falhas e dois erros em 15 casos; `browser-adversarial-before.log`, dois cenários reprovados de sete; `public-workspace-before.log` e `cached-report-before.log`, uma regressão reprovada cada. Esses resultados históricos não são apresentados como falhas ainda abertas. O teste inicial de permissões foi corrigido para aplicar explicitamente 0755 à pasta temporária, pois umask já a criava privada; isso foi ajuste de fixture, sem alterar permissões de diretórios do usuário.

## Matriz de qualidade e limites

| Categoria / requisito | Evidência executável | Limite |
| --- | --- | --- |
| Unidade: conteúdo e respostas | `validate.js`, `core.cjs`, `projects-data.cjs`, `runtime-core.cjs` | Validação pedagógica automática não substitui observação de aprendizagem |
| Regressão: 40 missões, seis modos, projetos/labs/glossário | `browser.cjs`, `labs-browser.cjs`, `projects-browser.cjs`, `projects-edge-browser.cjs`, `project-evaluation-browser.cjs` | Chromium emulado; não Safari físico |
| Persistência e migração V1/V1.5/V2/V3 | `storage-migration.cjs`, `runtime-migration.cjs`, `runtime-edge-browser.cjs`, `experiments.cjs` | Abas distintas não têm escrita transacional compartilhada |
| XP, dicas, reinício e reset | `core.cjs`, `projects-core.cjs`, `runtime-core.cjs` e respectivas suítes de UI | Leituras de experimentos não concedem XP |
| Python real, saída, erros e asserts | `runtime-browser.cjs`, `runtime-python.py`, `runtime-lessons-browser.cjs` | 14 soluções e reparos testados; não interpretador Python irrestrito |
| Isolamento, tempo e memória | `runtime-memory.cjs`, `runtime-races-browser.cjs`, `runtime-browser.cjs`, caso adversarial 12 | Memória WASM limitada; buffers/heap JS ainda podem pressionar dispositivo |
| Concorrência e interrupção | `runtime-races-browser.cjs`, `executor.py` casos 05/07/16, adversariais 01/02/19 | Timeout de escrita remota exige reconciliação manual, não retry cego |
| Contratos JS/Python e notebooks | `experiments.cjs`, `notebooks.py` | Duas receitas fixas, stdlib; sem bibliotecas grandes/LLMs |
| Integração do executor | `executor.py`, SDK e transporte injetados, artefatos CPU reais | Não foi feita chamada autenticada ao Kaggle |
| Autenticação/rede/status/429 | `executor.py`, gates e respostas injetadas | Comportamento da conta e quotas não medidos |
| Segurança de paths, logs, artefatos e ledger | `security-adversarial.py`, `executor.py` | Referência POSIX; não protege de usuário hostil com controle do host |
| End-to-end de experimentos | `experiments-browser.cjs`, `experiments-edge-browser.cjs` | Preparação/importação local; não submissão/retorno remoto |
| Mobile: toque, overflow, idioma e foco | UI em 320/375/390 px; screenshots de 320 e 390 inspecionadas | WebKit ausente; nenhum iPhone físico testado |
| Supply chain / dependências | SHA/SRI/licenças, fontes SDK oficiais e consultas de advisories | Consulta pública limitada, sem alegação de auditoria de todo componente nativo/transitivo |
| Compatibilidade estática | `scripts/check-static.py`, HTTP local e recursos relativos | HTML balanceado/IDs/labels, sem certificação completa de conformidade HTML |

## Segunda passagem completa

Em execução nesta retomada: `node scripts/test.cjs --browser`, incluindo as 19 suítes locais e 14 de navegador. O resultado final, horário e hash do log serão registrados em `quality-pass2.json` após o encerramento real do processo.

## Não testado ou deliberadamente desativado

Nenhuma chamada de conta Kaggle, submissão, execução remota, GPU, quota de conta, cancelamento remoto ou download real de artefatos Kaggle foi feita. O host Kaggle não está liberado neste ambiente e não há autorização/credenciais de conta. SDK foi pesquisado e testado por injeção, não por um job real. Não há backend implantado, login/token público ou polling no frontend.

WebKit não está instalado; Safari/iPhone físico e pressão total de memória no hardware continuam não verificados. O bootstrap depende de uma opção experimental publicada e fixada do Pyodide; upgrades exigem repetir testes. Relatórios importados têm origem declarada, sem atestado criptográfico. Não houve merge/publicação. Nenhum resultado local deve ser chamado de benchmark remoto.
