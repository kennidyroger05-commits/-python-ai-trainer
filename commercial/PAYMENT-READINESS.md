# Pagamentos — preparação, não integração ativa
Status: estrutura SQL de staging proposta; NÃO aplicada ou validada em PostgreSQL nesta rodada. Nenhum endpoint de pagamento habilitado.
## Contrato do adaptador futuro
1. Receber evento real e validar autenticidade sobre os bytes originais com o método documentado para webhooks de vendas, não confundir com webhooks bancários.
2. Conferir pedido, produto, status e data em fonte autorizada. Não confiar em parâmetros de redirect, e-mail do navegador ou dado não verificado.
3. Normalizar somente compra confirmada, reembolso e chargeback. Nenhum PIX/boleto pendente concede acesso.
4. Chamar trainer_record_verified_order usando credencial restrita ao componente servidor, nunca no navegador ou Worker de aprendizagem.
5. Se cliente ainda não tem conta confirmada, permitir vínculo posterior por e-mail verificado. Nunca associar pedido a conta de outra pessoa.
6. Acesso de 365 dias a partir da aprovação original; reenvio não prorroga. Reembolso ou chargeback tornam o pedido terminal; revogação não interfere em outras compras.
7. Auditar apenas identificadores e estados necessários; restringir acesso aos dados de compra, retenção e exclusão. Revisar fluxo de troca de e-mail e exclusão da conta antes do lançamento.
## Homologação requerida
- Criar um produto de área de membros externa em conta própria, sem habilitar venda pública.
- Capturar payload de TESTE e validar assinatura/autenticidade com documentação oficial de venda atual; nunca inserir token ou payload pessoal no Git.
- Testar pedido duplicado, reembolso antes da aprovação, reembolso depois, tentativa de alterar e-mail ou produto, conta sem confirmação, compra antes de cadastro, concorrência e expiração.
- Aplicar migration em ambiente novo e testar RLS, função service_role, retenção e isolamento. Integrar claim ao fluxo de sessão somente depois.
- Checkout permanece desabilitado até reconciliação real e revisão independente.
Fonte: https://ajuda.kiwify.com.br/pt-br/article/como-funcionam-os-webhooks-2ydtgl/
