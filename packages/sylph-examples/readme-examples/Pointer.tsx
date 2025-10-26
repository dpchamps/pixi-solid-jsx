import {
  createKeyboard,
  createSynchronizedEffect,
  createSignal,
  createPointer,
} from "sylph-jsx";

export const Pointer = () => {
  const pointer = createPointer(window, { expect: true });
  const [pos, setPos] = createSignal({ x: 0, y: 0 });
  const [type, setType] = createSignal("none");
  const onPointerMove = pointer.onPointerEvent(["pointerdown", "pointerup"], {
    filter: (event) => event.isPrimary,
  });

  createSynchronizedEffect(onPointerMove, (pointer) => {
    const [main] = pointer;
    if (!main) return;
    setType(main.eventType);
    setPos({
      x: main.x,
      y: main.y,
    });
  });

  return (
    <>
      <text>Capabilities: {JSON.stringify(pointer.capabilities, null, 0)}</text>
      <text y={50}>
        Coords: {JSON.stringify(pos())}, Type: {type()}
      </text>
    </>
  );
};
