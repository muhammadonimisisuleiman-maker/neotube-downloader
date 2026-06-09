import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import os from "os";
import youtubedl from "youtube-dl-exec";
import { execFile } from "child_process";
import util from "util";

const execFileAsync = util.promisify(execFile);

// Safe wrapper to prevent shell injection and path parsing errors on Windows
async function safeYtDlp(url: string, options: any, spawnOptions: any = {}) {
  const ytDlpPath = (youtubedl as any).constants.YOUTUBE_DL_PATH;
  const argsBuilder = (youtubedl as any).args;
  
  const ytArgs = argsBuilder(options);
  const fullArgs = [url, ...ytArgs];
  
  console.log(`[server] safeYtDlp running: ${ytDlpPath} ${fullArgs.length} args`);
  
  try {
    const { stdout, stderr } = await execFileAsync(ytDlpPath, fullArgs, { 
      cwd: spawnOptions.cwd || os.tmpdir(),
      maxBuffer: 1024 * 1024 * 50 // 50MB for large JSON outputs
    });
    
    if (options.dumpJson || options.dumpSingleJson) {
      try {
        return JSON.parse(stdout);
      } catch (e) {
        return stdout;
      }
    }
    return stdout;
  } catch (error: any) {
    // If it threw an error but we have stdout JSON (like partial failure), try to parse it
    if ((options.dumpJson || options.dumpSingleJson) && error.stdout) {
      try {
        const parsed = JSON.parse(error.stdout);
        if (parsed) return parsed;
      } catch (e) {}
    }
    throw error;
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Log the yt-dlp binary path for debugging
  try {
    const ytdlpDir = process.env.YOUTUBE_DL_DIR || 'default (node_modules)';
    console.log(`[server] YOUTUBE_DL_DIR = ${ytdlpDir}`);
    console.log(`[server] __dirname = ${__dirname}`);
    console.log(`[server] NODE_ENV = ${process.env.NODE_ENV}`);
  } catch(e) { console.error('[server] logging error', e); }

  app.use(express.json());

  // API endpoint to fetch video metadata
  app.post("/api/info", async (req, res) => {
    let tempCookiePath: string | null = null;
    try {
      const { url, cookies } = req.body;
      if (!url) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
      }
      
      const options: any = {
        dumpJson: true,
        noWarnings: true,
        noCheckCertificates: true,
        forceIpv4: true,
        socketTimeout: 30,
      };

      if (cookies && cookies.trim().length > 0) {
        tempCookiePath = path.join(os.tmpdir(), `yt-cookies-${Date.now()}-${Math.random().toString(36).substring(7)}.txt`);
        fs.writeFileSync(tempCookiePath, cookies, 'utf8');
        options.cookies = tempCookiePath;
        console.log(`[server] /api/info: Using cookies file at ${tempCookiePath} (${cookies.length} chars)`);
      } else {
        console.log('[server] /api/info: No cookies provided');
      }

      const info = await safeYtDlp(url, options, { cwd: os.tmpdir() }) as any;
      res.json({ title: info.title, lengthSeconds: info.duration });
    } catch (error: any) {
      console.error(error);
      let errorMsg = error.message || "Failed to fetch info";
      if (errorMsg.includes("Sign in to confirm you’re not a bot")) {
        errorMsg = "YouTube blocked this request (bot check). ⚠️ Please add your YouTube Netscape Cookies in Settings.";
      }
      res.status(500).json({ error: errorMsg });
    } finally {
      if (tempCookiePath && fs.existsSync(tempCookiePath)) {
        fs.unlinkSync(tempCookiePath);
      }
    }
  });

  // API endpoint for downloading the stream directly
  app.post("/api/stream", async (req, res) => {
    let tempCookiePath: string | null = null;
    let tempOutputPath: string | null = null;
    try {
      const { url, mode = 'video', quality = '1080p', audioBitrate = '320k', cookies } = req.body;
      
      if (!url) {
        return res.status(400).send("Invalid YouTube URL");
      }

      const baseCookieOptions: any = {};
      if (cookies && cookies.trim().length > 0) {
        tempCookiePath = path.join(os.tmpdir(), `yt-cookies-${Date.now()}-${Math.random().toString(36).substring(7)}.txt`);
        fs.writeFileSync(tempCookiePath, cookies, 'utf8');
        baseCookieOptions.cookies = tempCookiePath;
        console.log(`[server] /api/stream: Using cookies file (${cookies.length} chars)`);
      }

      // First get info to determine the title
      const infoOptions: any = { 
        dumpJson: true, 
        noWarnings: true,
        noCheckCertificates: true,
        forceIpv4: true,
        socketTimeout: 30,
        ...baseCookieOptions,
      };
      const info = await safeYtDlp(url, infoOptions, { cwd: os.tmpdir() }) as any;
      const title = info.title.replace(/[^\w\s]/gi, '_');
      console.log(`[server] /api/stream: Got title: ${title}`);

      let format = 'bv*+ba/b';
      let outputExt = 'mp4';
      let contentType = 'video/mp4';

      if (mode === 'audio') {
        format = 'bestaudio/best';
        outputExt = quality;
        if (quality === 'mp3') contentType = 'audio/mpeg';
        else if (quality === 'wav') contentType = 'audio/wav';
        else if (quality === 'flac') contentType = 'audio/flac';
        else if (quality === 'ogg') contentType = 'audio/ogg';
        else if (quality === 'm4a') contentType = 'audio/mp4';
      } else {
         if (quality === '4k') format = 'bv*[height<=2160]+ba/b[height<=2160]/bv*+ba/b';
         else if (quality === '2k') format = 'bv*[height<=1440]+ba/b[height<=1440]/bv*+ba/b';
         else if (quality === '1080p') format = 'bv*[height<=1080]+ba/b[height<=1080]/bv*+ba/b';
         else if (quality === '720p') format = 'bv*[height<=720]+ba/b[height<=720]/bv*+ba/b';
         else if (quality === '480p') format = 'bv*[height<=480]+ba/b[height<=480]/bv*+ba/b';
         else if (quality === '360p') format = 'bv*[height<=360]+ba/b[height<=360]/bv*+ba/b';
      }

      // Download to a temp file so yt-dlp can merge video+audio via ffmpeg
      const tempId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      tempOutputPath = path.join(os.tmpdir(), `neotube-${tempId}.${outputExt}`);
      
      console.log(`[server] /api/stream: Downloading to temp file: ${tempOutputPath}`);
      console.log(`[server] /api/stream: Format: ${format}, Mode: ${mode}`);

      const dlOptions: any = {
        output: tempOutputPath,
        format: format,
        noWarnings: true,
        noCheckCertificates: true,
        forceIpv4: true,
        socketTimeout: 30,
        mergeOutputFormat: mode === 'audio' ? undefined : 'mp4',
        ...baseCookieOptions,
      };

      // For audio, add post-processing to convert format
      if (mode === 'audio') {
        dlOptions.extractAudio = true;
        dlOptions.audioFormat = outputExt;
        dlOptions.audioQuality = audioBitrate.replace('k', '');
        tempOutputPath = path.join(os.tmpdir(), `neotube-${tempId}.${outputExt}`);
        dlOptions.output = path.join(os.tmpdir(), `neotube-${tempId}.%(ext)s`);
      }

      await safeYtDlp(url, dlOptions, { cwd: os.tmpdir() });

      // For audio, yt-dlp may have changed the extension - find the actual file
      if (mode === 'audio') {
        const basePattern = `neotube-${tempId}.`;
        const tmpFiles = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith(basePattern));
        if (tmpFiles.length > 0) {
          tempOutputPath = path.join(os.tmpdir(), tmpFiles[0]);
          console.log(`[server] /api/stream: Found audio file: ${tempOutputPath}`);
        }
      }

      if (!tempOutputPath || !fs.existsSync(tempOutputPath)) {
        throw new Error("Download completed but output file not found");
      }

      const stat = fs.statSync(tempOutputPath);
      console.log(`[server] /api/stream: File ready, size: ${(stat.size / 1024 / 1024).toFixed(1)} MB`);

      res.setHeader('Content-Disposition', `attachment; filename="${title}.${outputExt}"`);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stat.size.toString());

      const readStream = fs.createReadStream(tempOutputPath);
      readStream.pipe(res);

      readStream.on('end', () => {
        try {
          if (tempOutputPath && fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
          if (tempCookiePath && fs.existsSync(tempCookiePath)) fs.unlinkSync(tempCookiePath);
        } catch(e) { console.error('[server] cleanup error:', e); }
      });
      
      readStream.on('error', (err) => {
        console.error('[server] Read stream error:', err);
        try {
          if (tempOutputPath && fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
          if (tempCookiePath && fs.existsSync(tempCookiePath)) fs.unlinkSync(tempCookiePath);
        } catch(e) {}
      });

    } catch (error: any) {
      console.error('[server] /api/stream error:', error);
      try {
        if (tempOutputPath && fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
        if (tempCookiePath && fs.existsSync(tempCookiePath)) fs.unlinkSync(tempCookiePath);
      } catch(e) {}
      
      if (!res.headersSent) {
        let errorMsg = error.message || "Failed to stream";
        if (error.stderr) errorMsg += ` | stderr: ${error.stderr.substring(0, 500)}`;
        if (errorMsg.includes("Sign in to confirm you're not a bot")) {
          errorMsg = "YouTube blocked this request (bot check). ⚠️ Please add your YouTube Netscape Cookies in Settings.";
        }
        res.status(500).send(errorMsg);
      }
    }
  });

  // API endpoint to fetch playlist entries
  app.post("/api/playlist-info", async (req, res) => {
    let tempCookiePath: string | null = null;
    try {
      const { url, cookies } = req.body;
      if (!url) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
      }
      
      const options: any = {
        dumpSingleJson: true,
        flatPlaylist: true,
        noWarnings: true,
        noCheckCertificates: true,
        forceIpv4: true,
        socketTimeout: 30,
      };

      if (cookies && cookies.trim().length > 0) {
        tempCookiePath = path.join(os.tmpdir(), `yt-cookies-${Date.now()}-${Math.random().toString(36).substring(7)}.txt`);
        fs.writeFileSync(tempCookiePath, cookies, 'utf8');
        options.cookies = tempCookiePath;
        console.log(`[server] /api/playlist-info: Using cookies file (${cookies.length} chars)`);
      }

      const info = await safeYtDlp(url, options, { cwd: os.tmpdir() }) as any;
      
      if (!info.entries) {
         return res.json({ entries: [] });
      }

      const entries = info.entries.map((e: any) => ({
        id: e.id,
        title: e.title,
        url: e.url || (e.id ? `https://www.youtube.com/watch?v=${e.id}` : null),
        duration: e.duration
      })).filter((e: any) => e.url);

      res.json({ title: info.title, entries });
    } catch (error: any) {
      console.error(error);
      let errorMsg = error.message || "Failed to fetch playlist info";
      if (errorMsg.includes("Sign in to confirm you’re not a bot")) {
        errorMsg = "YouTube blocked this request (bot check). ⚠️ Please add your YouTube Netscape Cookies in Settings.";
      }
      res.status(500).json({ error: errorMsg });
    } finally {
      if (tempCookiePath && fs.existsSync(tempCookiePath)) {
        fs.unlinkSync(tempCookiePath);
      }
    }
  });

  // Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const isBundled = __dirname.endsWith('dist-server') || __dirname.endsWith('dist-server\\') || __dirname.endsWith('dist-server/');
    const distPath = path.join(__dirname, isBundled ? '..' : '.', 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[system] Express Backend running on http://localhost:${PORT}`);
  });
}

startServer();
