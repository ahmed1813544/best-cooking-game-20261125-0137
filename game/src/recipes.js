// The Golden Ladle — recipes and ingredients.
// Every dish on the menu, what it is made of, and what each ingredient needs
// before it can go on the plate. All names, dishes and prices are original.

export const INGREDIENTS = {
  bun:     { name: 'Bun',      icon: '🍞', key: '1', prep: 'none',  color: '#e8b04b' },
  patty:   { name: 'Patty',    icon: '🥩', key: '2', prep: 'grill', color: '#a85b32' },
  lettuce: { name: 'Lettuce',  icon: '🥬', key: '3', prep: 'chop',  color: '#5da24a' },
  tomato:  { name: 'Tomato',   icon: '🍅', key: '4', prep: 'chop',  color: '#d94f3d' },
  cheese:  { name: 'Cheese',   icon: '🧀', key: '5', prep: 'none',  color: '#f2c531' },
  onion:   { name: 'Onion',    icon: '🧅', key: '6', prep: 'chop',  color: '#c9a0c9' },
};

// How long each preparation step takes, in seconds.
export const PREP_TIMES = {
  grillSeconds: 6,   // a patty on the grill before it is ready
  burnSeconds: 9,    // extra seconds on the grill before it burns
  chopsNeeded: 3,    // chops on the board before a vegetable is ready
};

// The menu: each dish lists the ingredients on the plate, in serving order.
export const DISHES = [
  {
    id: 'garden-salad',
    name: 'Garden Salad',
    icon: '🥗',
    price: 8,
    needs: ['lettuce', 'tomato', 'onion'],
    blurb: 'Crisp, chopped and fresh.',
  },
  {
    id: 'classic-burger',
    name: 'Classic Burger',
    icon: '🍔',
    price: 14,
    needs: ['bun', 'patty', 'lettuce', 'tomato'],
    blurb: 'The house favourite.',
  },
  {
    id: 'cheese-melt',
    name: 'Cheese Melt',
    icon: '🧀',
    price: 16,
    needs: ['bun', 'patty', 'cheese', 'tomato'],
    blurb: 'Golden cheese, juicy patty.',
  },
  {
    id: 'crunch-burger',
    name: 'Crunch Burger',
    icon: '🍔',
    price: 18,
    needs: ['bun', 'patty', 'cheese', 'onion'],
    blurb: 'Sweet onion crunch on top.',
  },
];

// Dishes the kitchen starts the shift with; the rest unlock as the day heats up.
export const OPENING_DISHES = ['garden-salad', 'classic-burger'];
export const LATER_DISHES = ['cheese-melt', 'crunch-burger'];

/** The dish whose ingredient list matches the plate exactly, or null. */
export function dishForPlate(plate) {
  const sorted = [...plate].sort().join(',');
  return DISHES.find((d) => [...d.needs].sort().join(',') === sorted) ?? null;
}

/** A dish by id, or null. */
export function dishById(id) {
  return DISHES.find((d) => d.id === id) ?? null;
}
