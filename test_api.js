import { browseByGenre, getTopTen } from './src/services/anime.js';
async function test() {
  try {
    const res = await browseByGenre('action');
    console.log("browseByGenre keys:", Object.keys(res));
    if (res.animes) console.log("Has animes");

    const top = await getTopTen();
    console.log("getTopTen keys:", Object.keys(top));
    if (top.animes) console.log("Has top animes");
  } catch(e) {
    console.error(e);
  }
}
test();
