# Preparação comercial — staging V1
Não é release comercial. A main permanece intacta. Base V4 já mesclada no PR #8.
## Entregas
- Portal e amostra pública independente, com perguntas de opção da primeira unidade; não equivale à unidade completa.
- Build em diretório separado, Worker com autorização server-side para /app/* e API; Supabase Auth de e-mail/senha, somente contas confirmadas, sessão curta HttpOnly.
- RLS e concessão manual de acesso temporário/revogável para testadores; backup manual por conta e revisão otimista.
- Não há compra real, webhook, cadastro público, renovação automática de sessão ou recuperação de senha.
## Rodar em ambiente isolado
1. Criar NOVO projeto Supabase de staging (não usar base operacional). Aplicar schema.sql no SQL Editor. Desabilitar cadastro público e criar contas de teste confirmadas; conceder acesso de teste por UUID.
2. python3 commercial/build.py; node commercial/tests.mjs. Validar build e regressão original.
3. Configurar SUPABASE_URL e SUPABASE_ANON_KEY em ambiente local Wrangler ou secrets do Worker; nunca commitar .dev.vars. Usar HTTPS. A chave anon não substitui RLS; não usar service_role no Worker.
4. No diretório commercial, usar Wrangler local ou deploy de staging mediante aprovação. Não habilitar vendas.
5. Testar duas contas em dispositivos reais: usuário sem grant, ativo, expirado, revogado, sessão expirada, restauração, conflito de versões, isolamento de storage, acesso direto a JSON/WASM, consumo de memória e falhas de rede.
## Bloqueios de produção
- O repositório é público e o conteúdo antigo pode ser obtido fora do Worker; privatizar distribuição premium futura após decisão do proprietário. Não prometer DRM.
- Confirmar todos os acessos diretos a localStorage na V4 e referências de assets antes de aprovar o build. Backup manual não sincroniza abas em tempo real; testar restauração e conflitos.
- Validar no Safari/iPhone e Android reais, teclado, downloads, 14 MB iniciais do runtime, rotação, conexão lenta. Revisar licenças e tamanho de arquivos Wrangler.
- Avaliação pedagógica independente: pré/pós-teste com 10–20 iniciantes, tarefas sem alternativas (variáveis, função, JSON, tratamento de erro), medir autonomia; acrescentar desafios executáveis revisados antes de venda.
- Kiwify: criar produto externo e checkout somente depois de teste real; verificar documentação de assinatura de webhook, payload e produto, validar eventos aprovados/reembolso/chargeback com autenticidade, idempotência e reconciliação. Nunca confiar em redirecionamento de sucesso. Até lá checkoutEnabled=false.
- Implementar signup com confirmação, reset de senha, renovação de sessão, rate limits, retenção/eliminação de dados, logs sem PII, segurança independente e suporte; não liberar pagamento sem esses gates.
- Referências: https://developers.cloudflare.com/workers/static-assets/binding/ ; https://supabase.com/docs/guides/auth ; https://ajuda.kiwify.com.br/pt-br/article/como-funcionam-os-webhooks-2ydtgl/

## Prática de autonomia
Seis exercícios de código livre adicionais, acessíveis no app protegido pelo link Prática de autonomia. Reutilizam PythonExecutor e três casos por exercício; não contam como missões concluídas no currículo. Precisam de teste real de navegador, revisão pedagógica e avaliação com alunos. Não há alegação de ganho de aprendizagem.
