const STORAGE_KEY = 'videovault_list';
const THEME_KEY = 'videovault_theme';

function extractVideoId(input) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago';
  return d.toLocaleDateString();
}

function buildVideoObject(id, info) {
  return {
    id: id,
    title: info.title || 'Untitled',
    author: info.author_name || 'Unknown',
    thumbnail: info.thumbnail_url || `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
    published: new Date().toISOString(),
    duration: ''
  };
}

function isDuplicate(videos, id) {
  return videos.some(v => v.id === id);
}

function addVideoToList(videos, video) {
  const copy = [...videos];
  copy.unshift(video);
  return copy;
}

function removeVideoFromList(videos, index) {
  const copy = [...videos];
  copy.splice(index, 1);
  return copy;
}

function saveVideos(videos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
}

function loadVideos() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function fetchVideoInfo(videoId) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Video not found');
  return await resp.json();
}

function saveTheme(isLight) {
  localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) === 'light';
}

function hello() {
  return 'hello';
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractVideoId,
    timeAgo,
    buildVideoObject,
    isDuplicate,
    addVideoToList,
    removeVideoFromList,
    saveVideos,
    loadVideos,
    fetchVideoInfo,
    saveTheme,
    loadTheme,
    hello,
    STORAGE_KEY,
    THEME_KEY
  };
}
