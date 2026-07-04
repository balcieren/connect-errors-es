import { ErrorDefinition } from "./types";

const registry = new Map<string, ErrorDefinition>();

export function register(def: ErrorDefinition): void {
  if (!def.errorCode) {
    return;
  }
  registry.set(def.errorCode, def);
}

export function registerAll(defs: ErrorDefinition[]): void {
  for (const def of defs) {
    register(def);
  }
}

export function lookup(code: string): ErrorDefinition | undefined {
  return registry.get(code);
}

export function codes(): string[] {
  const result = Array.from(registry.keys());
  result.sort();
  return result;
}

// For testing purposes
export function clearRegistry(): void {
  registry.clear();
}
