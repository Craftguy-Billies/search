const express = require('express');
const cors = require('cors');
const { spawn, execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

const YT_DLP = '/home/openhands/.local/bin/yt-dlp';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Get video info
app.get('/api/info', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const raw = execSync(
      `${YT_DLP} --dump-json --no-warnings "${url.replace(/"/g, '\\"')}"`,
      { timeout: 30000, encoding: 'utf-8' }
    );
    const data = JSON.parse(raw);

    const formats = (data.formats || [])
      .filter(f => {
        if (f.resolution === 'audio only' || !f.vcodec || f.vcodec === 'none') {
          return f.acodec && f.acodec !== 'none';
        }
        return f.vcodec && f.vcodec !== 'none';
      })
      .map(f => ({
        itag: f.format_id,
        quality: f.resolution && f.resolution !== 'audio only'
          ? f.resolution
          : `${Math.round(f.abr || 0)}kbps`,
        container: f.audio_ext && f.audio_ext !== 'none'
          ? (f.video_ext && f.video_ext !== 'none' && f.video_ext !== f.audio_ext
              ? `${f.video_ext}+${f.audio_ext}`
              : f.audio_ext)
          : f.video_ext || 'mp4',
        hasVideo: !!(f.vcodec && f.vcodec !== 'none'),
        hasAudio: !!(f.acodec && f.acodec !== 'none'),
        contentLength: f.filesize || f.filesize_approx || null,
        approxSize: f.filesize
          ? `${(f.filesize / 1048576).toFixed(1)} MB`
          : f.filesize_approx
            ? `≈${(f.filesize_approx / 1048576).toFixed(1)} MB`
            : 'unknown',
      }));

    // Deduplicate
    const seen = new Set();
    const uniqueFormats = formats.filter(f => {
      const key = `${f.quality}-${f.container}-${f.hasVideo}-${f.hasAudio}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json({
      title: data.title,
      duration: data.duration || 0,
      thumbnail: data.thumbnail || '',
      author: data.channel || data.uploader || 'Unknown',
      formats: uniqueFormats,
    });
  } catch (err) {
    console.error('Info error:', err.message);
    res.status(500).json({ error: 'Failed to fetch video info. Check the URL.' });
  }
});

// Download endpoint — stream via yt-dlp to stdout
app.get('/api/download', async (req, res) => {
  const { url, itag } = req.query;
  if (!url || !itag) return res.status(400).json({ error: 'URL and itag are required' });

  try {
    // Get a clean filename from yt-dlp
    let filename = 'video.mp4';
    try {
      filename = execSync(
        `${YT_DLP} --print filename --no-warnings -f ${itag} "${url.replace(/"/g, '\\"')}"`,
        { timeout: 10000, encoding: 'utf-8' }
      ).trim();
    } catch { /* fallback */ }

    // Get content-type hint
    let contentType = 'application/octet-stream';
    try {
      const ext = filename.split('.').pop().toLowerCase();
      const map = { m4a: 'audio/mp4', mp4: 'video/mp4', webm: 'video/webm', '3gp': 'video/3gpp' };
      contentType = map[ext] || contentType;
    } catch { /* fallback */ }

    const safeName = filename.replace(/[<>:"/\\|?*]/g, '_');
    res.header('Content-Disposition', `attachment; filename="${safeName}"`);
    res.header('Content-Type', contentType);

    // Stream via yt-dlp stdout — handles all redirects & deciphering
    const dl = spawn(YT_DLP, [
      '-f', itag,
      '-o', '-',
      '--no-warnings',
      url,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      dl.kill('SIGKILL');
      if (!res.headersSent) res.status(504).json({ error: 'Download timed out' });
    }, 120000);

    dl.stdout.on('data', () => {
      if (timedOut) return;
      // Clear timeout once data starts flowing
      if (timeout._destroyed === false) clearTimeout(timeout);
    });

    dl.stderr.on('data', () => { /* swallow yt-dlp logs */ });

    dl.stdout.pipe(res);

    dl.on('error', (e) => {
      console.error('Spawn error:', e.message);
      if (!res.headersSent) res.status(500).json({ error: 'Download failed' });
    });

    dl.on('close', (code) => {
      if (timedOut) return;
      clearTimeout(timeout);
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ error: `yt-dlp exited with code ${code}` });
      }
    });
  } catch (err) {
    console.error('Download error:', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Download failed' });
  }
});

app.listen(PORT, () => {
  console.log(`YouTube Downloader server running at http://localhost:${PORT}`);
});
