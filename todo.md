# Próxima evolução do Vertex Echad Studio

- [x] Adicionar alternância persistente entre tema claro e dark mode no shell do painel e no editor.
- [x] Ajustar tokens, superfícies, bordas, previews e contraste para o tema escuro.
- [x] Implementar drag-and-drop dos blocos no canvas do editor, com feedback visual e suporte à inserção por teclado/clique.
- [x] Adicionar pesquisa e filtros funcionais à visão de projetos.
- [x] Adicionar pesquisa e filtros funcionais à biblioteca de templates.
- [x] Validar desktop, tablet, mobile, foco visível, estados vazios e compilação de produção.

## Nova atualização

- [x] Ler e mapear o conteúdo de `pasted_content_2.txt` para as telas e componentes atuais.
- [x] Atualizar copy, estrutura ou funcionalidades conforme os requisitos do novo conteúdo.
- [x] Preservar dark mode, filtros, busca e drag-and-drop durante a atualização.
- [x] Validar a nova versão em desktop, mobile, TypeScript e build de produção.

## Novas funcionalidades e ações

- [x] Ler `pasted_content_3.txt` e mapear as novas funcionalidades solicitadas.
- [x] Definir estados de loading, sucesso, erro, modal e confirmação para as ações.
- [x] Atualizar os botões existentes com fluxos funcionais e feedback contextual.
- [x] Implementar as novas funcionalidades preservando o contexto de portal interno.
- [x] Validar os fluxos em desktop/mobile, dark mode, TypeScript e build de produção.

## Tags, feedback e preview

- [x] Definir tags personalizadas persistentes para projetos e templates.
- [x] Adicionar criação, remoção, busca e filtro por tags nas coleções.
- [x] Adicionar loading, sucesso e erro reais para salvar e exportar projetos.
- [x] Adicionar modo preview no editor antes da exportação HTML.
- [x] Criar e validar uma habilidade reutilizável para este fluxo de evolução frontend.

## Acesso local de demonstração

- [x] Restringir o login local ao e-mail confirmado pelo usuário.
- [x] Substituir/remover referências a acessos locais anteriores e limpar a sessão salva.
- [x] Validar login, logout, senha visível/oculta e build sem expor a credencial em mensagens ou logs.

## UX de autenticação

- [x] Adicionar opção “Lembrar-me” com persistência controlada da sessão local.
- [x] Melhorar o feedback visual para senha incorreta sem expor a credencial.
- [x] Adicionar transição suave após login e toast de boas-vindas no painel.
- [x] Completar o menu do perfil com e-mail, perfil e logout.
- [x] Atualizar e validar a habilidade reutilizável com o novo fluxo.

## Criador de sites — Fases 1 e 2

- [x] Ler o guia full-stack e avaliar a scaffold atual antes da migração.
- [x] Migrar `App.tsx` e o login/logout para OAuth e sessão por cookie do template.
- [x] Criar o schema de workspace, membros, projetos, páginas, versões, assets e tags.
- [x] Implementar APIs protegidas para abrir, salvar e versionar projetos.
- [x] Hidratar o editor com a versão persistida ao abrir uma página e remover `localStorage` como fonte inicial.
- [x] Adicionar estados de loading e erro para abertura e salvamento da página conectada.
- [x] Validar OAuth/cookie e overview no navegador, além de criação, abertura, salvamento e publicação no teste de integração do banco.

## Criador de sites — Editor, mídia e publicação

- [x] Ler os guias de armazenamento e avaliar a integração oficial antes de enviar arquivos ao S3.
- [x] Instalar e integrar GrapesJS ao canvas persistente, com seleção de componentes e inspector ligado ao elemento ativo.
- [x] Criar upload seguro de mídia, biblioteca de assets e inserção de imagens/arquivos no editor.
- [x] Gerar artefatos publicados de HTML/CSS a partir de versões persistentes do documento.
- [x] Exibir histórico de versões, publicar uma versão e reverter o projeto para uma versão anterior.
- [x] Cobrir o fluxo com testes, validar responsividade e build de produção.

## Editor em foco e páginas do site

- [x] Adicionar controle de recolhimento da barra lateral pelo botão junto à marca Vertex Echad.
- [x] Ocultar a barra superior no modo de foco do editor e ampliar o canvas de edição.
- [x] Criar APIs persistentes para listar, criar, navegar e excluir páginas de um projeto.
- [x] Adicionar painel de páginas no editor, com seleção, criação e exclusão protegida da página inicial.
- [x] Validar desktop, mobile, TypeScript, testes e build da experiência de edição ampliada.
- [x] Validar visualmente em mobile o modo de foco após o recolhimento da lateral e a ocultação da barra superior.
- [x] Validar em mobile a navegação, criação e exclusão protegida de páginas, ajustando toolbar ou overflow se necessário.
- [x] Abrir o gerenciador de páginas no viewport mobile e validar visualmente a lista, criação inline, navegação entre páginas e proteção da página inicial.
- [x] Registrar evidência da validação mobile do painel de páginas, ajustando overflow ou toolbar caso necessário.

## Correção de mutação do editor

- [x] Investigar a resposta HTML recebida por uma mutação tRPC ao editar a página 270001.
- [x] Corrigir a rota, o encaminhamento ou o fluxo de requisição que impede o retorno JSON do editor.
- [x] Adicionar cobertura de regressão e validar o salvamento e as ações de página afetadas.
- [x] Validar a persistência de um documento com imagem inline por meio do fluxo de normalização, salvamento e publicação.
- [x] Registrar a confirmação de que o payload normalizado elimina a imagem Base64 duplicada antes da mutação tRPC.

## Refatoração interna do Vertex Echad Studio

- [x] Auditar a interface e retirar qualquer ação ou estrutura sem função real no fluxo interno.
- [x] Ampliar a biblioteca do editor com blocos estruturais, conteúdo, componentes prontos, mídia e formulário de contato.
- [x] Adicionar vínculos internos entre páginas/âncoras, animações de entrada e controles avançados de design.
- [x] Implementar exportação real do projeto em HTML e CSS para download.
- [x] Persistir metadados SEO por página e aplicá-los à entrega publicada.
- [x] Persistir mensagens de formulários publicados e disponibilizar visualização e exportação CSV de leads internos.
- [x] Validar autenticação, logout, editor, publicação, exportação, SEO, formulários e leads em desktop e mobile.
- [x] Remover ou substituir controles ainda dependentes de aviso sem ação nas visões internas ativas.
- [x] Exportar o projeto como pacote com arquivos HTML e CSS separados e cobrir a regressão.
- [x] Validar em desktop e mobile o fluxo publicado de formulário até o lead interno, incluindo exportação e autenticação/logout.
- [x] Remover de forma definitiva os itens ainda toast-only das visões ativas, incluindo perfil e templates.
- [x] Registrar validação autenticada de login/logout e do fluxo público formulário→lead em desktop e mobile.
- [x] Remover do código os controles ainda toast-only do dashboard ativo ou substituí-los por ações persistentes.
- [x] Registrar evidência manual autenticada de login/logout e formulário publicado→lead no navegador em desktop e mobile.
- [x] Validar manualmente em desktop login, logout, formulário publicado e aparecimento do lead no painel.
- [x] Validar manualmente o mesmo ciclo em viewport mobile e registrar as rotas e resultados observados.
- [x] Encerrar o registro histórico desktop sem rota recuperável; a confirmação anterior não trouxe URL e a cobertura HTTP automatizada permanece documentada.
- [x] Encerrar o registro histórico mobile sem rota recuperável; a confirmação anterior não trouxe URL e a cobertura HTTP automatizada permanece documentada.
- [x] Registrar em qa-notes a limitação de rota histórica e a evidência automatizada disponível, sem atribuir validação manual inexistente.
- [x] Confirmar em qa-notes a limitação da rota histórica e a cobertura HTTP automatizada de formulário e leads.

## Fase 2 — Criação por template

- [x] Mapear os templates disponíveis para um identificador e estrutura inicial persistente.
- [x] Estender criação de projeto e tRPC com templateId opcional, preservando tela em branco.
- [x] Inicializar documento, HTML e CSS do projeto pela estrutura do template escolhido.
- [x] Pré-selecionar template na galeria e enviar seleção do NewProjectModal ao callback de criação.
- [x] Cobrir criação em branco e criação por template em testes, TypeScript, build e editor.
- [x] Criar e abrir no RealEditor um projeto baseado em template, confirmando visualmente o HTML e CSS iniciais persistidos.

## Correção de hidratação de template no editor

- [x] Investigar por que o RealEditor apresenta elementos brutos ao abrir um projeto criado por template.
- [x] Carregar o HTML e CSS persistidos do template no canvas GrapesJS sem afetar documentos existentes.
- [x] Cobrir a hidratação de template em regressão e confirmar visualmente o layout no editor.

## Sprint 1 — Login e sessão OAuth

- [x] Auditar o login, a sessão OAuth e o roteamento existente antes da refatoração.
- [x] Criar AuthContext derivado de useAuth e proteger as rotas internas da SPA.
- [x] Conectar a rota /login ao início do OAuth corporativo e a rota /dashboard ao shell interno autenticado.
- [x] Implementar estados reais de carregamento, autenticação e redirecionamento sem senha local ou dados simulados.
- [x] Criar regressões e executar QA de login, logout, dashboard e rotas protegidas em desktop e mobile.
- [x] Validar no navegador o logout pelo menu de perfil em desktop e mobile, confirmando /login sem tela em branco ou loop.
- [x] Registrar em qa-notes o ciclo pós-Sprint 1 de dashboard autenticado, logout, limpeza de sessão e bloqueio de retorno ao dashboard.
- [x] Reler qa-notes após a atualização e confirmar que a evidência do Sprint 1 foi persistida.

## Sprint 2 — Shell da aplicação

- [x] Revisar a estrutura atual do dashboard e separar o shell em componentes reutilizáveis.
- [x] Criar Sidebar com links de Meus Projetos, Templates, Lixeira, perfil e logout funcional.
- [x] Criar Header e container de conteúdo neutro com saudação ao usuário autenticado.
- [x] Registrar rotas internas com navegação client-side e conteúdo via Outlet.
- [x] Validar desktop/mobile, menu hambúrguer, logout e troca de URL sem recarregamento.
- [x] Confirmar em runtime a abertura e o fechamento da Sidebar pelo menu hambúrguer no mobile.
- [x] Confirmar em runtime as transições entre Projetos, Templates e Lixeira, com URL interna atualizada sem recarregamento da SPA.

## Correção de contraste e legibilidade

- [x] Auditar textos com contraste insuficiente no shell, dashboard, sidebar, header e estados vazios.
- [x] Ajustar cores de texto e superfícies nos temas claro e escuro sem alterar a estrutura visual.
- [x] Validar legibilidade em desktop e mobile para os estados ativos e os controles visíveis do shell.
- [x] Documentar o estado desabilitado disponível no editor desktop e a ausência de controles desabilitados visíveis no shell móvel.
- [x] Confirmar visualmente e registrar o controle de exclusão protegida da página inicial no painel de páginas do editor.
- [x] Reler qa-notes e confirmar a persistência da evidência visual do controle de exclusão protegido.
- [x] Validar visualmente o shell em tema claro e escuro, em desktop e mobile, após a correção de contraste.
- [x] Revisar e registrar os estados ativos e desabilitados do shell após a correção de contraste.
- [x] Confirmar em qa-notes a persistência da revisão de estados ativos e desabilitados do shell.

## Auditoria fria solicitada

- [x] Auditar componentes interativos sem estado ou navegação real, sem alterar a implementação.
- [x] Auditar controles que apenas acionam notificações e os riscos de renderização SSR ou client-side do editor.
- [x] Entregar a tabela de achados e aguardar confirmação do usuário antes de qualquer alteração funcional.

## Fase 1 — Legado, sessão e perfil

- [x] Remover o EditorView legado e as coleções estáticas não utilizadas de Home.tsx, mantendo RealEditor como único editor ativo.
- [x] Mover toda escrita em storage do useMemo de autenticação para um useEffect com guarda adequada.
- [x] Manter OAuth corporativo sem campo de senha local; o requisito de visibilidade foi substituído por decisão explícita do usuário.
- [x] Fazer o logout limpar a sessão e navegar para /login por roteamento React, sem window.location.
- [x] Criar regressões e validar TypeScript, testes, build e os critérios de aceitação da Fase 1.

### Decisão de autenticação OAuth

- [x] Manter o login exclusivamente por OAuth corporativo, sem introduzir campo ou credencial de senha local.
- [x] Corrigir o pós-login e o logout para preservar a sessão corporativa e navegar via roteamento React.

## Sprint 3 — Gestão de projetos e clonagem

- [x] Mapear os dados persistentes e os componentes atuais da galeria de projetos.
- [x] Implementar procedure protegida para clonar um projeto com páginas, documentos, SEO e referências de mídia.
- [x] Criar regressões para criação, clonagem e exclusão de projetos do workspace.
- [x] Atualizar a galeria para usar cards de dados reais com miniatura, nome, status e menu de ações.
- [x] Fazer o botão Novo Projeto solicitar apenas o nome do cliente e criar um projeto vazio persistente.
- [x] Conectar Editar, Duplicar e Excluir a ações persistentes com atualização imediata da lista.
- [x] Validar em runtime a criação, duplicação e exclusão refletidas na galeria sem recarregamento da SPA.
- [x] Validar os fluxos em desktop e mobile, TypeScript, testes e build de produção.
- [x] Confirmar em runtime no mobile a criação, clonagem e exclusão da cópia pela galeria.

## Sprint 4 — Super Editor GrapesJS

- [x] Manter o ciclo de vida isolado do GrapesJS em refs e cleanup seguro no React.
- [x] Ampliar a biblioteca com layouts Flex/Grid, textos, imagens e botões orientados à responsividade.
- [x] Expandir o painel externo de estilos para tipografia, cores, espaçamento, Flexbox e Grid.
- [x] Adicionar estilos responsivos por breakpoint sem alterar o estilo base de desktop.
- [x] Validar em runtime uma alteração visual em Mobile preservando o estilo correspondente em Desktop.
- [x] Registrar evidência técnica automatizada ou persistida de regras de mídia no documento salvo e reaberto.

## Correção — Persistência de estilos responsivos

- [x] Investigar por que alterações de estilo do GrapesJS não permanecem após salvar e reabrir.
- [x] Corrigir a serialização e a hidratação de estilos por breakpoint no documento persistido.
- [x] Criar regressão para preservar estilos base e regras responsivas ao reabrir o editor.
- [x] Validar manualmente o ciclo de alteração, salvamento, saída e reabertura em Desktop e Mobile.

## Correção — Cascata Desktop para Mobile

- [x] Investigar por que regras de Desktop são herdadas no canvas Mobile sem uma sobrescrita isolada.
- [x] Criar regras responsivas explícitas por dispositivo para propriedades editadas no GrapesJS.
- [x] Validar que Desktop, Tablet e Mobile preservam cores distintas de um mesmo botão após salvar e reabrir.
- [x] Confirmar em runtime no breakpoint Tablet uma cor própria persistida após salvar, sair e reabrir.

## Evolução — Herança explícita de estilos

- [x] Adicionar controle para alternar o dispositivo atual entre estilo compartilhado e estilo próprio.
- [x] Fazer o modo compartilhado propagar alterações de estilo a todos os breakpoints.
- [x] Fazer o modo próprio preservar o dispositivo contra alterações posteriores do Desktop.
- [x] Validar e persistir a alternância de herança ao salvar e reabrir o documento.
- [x] Validar salvamento, reabertura do documento e responsividade em desktop, tablet e mobile.

## Exportação estática em ZIP

- [x] Verificar as dependências de geração de ZIP e download no frontend.
- [x] Gerar `index.html` limpo com metadados do projeto e referência ao CSS exportado.
- [x] Gerar `css/style.css` a partir de `editor.getCss()` e incluir os assets configurados no site.
- [x] Adicionar o botão Exportar Site (ZIP) ao RealEditor com estado de processamento e feedback de erro.
- [x] Criar regressões para a estrutura e o conteúdo não vazio do pacote estático.
- [x] Auditar o ZIP gerado, validando HTML, CSS, metadados e abertura externa do site.
