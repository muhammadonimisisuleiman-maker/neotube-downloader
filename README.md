# 🎬 NeoTube Downloader

A premium desktop video downloader built with **Electron**, **React**, and **yt-dlp**.
Supports **YouTube**, **Facebook**, **TikTok**, **Twitter/X**, and more.

![NeoTube Downloader](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey?style=for-the-badge&logo=windows)
![License](https://img.shields.io/badge/license-Open%20Source-green?style=for-the-badge)

---

## ✨ Features

- 🎥 **Video downloads** — 4K, 2K, 1080p, 720p, 480p, 360p
- 🎵 **Audio extraction** — MP3, WAV, FLAC, OGG, M4A
- 📋 **Batch downloads** — paste multiple links at once
- 📁 **Playlist support** — pick and choose videos from YouTube playlists
- 🍪 **Cookie support** — bypass age restrictions and bot checks
- 🌓 **Dark / Light mode** — premium Liquid Glass UI
- 📎 **Clipboard auto-detection** — automatically detects copied video links
- 🔒 **100% local & private** — no data ever leaves your device

---

## 📥 Download & Install

👉 **[Download the latest installer from Releases](https://github.com/muhammadonimisisuleiman-maker/neotube-downloader/releases/latest)**

Simply download `NeoTube-Downloader-Setup.exe` and run it. That's it!

---

## 🛠️ Build from Source

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)

### Setup

```bash
# Clone the repository
git clone https://github.com/muhammadonimisisuleiman-maker/neotube-downloader.git
cd neotube-downloader

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Build the Electron desktop app

```bash
npm run build-exe
```

This will generate the installer in the `release-installers/` folder.

---

## 🔒 Privacy & Security

- ✅ All cookies and session data are stored **locally on your device only**
- ✅ Cookies are written to a **temporary file**, used for the download, then **immediately deleted**
- ✅ No data is ever sent to any remote server
- ✅ No account details or tokens are stored anywhere other than your own machine

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron |
| Frontend | React + TypeScript + Vite |
| Backend | Express.js + TypeScript |
| Downloader Engine | yt-dlp (via youtube-dl-exec) |
| UI Styling | Tailwind CSS + Framer Motion |

---

## 📬 Contact & Feedback

Have a bug to report or a feature request?
Email: **muhammadonimisisuleiman@gmail.com**

---

*Made with ❤️ by muhammadonimisisuleiman-maker*
