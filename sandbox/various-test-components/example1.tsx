import {createAsset} from "../../src/core-effects/createAsset.ts";
import {Application, useApplicationState} from "../../src/core-tags/Application.tsx";
import {Texture} from "pixi.js";
import {createController} from "../example-1/createController.ts";
import {createControllerDirection} from "../example-1/createControllerDirection.ts";
import {Entity} from "../example-1/Entity.tsx";
import {createStore} from "solid-js/store";
import {createEffect} from "solid-js";

export const ClickSpriteExample = () => {
    const controller = createController();
    const direction = createControllerDirection(controller);
    const [playerState, setPlayerState] = createStore({
        x: 0,
        y: 0
    });
    const [applicationState] = useApplicationState() || [] as any;
    createEffect(() => {
        console.log(applicationState);
        setPlayerState((p) => ({
            x: p.x+direction.x()*2,
            y: p.y+direction.y()*2
        }))
    });
    return (
        <Application background={'#ecdddd'} width={500} height={500}>
            <Entity {...playerState}></Entity>
        </Application>
    )
}