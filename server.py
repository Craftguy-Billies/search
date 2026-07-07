"""YouTube Video Downloader — Backend Server

Provides a REST API for fetching video metadata and downloading
videos/audio from YouTube using yt-dlp.
"""

import os
import re
import json
import time
import threading
import tempfile

from flask import Flask, request, jsonify, send_file, after_this_request
from flask_cors import CORS
import yt_dlp

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

DOWNLOAD_DIR = os.path.join(tempfile.gettempdir(), 'yt_downloads')
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# Track active downloads so we can clean them up later
downloaded_files = {}
downloaded_files_lock = threading.Lock()

def sanitize_filename(name):
    """Remove or replace characters that are problematic in filenames."""
    return re.sub(r'[^\w\-_\. ]', '', name).strip() or 'video'


def cleanup_old_files():
    """Remove downloaded files older than 30 minutes."""
    now = time.time()
    with downloaded_files_lock:
        expired = [f for f, t in downloaded_files.items() if now - t > 1800]
        for f in expired:
            try:
                os.remove(f)
            except OSError:
                pass
            del downloaded_files[f]


@app.route('/api/info', methods=['GET'])
def get_video_info():
    """Fetch metadata for a YouTube video URL.

    Returns title, thumbnail, duration, uploader, and available formats.
    """
    url = request.args.get('url', '').strip()
    if not url:
        return jsonify({'error': 'No URL provided'}), 400

    # Basic URL validation
    youtube_regex = (
        r'(https?://)?(www\.)?'
        r'(youtube\.com|youtu\.be|m\.youtube\.com)/'
    )
    if not re.search(youtube_regex, url):
        return jsonify({'error': 'Invalid YouTube URL'}), 400

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'skip_download': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch video info: {str(e)}'}), 500

    formats = []
    seen = set()
    for f in info.get('formats', []):
        # Deduplicate by format_id
        fid = f.get('format_id', '')
        if fid in seen:
            continue
        seen.add(fid)

        ext = f.get('ext', '')
        note = f.get('format_note', '')
        resolution = f.get('resolution', '')
        filesize = f.get('filesize') or f.get('filesize_approx')
        acodec = f.get('acodec', 'none')
        vcodec = f.get('vcodec', 'none')

        # Determine type
        has_video = vcodec != 'none'
        has_audio = acodec != 'none'

        label_parts = []
        if has_video and resolution:
            label_parts.append(resolution)
        if note:
            label_parts.append(note)
        if ext:
            label_parts.append(ext)

        # Build a human-readable label
        if has_video and has_audio:
            type_label = 'video+audio'
        elif has_video:
            type_label = 'video'
        elif has_audio:
            type_label = 'audio'
        else:
            type_label = 'unknown'

        formats.append({
            'format_id': fid,
            'ext': ext,
            'resolution': resolution,
            'filesize': filesize,
            'vcodec': vcodec,
            'acodec': acodec,
            'type': type_label,
            'label': ' '.join(label_parts) if label_parts else f'{fid} ({ext})',
        })

    # Add best combined formats at the top
    best_formats = []
    for q in ['bestvideo+bestaudio', 'best', 'bestaudio']:
        best_formats.append({
            'format_id': q,
            'ext': 'mp4' if 'audio' not in q else 'm4a',
            'resolution': 'best',
            'filesize': None,
            'vcodec': 'avc1',
            'acodec': 'mp4a',
            'type': 'audio' if q == 'bestaudio' else 'video+audio',
            'label': f'{q} (auto)',
        })

    result = {
        'title': info.get('title', 'Unknown'),
        'thumbnail': info.get('thumbnail', ''),
        'duration': info.get('duration', 0),
        'uploader': info.get('uploader', info.get('channel', 'Unknown')),
        'uploader_url': info.get('uploader_url', info.get('channel_url', '')),
        'duration_string': info.get('duration_string', ''),
        'view_count': info.get('view_count', 0),
        'formats': best_formats + formats,
        'webpage_url': info.get('webpage_url', url),
    }

    return jsonify(result)


@app.route('/api/download', methods=['POST'])
def download_video():
    """Download a YouTube video/audio in the requested format.

    Expects JSON body: { url, format_id }
    Returns the file as an attachment.
    """
    data = request.get_json(silent=True) or {}
    url = data.get('url', '').strip()
    format_id = data.get('format_id', 'best')

    if not url:
        return jsonify({'error': 'No URL provided'}), 400

    youtube_regex = (
        r'(https?://)?(www\.)?'
        r'(youtube\.com|youtu\.be|m\.youtube\.com)/'
    )
    if not re.search(youtube_regex, url):
        return jsonify({'error': 'Invalid YouTube URL'}), 400

    # Determine output template
    outtmpl = os.path.join(DOWNLOAD_DIR, '%(title)s.%(ext)s')

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'format': format_id,
        'outtmpl': outtmpl,
        'merge_output_format': 'mp4',
        'restrictfilenames': False,
        'windowsfilenames': False,
    }

    # For audio-only downloads
    if format_id == 'bestaudio':
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'm4a',
        }]

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)

            # Adjust extension for audio post-processing
            if format_id == 'bestaudio':
                filename = filename.rsplit('.', 1)[0] + '.m4a'

            if not os.path.exists(filename):
                # Try other common extensions
                base = filename.rsplit('.', 1)[0]
                for ext in ['.mp4', '.m4a', '.webm', '.mkv', '.mp3']:
                    candidate = base + ext
                    if os.path.exists(candidate):
                        filename = candidate
                        break

    except Exception as e:
        return jsonify({'error': f'Download failed: {str(e)}'}), 500

    if not os.path.exists(filename):
        return jsonify({'error': 'Downloaded file not found on server'}), 500

    # Track for cleanup
    with downloaded_files_lock:
        downloaded_files[filename] = time.time()

    # Clean up old files in background
    cleanup_old_files()

    # Determine content type
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'mp4'
    mime_map = {
        'mp4': 'video/mp4',
        'm4a': 'audio/mp4',
        'webm': 'video/webm',
        'mkv': 'video/x-matroska',
        'mp3': 'audio/mpeg',
    }

    return send_file(
        filename,
        mimetype=mime_map.get(ext, 'application/octet-stream'),
        as_attachment=True,
        download_name=os.path.basename(filename),
    )


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 12000))
    print(f'YouTube Downloader server starting on port {port}')
    app.run(host='0.0.0.0', port=port, debug=True)
