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
    // Fallback for TVs that only accept (x, y) signature
    if (options.left !== undefined) el.scrollLeft = options.left;
    if (options.top !== undefined) el.scrollTop = options.top;
  }
}
