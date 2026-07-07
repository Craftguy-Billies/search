const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Get video info
app.get('/api/info', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const info = await ytdl.getInfo(url);
    const formats = info.formats
      .filter(f => f.hasVideo || f.hasAudio)
      .map(f => ({
        itag: f.itag,
        quality: f.qualityLabel || f.audioBitrate ? `${f.audioBitrate}kbps` : 'unknown',
        container: f.container,
        hasVideo: f.hasVideo,
        hasAudio: f.hasAudio,
        contentLength: f.contentLength,
        approxSize: f.contentLength
          ? `${(parseInt(f.contentLength) / 1048576).toFixed(1)} MB`
          : 'unknown',
      }));

    // Deduplicate and sort by quality
    const seen = new Set();
    const uniqueFormats = formats.filter(f => {
      const key = `${f.quality}-${f.container}-${f.hasVideo}-${f.hasAudio}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json({
      title: info.videoDetails.title,
      duration: parseInt(info.videoDetails.lengthSeconds),
      thumbnail: info.videoDetails.thumbnails.pop()?.url,
      author: info.videoDetails.author?.name,
      formats: uniqueFormats,
    });
  } catch (err) {
    console.error('Info error:', err.message);
    res.status(500).json({ error: 'Failed to fetch video info. Check the URL.' });
  }
});

// Download endpoint
app.get('/api/download', async (req, res) => {
  const { url, itag } = req.query;
  if (!url || !itag) return res.status(400).json({ error: 'URL and itag are required' });

  try {
    const info = await ytdl.getInfo(url);
    const format = info.formats.find(f => f.itag == itag);
    if (!format) return res.status(404).json({ error: 'Format not found' });

    res.header('Content-Disposition', `attachment; filename="${info.videoDetails.title}.${format.container}"`);
    ytdl(url, { format }).pipe(res);
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).json({ error: 'Download failed' });
  }
});

app.listen(PORT, () => {
  console.log(`YouTube Downloader server running at http://localhost:${PORT}`);
});
