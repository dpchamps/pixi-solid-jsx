import {RuntimeNode} from "jsx-runtime/jsx-core-runtime.ts";
import {Application, Container} from "pixi.js";
import {RawNode, RuntimeTextNode} from "jsx-runtime/jsx-node.ts";
import {isSome} from "../utility-types.ts";

export const withChild = <T extends Container|Application>(parent: RuntimeNode<T>, child: RuntimeNode|RawNode) => {
    const _child = isSome(child, "string", "number") ? RuntimeTextNode({text: child}) : child;
    if("addChild" in parent){
        parent.addChild(_child);
    } else {
        parent.stage.addChild(_child)
    }
    return parent;
}