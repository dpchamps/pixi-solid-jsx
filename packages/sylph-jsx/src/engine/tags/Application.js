"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = exports.useApplicationState = void 0;
var index_js_1 = require("../../pixi-jsx/solidjs-universal-renderer/index.js");
var utility_types_js_1 = require("../../utility-types.js");
var time_js_1 = require("../core/time.js");
var GameLoopContextProvider_jsx_1 = require("./GameLoopContextProvider.jsx");
var devtools_1 = require("@pixi/devtools");
var ApplicationContext = (0, index_js_1.createContext)();
/**
 * Hook to access the PixiJS Application instance from any child component.
 *
 * @returns {ApplicationState} Object containing the PixiJS Application instance
 * @throws {Error} If called outside of an Application component tree
 *
 * @example
 * const ChildComponent = () => {
 *   const { application } = useApplicationState();
 *   // Access PixiJS app directly
 *   console.log(application.renderer.width);
 *   return <sprite />;
 * };
 */
var useApplicationState = function () {
    var applicationState = (0, index_js_1.useContext)(ApplicationContext);
    (0, utility_types_js_1.invariant)(applicationState, "app state undefined");
    return applicationState;
};
exports.useApplicationState = useApplicationState;
/**
 * Root component that initializes a PixiJS Application and integrates it with SolidJS's reactive system.
 *
 * **Core Responsibilities:**
 * - Initializes PixiJS Application with custom ticker integration
 * - Synchronizes SolidJS reactive graph with PixiJS rendering loop
 * - Provides ApplicationContext and GameLoopContext to all child components
 * - Manages async initialization with loading states
 * - Enables PixiJS devtools integration
 *
 * **Context Providers:**
 * - `ApplicationContext`: Provides access to PixiJS Application instance via {@link useApplicationState}
 * - `GameLoopContext`: Provides frame-synchronized effects and frame counting
 *
 * **Key Props:**
 * - `createTicker`: Optional factory function to provide custom ticker (primarily for testing)
 * - `appInitialize`: Optional async callback invoked after PixiJS app initialization
 * - `loadingState`: Optional JSX to display during async initialization (defaults to "Loading..." text)
 * - All standard PixiJS Application options (width, height, background, etc.)
 *
 * **Initialization Flow:**
 * 1. Component mounts and creates ApplicationNode
 * 2. Custom ticker is assigned before initialization (critical for performance)
 * 3. PixiJS Application initializes asynchronously
 * 4. Optional `appInitialize` callback executes
 * 5. Ticker starts and children render
 *
 * @example
 * // Basic usage
 * const Game = () => (
 *   <Application width={800} height={600} background={0x1099bb}>
 *     <sprite x={100} y={100} />
 *   </Application>
 * );
 *
 * @example
 * // With initialization callback
 * const Game = () => (
 *   <Application
 *     width={800}
 *     height={600}
 *     appInitialize={async (app) => {
 *       await Assets.load('spritesheet.json');
 *       console.log('Assets loaded, app ready');
 *     }}
 *     loadingState={<text>Loading assets...</text>}
 *   >
 *     <sprite texture="loaded-texture" />
 *   </Application>
 * );
 *
 * @example
 * // With custom ticker (testing)
 * const TestGame = () => (
 *   <Application createTicker={() => new FakeTicker()}>
 *     <sprite />
 *   </Application>
 * );
 */
var Application = function (props) {
    var _a;
    var _b = (0, index_js_1.createSignal)(), application = _b[0], setApplication = _b[1];
    var scheduledEffects = new Map();
    var timer = (0, time_js_1.createTimer)({
        nextFrameFns: scheduledEffects,
        createTicker: props.createTicker,
    });
    var applicationState = {
        application: null,
    };
    var applicationReady = (0, index_js_1.createResource)(application, function (app) { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, devtools_1.initDevtools)({ app: app.container })];
                case 1:
                    _b.sent();
                    /**
                     * @warn
                     * You must assign the ticker prior to initialization.
                     * Otherwise, another ticker will start and can cause (to the best of my knowledge)
                     * two stage renders simultaneously.
                     *
                     * This will cause FPS degradation and frame drop stuttering.
                     */
                    app.container.ticker = timer.ticker;
                    return [4 /*yield*/, app.initialize()];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, ((_a = props.appInitialize) === null || _a === void 0 ? void 0 : _a.call(props, app.container))];
                case 3:
                    _b.sent();
                    timer.ticker.start();
                    applicationState.application = app.container;
                    return [2 /*return*/, true];
            }
        });
    }); })[0];
    var fallback = (_a = props.loadingState) !== null && _a !== void 0 ? _a : <text>Loading...</text>;
    return (<application {...props} ref={setApplication}>
      <container>
        <GameLoopContextProvider_jsx_1.GameLoopContextProvider gameLoopContext={{ frameCount: timer.frameCount, scheduledEffects: scheduledEffects }}>
          <ApplicationContext.Provider value={applicationState}>
            <index_js_1.Show when={applicationReady()} fallback={fallback}>
              {props.children}
            </index_js_1.Show>
          </ApplicationContext.Provider>
        </GameLoopContextProvider_jsx_1.GameLoopContextProvider>
      </container>
    </application>);
};
exports.Application = Application;
