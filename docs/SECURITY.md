# Limites e decisões de segurança

## Código Python local

O código digitado é executado somente no dispositivo, em CPython/Pyodide. O site não envia código, resultados ou credenciais a um serviço de execução. Não há backend, chave de API, telemetria nova ou modelo externo. Arquivos públicos do runtime são servidos pelo mesmo site.

A interface principal controla downloads fixos, integridade SHA-256, watchdog e o ciclo de vida. Um iframe de origem opaca (`sandbox=allow-scripts`, sem `allow-same-origin`) cria um worker clássico. CSP proíbe rede/conexões, frames e ações de formulário. Recursos do Pyodide são transferidos em memória; fetch do worker responde somente aos recursos de bootstrap conhecidos. APIs de rede/armazenamento/workers adicionais são removidas quando possível. A ponte Python–JS recebe objeto vazio e o harness restringe imports/builtins/atributos internos. A aplicação não entrega localStorage, DOM ou credenciais ao interpretador.

Origem opaca/CSP separam o programa dos dados do app. A política Python é defesa adicional e um limite pedagógico, não prova de isolamento absoluto. WebAssembly tampouco é garantia contra vulnerabilidades de navegador. O recurso é para pequenos programas de aprendizagem, não para hospedar adversários ou executar dependências desconhecidas.

Código com mais de 24 mil caracteres é recusado. Saída tem limite de 32 mil caracteres. Execução tem watchdog de cinco segundos por caso; inicialização, 90 segundos. Interromper/reiniciar encerra o worker e descarta a VM. Cada caso avaliado tem VM nova, inclusive módulos e builtins, evitando contaminação. Funções críticas de comparação/serialização são capturadas antes de código do aluno. Esse verificador não é certificação antifraude: testes/expectativas são recursos públicos e inspeccionáveis.

Não há quota rígida de memória por worker. WASM, cópias de recursos e pressão de memória no iPhone podem causar encerramento do navegador; uma alocação extrema pode afetar a aba antes do watchdog. Não prometemos sandbox absoluta, persistência da VM ou disponibilidade offline. Importar pacotes, acessar arquivos do dispositivo, `input()` e rede não são oferecidos.

## Interface, dados e canal

Código, stdout, stderr e JSON são renderizados por `textContent`/valor de textarea, nunca inseridos como HTML de aluno. A mensagem de retorno exige token aleatório por execução, `event.source` do iframe e origem `null`; código do aluno não recebe o token do canal. Uma nova execução cancela a anterior. Respostas tardias não alteram a etapa atual.

O progresso de exercícios guarda contagens, dicas, conclusão, Python e SHA-256 do snapshot aprovado. Não persiste automaticamente código livre ou saídas. Rascunhos ficam em memória e se perdem ao recarregar. Relatórios são downloads locais por ação explícita. Armazenamento do próprio dispositivo pode ser editado pelo usuário; não há alegação de certificado verificável.

Registros anteriores usam as mesmas chaves. Novos recursos usam chaves independentes e reset com confirmação remove somente dados conhecidos deste aplicativo. Dados danificados recebem cópia `.recovery` antes da substituição; quota/negação geram aviso. Múltiplas abas simultâneas continuam sujeitas à última gravação, sem sincronização.

## Supply chain e Kaggle

Pyodide 0.29.3 foi obtido do pacote oficial, SRI conferido e arquivos redistribuídos sem alteração, com licenças. A versão foi escolhida por funcionar em worker clássico dentro de origem opaca; o candidato mais recente usava module worker e falhou nesse isolamento. Não habilitamos `allow-same-origin` para contornar a incompatibilidade. Antes de publicar/manter, revisar versões, avisos upstream e custo de memória; veja `runtime/THIRD-PARTY.md`.

GitHub Pages é público. Não existem campos para tokens Kaggle, cookies de conta, URLs de upload ou execução remota arbitrária. Contratos fechados recusam campos desconhecidos e material com aparência de credencial; isso não substitui um cofre de segredos. O mock não faz rede. O adaptador remoto retorna `BACKEND_REQUIRED` para enviar/consultar resultados.

Uma integração real futura exige serviço autenticado separado, credenciais no servidor, autorização por job, limites e auditoria. Não foi instalado ou publicado backend. Notebook exportado é preparatório, privado, internet desativada e dono a revisar; não contém segredos nem roda modelo. `kernels delete` não é usado para cancelar jobs. Nenhuma conta foi autenticada ou job real solicitado nesta missão.

## Verificação e limite do parecer

Testes exercitam erros reais, políticas, limpeza, cancelamento/timeout, integridade e ausência de requests externos; os testes de interface cobrem caminhos de usuário e persistência. Isso não substitui revisão de segurança especializada ou prova formal. Chromium desktop emulado não prova comportamento físico do Safari/iPhone; WebKit e iPhone real precisam de validação antes de publicação.
