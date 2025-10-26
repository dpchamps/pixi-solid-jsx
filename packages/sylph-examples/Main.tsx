import { Application } from "sylph-jsx";
import { BasicExample } from "./readme-examples/BasicExample.tsx";
import { createWindowDimensions } from "sylph-jsx";
import { ClickSpriteExample } from "./readme-examples/ClickSpriteExample.tsx";
import { BasicCoroutineExample } from "./readme-examples/BasicCoroutineExample.tsx";
import { ControlsAndMovement } from "./readme-examples/ControlsAndMovement.tsx";
import { Input } from "./readme-examples/Input.tsx";
import { Pointer } from "./readme-examples/Pointer.tsx";

export const Main = () => {
  const windowDimensions = createWindowDimensions(window);

  return (
    <Application
      backgroundColor={"pink"}
      width={windowDimensions().innerWidth - 50}
      height={windowDimensions().innerHeight - 50}
      antialias={true}
    >
      {/*<BasicTest/>*/}
      {/*<BasicCoroutineExample/>*/}
      {/*<ControlsAndMovement />*/}
      {/*<Input />*/}
      <Pointer />
    </Application>
  );
};
