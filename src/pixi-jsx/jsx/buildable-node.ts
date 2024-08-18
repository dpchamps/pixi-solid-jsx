import {BuildableNode, BuildablePixiJsxNode} from "./jsx-node.ts";
import {assert, invariant, isDefined, Maybe} from "../../utility-types.ts";

let _id = 0;
const getId = () => ++_id;

type BuildableNodeOptions<Tag extends string, Container> =
    Pick<BuildableNode<Tag, Container>, "tag" | "container">
    & Partial<Omit<BuildableNode<Tag, Container>, "tag" | "container">>
    & {
    onAddChild: (child: BuildablePixiJsxNode, children: BuildablePixiJsxNode[]) => BuildablePixiJsxNode,
    onRemoveChild: (child: BuildablePixiJsxNode, children: BuildablePixiJsxNode[]) => void
    } & Record<string, unknown>
export const buildableNode= <Tag extends string, Container> (options: BuildableNodeOptions<Tag, Container>): BuildableNode<Tag, Container> => {
    let parent: Maybe<BuildablePixiJsxNode> = null;
    const originalChildrenNodes: BuildablePixiJsxNode[] = [];
    const augmentedChildrenNodes: BuildablePixiJsxNode[] = [];

    const id = getId();
    const {onAddChild, onRemoveChild, ...restOptions} = options

    return {
        get id(){
            return id;
        },
        addChild(child){
            const addedChild = onAddChild(child, originalChildrenNodes);
            originalChildrenNodes.push(child);
            augmentedChildrenNodes.push(addedChild)
            child.setParent(this as BuildablePixiJsxNode)
        },
        removeChild(child){
            const index = originalChildrenNodes.findIndex((originalNode) => originalNode.id === child.id);
            assert(index > -1, "this should never happen");
            const originalChildElement = originalChildrenNodes[index];
            const augmentedChildrenNode = augmentedChildrenNodes[index];
            invariant(originalChildElement);
            invariant(augmentedChildrenNode);
            onRemoveChild(augmentedChildrenNode, augmentedChildrenNodes)
            originalChildrenNodes.splice(index, 1);
            augmentedChildrenNodes.splice(index, 1);
        },
        setParent: (value: BuildablePixiJsxNode) => {
            parent = value;
        },
        getParent: () => isDefined(parent) ? parent : undefined,
        getChildren: () => originalChildrenNodes,
        setProp: (name, value) => {
            if(typeof options.container === 'object' && options.container !== null){
                Reflect.set(options.container, name, value)
            } else {
                // invariant?
            }
        },

        ...restOptions
    }
}