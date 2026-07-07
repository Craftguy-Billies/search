/**
 * @jest-environment jsdom
 */
test('yt-player end-to-end', () => {
  global.YT = { Player: class {} };
  require('../yt-player');
  expect(customElements.get('yt-player').prototype.extractId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
});
