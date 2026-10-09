export const PROJECT_TEMPLATE_IDS = ["editorial", "portfolio", "manifesto"] as const;

export type ProjectTemplateId = (typeof PROJECT_TEMPLATE_IDS)[number];

export type ProjectTemplateDocument = {
  schema: {
    kind: "vertex-template-document";
    schemaVersion: 1;
    templateId: ProjectTemplateId;
    blocks: string[];
  };
  html: string;
  css: string;
};

const sharedCss = `
  *{box-sizing:border-box}body{margin:0;font-family:Inter,Arial,sans-serif;color:#172033;background:#fff}
  .vertex-template{min-height:100vh}.vertex-template__inner{width:min(1120px,calc(100% - 48px));margin:0 auto}
  .vertex-template__button{display:inline-block;padding:13px 18px;border-radius:8px;background:#172033;color:#fff;text-decoration:none;font-weight:700}
  .vertex-template__eyebrow{font-size:12px;letter-spacing:.14em;font-weight:800;text-transform:uppercase}
`;

export function isProjectTemplateId(value: string | undefined): value is ProjectTemplateId {
  return Boolean(value && (PROJECT_TEMPLATE_IDS as readonly string[]).includes(value));
}

export function createProjectTemplateDocument(templateId: ProjectTemplateId, projectName: string): ProjectTemplateDocument {
  if (templateId === "editorial") {
    return {
      schema: { kind: "vertex-template-document", schemaVersion: 1, templateId, blocks: ["header", "hero", "editorial-grid", "footer"] },
      html: `<main class="vertex-template vertex-editorial"><section class="vertex-editorial__hero"><div class="vertex-template__inner"><span class="vertex-template__eyebrow">Estúdio editorial</span><h1>${projectName}</h1><p>Uma base editorial para apresentar ideias, coleções e projetos com clareza.</p><a class="vertex-template__button" href="#projetos">Ver projetos</a></div></section><section id="projetos" class="vertex-editorial__grid"><div class="vertex-template__inner"><article><span>01</span><h2>Projeto em destaque</h2><p>Substitua esta área por uma narrativa visual do projeto.</p></article><article><span>02</span><h2>Processo e intenção</h2><p>Use blocos, imagens e vínculos internos para continuar a construção.</p></article></div></section></main>`,
      css: `${sharedCss}.vertex-editorial__hero{padding:128px 0 88px;background:#f4f6fb}.vertex-editorial__hero h1{max-width:850px;margin:24px 0;font-size:clamp(56px,10vw,128px);line-height:.9;letter-spacing:-.065em}.vertex-editorial__hero p{max-width:520px;font-size:19px;line-height:1.6;color:#566177}.vertex-editorial__grid{padding:56px 0 96px}.vertex-editorial__grid>div{display:grid;grid-template-columns:repeat(2,1fr);gap:22px}.vertex-editorial__grid article{padding:36px;background:#172033;color:#fff;border-radius:14px}.vertex-editorial__grid article+article{background:#dce5ff;color:#172033}.vertex-editorial__grid span{font-weight:800;color:#79a0ff}@media(max-width:700px){.vertex-editorial__grid>div{grid-template-columns:1fr}}`,
    };
  }

  if (templateId === "portfolio") {
    return {
      schema: { kind: "vertex-template-document", schemaVersion: 1, templateId, blocks: ["navigation", "portfolio-hero", "work-list", "contact"] },
      html: `<main class="vertex-template vertex-portfolio"><header class="vertex-portfolio__nav"><div class="vertex-template__inner"><strong>${projectName}</strong><a href="#contato">Contato</a></div></header><section class="vertex-portfolio__hero"><div class="vertex-template__inner"><span class="vertex-template__eyebrow">Portfólio</span><h1>Trabalho com forma, função e presença.</h1></div></section><section class="vertex-portfolio__work"><div class="vertex-template__inner"><article><span>Projeto 01</span><h2>Uma seleção para começar</h2></article><article><span>Projeto 02</span><h2>Adicione suas próximas histórias</h2></article></div></section><footer id="contato" class="vertex-portfolio__footer"><div class="vertex-template__inner"><h2>Vamos conversar?</h2><a class="vertex-template__button" href="mailto:contato@exemplo.com">Enviar mensagem</a></div></footer></main>`,
      css: `${sharedCss}.vertex-portfolio{background:#f7f4ef}.vertex-portfolio__nav{padding:22px 0;border-bottom:1px solid #d8d0c3}.vertex-portfolio__nav>div{display:flex;justify-content:space-between}.vertex-portfolio__nav a{color:inherit}.vertex-portfolio__hero{padding:120px 0 72px}.vertex-portfolio__hero h1{max-width:900px;font-size:clamp(48px,9vw,110px);line-height:.94;letter-spacing:-.055em}.vertex-portfolio__work{padding:24px 0 100px}.vertex-portfolio__work>div{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}.vertex-portfolio__work article{min-height:310px;padding:30px;display:flex;flex-direction:column;justify-content:flex-end;background:#c9b69d;border-radius:12px}.vertex-portfolio__work article+article{background:#34302d;color:#fff}.vertex-portfolio__footer{padding:80px 0;background:#eae2d4}.vertex-portfolio__footer h2{font-size:clamp(38px,6vw,72px);margin:0 0 24px}@media(max-width:700px){.vertex-portfolio__work>div{grid-template-columns:1fr}}`,
    };
  }

  return {
    schema: { kind: "vertex-template-document", schemaVersion: 1, templateId, blocks: ["manifesto-hero", "statement", "call-to-action"] },
    html: `<main class="vertex-template vertex-manifesto"><section class="vertex-manifesto__hero"><div class="vertex-template__inner"><span class="vertex-template__eyebrow">Manifesto</span><h1>${projectName}</h1><p>Nós criamos sistemas visuais para dar direção ao que importa.</p><a class="vertex-template__button" href="#manifesto">Ler a ideia</a></div></section><section id="manifesto" class="vertex-manifesto__statement"><div class="vertex-template__inner"><p>Uma marca não precisa falar mais alto. Precisa ter algo claro a dizer.</p></div></section></main>`,
    css: `${sharedCss}.vertex-manifesto{background:#fff;color:#111}.vertex-manifesto__hero{padding:144px 0 112px;background:#f2f0eb}.vertex-manifesto__hero h1{margin:20px 0;font-size:clamp(60px,12vw,148px);line-height:.84;letter-spacing:-.075em}.vertex-manifesto__hero p{max-width:570px;font-size:22px;line-height:1.45}.vertex-manifesto__statement{padding:120px 0;background:#111;color:#fff}.vertex-manifesto__statement p{max-width:900px;margin:0;font-size:clamp(34px,6vw,76px);line-height:1.05;letter-spacing:-.04em}`,
  };
}
