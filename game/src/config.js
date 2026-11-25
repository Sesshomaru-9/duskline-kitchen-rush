// Duskline Kitchen Rush — shared constants: layout, ingredients, recipes, difficulty.
// One job: the numbers every other module reads, so tuning never touches logic.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const SHIFT_SECONDS = 150;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 3;
export const INTERACT_RANGE = 100;
export const CHEF_SPEED = 290;
export const CHEF_RADIUS = 22;

/** The kitchen floor the chef walks on (stations sit around its edges). */
export const FLOOR = { x: 16, y: 168, width: 1248, height: 428 };

/** Ingredient catalogue. kind: raw bin item, chopped/cooked results, or garnish. */
export const INGREDIENTS = {
  bun: { name: 'Bun', color: '#e8b25c', dark: '#b97f2e', shape: 'bun' },
  patty: { name: 'Patty', color: '#c96f4a', dark: '#8a3f22', shape: 'patty' },
  pattyCooked: { name: 'Grilled Patty', color: '#7a4a28', dark: '#4c2a12', shape: 'patty' },
  lettuce: { name: 'Lettuce', color: '#7dc242', dark: '#4a7d22', shape: 'leaf' },
  lettuceChopped: { name: 'Chopped Lettuce', color: '#8fd14f', dark: '#4a7d22', shape: 'leaf' },
  tomato: { name: 'Tomato', color: '#e5484d', dark: '#a11f24', shape: 'tomato' },
  tomatoChopped: { name: 'Chopped Tomato', color: '#f2665e', dark: '#a11f24', shape: 'tomato' },
  cheese: { name: 'Cheese', color: '#ffc93c', dark: '#d99400', shape: 'cheese' },
  onion: { name: 'Onion', color: '#e8dff5', dark: '#9a7fc0', shape: 'onion' },
  onionChopped: { name: 'Chopped Onion', color: '#f2ecfa', dark: '#9a7fc0', shape: 'onion' },
  potato: { name: 'Potato', color: '#d9a05b', dark: '#96682e', shape: 'potato' },
  fries: { name: 'Golden Fries', color: '#ffd34d', dark: '#c78d12', shape: 'fries' },
  egg: { name: 'Egg', color: '#fdf6e3', dark: '#c9b489', shape: 'egg' },
  eggCooked: { name: 'Fried Egg', color: '#fff7d6', dark: '#e8a13c', shape: 'egg' },
  sauce: { name: 'Dusk Sauce', color: '#d63c2f', dark: '#7d150c', shape: 'sauce' },
  burnt: { name: 'Burnt!', color: '#2b2b2b', dark: '#000000', shape: 'burnt' },
};

/** What the chopping board turns a raw item into, and how long it takes. */
export const CHOP = {
  lettuce: { into: 'lettuceChopped', seconds: 2.2 },
  tomato: { into: 'tomatoChopped', seconds: 2.2 },
  onion: { into: 'onionChopped', seconds: 2.2 },
};

/** What a stove burner turns a raw item into, how long to cook, and the burn grace. */
export const COOK = {
  patty: { into: 'pattyCooked', seconds: 6, burnAfter: 6 },
  egg: { into: 'eggCooked', seconds: 5, burnAfter: 6 },
  potato: { into: 'fries', seconds: 7, burnAfter: 6 },
};

/** The menu. Recipes unlock as the days (shifts) go on. */
export const RECIPES = [
  { id: 'salad', name: 'Garden Salad', needs: ['lettuceChopped', 'tomatoChopped'], price: 8, day: 1, color: '#7dc242' },
  { id: 'fries', name: 'Golden Fries', needs: ['fries', 'sauce'], price: 9, day: 1, color: '#ffd34d' },
  { id: 'melt', name: 'Cheese Melt', needs: ['bun', 'pattyCooked', 'cheese'], price: 12, day: 1, color: '#ffc93c' },
  { id: 'burger', name: 'Duskline Burger', needs: ['bun', 'pattyCooked', 'lettuceChopped', 'tomatoChopped', 'cheese'], price: 18, day: 2, color: '#e8b25c' },
  { id: 'omelette', name: 'Sunrise Omelette', needs: ['eggCooked', 'cheese', 'onionChopped'], price: 14, day: 2, color: '#fff7d6' },
  { id: 'platter', name: 'Duskline Platter', needs: ['bun', 'pattyCooked', 'fries', 'onionChopped', 'sauce'], price: 22, day: 3, color: '#d63c2f' },
];

/** Difficulty per day: order patience, spawn gap, and which recipes may appear. */
export function dayTuning(day) {
  return {
    patience: Math.max(32, 52 - (day - 1) * 5),
    spawnGap: Math.max(8, 16 - (day - 1) * 3),
    recipes: RECIPES.filter((r) => r.day <= day),
  };
}

/** Station rectangles on the 1280x720 floor. */
export const STATIONS = {
  board: { kind: 'board', label: 'CHOPPING BOARD', x: 40, y: 196, width: 220, height: 84 },
  stove: { kind: 'stove', label: 'STOVE', x: 40, y: 336, width: 220, height: 128 },
  plates: { kind: 'plates', label: 'ASSEMBLY COUNTER', x: 896, y: 260, width: 344, height: 244 },
  serve: { kind: 'serve', label: 'SERVE WINDOW', x: 720, y: 64, width: 544, height: 88 },
  trash: { kind: 'trash', label: 'TRASH', x: 1096, y: 612, width: 168, height: 88 },
};

/** Ingredient bins along the bottom counter, in serving order. */
export const BIN_ITEMS = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'onion', 'potato', 'egg', 'sauce'];
export const BINS = BIN_ITEMS.map((item, i) => ({
  kind: 'bin', item, label: INGREDIENTS[item].name.toUpperCase(),
  x: 16 + i * 120, y: 612, width: 112, height: 88,
}));

export const BEST_KEY = 'duskline-kitchen-rush-best';
