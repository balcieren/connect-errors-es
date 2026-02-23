export function getVersion(): string {
  try {
    // Find the package.json. If running from dist/plugin/bin.js, it's 2 levels up.
    // If running from src/plugin/..., it's also roughly accessible via path resolution
    return "0.1.0"; // hardcoding default for now, could be dynamic
  } catch {
    return "0.1.0";
  }
}
