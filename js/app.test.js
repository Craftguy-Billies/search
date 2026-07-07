// Mock localStorage for Node test environment
const store = {};
global.localStorage = {
  getItem: jest.fn((key) => store[key] ?? null),
  setItem: jest.fn((key, value) => { store[key] = String(value); }),
  removeItem: jest.fn((key) => { delete store[key]; }),
  clear: jest.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  get length() { return Object.keys(store).length; },
  key: jest.fn((i) => Object.keys(store)[i] ?? null)
};

const {
  extractVideoId,
  timeAgo,
  buildVideoObject,
  isDuplicate,
  addVideoToList,
  removeVideoFromList,
  saveVideos,
  loadVideos,
  saveTheme,
  loadTheme,
  hello,
  goodbye
} = require('./app');

// ---------------------------------------------------------------------------
// extractVideoId
// ---------------------------------------------------------------------------
describe('extractVideoId', () => {
  test('extracts from standard watch URL', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
      .toBe('dQw4w9WgXcQ');
  });

  test('extracts from youtu.be short URL', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ'))
      .toBe('dQw4w9WgXcQ');
  });

  test('extracts from embed URL', () => {
    expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'))
      .toBe('dQw4w9WgXcQ');
  });

  test('extracts from shorts URL', () => {
    expect(extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ'))
      .toBe('dQw4w9WgXcQ');
  });

  test('extracts from video URL with extra params', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120s'))
      .toBe('dQw4w9WgXcQ');
  });

  test('extracts from plain video ID', () => {
    expect(extractVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  test('handles video IDs with hyphens and underscores', () => {
    expect(extractVideoId('a-b_c1D2E3F')).toBe('a-b_c1D2E3F');
  });

  test('returns null for empty string', () => {
    expect(extractVideoId('')).toBeNull();
  });

  test('returns null for invalid input', () => {
    expect(extractVideoId('not a video')).toBeNull();
  });

  test('returns null for non-YouTube URL', () => {
    expect(extractVideoId('https://vimeo.com/123456')).toBeNull();
  });

  test('returns null for short ID', () => {
    expect(extractVideoId('abc')).toBeNull();
  });

  test('handles URL with timestamp anchor', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ#t=2m'))
      .toBe('dQw4w9WgXcQ');
  });

  test('handles mobile YouTube URL', () => {
    expect(extractVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ'))
      .toBe('dQw4w9WgXcQ');
  });

  test('handles URL with playlist parameter', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf'))
      .toBe('dQw4w9WgXcQ');
  });

  test('handles youtu.be with timestamp', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ?t=30'))
      .toBe('dQw4w9WgXcQ');
  });
});

// ---------------------------------------------------------------------------
// timeAgo
// ---------------------------------------------------------------------------
describe('timeAgo', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns "Just now" for less than 60 seconds', () => {
    expect(timeAgo(new Date('2025-06-15T11:59:30Z').toISOString())).toBe('Just now');
  });

  test('returns minutes ago', () => {
    expect(timeAgo(new Date('2025-06-15T11:58:00Z').toISOString())).toBe('2m ago');
  });

  test('returns hours ago', () => {
    expect(timeAgo(new Date('2025-06-15T09:00:00Z').toISOString())).toBe('3h ago');
  });

  test('returns days ago', () => {
    expect(timeAgo(new Date('2025-06-10T12:00:00Z').toISOString())).toBe('5d ago');
  });

  test('returns formatted date for older than 30 days', () => {
    const oldDate = new Date('2025-04-01T12:00:00Z');
    const result = timeAgo(oldDate.toISOString());
    expect(result).toBe(oldDate.toLocaleDateString());
  });

  test('handles edge case of exactly 60 seconds', () => {
    expect(timeAgo(new Date('2025-06-15T11:59:00Z').toISOString())).toBe('1m ago');
  });

  test('handles edge case of exactly 3600 seconds', () => {
    expect(timeAgo(new Date('2025-06-15T11:00:00Z').toISOString())).toBe('1h ago');
  });

  test('handles edge case of exactly 86400 seconds', () => {
    expect(timeAgo(new Date('2025-06-14T12:00:00Z').toISOString())).toBe('1d ago');
  });
});

// ---------------------------------------------------------------------------
// buildVideoObject
// ---------------------------------------------------------------------------
describe('buildVideoObject', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('builds video object from oEmbed data', () => {
    const info = {
      title: 'Rick Astley - Never Gonna Give You Up',
      author_name: 'Rick Astley',
      thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
    };
    const video = buildVideoObject('dQw4w9WgXcQ', info);
    expect(video).toEqual({
      id: 'dQw4w9WgXcQ',
      title: 'Rick Astley - Never Gonna Give You Up',
      author: 'Rick Astley',
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      published: '2025-06-15T12:00:00.000Z',
      duration: ''
    });
  });

  test('falls back to defaults when oEmbed data is missing', () => {
    const video = buildVideoObject('abc123DEF45', {});
    expect(video).toEqual({
      id: 'abc123DEF45',
      title: 'Untitled',
      author: 'Unknown',
      thumbnail: 'https://img.youtube.com/vi/abc123DEF45/mqdefault.jpg',
      published: '2025-06-15T12:00:00.000Z',
      duration: ''
    });
  });
});

// ---------------------------------------------------------------------------
// isDuplicate
// ---------------------------------------------------------------------------
describe('isDuplicate', () => {
  const videos = [
    { id: 'dQw4w9WgXcQ', title: 'Video 1' },
    { id: 'abc123DEF45', title: 'Video 2' }
  ];

  test('returns true for duplicate ID', () => {
    expect(isDuplicate(videos, 'dQw4w9WgXcQ')).toBe(true);
  });

  test('returns false for new ID', () => {
    expect(isDuplicate(videos, 'xyz789GHI01')).toBe(false);
  });

  test('returns false for empty list', () => {
    expect(isDuplicate([], 'dQw4w9WgXcQ')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// addVideoToList
// ---------------------------------------------------------------------------
describe('addVideoToList', () => {
  test('prepends video to list immutably', () => {
    const original = [{ id: 'abc' }];
    const video = { id: 'xyz' };
    const result = addVideoToList(original, video);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(video);
    expect(result[1]).toEqual({ id: 'abc' });
    expect(original).toHaveLength(1);
  });

  test('works with empty list', () => {
    const result = addVideoToList([], { id: 'abc' });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 'abc' });
  });
});

// ---------------------------------------------------------------------------
// removeVideoFromList
// ---------------------------------------------------------------------------
describe('removeVideoFromList', () => {
  const videos = [
    { id: 'abc', title: 'A' },
    { id: 'xyz', title: 'B' },
    { id: '123', title: 'C' }
  ];

  test('removes video at given index immutably', () => {
    const result = removeVideoFromList(videos, 1);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'abc', title: 'A' });
    expect(result[1]).toEqual({ id: '123', title: 'C' });
    expect(videos).toHaveLength(3);
  });

  test('removes first video', () => {
    const result = removeVideoFromList(videos, 0);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'xyz', title: 'B' });
  });

  test('removes last video', () => {
    const result = removeVideoFromList(videos, 2);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ id: 'xyz', title: 'B' });
  });

  test('handles out-of-bounds index gracefully', () => {
    const result = removeVideoFromList(videos, 5);
    expect(result).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// saveVideos / loadVideos  (localStorage round-trip)
// ---------------------------------------------------------------------------
describe('saveVideos / loadVideos', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('round-trips a video list', () => {
    const videos = [
      { id: 'abc', title: 'Test', author: 'Tester', published: '2025-01-01', duration: '5:00' }
    ];
    saveVideos(videos);
    const loaded = loadVideos();
    expect(loaded).toEqual(videos);
  });

  test('loadVideos returns empty array when nothing saved', () => {
    expect(loadVideos()).toEqual([]);
  });

  test('loadVideos returns empty array on corrupted JSON', () => {
    localStorage.setItem('videovault_list', '{bad json');
    expect(loadVideos()).toEqual([]);
  });

  test('loadVideos returns empty array when key is absent', () => {
    localStorage.removeItem('videovault_list');
    expect(loadVideos()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// saveTheme / loadTheme
// ---------------------------------------------------------------------------
describe('saveTheme / loadTheme', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('saves and loads light theme', () => {
    saveTheme(true);
    expect(loadTheme()).toBe(true);
  });

  test('saves and loads dark theme', () => {
    saveTheme(false);
    expect(loadTheme()).toBe(false);
  });

  test('returns false (dark) when no theme saved', () => {
    expect(loadTheme()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hello
// ---------------------------------------------------------------------------
describe('hello', () => {
  test('returns "hello"', () => {
    expect(hello()).toBe('hello');
  });
});

// ---------------------------------------------------------------------------
// goodbye
// ---------------------------------------------------------------------------
describe('goodbye', () => {
  test('returns "goodbye"', () => {
    expect(goodbye()).toBe('goodbye');
  });
});
