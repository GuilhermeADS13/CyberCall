# Política de uploads da CyberCall

## Fluxos liberados

A CyberCall permite anexos visuais autenticados em mensagens quando o arquivo passa pela allowlist de MIME/extensão, validação de assinatura, limite de tamanho, análise automática de conteúdo e verificação de propriedade da sessão. Imagens aprovadas podem ser exibidas no chat com pré-visualização.

## Fluxos bloqueados

Documentos, PDFs e outros arquivos não visuais permanecem bloqueados antes do armazenamento final enquanto a integração com um scanner antimalware confiável não estiver configurada. A aplicação usa uma política fail-closed: falha, ausência ou resposta inconclusiva do scanner não libera o arquivo.

## Próxima liberação controlada

A liberação de documentos depende da configuração de `CLOUDMERSIVE_API_KEY`, de testes de contrato do scanner, validação de MIME e assinatura, limites de tamanho, rate limit, registro de proprietário e tratamento de falhas. Nenhuma interface deve recomendar que o usuário contorne esses bloqueios.
