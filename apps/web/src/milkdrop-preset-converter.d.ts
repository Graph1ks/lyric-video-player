declare module "milkdrop-preset-converter" {
  export function convertPreset(source: string): Promise<Record<string, unknown>>;
}
