export function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / Math.max(0.000001, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function easeOutCubic(t: number) {
  const x = 1 - clamp(t);
  return 1 - x * x * x;
}

export function easeOutExpo(t: number) {
  const x = clamp(t);
  return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export function easeOutBack(t: number, overshoot = 1.70158) {
  const x = clamp(t) - 1;
  return 1 + (overshoot + 1) * x * x * x + overshoot * x * x;
}

export function easeOutElastic(t: number) {
  const x = clamp(t);
  if (x === 0 || x === 1) return x;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

export function dampedPulse(age: number, frequency = 9, decay = 7) {
  if (age < 0) return 0;
  return Math.exp(-age * decay) * Math.sin(age * frequency);
}

export function hash01(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
