import { renderRoot } from "../src/pixi-jsx";
import { Main } from "./Main.tsx";
import { Game } from "./example-1/Game.tsx";
// import {Scene1} from "./example-1/Scene1.tsx";

const main = async () => {
  const start = performance.now();
  console.log("rendering...");
  // renderRoot(Scene1, document.body)
  renderRoot(Main, document.body);
  console.log(`rendered ${performance.now() - start}`);
};

main().catch((error) => {
  console.error(``);
  console.error(error);
  debugger;
});
