import { Application } from "sylph-jsx";
import { BasicExample } from "./readme-examples/BasicExample.tsx";
import { createWindowDimensions } from "sylph-jsx";
import { ClickSpriteExample } from "./readme-examples/ClickSpriteExample.tsx";
import { BasicCoroutineExample } from "./readme-examples/BasicCoroutineExample.tsx";
import { ControlsAndMovement } from "./readme-examples/ControlsAndMovement.tsx";

export const Main = () => {
  const windowDimensions = createWindowDimensions(window);

  return (
    <Application
      backgroundColor={"pink"}
      width={windowDimensions().outerWidth}
      height={windowDimensions().outerHeight}
      antialias={true}
    >
      {/*<BasicTest/>*/}
      {/*<BasicCoroutineExample/>*/}
      <ControlsAndMovement />
    </Application>
  );
};
