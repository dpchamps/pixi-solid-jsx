import {createStore, produce} from "solid-js/store";
import {EntityProps} from "./Entity.tsx";
import {shallowEqual} from "shallow-equal";
import {invariant} from "../utility-types.ts";

export type EntityList = ReturnType<typeof createEntityList>;
export const createEntityList = () => {
    const [entities, setEntities] = createStore<Record<string, EntityProps>>({});
    return {
        entities: () => Object.values(entities),
        createEntity: (data: EntityProps) => {
            setEntities(produce((entities) => {
                entities[data.id] = data
            }))
        },
        updateEntity: (id: string, fn: (previousEntity: EntityProps) => Partial<EntityProps>) => {
            setEntities(produce((entities) => {
                const entity = entities[id]
                if(!entity) return;
                const next = {...entity, ...fn(entity)};
                if(shallowEqual(entity, next)) return;
                entities[id] = {...entity, ...fn(entity)};
            }))
        },
        getEntity: (id: string) => {
            return entities[id]
        },
        expectEntity: (id: string) => {
            const entity = entities[id];
            invariant(entity, `expected entity ${id} to exist`);
            return entity;
        }
    }
}