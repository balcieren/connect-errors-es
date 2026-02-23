import { M } from "./types";

export class MissingFieldError extends Error {
  template: string;
  missing: string[];

  constructor(template: string, missing: string[]) {
    super(`Missing template fields: ${missing.join(", ")}`);
    this.name = "MissingFieldError";
    this.template = template;
    this.missing = missing;
  }
}

export function templateFields(tpl: string): string[] {
  const matches = tpl.match(/\{\{([^{}]+)\}\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.slice(2, -2))));
}

export function validateTemplate(tpl: string, data?: M): void {
  const fields = templateFields(tpl);
  if (fields.length === 0) return;

  const missing: string[] = [];
  const safeData = data || {};

  for (const field of fields) {
    if (!(field in safeData)) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw new MissingFieldError(tpl, missing);
  }
}

export function formatTemplate(tpl: string, data?: M): string {
  if (!data) return tpl;
  return tpl.replace(/\{\{([^{}]+)\}\}/g, (_, key) => {
    return key in data ? data[key] : `{{${key}}}`;
  });
}
