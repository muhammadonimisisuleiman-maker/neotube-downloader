const yt = require('youtube-dl-exec');
yt('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
  output: '"C:\\Users\\ACCURATE COMPUTERS\\AppData\\Local\\Temp\\test_space.mp4"'
}).then(console.log).catch(e => console.error(e.message));
