// The Golden Ladle — entry point: wires the kitchen, the renderer and the
// controls together and runs the game loop. A `?shot=` URL drops the game
// into a staged moment for screenshots; otherwise the title screen waits
// for the player to start the shift.

import { newKitchen, startShift, tickKitchen } from './kitchen.js';
import { buildBins, buildMenu, renderKitchen } from './render.js';
import { bindInput } from './input.js';
import { SHOT_NAMES, setupShot } from './shots.js';
import { playOrder, playReady, playShiftEnd } from './audio.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isFinite(seedParam) ? seedParam : 20261125;

const kitchen = newKitchen(seed);
const handlers = bindInput(kitchen, () => startShift(kitchen));
buildBins(handlers.pick);
buildMenu();

let shotMode = false;
if (shotName && SHOT_NAMES.includes(shotName)) {
  shotMode = setupShot(kitchen, shotName);
}

// The loop: advance the kitchen, play its sounds, redraw the page.
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  // In shot mode the clock is frozen so the staged moment stays put.
  const events = shotMode ? [] : tickKitchen(kitchen, dt);
  for (const event of events) {
    if (event.type === 'order') playOrder();
    else if (event.type === 'ready') playReady();
    else if (event.type === 'shift-end') playShiftEnd();
  }
  renderKitchen(kitchen, handlers);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// A hook for automated play-testing: the page's state, read from outside.
window.__goldenLadle = { kitchen, startShift, shotMode };
