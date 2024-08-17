import {createStore} from "solid-js/store";
import {createComputed, createEffect, createSignal, onCleanup} from "solid-js";
import {shallowEqual} from "shallow-equal";

export type Controller = ReturnType<typeof createController>;
export const createController = () => {
    const [keyState, setKeyState] = createStore({
        keyDown: new Set<string>(),
    });

    createComputed(() => {
        const keyDownListener = (event: KeyboardEvent) => {
            setKeyState('keyDown', (x) => {
                x.add(event.code);
                return new Set(x);
            });
        };
        window.addEventListener('keydown', keyDownListener);

        const keyUpListener = (event: KeyboardEvent) => {
            setKeyState('keyDown', (x) => {
                x.delete(event.code);
                return new Set(x);
            });
        }
        window.addEventListener('keyup', keyUpListener);

        onCleanup(() => {
            window.removeEventListener('keydown', keyDownListener)
            window.removeEventListener('keyup', keyUpListener)
        });
    });

    return {
        onKeyPress: (...keyCodes: string[]) => {
            const [keyDown, setKeyDown] = createSignal<string[]>(
                [],
                {equals: (prev, next) => shallowEqual(prev, next)}
            );
            createEffect(() => {
                setKeyDown(keyCodes.filter((keyCode) => keyState.keyDown.has(keyCode)));
            })
            return keyDown;
        }
    }
}