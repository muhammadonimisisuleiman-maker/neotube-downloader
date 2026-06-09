import electronInstaller from 'electron-winstaller';
import path from 'path';

async function buildInstaller() {
  console.log('Building installer...');
  try {
    await electronInstaller.createWindowsInstaller({
      appDirectory: path.resolve('./release-builds/NeoTube Downloader-win32-x64'),
      outputDirectory: path.resolve('./release-installers'),
      authors: 'NeoTube',
      exe: 'NeoTube Downloader.exe',
      name: 'neotube_downloader',
      description: 'NeoTube Downloader Application',
      setupIcon: path.resolve('./build-icon.ico'),
      noMsi: true,
      setupExe: 'NeoTube-Downloader-Setup.exe'
    });
    console.log('Installer built successfully at ./release-installers!');
  } catch (e) {
    console.log(`Error building installer: ${e.message}`);
  }
}

buildInstaller();
