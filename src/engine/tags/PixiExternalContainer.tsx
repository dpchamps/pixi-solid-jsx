import {Container} from "pixi.js";
import {createEffect, createSignal, onCleanup} from "../../pixi-jsx/solidjs-universal-renderer";
import {ContainerNode} from "../../pixi-jsx/proxy-dom";
import {ContainerIntrinsicProps} from "../../pixi-jsx/jsx/jsx-node";

/**
 * Bridges imperatively-created PixiJS Container instances into the declarative pixi-jsx render tree.
 *
 * @description
 * Allows you to inject containers created outside of JSX into the reactive scene graph.
 *
 * ## When to Use
 * - Third-party PixiJS libraries that return pre-built Container instances
 * - Gradual migration from imperative PixiJS code to declarative patterns
 * - Advanced container control requiring fine-grained lifecycle management
 * - Dynamic container sourcing from external systems (plugins, procedural generation, etc.)
 *
 * ## When NOT to Use
 * - Simple declarative needs - use `<container>` directly instead
 * - Static content that never changes - wrap creation logic in a component instead
 *
 * @example
 * // Basic usage
 * const myContainer = new Container();
 * <PixiExternalContainer container={myContainer} x={100} y={50} />
 *
 * @example
 * // Reactive updates
 * const [currentContainer, setCurrentContainer] = createSignal<Container>();
 * <PixiExternalContainer container={currentContainer()} />
 *
 * @example
 * // With JSX children
 * <PixiExternalContainer container={externalContainer()}>
 *   <text>This text is a tracked child</text>
 *   <sprite texture={texture()} />
 * </PixiExternalContainer>
 *
 * @remarks
 * - External container is managed via the "untracked children" API
 * - Does not participate in normal SolidJS reactivity tracking
 * - Container lifecycle is controlled by the caller, not the component
 * - Multiple instances can coexist without conflict
 * - Automatically removes external container on component unmount
 * - When container prop changes, old container is swapped for new one
 */
export const PixiExternalContainer = (props: ContainerIntrinsicProps & { container: Container|undefined }) => {
    const [
        containerRef,
        setContainerRef
    ] = createSignal<ContainerNode>();

    const [
        previousContainer,
        setPreviousContainer
    ] = createSignal<Container>();

    const maybeRemovePreviousContainer = () => {
        const prev = previousContainer();
        if(prev) {
            containerRef()?.removeChildProxyUntracked(prev);
        }
    }

    onCleanup(maybeRemovePreviousContainer);

    createEffect(() => {
        maybeRemovePreviousContainer();
        if(!props.container) return;

        containerRef()?.addChildProxyUntracked(props.container);
        setPreviousContainer(props.container);
    })


    return (
        <container {...props} ref={setContainerRef} />
    );
}