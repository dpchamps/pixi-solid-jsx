import { PixiNodeProps } from "jsx-runtime/jsx-node.ts";
import { children } from "solid-custom-renderer/patched-types.ts";
import { Application } from "../../src/engine/tags/Application.tsx";

export const RendersWithChildren = (props: PixiNodeProps) => {
  const res = children(() => props.children);
  console.log(res, props.children);

  debugger;

  return <>{props.children}</>;
};

export const Parent = () => {
  return (
    <Application backgroundColor={"white"}>
      <RendersWithChildren>
        <container>
          <text>Hello!</text>
          {() => <text y={50}>Hello</text>}
        </container>
      </RendersWithChildren>
    </Application>
  );
};
