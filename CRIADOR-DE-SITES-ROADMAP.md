# Roteiro para transformar o protótipo em um criador de sites funcional

## Diagnóstico executivo

O projeto atual já possui uma **boa casca de produto**: dashboard, biblioteca de templates, editor visual, drag-and-drop inicial, dark mode, filtros, tags, preview, exportação local, login demonstrativo e menu de perfil. O ponto central é que o editor ainda não trabalha com um documento de site real. Hoje, ele altera principalmente um estado local de componentes e apresenta uma simulação visual; ainda não existe um modelo persistente de páginas, uma API para salvar mudanças, um sistema completo de seleção e layout, nem um pipeline de publicação.

> A mudança mais importante não é adicionar mais botões ao dashboard. É substituir o canvas demonstrativo por um **motor de edição baseado em documento**, com nós, estilos, assets, histórico e publicação.

A arquitetura também precisa mudar. O projeto é atualmente frontend-only, enquanto um criador de sites precisa de backend, banco de dados, armazenamento de arquivos e autenticação confiável. O login atual com credencial local deve ser tratado apenas como protótipo e removido antes de qualquer uso real.

## O que existe e o que ainda falta

| Área | Estado atual | O que precisa existir para ser funcional |
|---|---|---|
| Login | Formulário e sessão local no navegador | Autenticação real, sessões seguras, permissões e recuperação de acesso |
| Dashboard | Dados e ações demonstrativas | Projetos e atividade vindos de uma API persistente |
| Canvas | Blocos podem ser inseridos e arrastados de forma limitada | Seleção, posição, nesting, resize, reordenação, responsividade e edição de propriedades |
| Inspector | Painéis visuais de tipografia, cores e espaçamento | Controles vinculados ao nó selecionado e ao documento salvo |
| Undo/redo | Histórico local limitado de blocos | Histórico transacional de operações, persistente por sessão de edição |
| Tags | Chips, criação e filtros locais | Tags persistentes no banco, escopo por workspace e filtros compartilháveis |
| Assets | Tiles demonstrativos | Upload real, armazenamento, metadados, otimização e seleção no editor |
| Preview | Renderização local do mockup | Preview baseado no mesmo documento salvo que será publicado |
| Exportação | Geração simplificada de HTML local | Build reproduzível de HTML/CSS/assets, publicação e rollback |
| Formulários | Dados estáticos | Form builder, validação, armazenamento e consulta das respostas |
| Colaboração | Não implementada | Perfis, permissões, lock/merge e histórico por colaborador |

## Arquitetura recomendada

### Camada de produto

Manter o React como shell da aplicação, mas separar claramente três partes: **workspace**, **editor** e **runtime publicado**. O workspace gerencia projetos, páginas, assets, tags e versões. O editor manipula um documento em memória e emite operações. O runtime publicado apenas renderiza a versão publicada, sem carregar toda a lógica do editor.

### Motor do editor

Para chegar a um MVP funcional com menor risco, usar um motor de editor baseado em componentes, como o GrapesJS, integrado ao shell visual existente. O GrapesJS pode assumir a parte difícil de seleção, árvore de componentes, drag-and-drop, traits e serialização, enquanto a aplicação mantém sua própria navegação, autenticação, projetos, permissões e persistência.

Uma alternativa é construir um motor próprio sobre `dnd-kit` ou APIs nativas. Essa opção oferece mais controle, mas exige implementar árvore de nós, regras de drop, seleção, resize, teclado, clipboard, histórico, sincronização e serialização. Para o projeto atual, essa alternativa só deve ser escolhida se houver requisitos visuais que um motor existente não consiga atender.

### Backend e infraestrutura

Como o criador precisa salvar documentos, usuários e arquivos, o projeto deve ser convertido de frontend-only para full-stack. A base recomendada é um backend Node/Express com PostgreSQL para dados estruturados e object storage para imagens, vídeos e arquivos. O navegador deve conversar com a API; não deve gravar o documento final diretamente em `localStorage` como fonte oficial.

| Componente | Responsabilidade |
|---|---|
| React + editor engine | Interface, canvas, inspector, operações e preview |
| Backend Node/Express | Autenticação, autorização, CRUD, autosave e publicação |
| PostgreSQL/ORM | Usuários, workspaces, projetos, páginas, nós, estilos, tags e versões |
| Object storage | Imagens, fontes, vídeos, documentos e arquivos exportados |
| Job de publicação | Geração de build, validação de assets e disponibilização da versão |
| Analytics/logs | Erros de editor, falhas de publicação e auditoria de ações |

## Modelo de dados mínimo

O editor precisa salvar uma representação estruturada, não apenas HTML solto. Um modelo inicial pode ser organizado assim:

| Entidade | Campos essenciais |
|---|---|
| `User` | `id`, `email`, `name`, `role`, `status`, `createdAt` |
| `Workspace` | `id`, `name`, `settings`, `createdAt` |
| `WorkspaceMember` | `workspaceId`, `userId`, `permission` |
| `Project` | `id`, `workspaceId`, `name`, `slug`, `status`, `tags`, `createdBy` |
| `Page` | `id`, `projectId`, `name`, `path`, `draftVersionId`, `publishedVersionId` |
| `DocumentVersion` | `id`, `pageId`, `schema`, `createdBy`, `createdAt`, `message` |
| `Asset` | `id`, `workspaceId`, `key`, `url`, `mimeType`, `width`, `height`, `size` |
| `Tag` | `id`, `workspaceId`, `name`, `color`, `createdBy` |
| `Form` | `id`, `pageId`, `fields`, `settings` |
| `FormSubmission` | `id`, `formId`, `payload`, `createdAt`, `status` |

O campo `schema` deve conter a árvore de componentes e seus estilos. Uma estrutura simplificada seria:

```json
{
  "type": "page",
  "children": [
    {
      "id": "section-1",
      "type": "section",
      "props": { "background": "#f5f5f7" },
      "styles": { "paddingTop": 96, "paddingBottom": 96 },
      "children": [
        {
          "id": "heading-1",
          "type": "heading",
          "props": { "text": "Forma antes da superfície." },
          "styles": { "fontSize": 64, "color": "#1d1d1f" },
          "children": []
        }
      ]
    }
  ]
}
```

O HTML publicado deve ser uma saída do schema. Não usar o HTML publicado como única fonte de verdade, porque isso dificulta migrações, histórico, validação e edição posterior.

## MVP recomendado do criador

O primeiro MVP deve ser deliberadamente limitado. É melhor ter seis componentes confiáveis do que dezenas de blocos que quebram em responsividade.

| Ordem | Entrega | Critério de aceite |
|---:|---|---|
| 1 | Documento e árvore de componentes | Abrir uma página carrega um schema real com IDs estáveis |
| 2 | Canvas com seleção | Clicar em um elemento mostra sua seleção e atualiza o inspector |
| 3 | Componentes básicos | Seção, container, título, texto, imagem e botão são inseríveis |
| 4 | Reordenação | Arrastar um bloco muda a posição na árvore e no canvas |
| 5 | Inspector conectado | Alterar texto, cor, tipografia, espaçamento e alinhamento atualiza o nó |
| 6 | Responsividade | Desktop, tablet e mobile possuem valores editáveis e previsíveis |
| 7 | Undo/redo | Cada operação relevante pode ser desfeita e refeita |
| 8 | Autosave | Alterações são salvas após debounce, com estado de erro e retry |
| 9 | Preview | O preview usa o mesmo documento que o canvas e não mostra controles de edição |
| 10 | Publicação | O usuário publica uma versão, vê o status e consegue voltar à anterior |

## Ordem de implementação

### Fase 1 — Fundação full-stack

Converter o projeto para full-stack, adicionar autenticação real e definir o schema do banco. Remover a credencial hardcoded do código. Criar endpoints protegidos para listar projetos, abrir páginas, salvar versões, consultar assets e verificar permissões.

### Fase 2 — Documento e persistência

Criar o modelo de documento, carregar o schema ao abrir o editor e salvar versões. Implementar debounce de autosave, indicador “salvando”, “salvo” e “erro ao salvar”, além de retry. O salvamento manual e o autosave devem chamar o mesmo serviço de persistência.

### Fase 3 — Motor de edição

Integrar o editor engine ou construir a primeira árvore própria. Implementar seleção, inserção, reordenação, nesting, delete, duplicação, teclado e undo/redo. Cada mudança deve ser uma operação serializável, para que o histórico não dependa apenas de snapshots frágeis.

### Fase 4 — Inspector e responsividade

Conectar os painéis visuais ao nó selecionado. Começar por texto, cores, tipografia, espaçamento e alinhamento. Em seguida, adicionar valores por breakpoint e regras para evitar layouts impossíveis ou estilos inválidos.

### Fase 5 — Assets e formulários

Adicionar upload real para object storage, biblioteca de assets, seleção de imagem e metadados. Em paralelo, transformar o bloco de formulário em um componente configurável, com campos, validação, armazenamento de submissões e área interna para consulta.

### Fase 6 — Preview e publicação

Gerar o preview a partir do schema atual. Criar um job de publicação que valida o documento, resolve assets, gera HTML/CSS e disponibiliza uma versão identificada. Exibir status de fila, sucesso, erro e rollback. Não considerar “exportar um Blob no navegador” como publicação de produção.

### Fase 7 — Operação interna

Adicionar permissões por workspace, auditoria, histórico de versões, tags no banco, compartilhamento de revisão, proteção contra edição concorrente e observabilidade de falhas.

## O que não deve ser prioridade agora

Não investir primeiro em novas métricas do dashboard, animações decorativas, dezenas de templates, integrações de marketing ou refinamentos cosméticos. Essas áreas só terão valor depois que o usuário conseguir abrir um projeto, editar uma página, salvar, visualizar, publicar e recuperar uma versão anterior sem perder trabalho.

## Critérios para considerar o criador realmente funcional

O produto estará em um primeiro nível funcional quando um colaborador puder fazer o seguinte fluxo sem intervenção técnica: entrar com uma conta real, criar um projeto, adicionar componentes, mover e editar os componentes, trocar a imagem, alternar entre desktop/tablet/mobile, desfazer uma alteração, fechar e reabrir o projeto com o estado preservado, abrir o preview, publicar uma versão e recuperar a versão anterior.

Esse fluxo deve funcionar com dados reais, não apenas com toasts. Cada falha de rede precisa deixar o usuário sabendo se a alteração foi salva, está pendente ou precisa ser tentada novamente.

## Próximo passo recomendado

O próximo passo prático é implementar a **Fase 1 e a Fase 2 juntas**: habilitar o backend full-stack, remover a autenticação local hardcoded, criar o modelo `Project/Page/DocumentVersion/Asset` e salvar um primeiro schema real. Depois disso, integrar o motor de editor ao schema, em vez de continuar aumentando o número de botões demonstrativos.

> Se você quiser, a próxima entrega pode ser a primeira versão do **editor MVP real**, começando por árvore de componentes, seleção, drag-and-drop, inspector conectado e autosave.

## Referências

Este roteiro foi produzido a partir do estado atual do projeto `website-conteudo`, do código existente e dos requisitos já definidos para o portal interno. Não foram usadas fontes externas nesta avaliação.
