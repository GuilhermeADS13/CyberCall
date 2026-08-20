# Contribuindo com o CyberCall

Obrigado por contribuir com o CyberCall. O projeto prioriza comunicação em tempo real, segurança, acessibilidade e uma experiência visual cyberpunk consistente. Antes de propor uma mudança, consulte o README e verifique Issues abertas para evitar trabalho duplicado.

## Fluxo de desenvolvimento

Crie uma branch curta a partir de `main`, implemente uma mudança focada e mantenha o histórico compreensível. Para alterações maiores, abra uma Issue primeiro e descreva o problema, o escopo e os critérios de aceite. Commits devem usar mensagens objetivas, por exemplo `feat: add network quality indicator` ou `fix: isolate realtime room events`.

## Comandos locais

```bash
pnpm install
pnpm check
pnpm test --run
pnpm build
```

Toda Pull Request deve passar por TypeScript check, testes e build. Alterações visuais devem ser verificadas em desktop e mobile. Alterações em WebSocket/WebRTC devem incluir cenários de autorização, isolamento de sala, reconexão e cleanup.

## Segurança

Nunca envie `.env`, tokens, cookies, chaves de API, dumps de banco ou dados pessoais. Use as variáveis de ambiente do projeto para credenciais. Não enfraqueça o comportamento fail-closed de uploads nem encaminhe eventos realtime sem verificar autenticação, membership, canal e `roomKey`. Vulnerabilidades não devem ser publicadas em Issue pública; comunique-as ao responsável pelo repositório por um canal privado.

## Acessibilidade e UX

Novos controles devem ser acessíveis por teclado, possuir foco visível, labels semânticos e estados de erro/loading. Modais precisam controlar foco, fechar com Escape quando apropriado e restaurar o foco ao gatilho. Animações devem respeitar `prefers-reduced-motion`.

## Pull Requests

Use o template da Pull Request e explique o comportamento antes/depois. Inclua screenshots ou gravações para mudanças visuais, sem dados sensíveis. Solicite revisão quando a alteração estiver validada localmente; o workflow do GitHub Actions executará check, testes e build automaticamente.
