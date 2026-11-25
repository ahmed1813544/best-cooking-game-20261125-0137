// The Golden Ladle — the kitchen itself: orders, plate, grill, chopping
// board and the shift clock. Pure state and rules; rendering lives in render.js.

import { DISHES, INGREDIENTS, LATER_DISHES, OPENING_DISHES, PREP_TIMES, dishById, dishForPlate } from './recipes.js';

export const SHIFT_SECONDS = 150;
export const MAX_ORDERS = 3;
export const GRILL_SLOTS = 2;
export const MAX_PLATE_ITEMS = 5;

// A small seeded random so screenshot setups play the same every time.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh kitchen state. `seed` drives which dishes the orders ask for. */
export function newKitchen(seed = 20261125) {
  return {
    phase: 'title', // 'title' | 'playing' | 'over'
    seed,
    rng: mulberry32(seed),
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    score: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    orders: [],
    nextOrderId: 1,
    nextOrderIn: 2.5,
    plate: [],
    board: { item: null, chops: 0 },
    grill: [],
    unlocked: new Set(OPENING_DISHES),
    paused: false,
    muted: false,
    message: '',
    messageAt: 0,
    stars: 0,
  };
}

/** Dishes the kitchen can be asked for right now. */
export function availableDishes(kitchen) {
  return DISHES.filter((d) => kitchen.unlocked.has(d.id));
}

/** Start the shift: clear the board and deal the first orders. */
export function startShift(kitchen) {
  kitchen.phase = 'playing';
  kitchen.timeLeft = SHIFT_SECONDS;
  kitchen.elapsed = 0;
  kitchen.coins = 0;
  kitchen.score = 0;
  kitchen.served = 0;
  kitchen.missed = 0;
  kitchen.combo = 0;
  kitchen.bestCombo = 0;
  kitchen.orders = [];
  kitchen.plate = [];
  kitchen.board = { item: null, chops: 0 };
  kitchen.grill = [];
  kitchen.unlocked = new Set(OPENING_DISHES);
  kitchen.nextOrderIn = 1.5;
  kitchen.paused = false;
  kitchen.message = 'Shift started — take the orders!';
  kitchen.messageAt = kitchen.elapsed;
}

/** How long a new order waits before its patience runs out. */
export function orderPatience(kitchen) {
  return Math.max(28, 46 - kitchen.elapsed * 0.08);
}

/** How long until the next order ticket lands. */
export function orderInterval(kitchen) {
  return Math.max(8, 14 - kitchen.elapsed * 0.04);
}

/** Deal one new order ticket onto the board. Returns the order or null. */
export function spawnOrder(kitchen) {
  if (kitchen.orders.length >= MAX_ORDERS) return null;
  const dishes = availableDishes(kitchen);
  const dish = dishes[Math.floor(kitchen.rng() * dishes.length)];
  const patience = orderPatience(kitchen);
  const order = {
    id: kitchen.nextOrderId++,
    dishId: dish.id,
    patience,
    maxPatience: patience,
    reward: dish.price,
  };
  kitchen.orders.push(order);
  kitchen.nextOrderIn = orderInterval(kitchen);
  return order;
}

/** Unlock the rest of the menu once the kitchen is warmed up. */
export function maybeUnlockMenu(kitchen) {
  if (kitchen.served >= 3 || kitchen.elapsed >= 55) {
    for (const id of LATER_DISHES) kitchen.unlocked.add(id);
  }
}

/** Advance the kitchen by `dt` seconds. Returns events for sound and flashes. */
export function tickKitchen(kitchen, dt) {
  const events = [];
  if (kitchen.phase !== 'playing' || kitchen.paused) return events;
  kitchen.elapsed += dt;
  kitchen.timeLeft = Math.max(0, kitchen.timeLeft - dt);
  maybeUnlockMenu(kitchen);

  kitchen.nextOrderIn -= dt;
  if (kitchen.nextOrderIn <= 0) {
    const order = spawnOrder(kitchen);
    if (order) events.push({ type: 'order' });
    else kitchen.nextOrderIn = 2;
  }

  for (const order of [...kitchen.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) {
      kitchen.orders = kitchen.orders.filter((o) => o.id !== order.id);
      kitchen.missed += 1;
      kitchen.combo = 0;
      kitchen.message = `${dishById(order.dishId).name} walked out!`;
      kitchen.messageAt = kitchen.elapsed;
      events.push({ type: 'missed' });
    }
  }

  for (const slot of kitchen.grill) {
    const wasCooking = slot.state === 'cooking';
    slot.t += dt;
    if (wasCooking && slot.t >= PREP_TIMES.grillSeconds) {
      slot.state = 'ready';
      events.push({ type: 'ready' });
    } else if (slot.state === 'ready' && slot.t >= PREP_TIMES.grillSeconds + PREP_TIMES.burnSeconds) {
      slot.state = 'burnt';
      kitchen.message = 'A patty burned on the grill!';
      kitchen.messageAt = kitchen.elapsed;
      events.push({ type: 'burnt' });
    }
  }

  if (kitchen.timeLeft <= 0) {
    kitchen.phase = 'over';
    kitchen.stars = kitchen.coins >= 90 ? 3 : kitchen.coins >= 55 ? 2 : kitchen.coins >= 30 ? 1 : 0;
    events.push({ type: 'shift-end' });
  }
  return events;
}

/** Put an ingredient from the counter into play. Returns 'ok' or a reason. */
export function addIngredient(kitchen, id) {
  if (kitchen.phase !== 'playing' || kitchen.paused) return 'not-playing';
  const ingredient = INGREDIENTS[id];
  if (!ingredient) return 'unknown';
  if (kitchen.plate.length >= MAX_PLATE_ITEMS) return 'plate-full';

  if (ingredient.prep === 'grill') {
    if (kitchen.grill.length >= GRILL_SLOTS) return 'grill-full';
    kitchen.grill.push({ id, state: 'cooking', t: 0 });
    return 'grill';
  }
  if (ingredient.prep === 'chop') {
    if (kitchen.board.item !== null) return 'board-busy';
    kitchen.board = { item: id, chops: 0 };
    return 'board';
  }
  kitchen.plate.push(id);
  return 'plate';
}

/** One chop on the board. Returns 'ok', 'done' or a reason. */
export function chopBoard(kitchen) {
  if (kitchen.phase !== 'playing' || kitchen.paused) return 'not-playing';
  if (kitchen.board.item === null) return 'board-empty';
  kitchen.board.chops += 1;
  if (kitchen.board.chops >= PREP_TIMES.chopsNeeded) {
    const item = kitchen.board.item;
    kitchen.plate.push(item);
    kitchen.board = { item: null, chops: 0 };
    return 'done';
  }
  return 'ok';
}

/** Take a patty off the grill. Returns 'ok', 'burnt' or a reason. */
export function takeFromGrill(kitchen, index) {
  if (kitchen.phase !== 'playing' || kitchen.paused) return 'not-playing';
  const slot = kitchen.grill[index];
  if (!slot) return 'empty-slot';
  if (slot.state === 'cooking') return 'not-ready';
  kitchen.grill.splice(index, 1);
  if (slot.state === 'burnt') return 'burnt';
  kitchen.plate.push(slot.id);
  return 'ok';
}

/** Serve the plate. Returns the served order, 'no-match' or a reason. */
export function servePlate(kitchen) {
  if (kitchen.phase !== 'playing' || kitchen.paused) return 'not-playing';
  if (kitchen.plate.length === 0) return 'plate-empty';
  const dish = dishForPlate(kitchen.plate);
  if (!dish) {
    kitchen.combo = 0;
    return 'no-match';
  }
  const order = kitchen.orders.find((o) => o.dishId === dish.id);
  if (!order) {
    kitchen.combo = 0;
    return 'no-order';
  }
  const patienceBonus = Math.max(0, Math.round((order.patience / order.maxPatience) * 6));
  const tip = kitchen.combo >= 2 ? 2 : 0;
  const earned = dish.price + patienceBonus + tip;
  kitchen.coins += earned;
  kitchen.score += earned * 10 + kitchen.combo * 5;
  kitchen.served += 1;
  kitchen.combo += 1;
  kitchen.bestCombo = Math.max(kitchen.bestCombo, kitchen.combo);
  kitchen.orders = kitchen.orders.filter((o) => o.id !== order.id);
  kitchen.plate = [];
  kitchen.message = `${dish.name} served! +${earned} coins`;
  kitchen.messageAt = kitchen.elapsed;
  return { dish, earned, order };
}

/** Tip the plate into the bin. */
export function trashPlate(kitchen) {
  if (kitchen.phase !== 'playing' || kitchen.paused) return 'not-playing';
  if (kitchen.plate.length === 0) return 'plate-empty';
  kitchen.plate = [];
  kitchen.combo = 0;
  return 'ok';
}

/** The dish the plate matches, if it matches any dish at all. */
export function plateDish(kitchen) {
  return dishForPlate(kitchen.plate);
}

/** The order the plate could serve right now, if any. */
export function servableOrder(kitchen) {
  const dish = dishForPlate(kitchen.plate);
  if (!dish) return null;
  return kitchen.orders.find((o) => o.dishId === dish.id) ?? null;
}
