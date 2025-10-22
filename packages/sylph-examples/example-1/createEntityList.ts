// import { EntityProps } from "./Entity.tsx";
// import { invariant } from "sylph-jsx/src/utility-types.ts";
// import { createSignal } from "solid-js";
// import { shallowAssignAndDiff } from "sylph-jsx/src/utility-arrays.ts";
//
// export type EntityList = ReturnType<typeof createEntityList>;
// export const createEntityList = () => {
//   const list: EntityProps[] = [];
//   const indexMap = new Map<string, number>();
//   const [update, setUpdate] = createSignal(false, { equals: false });
//   const updateIfNeeded = () => (!update() ? setUpdate(true) : false);
//   const observeUpdate = () => (update() ? setUpdate(false) : true);
//   const entitiesComputed = () => (observeUpdate() ? list : list);
//
//   return {
//     entities: entitiesComputed,
//     createEntity: (data: EntityProps) => {
//       const idx = list.push(data);
//       updateIfNeeded();
//       indexMap.set(data.id, idx - 1);
//     },
//     updateEntity: (
//       id: string,
//       fn: (previousEntity: EntityProps) => Partial<EntityProps>,
//     ) => {
//       const entityIdx = indexMap.get(id);
//       if (typeof entityIdx === "undefined") return;
//       const entity = list[entityIdx];
//       invariant(entity);
//
//       const maybeUpdatedProps = fn(entity);
//       const wasMutated = shallowAssignAndDiff(entity, maybeUpdatedProps);
//       if (wasMutated) {
//         list[entityIdx] = { ...entity };
//         updateIfNeeded();
//       }
//     },
//     removeEntity: (id: string) => {
//       const entityIdx = indexMap.get(id);
//       if (typeof entityIdx === "undefined") return;
//       list.splice(entityIdx, 1);
//       indexMap.delete(id);
//       for (let i = entityIdx; i <= list.length - 1; i += 1) {
//         const entity = list[i];
//         invariant(entity);
//         indexMap.set(entity.id, i);
//       }
//       setUpdate(true);
//     },
//     expectEntity: (id: string) => {
//       const entityIdx = indexMap.get(id);
//       invariant(entityIdx);
//       const entity = entitiesComputed()[entityIdx];
//       invariant(entity, `expected entity ${id} to exist`);
//       return entity;
//     },
//   };
// };
