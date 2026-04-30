import { setKeyMap } from '@noriginmedia/norigin-spatial-navigation';

export const TV_KEY_MAP = {
  left:  [37, 'ArrowLeft'],
  up:    [38, 'ArrowUp'],
  right: [39, 'ArrowRight'],
  down:  [40, 'ArrowDown'],
  enter: [13, 'Enter'],
};

export const TIZEN_EXTRA_KEYS = {
  back:      [10009, 'XF86Back'],
  playPause: [10252],
  play:      [10232],
  pause:     [19],
};

export function initKeyMap() {
  setKeyMap(TV_KEY_MAP);
}

/**
 * Register Samsung Tizen remote keys so the browser receives them as keydown events.
 * Without this, Samsung Smart Remote directional keys may not fire keydown.
 * Must be called after the DOM is ready.
 */
export function registerTizenKeys() {
  try {
    // Samsung Tizen API to register remote control keys
    const tizen = (window as any).tizen;
    if (tizen && tizen.tvinputdevice) {
      const keys = [
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Enter', 'Return', 'Back',
        'MediaPlay', 'MediaPause', 'MediaPlayPause',
        'MediaStop', 'MediaFastForward', 'MediaRewind',
      ];
      keys.forEach(key => {
        try { tizen.tvinputdevice.registerKey(key); } catch {}
      });
    }
  } catch {}
}

/**
 * Smooth scroll polyfill for TV browsers (webOS / Tizen) that don't support
 * scrollTo({ behavior: 'smooth' }). Falls back to instant scroll.
 */
export function tvScrollTo(
  el: HTMLElement | null,
  options: { left?: number; top?: number }
) {
  if (!el) return;
  try {
    el.scrollTo({ left: options.left ?? el.scrollLeft, top: options.top ?? el.scrollTop, behavior: 'smooth' });
  } catch {
    if (options.left !== undefined) el.scrollLeft = options.left;
    if (options.top !== undefined) el.scrollTop = options.top;
  }
}
