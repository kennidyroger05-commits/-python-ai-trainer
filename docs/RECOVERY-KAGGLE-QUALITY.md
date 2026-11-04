# Retomada da auditoria Kaggle

O workspace anterior foi preservado. Branch ativa: `feature/kaggle-execution-quality`; HEAD encontrado: `0400e4e`. Os cinco marcos anteriores estavam commitados, e o log completo da primeira passagem registrava 31 suítes aprovadas. Não houve reconstrução, reset destrutivo ou descarte de mudanças.

Foram encontradas alterações locais ainda não commitadas no executor e em seus testes. Elas corrigem defeitos reproduzidos pela segunda revisão: reenvio após NEW_SCRIPT, mutação do job durante preparação, campos inesperados no estado/relatório, validação insuficiente de splits/checkpoints/métricas e hashes calculados por releitura do caminho. Também impõem workspace privado e preservam estado corrompido sem novo envio.

Antes do commit de recuperação foram executados novamente: 16 casos adversariais, 27 casos do executor, oito casos de notebooks completos em CPU e a suíte JavaScript de contratos/estado/geração equivalente. Todos passaram. Os logs anteriores com falhas foram preservados como evidência da causa, sem serem tratados como o estado atual.

Na retomada foram concluídas a auditoria adversarial da interface, correções adicionais e a segunda passagem completa: 33 suítes aprovadas e nenhuma reprovada, incluindo 54 casos Python de notebooks/executor/segurança e sete cenários adversariais novos no Chromium. Os dois notebooks foram novamente executados completos em CPU. Também foram corrigidos workspace dentro da raiz HTTP, relatório na receita errada, XP acessível desatualizado e campos desconhecidos no cache de relatórios concluídos.

Commits incrementais após a recuperação: `f7a5a7f`, `d2e1358` e `057a9a1`, enviados ao GitHub. O código funcional permaneceu estável durante a segunda passagem; as últimas alterações são documentação/evidência. Resultado e limites em [REPORT-KAGGLE-EXECUTION.md](REPORT-KAGGLE-EXECUTION.md), matriz em [QUALITY-AUDIT.md](QUALITY-AUDIT.md) e prova em [quality-pass2.json](quality-pass2.json).

Kaggle real permanece desativado e não foi autenticado ou executado. WebKit não está disponível e nenhum iPhone físico foi testado. Nenhuma mudança em main, merge ou publicação. A tentativa final de PR terá resultado registrado no relatório; se a API continuar Forbidden, comparação e corpo preparado serão entregues.
