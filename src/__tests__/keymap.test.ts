import { TV_KEY_MAP, TIZEN_EXTRA_KEYS, initKeyMap } from '../keymap';

// Mock the spatial navigation module so we can spy on setKeyMap
jest.mock('@noriginmedia/norigin-spatial-navigation', () => ({
  setKeyMap: jest.fn(),
}));

import { setKeyMap } from '@noriginmedia/norigin-spatial-navigation';

describe('TV_KEY_MAP', () => {
  it('left contains keyCode 37 and string ArrowLeft', () => {
    expect(TV_KEY_MAP.left).toContain(37);
    expect(TV_KEY_MAP.left).toContain('ArrowLeft');
  });

  it('up contains keyCode 38 and string ArrowUp', () => {
    expect(TV_KEY_MAP.up).toContain(38);
    expect(TV_KEY_MAP.up).toContain('ArrowUp');
  });

  it('right contains keyCode 39 and string ArrowRight', () => {
    expect(TV_KEY_MAP.right).toContain(39);
    expect(TV_KEY_MAP.right).toContain('ArrowRight');
  });

  it('down contains keyCode 40 and string ArrowDown', () => {
    expect(TV_KEY_MAP.down).toContain(40);
    expect(TV_KEY_MAP.down).toContain('ArrowDown');
  });

  it('enter contains keyCode 13 and string Enter', () => {
    expect(TV_KEY_MAP.enter).toContain(13);
    expect(TV_KEY_MAP.enter).toContain('Enter');
  });
});

describe('TIZEN_EXTRA_KEYS', () => {
  it('back contains keyCode 10009', () => {
    expect(TIZEN_EXTRA_KEYS.back).toContain(10009);
  });

  it('playPause contains keyCode 10252', () => {
    expect(TIZEN_EXTRA_KEYS.playPause).toContain(10252);
  });
});

describe('initKeyMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls setKeyMap with TV_KEY_MAP', () => {
    initKeyMap();
    expect(setKeyMap).toHaveBeenCalledTimes(1);
    expect(setKeyMap).toHaveBeenCalledWith(TV_KEY_MAP);
  });
});
