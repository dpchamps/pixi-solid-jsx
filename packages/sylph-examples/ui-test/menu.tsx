// import { JSX } from "jsx-runtime/jsx-runtime.ts";
// import {
//   children,
//   createEffect,
//   createSignal,
//   For,
//   onMount,
//   untrack,
// } from "solid-custom-renderer/patched-types.ts";
// import { ProxyNode } from "sylph-jsx/src/pixi-jsx/proxy-dom/nodes/Node.ts";
// import { createAsset } from "sylph-jsx/src/engine/effects/createAsset.ts";
// import { Container, Texture, Text } from "pixi.js";
// import { createController } from "../example-1/createController.ts";
// import { ContainerNode } from "sylph-jsx/src/pixi-jsx/proxy-dom";
// import { invariant } from "sylph-jsx/src/utility-types.ts";
// import { Box } from "./BackgroundContainer.tsx";
// import { FlexBox } from "sylph-jsx/src/engine/tags/deprecated/FlexBox/FlexBox.tsx";
//
// type HorizontalSpacingProps = {
//   x?: number;
//   y?: number;
//   margin?: number;
//   padding?: number;
//   type: "vertical" | "horizontal";
// };
//
// const Spacer = (props: JSX.PixieNodeProps<HorizontalSpacingProps>) => {
//   const childRef = children(() => props.children);
//   const margin = props.margin || 0;
//   const padding = props.padding || 0;
//
//   return (
//     <container x={props.x || 0} y={props.y || 0}>
//       {childRef.toArray().map((el, index) => {
//         if (el instanceof ProxyNode) {
//           switch (props.type) {
//             case "horizontal": {
//               el.container.x = index * (margin + padding);
//               break;
//             }
//             case "vertical": {
//               el.container.y = index * (margin + padding);
//               break;
//             }
//           }
//         }
//         return el;
//       })}
//     </container>
//   );
// };
//
// const PixiePrimitive = (props: { children: () => Container }) => {
//   const [jsxContainerRef, setJsxContainerRef] = createSignal<ContainerNode>();
//   onMount(() => {
//     const parentContainer = jsxContainerRef();
//     invariant(parentContainer);
//     const x = props.children();
//     parentContainer.container.addChild(x);
//     x.parent = parentContainer.container;
//     debugger;
//   });
//   return <container ref={setJsxContainerRef} />;
// };
//
// export const Menu = (props: JSX.PixieNodeProps<{ visible: boolean }>) => {
//   const texture = createAsset<Texture>("fire.png");
//   const controller = createController();
//   const onNavigate = controller.onKeyPress(
//     "KeyW",
//     "KeyS",
//     "Enter",
//     "ShiftRight",
//   );
//   const [selectIndex, setSelectIndex] = createSignal(0);
//   const [menu, setMenu] = createSignal([
//     "Menu Item One",
//     "Menu Item Two",
//     "Menu Item Three",
//   ]);
//
//   const indicatorPosition = () => selectIndex() * 60 - 25;
//   createEffect(() => {
//     if (!props.visible) return;
//     const keyPress = onNavigate();
//
//     if (keyPress.includes("KeyW")) {
//       setSelectIndex((idx) => idx - 1);
//     } else if (keyPress.includes("KeyS")) {
//       setSelectIndex((idx) => idx + 1);
//     }
//
//     if (keyPress.includes("Enter")) {
//       setMenu((els) => [...els, `Something new ${Math.random()}`]);
//     }
//
//     if (keyPress.includes("ShiftRight")) {
//       setMenu((els) => els.splice(0, els.length - 1));
//     }
//
//     setSelectIndex((idx) =>
//       Math.max(0, Math.min(untrack(menu).length - 1, idx)),
//     );
//   });
//
//   return (
//     <Box
//       type={"fixed"}
//       x={0}
//       y={0}
//       width={400}
//       height={400}
//       backgroundColor={"grey"}
//       borderColor={"grey"}
//     >
//       <sprite
//         x={-25}
//         y={indicatorPosition()}
//         texture={texture()!}
//         width={50}
//         height={50}
//       />
//
//       <FlexBox orientation={"vertical"} padding={60}>
//         <For each={menu()}>{(title) => <text>{title}</text>}</For>
//       </FlexBox>
//     </Box>
//   );
// };
