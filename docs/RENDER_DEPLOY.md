# Deploy do CyberCall no Render

O CyberCall pode ser executado como um **Web Service Node** no Render. O projeto já possui scripts compatíveis: `pnpm build` gera o frontend e o bundle Express em `dist/index.js`, enquanto `pnpm start` inicializa o servidor em produção. O servidor lê a porta injetada pelo ambiente através de `process.env.PORT`, portanto não há porta fixa no serviço.

## Configuração recomendada

O arquivo `render.yaml` contém um Blueprint inicial com os comandos abaixo:

| Campo             | Valor                                          |
| ----------------- | ---------------------------------------------- |
| Runtime           | Node                                           |
| Build command     | `pnpm install --frozen-lockfile && pnpm build` |
| Start command     | `pnpm start`                                   |
| Health check      | `/api/health`                                  |
| Deploy automático | A cada commit na branch conectada              |

O WebSocket realtime utiliza o caminho `/api/realtime`. Depois que o serviço estiver online, o frontend deve usar o mesmo domínio do Web Service; em HTTPS, o cliente converte automaticamente o protocolo para `wss://`.

O upgrade do WebSocket e as mutations em `/api` validam o cabeçalho `Origin`. A própria origem do serviço é aceita automaticamente; se o frontend for servido de outro domínio, liste-o em `ALLOWED_ORIGINS` (separado por vírgula) ou o navegador receberá `403`.

## Variáveis de ambiente

No Render, conecte o serviço ao repositório `GuilhermeADS13/CyberCall` e preencha os valores marcados como secretos no Blueprint. As variáveis `DATABASE_URL`, `JWT_SECRET`, credenciais OAuth e credenciais Forge são obrigatórias para o backend completo. As variáveis iniciadas por `VITE_` também precisam existir durante o build, pois são incorporadas ao bundle do frontend.

Sem `VITE_TURN_URLS` a chamada só funciona entre redes permissivas; provisione um TURN (coturn próprio ou serviço gerenciado) antes de considerar a voz pronta para produção. O banco precisa ser um MySQL/TiDB acessível externamente. O armazenamento de anexos depende do serviço S3 compatível configurado pelos helpers do projeto; o chatbot FAQ depende das credenciais Forge/LLM correspondentes. Não coloque valores reais em `render.yaml`, `.env` ou no GitHub.

## Passos no Render

1. Abra **New → Blueprint** ou **New → Web Service** e selecione `GuilhermeADS13/CyberCall`.
2. Se usar Blueprint, confirme o arquivo `render.yaml` e preencha os campos secretos quando solicitado.
3. Se criar o serviço manualmente, use os comandos de build e start da tabela acima.
4. Cadastre as variáveis de ambiente obrigatórias antes do primeiro deploy, usando `.env.example` como referência.
5. Rode as migrations (`pnpm db:push`) para criar os índices da migration `0008`, sem os quais toda leitura de mensagens faz varredura completa de tabela.
6. Configure o callback OAuth para o domínio HTTPS fornecido pelo Render e atualize as origens permitidas do aplicativo.
7. Após o primeiro deploy, valide login, carregamento de comunidades, mensagens, WebSocket em `/api/realtime` e uma chamada WebRTC.

A hospedagem Render é uma alternativa externa ao WebDev gerenciado. Ela exige manutenção própria de variáveis, banco, domínio, logs e política de escala; o WebDev continua sendo o caminho integrado atualmente configurado para este projeto.
