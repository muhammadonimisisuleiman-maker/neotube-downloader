import youtubedl from 'youtube-dl-exec';
import { execFile } from 'child_process';
import util from 'util';
import os from 'os';

const execFileAsync = util.promisify(execFile);

async function run() {
  const ytDlpPath = (youtubedl as any).constants.YOUTUBE_DL_PATH;
  const argsBuilder = (youtubedl as any).args;
  
  const options = {
    output: 'C:\\Users\\ACCURATE COMPUTERS\\AppData\\Local\\Temp\\test space.mp4',
    format: 'bv*[height<=1080]+ba/b[height<=1080]/bv*+ba/b',
    getFormat: true
  };
  
  const ytArgs = argsBuilder(options);
  const fullArgs = ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', ...ytArgs];
  
  console.log('Running with execFile:', ytDlpPath);
  console.log('Args:', fullArgs);
  
  try {
    const { stdout } = await execFileAsync(ytDlpPath, fullArgs, { cwd: os.tmpdir() });
    console.log('Success:', stdout.trim());
  } catch (e: any) {
    console.error('Error stdout:', e.stdout);
    console.error('Error stderr:', e.stderr);
    console.error('Error message:', e.message);
  }
}

run();
