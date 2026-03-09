import * as anime from './src/services/anime.js';

async function test() {
  try {
    let res = await anime.getStreamLink('steinsgate-3::ep=213', 'hd-1', 'sub', 'hianime-scrap');
    console.log("Stream Link Data:", JSON.stringify(res).substring(0, 500));
  } catch(e) {
    console.error(e);
  }
}
test();
