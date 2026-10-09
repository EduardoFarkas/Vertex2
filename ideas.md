# Direção visual do website

## Abordagens consideradas

### Abordagem 1 — Minimalismo Operacional
**Very Brief Intro:** Um workspace editorial inspirado no design de produto da Apple e em estúdios suíços: branco, grafite, azul pontual e hierarquia silenciosa. A interface deve transmitir controle, precisão e espaço para criar.

**Probability:** 0.07

### Abordagem 2 — Arquivo Editorial
**Very Brief Intro:** Uma linguagem de revista digital com tipografia serifada, tons de papel e uma composição mais narrativa, feita para destacar contexto, processo e conteúdo. O produto pareceria um caderno de direção criativa.

**Probability:** 0.03

### Abordagem 3 — Estúdio Modular
**Very Brief Intro:** Um sistema visual mais expressivo, com blocos coloridos, superfícies translúcidas e contrastes cromáticos para tornar o editor uma ferramenta energética. A personalidade seria mais próxima de um laboratório de design.

**Probability:** 0.09

## Abordagem escolhida — Minimalismo Operacional

### Design Movement

Minimalismo de produto contemporâneo, com referências ao **Swiss International Style**, ao design de interfaces da Apple e à lógica de um estúdio editorial profissional. A estética combina superfícies silenciosas com acentos precisos para que a ferramenta pareça confiável antes mesmo de ser usada.

### Core Principles

1. **Clareza antes de ornamentação:** cada elemento deve explicar seu papel sem depender de decoração.
2. **Espaço como ferramenta:** áreas de respiro, margens largas e separadores finos criam uma sensação de foco.
3. **Precisão tátil:** estados de hover, foco e seleção respondem com suavidade, sem efeitos chamativos.
4. **Profundidade discreta:** cartões brancos, vidro fosco e sombras difusas separam camadas sem criar peso visual.

### Color Philosophy

O fundo ultraclaro `#F5F5F7` funciona como uma folha de trabalho neutra; o branco dos painéis cria zonas de concentração; o grafite `#1D1D1F` dá autoridade às ações; e o azul `#0066CC` aparece apenas como sinal de navegação, foco ou link. A cor própria da marca é **Azul Vertex `#2563EB`**, um azul limpo e técnico que conecta criação, estrutura e publicação sem cair em estética corporativa genérica.

### Layout Paradigm

A estrutura usa um **workspace assimétrico**: navegação lateral estreita e persistente, conteúdo principal em uma coluna ampla com respiros generosos, e painéis contextuais que entram pela direita quando necessário. Em vez de uma grade centralizada uniforme, cada página terá uma zona de ação dominante e uma camada de contexto secundária.

### Signature Elements

1. **Rail de navegação com marcador vertical:** a seção ativa é indicada por uma linha azul de 2px e não por um bloco pesado.
2. **Canvas com moldura de dispositivo:** o editor central parece uma folha real dentro do estúdio, com breakpoints visíveis e bordas finas.
3. **Micro-rótulos de sistema:** pequenas etiquetas em caixa alta, espaçamento amplo e cinza frio orientam o usuário sem competir com títulos.

### Interaction Philosophy

As interações devem parecer deliberadas e reversíveis. O usuário sempre entende onde está, o que está selecionado e qual ação terá consequência. Ações principais usam contraste preto; ações secundárias usam bordas leves; menus e accordions revelam contexto sem deslocar a página inteira.

### Animation

Entradas de painéis usam `opacity` e `translateY(6px)` em 180ms com easing de saída firme. Botões respondem com redução de escala de `0.98` no pressionar. Hover em cartões move a sombra e eleva o cartão no máximo 2px. A navegação lateral não pulsa: o estado ativo muda de cor e marcador com transição curta. Toda animação não essencial respeita `prefers-reduced-motion`.

### Typography System

Usar **Manrope** para títulos, números e navegação, com pesos 500–700, e **Inter** para texto corrido, labels e dados de tabela, com pesos 400–600. Títulos de página ficam entre 2.5rem e 3.25rem em desktop; títulos de seção entre 1.05rem e 1.25rem; micro-rótulos em 0.68rem com `letter-spacing: 0.16em`; corpo em 0.9rem–1rem, com altura de linha generosa.

### Brand Essence

**Vertex Echad Studio é o workspace visual para pessoas que transformam estrutura em presença digital, reunindo edição, templates e publicação em um único estúdio silencioso e preciso.**

Personalidade: **preciso, calmo, autoral**.

### Brand Voice

Headlines são diretas e afirmativas; CTAs usam verbos de ação claros; microcopy reduz ansiedade e explica o próximo passo. Evitar slogans genéricos e promessas absolutas.

Exemplos:

> **Seu próximo site começa com uma tela em branco.**

> **Modele a estrutura. Publique a presença.**

### Wordmark & Logo

O símbolo é um **V geométrico formado por duas lâminas que se encontram em um ponto deslocado**, sugerindo uma página aberta e um cursor de edição. Ele será usado sem texto em favicon e marca de navegação; o wordmark “VERTEX ECHAD” aparece em caixa alta, com espaçamento controlado e tratamento tipográfico próprio, nunca como texto padrão isolado.

### Signature Brand Color

**Azul Vertex `#2563EB`** — o azul de precisão que sinaliza foco, autoria e publicação.

## Style Decisions

- A interface seguirá o Minimalismo Operacional em todas as telas, sem gradientes roxos, sem excesso de cantos arredondados e sem navegação centralizada genérica.
- A primeira entrega será um frontend navegável de alta fidelidade com dados demonstrativos locais; integrações reais de autenticação, PostgreSQL, Prisma e GrapesJS ficam preparadas como evolução de produto, mas não serão simuladas como funcionando no backend sem a configuração correspondente.
- O produto será apresentado como um estúdio profissional, não como uma landing page promocional: a tela inicial prioriza contexto, projetos e ações de criação.
- O produto é estritamente interno: não exibir planos, assinaturas, propaganda, linguagem de conversão ou CTAs comerciais. A interface deve priorizar comunicados, ferramentas, documentos, diretório e produtividade dos colaboradores.
- A navegação de recursos internos usa linguagem operacional — “Formulários”, “Documentos”, “Diretório” e “Comunicados” — em vez de conceitos de cliente final ou aquisição.
