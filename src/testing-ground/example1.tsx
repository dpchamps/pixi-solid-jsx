import {createAsset} from "../core-effects/createAsset.ts";
import {Application, useApplicationState} from "../core-tags/Application.tsx";
import {Texture} from "pixi.js";
import {createController} from "../sandbox/createController.ts";
import {createControllerDirection} from "../sandbox/createControllerDirection.ts";
import {Entity} from "../sandbox/Entity.tsx";
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