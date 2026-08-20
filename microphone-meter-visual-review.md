# Revisão visual do medidor de microfone

As capturas em 1280×720 e 390×844 mantiveram o shell CyberCall sem overflow ou regressões de hierarquia. O indicador de nível é renderizado dentro dos controles do overlay de voz, portanto não altera a navegação principal em modo visitante. Em viewport estreita, o drawer e a coluna de conteúdo continuam legíveis.

A leitura dinâmica do medidor deve ser observada com uma sessão autenticada e uma permissão de microfone concedida: o componente exibe barras ciano/âmbar/vermelhas conforme a intensidade, `muted` quando o microfone está desativado e `n/a` quando a Web Audio API não está disponível. O estado também é anunciado por `role=status` e `aria-live=polite`.
