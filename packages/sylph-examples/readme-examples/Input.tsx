import {
  createKeyboard,
  createSynchronizedEffect,
  createSignal,
} from "sylph-jsx";

export const Input = () => {
  const keyboard = createKeyboard(window);
  const x = keyboard.onKeyPress("KeyA", "KeyQ");
  const y = keyboard.onKeyHold("KeyS", "KeyD");
  const [pressCount, setPressCount] = createSignal(0);
  const [pressed, setPressed] = createSignal<string[]>([]);
  const [holdCount, setHoldCount] = createSignal(0);
  const [held, setHeld] = createSignal<string[]>([]);

  createSynchronizedEffect(x, (press) => {
    setPressed(press);
    if (press.length === 0) return;
    setPressCount((last) => last + 1);
  });

  createSynchronizedEffect(y, (hold) => {
    setHeld(hold);
    if (hold.length === 0) return;
    setHoldCount((last) => last + 1);
  });

  return (
    <>
      <text>
        Press Count: {pressCount()}. Pressed: {pressed().join(",")}
      </text>
      <text y={50}>
        Hold Count: {holdCount()}. Held: {held().join(",")}
      </text>
    </>
  );
};
