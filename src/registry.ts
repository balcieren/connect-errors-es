import { ErrorDefinition } from "./types.js";

const registry = new Map<string, ErrorDefinition>();

export function register(def: ErrorDefinition): void {
  registry.set(def.code, def);
}

export function registerAll(defs: ErrorDefinition[]): void {
  for (const def of defs) {
    register(def);
  }
}

export function lookup(code: string): ErrorDefinition | undefined {
  return registry.get(code);
}

// For testing purposes
export function clearRegistry(): void {
  registry.clear();
}
