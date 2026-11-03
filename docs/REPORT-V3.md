# Relatório V3 — Python AI Lab

## Estado e recuperação

A V3 está implementada e validada automaticamente para revisão na branch `feature/v3-python-ai-lab`, baseada em V2 `eb813511d255994d994b0c9adac5af76c93beee8`. Não foi integrada nem publicada. Main, V1.5 e V2 permanecem nas referências anteriores.

A execução foi interrompida pelo ambiente. Na retomada, os arquivos e alterações locais estavam presentes; nenhum trabalho válido foi reconstruído ou descartado. Sete testes foram reexecutados antes do checkpoint `0065244`, enviado imediatamente. O desenvolvimento continuou com commits/pushes incrementais. O processo antigo de navegador não foi presumido como concluído: todas as suítes foram executadas novamente.

## Entregas

| Requisito | Entrega e validação |
| --- | --- |
| Auditoria V2 | Testes de conteúdo, lógica, CPython e mobile antes das mudanças; matriz em `COMPATIBILITY-V3.md` |
| Quarenta missões preservadas | Hashes dos arquivos de conteúdo/idioma V2 e regressões V1–V2 |
| Quatro projetos | Dez etapas por projeto; mesmo artefato, dados, casos e conclusão |
| Motor reutilizável | IDs de atividade/etapa, estado isolado, validação, dicas, navegação e retomada |
| Simulador de fluxos | 17 fluxos e 63 nodes de referência, com entrada, saída, decisão, falha e correção |
| Debugging novo | Oito cenários de três etapas, com evidência, causa, correção e teste |
| Introdução a testes | Seis etapas: entrada/esperado, positivo, negativo, borda, asserção e vocabulário |
| Competências | Dez áreas com contagens de conceitos observados, sem níveis profissionais inventados |
| Idiomas e camadas | PT, Misto padrão, English; definição, exemplo e aplicação profissional |
| Revisão por erros | Missão de revisão, exemplo ou continuação opcional; rascunho preservado no retorno |
| Portfólio | “Meus projetos”, conclusão real local e download Markdown identificado como simulado |
| Persistência e migração | Dados do Lab separados; histórico/XP/preferência V1, V1.5 e V2 preservados |
| Mobile | Percursos reais de toque em Chromium em 320, 375 e 390 px; sem teclado obrigatório ou overflow horizontal |

As 70 etapas novas são 40 etapas de projeto, 24 de debugging e seis do tutorial. Elas não são apresentadas como mais setenta missões independentes. A base continua com quarenta missões.

## Projetos concluídos

1. **Roteador de modelos:** entrada, variáveis, regra de prioridade, seleção, fallback, auditoria da decisão, ramo invertido, correção, testes e explicação. O workspace realmente falha nos casos cadastrados quando recebe a cópia invertida e passa após reparo. Modelos são fictícios e scores não são presumidos como probabilidades calibradas.
2. **Cliente de API de IA:** payload, parâmetros, transporte JSON como texto, parsing, campos, chave ausente, status 503, fallback e quatro casos do contrato. Diferencia dicionário Python, estrutura JSON e texto serializado. Nenhuma requisição de modelo é realizada.
3. **Avaliação de modelos:** quatro tarefas, alvos, previsões, igualdade textual, contagens, fração de acertos, IDs das falhas e trade-offs. A=3/4 e B=2/4 neste conjunto. Latência média por tarefa e custo total do lote são fictícios e distintos de acurácia. A solução também trata previsões ausentes e avaliação vazia nos testes.
4. **Mini pipeline de treinamento:** seis exemplos fictícios, separação por IDs, lotes, três épocas, perdas de treino/validação, divergência e checkpoint 2. Diferencia inferência, treinamento e fine-tuning. Nenhum ajuste real de pesos ocorre e os logs não comprovam superioridade geral.

## Cenários novos de debugging

| Cenário | Evidência / comportamento | Testes da correção |
| --- | --- | --- |
| Chave interna ausente | KeyError ao acessar content no lugar de body.text | Campo presente, corpo ausente, campo ausente |
| Contagem como texto | TypeError em texto + inteiro | Texto de inteiro, inteiro, texto inválido rejeitado |
| Função sem return | None sem exceção | Entradas 3, 0 e 4 rejeitam retorno constante |
| Limite de orçamento invertido | Resultado contrário à regra, sem exceção | Abaixo, igual e acima do limite |
| Fallback inalcançável | Retorno antes da guarda, sem exceção | Texto válido, chave ausente e texto vazio |
| API com JSON malformado | JSONDecodeError real | JSON válido, sintaxe inválida, null válido |
| Lista de scores vazia | ValueError de max sem itens | Lista comum, vazia e scores negativos |
| Denominador errado | Acurácia artificialmente alta, sem exceção | Todas corretas, previsão ausente e conjunto vazio |

As evidências e mensagens reais são confrontadas com CPython 3.12.14. Dezesseis reparos alternativos são rejeitados pelos casos, além da verificação de todas as escolhas da interface.

## Arquitetura e decisões

- `projects/engine.js`: esquema e estado por ID, efeitos cumulativos, ledger de XP, testes/configuração, navegação e evidências.
- `projects/models.js`: funções determinísticas cadastradas. Não há interpretador de código arbitrário.
- `projects/view.js` e `flow-view.js`: tela genérica, recursos em camadas e navegação dos fluxos.
- `projects/portfolio.js`: relatório local com objetivo, conceitos, etapas, artefato, dados fictícios, solução, testes registrados e limitações.
- `projects/*.json`: quatro projetos, oito cenários, tutorial, dados e 31 termos adicionais; o glossário combinado tem 68 termos sem sobrescrever os 37 anteriores.
- `core/storage.js`: leitura defensiva, cópia local antes de recuperar corrupção, falha de quota e remoção restrita às chaves do app.
- `app.js` e `core/progress.js`: integração e correções de compatibilidade, preservando o motor de missões.

Foi rejeitada a reescrita da V2 e a mistura dos dois XP/históricos. Editor livre, backend, execução arbitrária, LLM, credenciais e sincronização não foram introduzidos. Novos domínios usam dados e adaptadores pequenos de modelo/testes, sem uma nova tela para cada projeto.

## Competências e metodologia

Fundamentos Python, estruturas de dados, funções, debugging, APIs, raciocínio lógico, fluxos de IA, avaliação, treinamento e inglês técnico.

O painel conta conceitos distintos com apresentação registrada, tentativa e ao menos um acerto. Revisão é uma heurística explícita: erro nas três tentativas recentes ou duas dicas na unidade. Categorias podem coexistir; um acerto não significa domínio. Conclusões antigas fornecem evidência histórica de acerto, mas contagens de erros/tentativas ausentes não são inventadas. Traduções consultadas contam como apresentação em inglês; a questão contextual de vocabulário fornece uma evidência específica de prática/acerto. Não há avaliação de fluência, empregabilidade ou nível profissional.

## Testes e resultados

Todos os comandos abaixo passaram:

- `node tests/validate.js` e `node tests/core.cjs`: integridade e respostas das 40 missões, seis modalidades, pré-requisitos, idiomas, XP, revisão e migração anterior.
- `python3 tests/python-fixtures.py`: resultados de 40 exemplos, alternativas de correção, exceções e seis traces V2.
- `node tests/projects-core.cjs`: 13 atividades e 70 etapas; respostas certas/erradas, estado isolado, reload de registros, reinício sem XP duplicado, corrupção/quota e hashes V2.
- `node tests/projects-data.cjs`: esquemas mutados inválidos, traduções/termos, links de revisão, testes obrigatórios e assinatura obsoleta, Markdown honesto e evidências sem dados fabricados.
- `node tests/storage-migration.cjs`: V1/V1.5/V2, preservação do registro de origem, salvamento separado, recuperação parcial, backups locais, reset restrito e quota.
- `python3 tests/projects-python.py`: quatro soluções completas, oito programas quebrados, 16 reparos rejeitados, 24 casos de debugging, round-trip JSON, avaliação/treinamento e paridade JavaScript/CPython. Inclui previsões ausentes na avaliação.
- `node tests/browser.cjs`: todas as quarenta missões nos três tamanhos de tela, com idiomas, dicas, XP, armazenamento, traces, reinício e reset.
- `node tests/labs-browser.cjs`: laboratórios V2, investigação/correção, fluxo IA, revisão e migração nas três larguras.
- `node tests/projects-browser.cjs`: 70 etapas em 320/375/390 px; toques reais, opções erradas repetidas, workspace sem efeito de erro, camadas, glossário offline, idioma sem perder resposta, reload, retorno de revisão, fluxos, conclusão, downloads de fato, reinício, reset e alternância rápida de telas. Os projetos não alteraram o XP/histórico das missões.
- `node tests/projects-edge-browser.cjs`: migração real com 5/15/40 conclusões anteriores, preferência e rascunho/fluxo após reload, registros ausentes/danificados, recuperação parcial e leitura/escrita de armazenamento bloqueadas. Executado em 375 px.
- `node tests/project-evaluation-browser.cjs`: auditoria posterior da correção para previsão ausente, quatro verificações no painel e relatório exportado com dados/código corrigidos, em 320/375/390 px.
- Sintaxe JavaScript, JSON e `git diff --check`.

As capturas de interface são produzidas em `/tmp` durante o desenvolvimento e revisadas no ambiente; não contêm dados privados de usuários reais. Os testes de navegador não são testes em iPhone físico.

## Problemas encontrados e corrigidos

- Preferência de idioma lida sem proteção impedia carregar o app quando localStorage negava leitura.
- Métricas locais com `recent` corrompido podiam quebrar a revisão; agora são normalizadas com preservação recuperável da origem.
- JSON inválido ou estruturalmente impróprio podia ser sobrescrito sem cópia local. A recuperação agora mantém uma cópia antes de gravar.
- Alguns módulos continuavam em português no modo English.
- Retomar um registro com etapa final inválida podia deixar o usuário sem pré-requisitos; o carregador recupera a primeira etapa válida pendente.
- Revisão iniciada por projeto não deve avançar silenciosamente o ponto normal das missões; o retorno restaura o contexto.
- Comparação de JSON não deve depender da ordem de chaves.
- A solução de avaliação precisava proteger também a listagem de falhas para previsões ausentes, além do denominador da acurácia. A correção foi verificada com Python/JS e exportação no navegador.
- O relatório exportado passou a incluir os dados fictícios para tornar seus resultados conferíveis.

## Limitações, riscos e revisão manual

Safari/WebKit não está instalado e não houve teste em iPhone real. Recursos como structuredClone exigem Safari moderno. Download Blob/Markdown e acessibilidade com VoiceOver precisam de revisão no dispositivo. Chromium com emulação de toque não comprova compatibilidade física completa.

Os contratos são deliberadamente pequenos: por exemplo, o roteador usa prioridades definidas e alternativa local prevista, e a avaliação usa igualdade textual em dados minúsculos. As simulações não aceitam programas gerais, não fazem APIs reais e não treinam modelos. Traces são referências previamente validadas e estão rotulados como tal.

Persistência é local e não coordena escritas simultâneas de várias abas. Armazenamento negado/quota excedida permite continuar em memória com aviso, mas não garante retomada após fechar/recarregar. Cópias de recuperação ficam no próprio navegador até o reset confirmado. Dados apagados pelo usuário ou pelo navegador não podem ser restaurados pela aplicação.

A validação técnica não substitui avaliação de compreensão por iniciantes. O portfólio é um registro didático local, não certificado externo ou prova de experiência profissional. Antes de publicar, revisar V1.5/V2 e V3 manualmente no Safari/iPhone e aprovar os PRs na ordem adequada.

## Commits e entrega

- `0065244`: recuperação imediata do trabalho existente, motor, conteúdo, testes e push.
- `d78dda2`: armazenamento negado, extremos de navegador e segundo push.
- `4cb20e8`: orientação, glossário, revisão opcional e correção da avaliação, com testes.
- A documentação final e o registro da tentativa de PR constam dos commits seguintes no histórico da branch.

O destino do PR de rascunho é `feature/v2-debug-training`, nunca main. Não há autorização de merge ou publicação. O texto está em `docs/PR-V3.md`; o resultado real da tentativa será registrado no fechamento da entrega. Nenhuma V4 foi iniciada.
