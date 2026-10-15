# ytmusic-scraper-api

YouTube Music API for Node.js. Search songs, albums, artists and playlists, get track info, lyrics, queue, charts, thumbnails, and download audio as `m4a` or `mp3`.

- Works with ESM (`import`) and CommonJS (`require`)
- Easy to use in any bot (WhatsApp, Telegram, Discord, Messenger and more)
- Cookies are loaded automatically from a remote `token.txt`
- No API key needed

## Requirements

- Node.js 18 or newer
- `ffmpeg` installed and available in `PATH` (only needed for `mp3` conversion)

## Install

```bash
npm install ytmusic-scraper-api
```

Install ffmpeg if you want mp3 output:

```bash
sudo apt install ffmpeg
```

On Termux: `pkg install ffmpeg`

## Quick start

### ESM

```js
import ytm from 'ytmusic-scraper-api';

const results = await ytm.search('Shape of You', { filter: 'songs' });
console.log(results[0]);

const info = await ytm.download(results[0].videoId, { format: 'mp3', save: true });
console.log(info.savedPath);
```

### CommonJS

```js
const ytm = require('ytmusic-scraper-api');

(async () => {
  const results = await ytm.search('Shape of You', { filter: 'songs' });
  console.log(results[0]);
})();
```

In CommonJS every function returns a Promise, including `extractVideoId` and `extractBrowseId`, so use `await` on them.

## Using it in a bot

The same code works in any bot framework. Only the part that sends the file is different.

### Get the song as a buffer

```js
const ytm = require('ytmusic-scraper-api');

async function getSong(query) {
  const [song] = await ytm.search(query, { filter: 'songs' });
  if (!song) return null;

  const info = await ytm.download(song.videoId, { format: 'mp3', buffer: true });
  return {
    title: info.title,
    artist: info.artist,
    duration: info.duration,
    filename: info.filename,
    mimeType: info.mimeType,
    buffer: info.buffer
  };
}
```

Send `buffer` with your bot library's audio or document send method.

### Get the song as a file

```js
const fs = require('fs');
const path = require('path');
const os = require('os');
const ytm = require('ytmusic-scraper-api');

async function sendSong(query, send) {
  const [song] = await ytm.search(query, { filter: 'songs' });
  if (!song) throw new Error('Song not found');

  const file = path.join(os.tmpdir(), `${Date.now()}.mp3`);
  try {
    const info = await ytm.download(song.videoId, { format: 'mp3', outputPath: file });
    await send({
      caption: `${info.title} - ${info.artist}`,
      stream: fs.createReadStream(file)
    });
  } finally {
    fs.rm(file, () => {});
  }
}
```

Tips for bots:

- Always delete temporary files after sending.
- Many platforms limit file size (for example 25 MB). Use `info.size` to check before sending.
- Wrap calls in `try/catch` and reply with a friendly message on failure.
- Add a cooldown per user to avoid spam.


## API reference

All functions are async. The last argument `options` is always optional and always accepts `cookie`.

| Function | Description |
| --- | --- |
| `search(query, options)` | Search YouTube Music |
| `getTrack(idOrUrl, options)` | Track details with audio stream |
| `getAudioStream(idOrUrlOrQuery, options)` | Direct audio URL |
| `download(idOrUrlOrQuery, options)` | Download as m4a or mp3 |
| `getLyrics(idOrUrlOrQuery, options)` | Lyrics and source |
| `getQueue(idOrUrl, options)` | Up next / related tracks |
| `getAlbum(browseIdOrUrl, options)` | Album details and tracks |
| `getArtist(browseIdOrUrl, options)` | Artist details, songs, albums, singles |
| `getPlaylist(browseIdOrUrl, options)` | Playlist details and tracks |
| `getCharts(country, options)` | Top artists chart |
| `getExplore(options)` | Explore page categories |
| `getThumbnail(idOrUrl, options)` | Thumbnails in several sizes |
| `extractVideoId(input)` | Video ID from a URL or ID, otherwise `null` |
| `extractBrowseId(input)` | Browse ID from a URL or ID |
| `parseCookies(input)` | Resolve cookies to a header string |
| `getInnertubeConfig(cookie)` | Internal client config (cached 30 min) |

### search

```js
await ytm.search('query');
await ytm.search('query', { filter: 'songs' });
```

Filters: `songs`, `videos`, `albums`, `artists`, `playlists`, `community_playlists`.

- With a filter, the result is an array of items.
- Without a filter, the result is `{ query, topResult, songs, videos, albums, artists, playlists }`.

Item shape:

```js
{
  type: 'song',
  title: 'Song title',
  videoId: 'xxxxxxxxxxx',
  browseId: null,
  artists: [{ name: 'Artist', id: 'UC...' }],
  album: { name: 'Album', id: 'MPREb_...' },
  duration: '3:53',
  plays: '1.2B plays',
  thumbnail: 'https://...',
  thumbnails: []
}
```

### download

```js
const info = await ytm.download('Shape of You', {
  format: 'mp3',
  outputPath: './song.mp3'
});
```

| Option | Description |
| --- | --- |
| `format` | `'mp3'` or default `m4a` |
| `save` | Save to the system temp folder |
| `outputPath` | Save to this exact path |
| `buffer` | Return the file as `info.buffer` |
| `whatsapp` | Same as `format: 'mp3'` plus buffer |
| `cookie` | Cookie string or file path |

Returns:

```js
{
  videoId, title, artist, duration, durationSeconds, thumbnail,
  filename, format, mimeType, bitrate, size, formattedSize,
  downloadUrl, savedPath, buffer
}
```

`savedPath` and `buffer` appear only when requested. If you pass nothing, only `downloadUrl` is returned and nothing is downloaded.

### getTrack

```js
const track = await ytm.getTrack('dQw4w9WgXcQ', { lyrics: true, queue: true });
```

| Option | Description |
| --- | --- |
| `lyrics` | Include `lyrics` and `lyricsSource` |
| `queue` or `related` | Include `queue` |

### getLyrics

```js
const { lyrics, source } = await ytm.getLyrics('Shape of You');
```

`lyrics` is `null` when the song has no lyrics.

### getThumbnail

```js
const thumb = await ytm.getThumbnail('dQw4w9WgXcQ', { quality: 'hd', save: true });
```

Quality: `ultra_hd` (default), `hd`, `medium`, `small`. Also accepts album (`MPREb_...`), artist (`UC...`) and playlist (`VL...` / `PL...`) IDs.

### Inputs you can pass

- Video: 11 character ID, `youtu.be`, `youtube.com/watch?v=`, `music.youtube.com/watch?v=`, shorts, embed links
- Album: `MPREb_...` ID or `browse/MPREb_...` link
- Artist: `UC...` ID or `channel/UC...` link
- Playlist: `PL...`, `VL...` or any link containing `list=`
- For `getAudioStream`, `download`, `getLyrics`, `getQueue`, `getTrack`: a plain text query also works

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `ffmpeg exited with code ...` or `spawn ffmpeg ENOENT` | Install ffmpeg and make sure it is in `PATH` |
| `Failed to resolve audio stream for this track` | Try another track, or refresh your cookies |
| `YouTube Music API error: HTTP 403` | Cookies expired or IP blocked. Refresh cookies |
| `require() of ES Module` error | Update to the latest version, `require` is supported through `index.cjs` |
| File too large to send | Many platforms limit attachments to about 25 MB. Use shorter tracks |
| Empty search result | Try without `filter`, or check your internet / cookies |

## Notes

- This package uses YouTube's unofficial internal endpoints. They can change without notice.
- Use it only for content you have the right to download. You are responsible for how you use it.
- This project is not affiliated with YouTube or Google.

## Author

**Aryan Mugdho**

- GitHub: [aryannix](https://github.com/aryannix)
- Instagram: [aryannix07](https://instagram.com/aryannix07)

## License

MIT
