#!/usr/bin/env python3
"""YouTube Downloader — Flask backend powered by yt-dlp."""

import os
import re
import tempfile
import string
from pathlib import Path

import yt_dlp
from flask import Flask, request, jsonify, send_file, send_from_directory, after_this_request

app = Flask(__name__, static_folder=None)

DOWNLOAD_DIR = Path(tempfile.mkdtemp(prefix="ytdl_"))

# Path to the repo root (where this script lives)
REPO_DIR = Path(__file__).resolve().parent

# Regex for YouTube URLs (used by both info + download endpoints)
YT_REGEX = re.compile(r"https?://(www\.)?(youtube\.com|youtu\.be)/")

# Safe characters for filenames
SAFE_FILENAME_CHARS = set(string.ascii_letters + string.digits + " ._-()[]")


def _safe_filename(title: str, default: str = "video") -> str:
    """Strip characters that could cause trouble in Content-Disposition."""
    safe = "".join(c if c in SAFE_FILENAME_CHARS else "_" for c in title)
    safe = re.sub(r"_+", "_", safe).strip("_")
    return safe or default


def extract_info(url):
    """Fetch video metadata and available formats."""
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

    formats = []
    for f in info.get("formats", []):
        fmt = {
            "format_id": f.get("format_id"),
            "ext": f.get("ext"),
            "filesize": f.get("filesize"),
            "filesize_approx": f.get("filesize_approx"),
            "width": f.get("width"),
            "height": f.get("height"),
            "vcodec": f.get("vcodec"),
            "acodec": f.get("acodec"),
            "tbr": f.get("tbr"),
            "fps": f.get("fps"),
            "note": f.get("format_note", ""),
        }
        formats.append(fmt)

    # Build a simplified list for the UI
    streams = []
    seen = set()
    for f in formats:
        height = f.get("height") or 0
        ext = f.get("ext", "?")
        if height >= 2160:
            label = "4K"
        elif height >= 1440:
            label = "1440p"
        elif height >= 1080:
            label = "1080p"
        elif height >= 720:
            label = "720p"
        elif height >= 480:
            label = "480p"
        elif height >= 360:
            label = "360p"
        elif f["vcodec"] == "none" and f["acodec"] != "none":
            label = "Audio Only"
        else:
            label = f"{height}p" if height else f["note"] or ext

        key = f"{label}-{ext}"
        if key not in seen:
            seen.add(key)
            streams.append({
                "format_id": f["format_id"],
                "label": label,
                "ext": ext,
                "filesize": f.get("filesize") or f.get("filesize_approx"),
                "has_video": f["vcodec"] != "none",
                "has_audio": f["acodec"] != "none",
            })

    # Add best combined formats
    best_opts = [
        ("bestvideo+bestaudio", "Best Video + Audio (auto)"),
        ("best", "Best (single file)"),
    ]
    for fid, label in best_opts:
        streams.insert(0, {"format_id": fid, "label": label, "ext": "mp4", "special": True})

    # Add audio-only best option
    streams.append({
        "format_id": "bestaudio/best",
        "label": "Audio Only (best)",
        "ext": "m4a",
        "special": True,
    })

    return {
        "title": info.get("title", "Untitled"),
        "duration": info.get("duration"),
        "thumbnail": info.get("thumbnail"),
        "uploader": info.get("uploader"),
        "webpage_url": info.get("webpage_url", url),
        "streams": streams,
    }


@app.route("/api/info", methods=["POST"])
def api_info():
    data = request.get_json(force=True)
    url = data.get("url", "").strip()
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    if not YT_REGEX.match(url):
        return jsonify({"error": "Not a valid YouTube URL"}), 400

    try:
        info = extract_info(url)
        return jsonify(info)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/download")
def api_download():
    url = request.args.get("url", "").strip()
    format_id = request.args.get("format_id", "best")

    if not url:
        return jsonify({"error": "No URL provided"}), 400
    if not YT_REGEX.match(url):
        return jsonify({"error": "Not a valid YouTube URL"}), 400

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "format": format_id,
        "outtmpl": str(DOWNLOAD_DIR / "%(title)s.%(ext)s"),
        "merge_output_format": "mp4",
        "postprocessor_args": ["-movflags", "+faststart"],
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)

            p = Path(filename)
            if not p.exists():
                p = p.with_suffix(".mp4")
            if not p.exists():
                p = p.with_suffix(".m4a")
            if not p.exists():
                p = p.with_suffix(".webm")

            if not p.exists():
                return jsonify({"error": "Downloaded file not found"}), 500

            @after_this_request
            def cleanup(response):
                try:
                    p.unlink(missing_ok=True)
                except Exception:
                    pass

            safe_title = _safe_filename(info.get("title", "video"))
            as_attachment = request.args.get("dl", "1") == "1"
            return send_file(
                str(p),
                as_attachment=as_attachment,
                download_name=f"{safe_title}.{p.suffix[1:] or 'mp4'}",
            )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


# ── Static file routes (defined after API routes to avoid overlap) ──

@app.route("/")
def index():
    return send_from_directory(REPO_DIR, "youtube-downloader.html")


@app.route("/<path:filename>")
def static_files(filename):
    """Serve frontend static assets (HTML, CSS, JS only)."""
    name = Path(filename).name
    if not any(name.endswith(ext) for ext in (".html", ".css", ".js", ".svg", ".png", ".ico", ".json")):
        return jsonify({"error": "Not found"}), 404
    return send_from_directory(REPO_DIR, name)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🎬 YouTube Downloader server on http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
