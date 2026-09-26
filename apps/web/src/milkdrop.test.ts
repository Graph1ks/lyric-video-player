import { describe, expect, it } from "vitest";
import {
  extractMilkdropTextureReferences,
  resolveMilkdropTextures,
} from "./milkdrop";
import { TYPOGRAPHY_FONTS } from "./typographyFonts";

describe("MilkDrop client compatibility helpers", () => {
  it("extracts custom shader samplers while ignoring Butterchurn built-ins", () => {
    const refs = extractMilkdropTextureReferences([
      "sampler sampler_main;",
      "sampler sampler_noise_lq;",
      "sampler sampler_pw_foo_texture;",
      "sampler sampler_fc_bar;",
    ].join("\n"));

    expect(refs).toEqual(["bar", "foo_texture"]);
  });

  it("resolves texture names case-insensitively and reports missing references", () => {
    const textures = [{
      id: "1234567890abcdef",
      name: "Foo_Texture",
      fileName: "Foo_Texture.PNG",
      relativePath: "pack/Foo_Texture.PNG",
      size: 10,
      modifiedMs: 1,
    }];

    const result = resolveMilkdropTextures(["foo_texture", "missing"], textures);
    expect(result.resolved.map(item => item.sampler)).toEqual(["foo_texture"]);
    expect(result.missing).toEqual(["missing"]);
  });
});

describe("lyric font catalog", () => {
  it("covers distinct typographic categories without network font loading", () => {
    expect(TYPOGRAPHY_FONTS.length).toBeGreaterThanOrEqual(7);
    expect(new Set(TYPOGRAPHY_FONTS.map(font => font.category))).toEqual(new Set([
      "sans",
      "display",
      "condensed",
      "serif",
      "mono",
      "handwritten",
      "graphic",
    ]));
  });
});
