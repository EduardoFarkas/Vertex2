export type ProjectTemplateId = "editorial" | "portfolio" | "manifesto";

export function toProjectCreateInput(name: string, templateId?: ProjectTemplateId) {
  return templateId ? { name, templateId } : { name };
}
