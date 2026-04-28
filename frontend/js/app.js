import WorldApp from "./app/world.app.js";

async function init() {
  const app = new WorldApp();
  await app.init();
}

init();
