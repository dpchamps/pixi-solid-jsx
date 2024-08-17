import {createControllerDirection} from "./createControllerDirection.ts";
import {onNextFrame, useApplicationState} from "../core-tags/Application.tsx";
import {Entity} from "./Entity.tsx";
import {useGameState} from "./Game.tsx";
import {Index} from "../solid-custom-renderer";
import {createEntityList, EntityList} from "./createEntityList.ts";
import {unwrap} from "solid-js/store";
import {overlaps} from "./position.ts";

const createPlayerEntity = (entityList: EntityList) => {
    const playerId = "player";
    const gameState = useGameState();
    const controllerDirection = createControllerDirection(gameState.controller);
    entityList.createEntity({
        id: playerId,
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        texture: "fire.png"
    });

    onNextFrame({
        query: (appState) => {
            const deltaTime = appState.time.deltaTime();
            const {x, y} = {x: controllerDirection.x(), y: controllerDirection.y()};

            return {
                x: x*2*deltaTime,
                y: y*2*deltaTime
            }
        },
        tick: (nextPosition) => {
            entityList.updateEntity("player", ({x, y}) => ({
                x: x+nextPosition.x,
                y: y+nextPosition.y
            }));
        }
    });

    return playerId;
}

const createOtherEntity = (entityList: EntityList) => {
    const otherId = "other";
    const applicationState = useApplicationState();
    entityList.createEntity({
        id: otherId,
        x: applicationState.application.canvas.width/2,
        y: applicationState.application.canvas.height/2,
        width: 50,
        height: 50,
        texture: "fire.png"
    });

    return otherId;
}

export const Scene1 = () => {
    const applicationState = useApplicationState();
    const entityList = createEntityList();
    const playerId = createPlayerEntity(entityList);
    const otherId = createOtherEntity(entityList);

    onNextFrame({
        query: () => {
            const player = entityList.expectEntity(playerId);
            const other = entityList.expectEntity(otherId);

            return {player, other}
        },
        tick: (entities) => {
            console.log("This is lazy and only updates when the query updates");
            applicationState.application.renderer.background.color = overlaps(entities.player, entities.other) ? "grey" : "pink"
        }
    })

    return (
        <>
            <Index each={entityList.entities()}>
                {
                    (props) => <Entity {...props()}/>
                }
            </Index>
        </>
    )
}