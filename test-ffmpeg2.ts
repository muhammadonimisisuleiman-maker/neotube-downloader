import youtubedl from 'youtube-dl-exec';
import { spawn } from 'child_process';
import fs from 'fs';

let url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const ytProcess = youtubedl.exec(url, {
    output: '-',
    format: 'bestaudio',
    noWarnings: true
});

const ffmpeg = spawn('ffmpeg', [
    '-loglevel', 'error',
    '-i', 'pipe:0',
    '-f', 'wav',
    '-map', '0:a',
    '-y',
    'pipe:1'
]);

ytProcess.stdout!.pipe(ffmpeg.stdin);
ffmpeg.stdout.pipe(fs.createWriteStream('test-converted.wav'));

ffmpeg.stderr.on('data', d => console.log('ffmpeg log: ' + d.toString()));
ffmpeg.on('close', (code) => console.log('ffmpeg done with code', code));
ytProcess.on('close', (code) => console.log('yt process done with code', code));
