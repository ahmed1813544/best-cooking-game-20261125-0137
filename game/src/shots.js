// The Golden Ladle — screenshot setups.
// `?shot=cover|assembly|serve|rush` drops the kitchen into a fixed, lively
// state so a screenshot shows the real game at its best: the same code,
// the same rendering, just a chosen moment. No shot mode changes how the
// game plays; it only picks the moment.

import { PREP_TIMES } from './recipes.js';
import { startShift } from './kitchen.js';

/** The four staged moments, in the order the screenshots are named. */
export const SHOT_NAMES = ['cover', 'assembly', 'serve', 'rush'];

function makeOrder(id, dishId, patience, maxPatience, reward) {
  return { id, dishId, patience, maxPatience, reward };
}

function base(kitchen, { elapsed, timeLeft, coins, score, served }) {
  startShift(kitchen);
  kitchen.elapsed = elapsed;
  kitchen.timeLeft = timeLeft;
  kitchen.coins = coins;
  kitchen.score = score;
  kitchen.served = served;
  kitchen.orders = [];
  kitchen.plate = [];
  kitchen.board = { item: null, chops: 0 };
  kitchen.grill = [];
  kitchen.message = '';
}

/** Drop the kitchen into the named staged moment. Returns true when known. */
export function setupShot(kitchen, name) {
  if (name === 'cover') {
    base(kitchen, { elapsed: 25, timeLeft: 125, coins: 14, score: 140, served: 1 });
    kitchen.orders = [
      makeOrder(1, 'classic-burger', 32, 44, 14),
      makeOrder(2, 'garden-salad', 21, 44, 8),
    ];
    kitchen.plate = ['bun', 'lettuce'];
    kitchen.board = { item: 'tomato', chops: 2 };
    kitchen.grill = [{ id: 'patty', state: 'cooking', t: PREP_TIMES.grillSeconds * 0.55 }];
    kitchen.message = 'Chop the tomato, then serve the burger!';
    kitchen.messageAt = kitchen.elapsed;
    return true;
  }
  if (name === 'assembly') {
    base(kitchen, { elapsed: 48, timeLeft: 102, coins: 28, score: 310, served: 2 });
    kitchen.orders = [makeOrder(1, 'classic-burger', 30, 42, 14)];
    kitchen.plate = ['bun', 'patty', 'lettuce'];
    kitchen.board = { item: 'tomato', chops: 1 };
    kitchen.grill = [{ id: 'patty', state: 'ready', t: PREP_TIMES.grillSeconds }];
    kitchen.message = 'One more chop and the burger is done!';
    kitchen.messageAt = kitchen.elapsed;
    return true;
  }
  if (name === 'serve') {
    base(kitchen, { elapsed: 70, timeLeft: 80, coins: 42, score: 480, served: 3 });
    kitchen.orders = [
      makeOrder(1, 'classic-burger', 38, 40, 14),
      makeOrder(2, 'cheese-melt', 26, 40, 16),
    ];
    kitchen.plate = ['bun', 'patty', 'lettuce', 'tomato'];
    kitchen.message = 'Classic Burger ready — SERVE it!';
    kitchen.messageAt = kitchen.elapsed;
    return true;
  }
  if (name === 'rush') {
    base(kitchen, { elapsed: 108, timeLeft: 42, coins: 64, score: 760, served: 5 });
    kitchen.unlocked.add('cheese-melt');
    kitchen.unlocked.add('crunch-burger');
    kitchen.orders = [
      makeOrder(1, 'cheese-melt', 9, 34, 16),
      makeOrder(2, 'classic-burger', 18, 36, 14),
      makeOrder(3, 'garden-salad', 27, 38, 8),
    ];
    kitchen.plate = ['bun', 'cheese'];
    kitchen.board = { item: 'onion', chops: 2 };
    kitchen.grill = [
      { id: 'patty', state: 'ready', t: PREP_TIMES.grillSeconds },
      { id: 'patty', state: 'cooking', t: PREP_TIMES.grillSeconds * 0.4 },
    ];
    kitchen.combo = 3;
    kitchen.message = 'RUSH! The Cheese Melt is almost out of time!';
    kitchen.messageAt = kitchen.elapsed;
    return true;
  }
  return false;
}
