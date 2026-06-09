import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'build-icon.ico')
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.autoHideMenuBar = true;

  const loadWithRetry = () => {
    if (!mainWindow) return;
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      setTimeout(loadWithRetry, 500);
    });
  };
  loadWithRetry();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // Set yt-dlp binary path before importing server
  const ytdlpDir = path.join(__dirname, 'node_modules', 'youtube-dl-exec', 'bin');
  process.env.YOUTUBE_DL_DIR = ytdlpDir;
  process.env.NODE_ENV = 'production';
  process.env.PORT = '3000';

  console.log('[electron] Starting server...');
  console.log('[electron] yt-dlp dir:', ytdlpDir);
  console.log('[electron] __dirname:', __dirname);

  // Import the server directly — it will call startServer() on import
  try {
    await import('./dist-server/server.js');
    console.log('[electron] Server module loaded.');
  } catch (err) {
    console.error('[electron] Failed to load server:', err);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
