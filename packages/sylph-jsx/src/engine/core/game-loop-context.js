"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGameLoopContext = exports.GameLoopContext = void 0;
var index_js_1 = require("../../pixi-jsx/solidjs-universal-renderer/index.js");
var utility_types_js_1 = require("../../utility-types.js");
debugger;
exports.GameLoopContext = (0, index_js_1.createContext)();
/**
 * Hook to access the game loop context from any child component.
 *
 * Provides access to frame counting and effect scheduling for frame-synchronized operations.
 * Most users should prefer {@link createSynchronizedEffect} from "engine/core/query-fns" instead
 * of using this hook directly.
 *
 * @returns {GameLoopContext} Object containing frameCount accessor and scheduledEffects map
 * @throws {Error} If called outside of a GameLoopContextProvider/Application tree
 *
 *
 */
var useGameLoopContext = function () {
    var gameLoopContext = (0, index_js_1.useContext)(exports.GameLoopContext);
    (0, utility_types_js_1.invariantUseContext)(gameLoopContext, "GameLoopContext");
    return gameLoopContext;
};
exports.useGameLoopContext = useGameLoopContext;
