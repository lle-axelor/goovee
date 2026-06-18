// Deterministic visual style for product categories — derives a hue (0-359)
// and an emoji from the category name. Categories have no visual metadata in
// Axelor, so we hash the name to get a stable colour/emoji per category.

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

export function getCategoryHue(name: string | null | undefined): number {
  if (!name) return 215; // royal blue fallback
  return djb2(name) % 360;
}

// Keyword → emoji map. Falls back to 📦 for unknown categories.
const EMOJI_RULES: Array<[RegExp, string]> = [
  [/vanne|valve/i, '🔧'],
  [/compresseur|compressor|pump|pompe/i, '⚙️'],
  [/automate|controller|control|plc/i, '🎛️'],
  [/capteur|sensor|measure|mesure/i, '📡'],
  [/moteur|motor|engine/i, '🔩'],
  [/cable|câble|wire|connector|connecteur/i, '🔌'],
  [/tube|tuyau|hose|pipe/i, '🪈'],
  [/filtre|filter/i, '🧴'],
  [/eclairage|éclairage|lighting|lamp|lampe/i, '💡'],
  [/secur|sécur|safety|protection/i, '🛡️'],
  [/outil|tool/i, '🛠️'],
  [/piece|pièce|spare|consommable|consumable/i, '🔧'],
  [/service|maintenance/i, '🧰'],
  [/livre|book|document/i, '📘'],
  [/electronique|électronique|electronic/i, '🔋'],
];

export function getCategoryEmoji(name: string | null | undefined): string {
  if (!name) return '📦';
  for (const [re, emoji] of EMOJI_RULES) {
    if (re.test(name)) return emoji;
  }
  return '📦';
}

export function getCategoryGradient(hue: number): string {
  return `
    radial-gradient(circle at 30% 30%, hsla(${hue}, 55%, 75%, 0.5), transparent 60%),
    linear-gradient(135deg, hsl(${hue}, 30%, 88%) 0%, hsl(${(hue + 20) % 360}, 30%, 72%) 100%)
  `;
}
