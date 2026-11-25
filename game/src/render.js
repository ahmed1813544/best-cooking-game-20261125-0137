// The Golden Ladle — draws the kitchen into the page.
// The HTML holds the skeleton; this file builds the tickets, bins, grill
// slots and plate once and then updates them in place, so a button never
// vanishes under the player's mouse while the game redraws.

import { DISHES, INGREDIENTS, PREP_TIMES } from './recipes.js';
import { plateDish, servableOrder } from './kitchen.js';

const $ = (id) => document.getElementById(id);

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Persistent nodes, built once and updated in place.
const ticketNodes = new Map();
let grillNodes = [];
let boardSignature = '';
let plateSignature = '';
let menuBuilt = false;

/** Build the ingredient bins once, from the recipe data. */
export function buildBins(onPick) {
  const bins = $('bins');
  bins.textContent = '';
  for (const [id, ingredient] of Object.entries(INGREDIENTS)) {
    const bin = el('button', 'bin', '');
    bin.dataset.ingredient = id;
    bin.style.setProperty('--bin-color', ingredient.color);
    bin.innerHTML = `<span class="bin-icon">${ingredient.icon}</span>
      <span class="bin-name">${ingredient.name}</span>
      <span class="bin-key">${ingredient.key}</span>
      <span class="bin-prep">${ingredient.prep === 'none' ? 'ready' : ingredient.prep === 'grill' ? 'needs grill' : 'needs chopping'}</span>`;
    bin.addEventListener('click', () => onPick(id));
    bins.appendChild(bin);
  }
}

/** Build the menu list once. */
export function buildMenu() {
  const list = $('menuList');
  list.textContent = '';
  for (const dish of DISHES) {
    const row = el('div', 'menu-row');
    row.dataset.dish = dish.id;
    row.innerHTML = `<span class="menu-icon">${dish.icon}</span>
      <span class="menu-name">${dish.name}</span>
      <span class="menu-needs">${dish.needs.map((n) => INGREDIENTS[n].icon).join(' + ')}</span>
      <span class="menu-price">🪙${dish.price}</span>`;
    list.appendChild(row);
  }
  menuBuilt = true;
}

/** Build one order ticket node, kept and updated while the order lives. */
function buildTicket(order, dish) {
  const ticket = el('div', 'ticket');
  ticket.innerHTML = `<div class="ticket-head">
      <span class="ticket-icon">${dish.icon}</span>
      <span class="ticket-name">${dish.name}</span>
      <span class="ticket-reward">🪙${order.reward}</span>
    </div>
    <div class="ticket-needs">${dish.needs.map((n) => `<span class="need" title="${INGREDIENTS[n].name}">${INGREDIENTS[n].icon}</span>`).join('')}</div>
    <div class="patience"><div class="patience-fill"></div></div>
    <div class="ticket-time"></div>`;
  return ticket;
}

function updateTicket(ticket, order) {
  const urgency = order.patience / order.maxPatience;
  ticket.classList.toggle('urgent', urgency < 0.35);
  ticket.querySelector('.patience-fill').style.width = `${Math.max(0, urgency * 100)}%`;
  ticket.querySelector('.ticket-time').textContent = `${Math.ceil(order.patience)}s`;
}

/** Build the two grill slot nodes once, with a fixed inner structure. */
function buildGrill(handlers) {
  const grill = $('grillSlots');
  grill.textContent = '';
  grillNodes = [];
  for (let i = 0; i < 2; i++) {
    const node = el('button', 'grill-slot empty');
    node.innerHTML = `<span class="grill-icon"></span>
      <span class="grill-bar"><span class="grill-fill"></span></span>
      <span class="grill-label">Empty slot</span>`;
    node.addEventListener('click', () => handlers.takeGrill(i));
    grill.appendChild(node);
    grillNodes.push(node);
  }
}

/**
 * Update a grill slot in place: only text and widths change, the button and
 * its children stay put, so a click is never lost to a rebuilt node.
 */
function updateGrillSlot(node, slot) {
  if (!slot) {
    node.className = 'grill-slot empty';
    node.querySelector('.grill-icon').textContent = '';
    node.querySelector('.grill-fill').style.width = '0%';
    node.querySelector('.grill-label').textContent = 'Empty slot';
    return;
  }
  node.className = `grill-slot ${slot.state}`;
  const progress = Math.min(1, slot.t / PREP_TIMES.grillSeconds);
  node.querySelector('.grill-icon').textContent = slot.state === 'burnt' ? '🔥' : '🥩';
  node.querySelector('.grill-fill').style.width = `${slot.state === 'burnt' ? 100 : progress * 100}%`;
  node.querySelector('.grill-label').textContent =
    slot.state === 'cooking' ? `Cooking… ${Math.round(progress * 100)}%`
    : slot.state === 'ready' ? 'READY! Click to take'
    : 'BURNT! Click to bin it';
}

/** Rebuild the chopping board only when what sits on it changes. */
function updateBoard(kitchen, handlers) {
  const signature = kitchen.board.item === null
    ? 'empty'
    : `${kitchen.board.item}:${kitchen.board.chops}`;
  if (signature === boardSignature) return;
  boardSignature = signature;
  const board = $('chopBoard');
  board.textContent = '';
  if (kitchen.board.item) {
    const ingredient = INGREDIENTS[kitchen.board.item];
    const marks = '🔪'.repeat(kitchen.board.chops) + '·'.repeat(PREP_TIMES.chopsNeeded - kitchen.board.chops);
    const button = el('button', 'board-item');
    button.id = 'boardItem';
    button.innerHTML = `<span class="board-icon">${ingredient.icon}</span>
      <span class="board-name">${ingredient.name}</span>
      <span class="board-chops">${marks}</span>
      <span class="board-hint">Click to chop!</span>`;
    button.addEventListener('click', handlers.chop);
    board.appendChild(button);
  } else {
    board.appendChild(el('div', 'board-empty', 'Empty — click Lettuce, Tomato or Onion below'));
  }
}

/** Rebuild the plate only when its contents change. */
function updatePlate(kitchen) {
  const signature = kitchen.plate.join(',');
  if (signature === plateSignature) return;
  plateSignature = signature;
  const plate = $('plate');
  plate.textContent = '';
  if (kitchen.plate.length === 0) {
    plate.appendChild(el('div', 'plate-empty', 'Empty plate'));
  }
  for (const id of kitchen.plate) {
    const ingredient = INGREDIENTS[id];
    const chip = el('span', 'plate-item');
    chip.title = ingredient.name;
    chip.textContent = ingredient.icon;
    plate.appendChild(chip);
  }
}

/** Refresh every live part of the kitchen from the state. */
export function renderKitchen(kitchen, handlers) {
  if (grillNodes.length === 0) buildGrill(handlers);

  // Top bar: shift clock, coins, score, combo.
  const timer = $('timer');
  timer.textContent = formatTime(kitchen.timeLeft);
  timer.classList.toggle('low', kitchen.timeLeft <= 30 && kitchen.phase === 'playing');
  $('coins').textContent = kitchen.coins;
  $('score').textContent = kitchen.score;
  $('combo').textContent = `x${kitchen.combo}`;
  $('muteBtn').textContent = kitchen.muted ? '🔇' : '🔊';
  $('pauseBtn').textContent = kitchen.paused ? '▶️' : '⏸';

  // Order board: keep a node per order, update its patience in place.
  const tickets = $('tickets');
  const liveIds = new Set(kitchen.orders.map((o) => o.id));
  for (const [id, node] of [...ticketNodes]) {
    if (!liveIds.has(id)) {
      node.remove();
      ticketNodes.delete(id);
    }
  }
  for (const order of kitchen.orders) {
    const dish = DISHES.find((d) => d.id === order.dishId);
    let node = ticketNodes.get(order.id);
    if (!node) {
      node = buildTicket(order, dish);
      ticketNodes.set(order.id, node);
      tickets.appendChild(node);
    }
    updateTicket(node, order);
  }
  let noOrders = document.querySelector('.no-orders');
  if (kitchen.orders.length === 0 && kitchen.phase === 'playing') {
    if (!noOrders) tickets.appendChild(el('div', 'no-orders', 'No orders yet — the lunch rush is coming…'));
  } else if (noOrders) {
    noOrders.remove();
  }

  // Grill and chopping board.
  for (let i = 0; i < 2; i++) updateGrillSlot(grillNodes[i], kitchen.grill[i]);
  updateBoard(kitchen, handlers);

  // Plate.
  updatePlate(kitchen);
  const dish = plateDish(kitchen);
  $('plateDish').textContent = dish
    ? `${dish.icon} ${dish.name} — ${dish.blurb}`
    : kitchen.plate.length > 0 ? 'Not a menu dish yet…' : '';

  const serveBtn = $('serveBtn');
  const servable = servableOrder(kitchen);
  serveBtn.disabled = !servable;
  serveBtn.classList.toggle('ready', Boolean(servable));
  serveBtn.textContent = servable ? `SERVE ${dish.name.toUpperCase()} ➜` : 'SERVE ➜';
  $('trashBtn').disabled = kitchen.plate.length === 0;

  // Menu: dim the dishes not unlocked yet.
  if (menuBuilt) {
    for (const row of document.querySelectorAll('.menu-row')) {
      row.classList.toggle('locked', !kitchen.unlocked.has(row.dataset.dish));
    }
  }

  // Toast message.
  const toast = $('toast');
  if (kitchen.message && kitchen.elapsed - kitchen.messageAt < 3) {
    toast.textContent = kitchen.message;
    toast.classList.add('show');
  } else {
    toast.classList.remove('show');
  }

  // Overlays.
  $('titleScreen').classList.toggle('hidden', kitchen.phase !== 'title');
  const over = $('gameOverScreen');
  over.classList.toggle('hidden', kitchen.phase !== 'over');
  if (kitchen.phase === 'over') {
    $('finalCoins').textContent = kitchen.coins;
    $('finalServed').textContent = kitchen.served;
    $('finalMissed').textContent = kitchen.missed;
    $('finalScore').textContent = kitchen.score;
    $('finalStars').textContent = '⭐'.repeat(kitchen.stars) || 'No stars — try again, chef!';
    $('finalBestCombo').textContent = kitchen.bestCombo;
  }
}
