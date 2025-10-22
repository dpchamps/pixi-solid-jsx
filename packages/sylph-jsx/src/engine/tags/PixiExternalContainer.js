"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PixiExternalContainer = void 0;
var index_js_1 = require("../../pixi-jsx/solidjs-universal-renderer/index.js");
/**
 * Bridges imperatively-created PixiJS Container instances into the declarative pixi-jsx render tree.
 *
 * @description
 * Allows you to inject containers created outside of JSX into the reactive scene graph.
 *
 * ## When to Use
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
var PixiExternalContainer = function (props) {
    var _a = (0, index_js_1.createSignal)(), containerRef = _a[0], setContainerRef = _a[1];
    var _b = (0, index_js_1.createSignal)(), previousContainer = _b[0], setPreviousContainer = _b[1];
    var maybeRemovePreviousContainer = function () {
        var _a;
        var prev = previousContainer();
        if (prev) {
            (_a = containerRef()) === null || _a === void 0 ? void 0 : _a.removeChildProxyUntracked(prev);
        }
    };
    (0, index_js_1.onCleanup)(maybeRemovePreviousContainer);
    (0, index_js_1.createEffect)(function () {
        var _a;
        maybeRemovePreviousContainer();
        if (!props.container)
            return;
        (_a = containerRef()) === null || _a === void 0 ? void 0 : _a.addChildProxyUntracked(props.container);
        setPreviousContainer(props.container);
    });
    return <container {...props} ref={setContainerRef}/>;
};
exports.PixiExternalContainer = PixiExternalContainer;
