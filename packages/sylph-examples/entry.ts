import { renderRoot } from "sylph-jsx";
import { Main } from "./Main.tsx";

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
  // eslint-disable-next-line no-debugger
  debugger;
});
