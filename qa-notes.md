# Validação visual — tags, feedback e preview

- A rota `/login` renderiza o formulário controlado com contraste, hierarquia e campos de e-mail/senha visíveis.
- A rota `/dashboard` sem sessão continua protegida e apresenta o login, comportamento esperado para a autenticação local.
- A interface mantém a direção Minimalismo Operacional e não reintroduz elementos comerciais.
- A validação visual não substitui o teste manual autenticado de criação de tags, salvar/exportar e preview; esses fluxos foram cobertos por TypeScript, build e handlers de estado.

## Validação full-stack — criador de sites

- O workspace autenticado renderiza em desktop e mobile com o estado vazio de projetos vindo da API persistente, sem depender de dados seed no painel de projetos.
- A sessão OAuth carregou um perfil real e a consulta `siteBuilder.overview` respondeu com sucesso, criando/recuperando o workspace do usuário.
- A abertura, criação, salvamento de versão e publicação exigem uma interação autenticada manual no botão “Novo projeto”; a interface e os procedimentos foram conectados e o estado de ausência de página no editor foi tratado.

## Validação GrapesJS, mídia e publicação

- A rota pública `/site/:slug` respondeu com uma página 404 controlada para um slug inexistente, confirmando o registro correto da entrega pública.
- O editor GrapesJS foi aberto com uma página persistente: canvas carregado, botões de blocos, toolbar de desktop/tablet/mobile, ações de salvar/publicar, biblioteca de mídia e painel de estilos renderizaram no workspace.
- O canvas exibiu um elemento selecionável e o inspetor de propriedades do GrapesJS apresentou controles de layout e espaçamento na lateral direita.
- Em mobile, os painéis laterais foram ocultados para priorizar o canvas e os controles secundários foram reduzidos a ícones, mantendo Salvar e Publicar inteiramente visíveis na toolbar.

## Editor em foco e páginas

- O editor aberto por link direto exibiu a barra lateral recolhida, sem a barra superior do workspace, ampliando a área horizontal e vertical do canvas.
- O botão junto à marca Vertex substituiu o antigo X no desktop; a barra recolhida permanece como uma faixa de ícones e pode ser expandida novamente.
- O painel Páginas renderizou a página inicial protegida, o controle de criação e a ação de exclusão desabilitada para a rota `/`.
- Em mobile, o painel lateral é substituído por um atalho de páginas na toolbar. O atalho abre um painel modal com a mesma lista persistente, criação inline, navegação e exclusão protegida.
- A viewport móvel de 390 px preservou canvas, atalhos de desfazer/refazer/prévia, Salvar e Publicar sem overflow horizontal.
- Com o parâmetro de inspeção móvel ativo, o painel abriu sobre o canvas sem deslocar a toolbar e apresentou título, ação de fechar e a seção de páginas.
- Em captura móvel integral, a lista mostrou a página inicial em estado ativo com ação de exclusão indisponível; o formulário inline mostrou campo de nome e botão Criar. A cobertura de integração confirmou a criação de uma segunda página, a listagem de duas páginas, a navegação por ID e o bloqueio da exclusão da home.

## Correção de mutação do editor

- A inspeção de rede identificou um `403 Forbidden` HTML do gateway ao tentar salvar a página 270001. A imagem em Base64 estava duplicada entre o schema GrapesJS e o HTML, ampliando a requisição antes que ela chegasse ao endpoint tRPC.
- Antes de salvar ou publicar, o editor agora detecta imagens `data:image/...;base64`, envia cada imagem uma única vez para a biblioteca de ativos e substitui todas as referências pelo URL persistente retornado.
- A página afetada recarregou com todas as consultas tRPC em JSON e HTTP 200. A suíte agora inclui testes da detecção, deduplicação e substituição das imagens inline; TypeScript, 6 testes e build de produção passaram.
- O teste de integração persiste e publica um documento que começa com a mesma imagem `data:image/...;base64` duplicada no schema e no HTML. Antes das mutações de versão e publicação, a imagem é armazenada como ativo e o documento normalizado não preserva qualquer referência Base64.

## Refatoração interna do Studio

- A navegação visível foi concentrada em Projetos, Templates, Formulários e Editor visual. O dashboard agora mostra contagens persistentes de projetos, páginas, ativos e leads, em vez de métricas ilustrativas.
- O editor recebeu categorias de blocos para estrutura, conteúdo, componentes e formulário de contato. Ações de vínculo por página/âncora, animações, upload de mídia, exportação HTML, SEO por página, versionamento e publicação estão conectadas a estados reais.
- A publicação entrega cada rota de página em `/site/:slug` e `/site/:slug/:caminho`, aplica metadata SEO e registra submissões de formulário. A visão Formulários filtra, qualifica, copia contato e exporta os registros reais em CSV.
- A validação final cobriu TypeScript, build de produção, 7 testes Vitest incluindo SEO, ativos inline, captura de lead, qualificação e roteamento multi-páginas, além de capturas desktop e mobile do painel, editor e formulário.
- A exportação agora dispara dois artefatos complementares — `nome-do-projeto.html` e `nome-do-projeto.css` —, com o HTML referenciando a folha de estilos. A geração é coberta por teste unitário e não depende de conteúdo demonstrativo.
- A autenticação OAuth e o logout mantêm a cobertura existente. O fluxo de formulário publicado, persistência do lead, mudança de status, metadata SEO e rota multi-páginas foi exercitado no teste de integração; as telas de projetos, editor e formulários foram revisadas em desktop e mobile.
- A regressão de formulário agora inicializa o servidor Express com a rota publicada, envia um `POST /site/:slug/leads` real e confirma HTTP 201, seguido da presença do novo contato na consulta interna de leads. O teste de logout validado permanece na suíte de autenticação.
- A captura solicitada em `/login` sob sessão OAuth ativa foi redirecionada ao workspace, evidenciando a proteção de rota e a continuidade da sessão autenticada. O logout é coberto no teste dedicado de autenticação; as capturas do editor e da área de Formulários foram executadas em desktop e mobile, e a rota pública de formulário foi validada por HTTP contra o mesmo backend persistente.
- O usuário confirmou a execução do ciclo manual solicitado: publicação de uma página com formulário, envio na página publicada, visualização no painel de Formulários e saída/entrada pela sessão OAuth, incluindo a verificação em layout desktop e mobile.

## Fase 1 — Legado, OAuth e perfil

- `EditorView`, o fluxo visual anterior de canvas, versão, mídia, motion e exportação, foi desativado em favor do `RealEditor`, que permanece como único editor renderizado no shell principal. As coleções estáticas `projectList` e `leads` foram removidas, e o cartão de projeto passou a usar um tipo explícito.
- A escrita de `manus-runtime-user-info` foi transferida do cálculo memoizado de `useAuth` para um `useEffect` com guarda de ambiente e `try/catch`, preservando o OAuth por cookie e evitando efeitos colaterais durante a renderização.
- A SPA passou a usar `BrowserRouter` e `useNavigate`. Após concluir a limpeza local/remota de sessão, o logout conduz para `/login` com substituição de histórico; uma pessoa já autenticada é encaminhada de `/login` para `/`.
- Validações: TypeScript, build de produção, 8 arquivos de teste e 11 testes passaram. Há regressões específicas para a navegação pós-logout e para garantir que `localStorage` não é acessado dentro do `useMemo` do hook de autenticação.
- Após solicitação de registro, o usuário confirmou novamente que o ciclo manual foi concluído nas visualizações desktop e mobile: acesso OAuth, saída, retorno à rota de login, submissão em página publicada e disponibilidade do lead em Formulários. Nenhuma falha foi reportada.

## Fase 2 — Criação por template

- O catálogo interno passou a usar IDs estáveis `editorial`, `portfolio` e `manifesto`. A galeria envia o ID do card clicado ao modal, que o abre pré-selecionado; a opção Tela em branco omite o campo opcional `templateId`.
- O contrato tRPC valida `templateId` contra os IDs publicados e o helper de banco salva a primeira versão com schema, HTML e CSS do template. Projetos em branco continuam com o schema inicial existente e nenhum HTML/CSS de template.
- A integração persistente confirmou a versão inicial de um projeto editorial com conteúdo e CSS correspondentes. Regressões unitárias confirmam a geração de todos os templates e o payload correto para criação em branco ou com template. TypeScript, build e 15 testes passaram.

## Correção de hidratação de template

- A inspeção do projeto inicialmente validado mostrou que ele não possuía `templateId`, HTML ou CSS de template, portanto era uma criação em branco e não uma falha da renderização GrapesJS.
- O RealEditor passou a resolver explicitamente documentos com HTML/CSS persistidos, inclusive os schemas de template, e mantém a restauração via `projectData` para documentos GrapesJS. A criação também falha com mensagem clara caso o backend não devolva o template solicitado.
- A regressão de resolução de documento passou junto de TypeScript, build e 17 testes. O usuário criou um novo projeto Editorial e confirmou que o canvas abriu com hero, título grande e cartões, em vez da estrutura bruta.

## Sprint 1 — Login e sessão OAuth

- `AuthContext` agora expõe o estado real do OAuth obtido por `useAuth`, sem credenciais locais, valores simulados ou duplicação de sessão. A tela `/login` mantém o design responsivo e usa exclusivamente o botão **Entrar com Conta Corporativa** para iniciar o provedor externo.
- `/dashboard` é protegido por política declarativa do React Router; uma sessão ausente é encaminhada para `/login`, e uma sessão ativa em `/login` é direcionada ao dashboard. O logout usa o helper de limpeza da sessão e navega para `/login` sem `window.location`.
- A autoauditoria passou com TypeScript, build de produção, 12 arquivos de teste e 20 testes. Capturas desktop/mobile confirmaram a convergência de `/login` ao dashboard quando autenticado; o usuário confirmou que o logout no menu de perfil funciona nos dois formatos, retorna a `/login` e bloqueia o dashboard enquanto a sessão está ausente.

## Registro histórico de formulário e leads

- A rota específica usada no teste manual histórico de formulário não foi recuperada pelo usuário. Por transparência, não foi registrada uma URL ou observação manual fictícia. A evidência mantida para esse fluxo é a regressão HTTP persistente: o endpoint público de formulário recebe o `POST`, cria o lead no banco e o registro aparece na consulta interna de Formulários.

## Shell e contraste

- O shell autenticado foi separado em `ApplicationLayout`, `Sidebar` e `AppHeader`. As rotas internas `/dashboard/projects`, `/dashboard/templates` e `/dashboard/trash` renderizaram com navegação por `NavLink`, sem recarregamento de página, em captura desktop e mobile.
- O contraste de rótulos, links, informações de conta, estado vazio e cabeçalho foi reforçado. Os novos componentes agora definem pares explícitos de fundo e texto para tema claro e escuro; os tokens `muted-foreground` foram ajustados para manter texto secundário legível.
- TypeScript, 20 testes e build de produção passaram após a correção. As capturas desktop/mobile mostraram títulos, filtros, cards, rótulos da sidebar e a lixeira com texto legível sobre as superfícies correspondentes.
- A inspeção temporária em tema escuro confirmou contraste consistente em desktop e mobile para títulos, descrições, filtros, rótulos da navegação, perfil, botão Sair e o estado vazio da lixeira. A preferência normal de tema foi restaurada após o QA.
- Os itens ativos da Sidebar usam fundo azul/escuro com texto branco; filtros e botões mantêm texto legível no estado padrão. Não há controles desabilitados visíveis no shell atual; os estados desabilitados existentes do editor continuam usando opacidade sem remover o contraste do texto.
- A revisão final incluiu os itens ativos de Projetos, Templates e Lixeira, em desktop e mobile, nos temas claro e escuro. Os estados desabilitados usados pelo editor e pelas ações assíncronas foram reforçados: botões de contorno agora usam superfície e texto específicos por tema, e a opacidade geral foi elevada para preservar leitura durante carregamentos.
- A página inicial protegida mostrou a ação de exclusão indisponível no painel de páginas do editor desktop, ainda distinguível sem se confundir com o fundo. No shell móvel não há ação desabilitada visível; as ações são links ativos ou são ocultadas pelo modo compacto. A regra de contraste para botões desabilitados permanece aplicada ao editor quando essas ações surgem durante carregamentos.
- A captura do editor na rota `/dashboard/projects?view=editor&page=30001` exibiu a página **Início** e seu ícone de exclusão indisponível no painel de páginas desktop. A implementação reforça esse estado com `disabled={page.isHome}` e título acessível **“A página inicial é protegida”**; em mobile, o shell compacto não expõe controles indisponíveis permanentes.
- Em inspeção visual independente do editor no viewport de 1280 × 800, o item selecionado **Início** no painel **Páginas** exibiu o ícone de lixeira em cinza neutro, distinto dos ícones ativos em azul e visível sobre o cartão azul-claro. O estado corresponde à proteção funcional da página inicial, não se mistura ao fundo e preserva a legibilidade necessária.
- A validação manual final do Sprint 2 foi confirmada pelo usuário: a ação **Sair** na nova Sidebar encerrou a sessão e redirecionou corretamente para `/login`. As capturas anteriores já haviam coberto os layouts desktop/mobile, o menu compacto e as rotas internas sem recarregamento.
- Em confirmação manual complementar no celular, o usuário abriu e fechou a Sidebar pelo menu hambúrguer e navegou para **Templates** e **Lixeira**. O conteúdo mudou nas URLs internas sem recarregamento completo da SPA, concluindo os critérios de navegação do Sprint 2.

## Sprint 3 — Gestão de projetos e clonagem

- A rota `/dashboard/projects` passou a renderizar uma galeria responsiva alimentada pela consulta persistente `siteBuilder.overview`: miniatura, nome do cliente, contagem de páginas, status e data de atualização vêm do projeto real, sem coleção local de projetos.
- O fluxo de clonagem cria um projeto rascunho com prefixo `[CÓPIA]`, páginas, documento mais recente, SEO e tags do projeto de origem. A exclusão usa a mesma autorização de workspace e remove as relações dependentes por cascade.
- As capturas desktop e mobile mostraram a galeria em três colunas e uma coluna, respectivamente, mantendo os cards legíveis e o botão **Novo projeto** acessível.
- O usuário confirmou manualmente o ciclo final: criou um projeto vazio pelo nome do cliente, duplicou-o pelo menu do card, viu o novo item com o prefixo **[CÓPIA]** sem recarregamento completo e excluiu somente a cópia; a galeria refletiu cada mutation imediatamente.
- A confirmação manual abrangeu também o viewport móvel: criação do projeto vazio, abertura do menu de ações, duplicação e exclusão somente da cópia ocorreram sem recarregar a SPA. A captura móvel confirma que a galeria se adapta a uma coluna e preserva o acesso ao menu de cada card.

## Sprint 4 — Super Editor GrapesJS

- O GrapesJS permanece isolado em refs de canvas, blocos, estilos e instância. A inicialização ocorre no efeito de abertura do documento e o cleanup destrói a instância anterior, evitando duplicação de iframes e listeners em re-renderizações.
- A biblioteca externa passou a usar o Block Manager nativo em modo arrastável, com estruturas Flex, Grid fluido, textos, imagens, grupos de botões, componentes e formulários. O Style Manager continua fora do canvas e agora inclui setores de Layout, Flexbox, Grid, Tipografia e Aparência.
- O Device Manager usa regras CSS responsivas por desktop, tablet e mobile. Com estilos não inline, as alterações de cada breakpoint são armazenadas como regras de mídia no documento persistido, preservando o estilo base do desktop.
- Capturas desktop e mobile confirmaram o canvas predominante, o painel externo corporativo e a biblioteca de blocos legível. TypeScript, 21 testes Vitest e build de produção passaram.
- A correção de reabertura deixou o `projectData` do GrapesJS como fonte de verdade e restringiu HTML/CSS separados ao papel de fallback, impedindo a sobrescrita de regras responsivas carregadas do documento salvo. A regressão cobre tanto a preservação de CSS por media query quanto o fallback quando o projeto não contém os artefatos.
- A investigação confirmou a cascata normal do CSS: a regra base de Desktop é herdada em viewports menores até que uma media query a substitua. O editor agora expõe um controle contextual em Tablet e Mobile. **Estilo compartilhado** sincroniza a mudança ao estilo-base; **Criar estilo próprio** materializa uma regra daquele breakpoint com a aparência atual e a protege de alterações posteriores do Desktop.
- O usuário validou manualmente ambos os cenários, incluindo salvar, sair e reabrir: o estilo compartilhado acompanhou a alteração entre dispositivos e o estilo próprio manteve uma cor independente após a persistência.
- A validação complementar em **Tablet** foi confirmada pelo usuário: uma cor própria do botão permaneceu distinta de Desktop e Mobile após salvar, sair e reabrir. Assim, a independência e a persistência foram verificadas nos três breakpoints configurados.

## Exportação estática em ZIP

- A exportação usa `editor.getHtml()` e `editor.getCss()` para montar `index.html` e `css/style.css`; o HTML recebe título, description, favicon e OpenGraph quando configurados. A auditoria automatizada abriu o ZIP, verificou que os dois arquivos não estão vazios, confirmou a localização de mídia usada no HTML/CSS e garantiu a remoção de atributos e classes internas do GrapesJS.
- O download foi validado manualmente pelo usuário com um template sem edição: o arquivo ZIP continha `index.html` e CSS, e a abertura externa no VS Code exibiu o site corretamente. Isso confirma o pacote estático mínimo para hospedagem fora do Vertex.
