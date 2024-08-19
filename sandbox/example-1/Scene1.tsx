import {createControllerDirection} from "./createControllerDirection.ts";
import {
    ApplicationState,
    onNextFrame,
    OnNextFrameQuery,
    useApplicationState
} from "../../src/engine/tags/Application.tsx";
import {Entity, EntityProps} from "./Entity.tsx";
import {GameState, useGameState} from "./Game.tsx";
import {Index, createEffect, createSignal, getOwner, runWithOwner, untrack} from "solid-custom-renderer/index.ts";
import {createEntityList, EntityList} from "./createEntityList.ts";
import {overlaps, randomBetween} from "./position.ts";
import {FpsCounter} from "./FpsCounter.tsx";
import {Texture} from "pixi.js";

const createPlayerEntity = (entityList: EntityList, gameState: GameState) => {
    const playerId = "player";
    const controllerDirection = createControllerDirection(gameState.controller);
    entityList.createEntity({
        id: playerId,
        x: 0 - (50/2),
        y: 0 - (50/2),
        width: 50,
        height: 50,
        texture: "fire.png",
        zIndex: 500,
    });

    onNextFrame({
        query: (appState) => {
            // const deltaTime = untrack(appState.time.deltaTime);
            const deltaTime = appState.time.deltaTime();
            const {x, y} = {x: controllerDirection.x(), y: controllerDirection.y()};

            return {
                x: x*3*deltaTime,
                y: y*3*deltaTime
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
        x: applicationState.application.canvas.width/2 - (50/2),
        y: applicationState.application.canvas.height/2 - (50/2),
        width: 50,
        height: 50,
        texture: "fire.png",
        tint: "grey",
        zIndex: 400
    });

    return otherId;
}

const createWanderingEntity = (entityList: EntityList, applicationState: ApplicationState) => {
    const [state, setState] = createSignal<keyof typeof states>("toCreate");

    const id = self.crypto.randomUUID();
    const width = 50;
    const height = 50;

    const randomDirection = {
        x: randomBetween(-1, 2)+0.5,
        y: randomBetween(-1, 2)+0.5,
    }

    const states = {
        toCreate: (): OnNextFrameQuery<{ entityId: string }> => ({
            query: () => {
                return {entityId: id}
            },
            tick: ({entityId}) => {
                entityList.createEntity({
                    id: entityId,
                    x: randomBetween(-(width/2), applicationState.application.canvas.width+(width/2)),
                    y: randomBetween(-(width/2), applicationState.application.canvas.width+(width/2)),
                    width,
                    height,
                    texture: "fire.png",
                    scale: 0.2,
                    spriteProps: {
                        onclick: () => {
                            setState("toDelete");
                        }
                    }
                });
                setState("created");
            }
        }),
        created: (): OnNextFrameQuery<{ entity: EntityProps, deltaTime: number }> => ({
            query: (applicationState) => ({entity: entityList.expectEntity(id), deltaTime: untrack(applicationState.time.deltaTime)}),
            tick: ({entity, deltaTime}) => {
                if(
                    entity.x >= applicationState.application.canvas.width ||
                    entity.x <= 0 ||
                    entity.y >= applicationState.application.canvas.height ||
                    entity.y <= 0
                ){
                    randomDirection.x = randomDirection.x*-1;
                    randomDirection.y = randomDirection.y*-1
                }
                entityList.updateEntity(id, ({x, y}) => ({
                    x: x+randomDirection.x*4*deltaTime,
                    y: y+randomDirection.y*4*deltaTime
                }));
            }
        }),
        toDelete: (): OnNextFrameQuery<{ entity: EntityProps }> => ({
            query: () => ({entity: entityList.expectEntity(id)}),
            tick: ({entity}) => {
                entityList.removeEntity(entity.id);
                setState("deleted")
            }
        }),
        deleted: () => ({
            query: () => {},
            tick: () => {}
        })
    }

    onNextFrame({
        query: (a) => {
            return states[state()]().query(a);
        },
        tick: (x) => {
            states[state()]().tick(x)
        }
    })


    return id;
}

export const Scene1 = () => {
    const applicationState = useApplicationState();
    const gameState = useGameState();
    const entityList = createEntityList();
    const playerId = createPlayerEntity(entityList, gameState);
    const otherId = createOtherEntity(entityList);
    const owner = getOwner();

    createEffect(() => {
        console.log("Scene1 Render")
    })

    onNextFrame({
        query: () => {
            const player = entityList.expectEntity(playerId);
            const other = entityList.expectEntity(otherId);

            return {player, other}
        },
        tick: (entities) => {
            const tint = overlaps(entities.player, entities.other) ? "pink" : "white";
            applicationState.application.renderer.background.color = overlaps(entities.player, entities.other) ? "grey" : "lightblue"
            for(const entity of entityList.entities()){
                entityList.updateEntity(entity.id, () => ({
                    tint
                }))
            }

        }
    });

    onNextFrame({
        query: (applicationState) => {
            return applicationState.time.deltaTime()
        },
        tick: () => {
            runWithOwner(owner, () => createWanderingEntity(entityList, applicationState))
        }
    })

    return (
        <>
            <container zIndex={10000}>
                <sprite texture={Texture.WHITE} width={270} height={75}/>
                <FpsCounter zIndex={10_000}/>
                <text y={25} zIndex={10000}>Entity Count: {`${entityList.entities().length}`}</text>
            </container>
            {/*<text>Helos</text>*/}
            <Index each={entityList.entities()}>
                {
                    (props) => <Entity {...props()}/>
                }
            </Index>
        </>
    )
}