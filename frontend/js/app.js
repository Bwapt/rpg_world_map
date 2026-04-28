import WorldApp from "./app/world.app.js";

/**
 * Point d'entree du frontend.
 *
 * @returns {Promise<void>}
 */
async function init() {
  const app = new WorldApp();
  await app.init();
}

init();
