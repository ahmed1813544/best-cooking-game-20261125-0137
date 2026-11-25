// The Golden Ladle — keyboard and mouse controls.
// Clicks land on the bins, grill, board and buttons; keys mirror them:
// 1–6 pick an ingredient, C chops, G takes the first ready patty,
// Space serves, T trashes the plate, P pauses, M mutes.

import { INGREDIENTS } from './recipes.js';
import { addIngredient, chopBoard, servePlate, takeFromGrill, trashPlate } from './kitchen.js';
import { ensureAudio, playChop, playError, playPick, playServe, playSizzle, toggleMute } from './audio.js';

function flashMessage(kitchen, text) {
  kitchen.message = text;
  kitchen.messageAt = kitchen.elapsed;
}

function pickIngredient(kitchen, id) {
  ensureAudio();
  const result = addIngredient(kitchen, id);
  if (result === 'plate') {
    playPick();
  } else if (result === 'board') {
    playPick();
    flashMessage(kitchen, `${INGREDIENTS[id].name} on the board — chop it!`);
  } else if (result === 'grill') {
    playSizzle();
    flashMessage(kitchen, 'Patty on the grill — watch it cook!');
  } else if (result === 'grill-full') {
    playError();
    flashMessage(kitchen, 'The grill is full — wait for a patty!');
  } else if (result === 'board-busy') {
    playError();
    flashMessage(kitchen, 'Finish chopping first!');
  } else if (result === 'plate-full') {
    playError();
    flashMessage(kitchen, 'The plate is full — serve or trash it!');
  }
}

function chop(kitchen) {
  ensureAudio();
  const result = chopBoard(kitchen);
  if (result === 'ok') playChop();
  else if (result === 'done') {
    playChop();
    playPick();
    flashMessage(kitchen, 'Chopped! Onto the plate.');
  } else if (result === 'board-empty') {
    playError();
    flashMessage(kitchen, 'Nothing on the board to chop.');
  }
}

function takeGrill(kitchen, index) {
  ensureAudio();
  const result = takeFromGrill(kitchen, index);
  if (result === 'ok') {
    playPick();
  } else if (result === 'burnt') {
    playError();
    flashMessage(kitchen, 'Burnt patty binned.');
  } else if (result === 'not-ready') {
    playError();
    flashMessage(kitchen, 'Still cooking — wait for READY!');
  }
}

function serve(kitchen) {
  ensureAudio();
  const result = servePlate(kitchen);
  if (result === 'no-match' || result === 'no-order') {
    playError();
    flashMessage(kitchen, result === 'no-match' ? 'That is not a menu dish!' : 'No order wants that dish right now.');
  } else if (result === 'plate-empty') {
    playError();
    flashMessage(kitchen, 'The plate is empty!');
  } else if (result && typeof result === 'object') {
    playServe();
  }
}

function trash(kitchen) {
  ensureAudio();
  if (trashPlate(kitchen) === 'ok') playPick();
}

/** Wire every control to the kitchen. Returns the handlers render.js needs. */
export function bindInput(kitchen, onStart) {
  const handlers = {
    pick: (id) => pickIngredient(kitchen, id),
    chop: () => chop(kitchen),
    takeGrill: (index) => takeGrill(kitchen, index),
    serve: () => serve(kitchen),
    trash: () => trash(kitchen),
  };

  document.getElementById('serveBtn').addEventListener('click', handlers.serve);
  document.getElementById('trashBtn').addEventListener('click', handlers.trash);
  document.getElementById('startBtn').addEventListener('click', () => {
    ensureAudio();
    onStart();
  });
  document.getElementById('againBtn').addEventListener('click', () => {
    ensureAudio();
    onStart();
  });
  document.getElementById('muteBtn').addEventListener('click', () => {
    kitchen.muted = toggleMute();
  });
  document.getElementById('pauseBtn').addEventListener('click', () => {
    if (kitchen.phase === 'playing') kitchen.paused = !kitchen.paused;
  });

  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (kitchen.phase === 'title' && (key === 'enter' || key === ' ')) {
      event.preventDefault();
      ensureAudio();
      onStart();
      return;
    }
    if (kitchen.phase === 'over' && key === 'enter') {
      ensureAudio();
      onStart();
      return;
    }
    if (kitchen.phase !== 'playing') return;
    if (key === ' ') {
      event.preventDefault();
      serve(kitchen);
      return;
    }
    if (key === 'c') {
      chop(kitchen);
      return;
    }
    if (key === 'g') {
      const ready = kitchen.grill.findIndex((s) => s.state === 'ready' || s.state === 'burnt');
      if (ready >= 0) takeGrill(kitchen, ready);
      return;
    }
    if (key === 't') {
      trash(kitchen);
      return;
    }
    if (key === 'p') {
      kitchen.paused = !kitchen.paused;
      return;
    }
    if (key === 'm') {
      kitchen.muted = toggleMute();
      return;
    }
    const ingredient = Object.entries(INGREDIENTS).find(([, info]) => info.key === key);
    if (ingredient) pickIngredient(kitchen, ingredient[0]);
  });

  return handlers;
}
