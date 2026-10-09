import { parseFragment, serialize } from "parse5";
import postcss from "postcss";

type NodeLike = { nodeName: string; tagName?: string; attrs?: Array<{ name: string; value: string }>; childNodes?: NodeLike[] };

const allowedTags = new Set(("a abbr article aside b blockquote br button caption code col colgroup dd del details div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr i img input label legend li main nav ol option p picture pre section select small source span strong sub summary sup table tbody td textarea tfoot th thead tr u ul video audio track").split(" "));
const dropTags = new Set(["script", "style", "iframe", "frame", "frameset", "object", "embed", "applet", "svg", "math", "template", "noscript", "foreignobject"]);
const safeAttributes = new Set(("id class title role lang dir tabindex alt width height loading decoding href src target rel type name value placeholder required disabled checked selected for rows cols colspan rowspan method accept controls poster loop muted autoplay playsinline data-vertex-lead-form data-vertex-form-id data-vertex-form-status").split(" "));
const safeUrl = (value: string) => {
  const normalized = value.trim().replace(/[\u0000-\u0020\u007f]/g, "").toLowerCase();
  if (!normalized || normalized.startsWith("//")) return false;
  return normalized.startsWith("#") || normalized.startsWith("/") || normalized.startsWith("./") || normalized.startsWith("../") || /^(https?:|mailto:|tel:)/.test(normalized);
};

export function sanitizePublishedUrl(value: string) {
  return safeUrl(value) ? value.trim() : null;
}

export function sanitizePublishedHtml(input: string) {
  const fragment = parseFragment(input.slice(0, 1_000_000)) as unknown as NodeLike;
  const cleanChildren = (parent: NodeLike) => {
    parent.childNodes = (parent.childNodes ?? []).flatMap((node) => {
      const tag = node.tagName?.toLowerCase();
      if (tag && dropTags.has(tag)) return [];
      if (tag && !allowedTags.has(tag)) {
        cleanChildren(node);
        return node.childNodes ?? [];
      }
      if (tag) {
        node.attrs = (node.attrs ?? []).filter(({ name, value }) => {
          const key = name.toLowerCase();
          if (key.startsWith("on") || key === "style" || key === "srcdoc" || key === "formaction" || key === "xlink:href") return false;
          if (key.startsWith("aria-") || key.startsWith("data-vertex-")) return true;
          if (!safeAttributes.has(key)) return false;
          if (["href", "src", "poster"].includes(key)) return safeUrl(value);
          if (key === "target") return value === "_blank" || value === "_self";
          return true;
        });
        if (node.attrs.some((attr) => attr.name === "target" && attr.value === "_blank")) {
          const rel = node.attrs.find((attr) => attr.name === "rel");
          if (rel) rel.value = "noopener noreferrer";
          else node.attrs.push({ name: "rel", value: "noopener noreferrer" });
        }
      }
      cleanChildren(node);
      return [node];
    });
  };
  cleanChildren(fragment);
  return serialize(fragment as Parameters<typeof serialize>[0]);
}

const forbiddenCssValue = /(?:javascript\s*:|vbscript\s*:|expression\s*\(|-moz-binding|behavior\s*:|data\s*:\s*text\/html|[<>\\])/i;
const allowedAtRules = new Set(["media", "supports", "keyframes", "-webkit-keyframes", "font-face", "layer"]);

export function sanitizePublishedCss(input: string) {
  if (!input || input.length > 1_000_000) return "";
  try {
    const root = postcss.parse(input, { from: undefined });
    root.walkAtRules((rule) => {
      if (!allowedAtRules.has(rule.name.toLowerCase()) || forbiddenCssValue.test(rule.params)) rule.remove();
    });
    root.walkRules((rule) => { if (forbiddenCssValue.test(rule.selector)) rule.remove(); });
    root.walkDecls((declaration) => {
      const value = declaration.value;
      if (forbiddenCssValue.test(value)) { declaration.remove(); return; }
      const urls = value.match(/url\s*\(([^)]*)\)/gi) ?? [];
      for (const url of urls) {
        const argument = url.replace(/^url\s*\(/i, "").replace(/\)$/, "").trim().replace(/^(["'])(.*)\1$/, "$2");
        if (!safeUrl(argument)) { declaration.remove(); return; }
      }
    });
    return root.toString().replace(/<\/style/gi, "");
  } catch {
    // CSS inválido não é publicado: falha segura sem servir markup/style parcial.
    return "";
  }
}
