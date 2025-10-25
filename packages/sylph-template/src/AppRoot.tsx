import { Game } from "./components/Game";
import { Application } from "sylph-jsx";

export const AppRoot = () => (
  <Application
    resolution={window.devicePixelRatio}
    autoDensity={true}
    antialias={true}
    background={"black"}
    roundPixels={true}
  >
    <Game />
  </Application>
);
