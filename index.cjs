'use strict';

const names = [
  'parseCookies',
  'getInnertubeConfig',
  'extractVideoId',
  'extractBrowseId',
  'search',
  'getAudioStream',
  'getLyrics',
  'getQueue',
  'getTrack',
  'getAlbum',
  'getArtist',
  'getPlaylist',
  'getCharts',
  'getExplore',
  'download',
  'getThumbnail'
];

let loader = null;
const load = () => (loader || (loader = import('./index.js')));

const api = {};
for (const name of names) {
  api[name] = async (...args) => (await load())[name](...args);
}

module.exports = api;
module.exports.default = api;
