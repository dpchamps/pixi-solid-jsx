import { describe, test, expect } from "vitest";
import { invariant } from "../../../utility-types";
import { renderPixiScene } from "../../../__tests__/test-utils/test-utils.tsx";
import { ContainerNode, TextNode, SpriteNode } from "../../proxy-dom";

describe("Node ID generation", () => {
  test("IDs increment sequentially", () => {
    const node1 = ContainerNode.create();
    const node2 = ContainerNode.create();
    const node3 = ContainerNode.create();

    expect(node2.id).toBe(node1.id + 1);
    expect(node3.id).toBe(node2.id + 1);
  });

  test("IDs never reset between operations", () => {
    const before = ContainerNode.create();

    ContainerNode.create();
    TextNode.create();
    SpriteNode.create();

    const after = ContainerNode.create();

    expect(after.id - before.id).toBe(4);
  });

  test("ProxyNodes from different renders share global ID sequence", () => {
    const html1 = renderPixiScene(() => <application><container /></application>);
    const html2 = renderPixiScene(() => <application><container /></application>);

    const app1 = html1.getChildren()[0];
    const app2 = html2.getChildren()[0];
    invariant(app1);
    invariant(app2);

    expect(app2.id).toBeGreaterThan(app1.id);
  });

  test("nested renders accumulate IDs globally", () => {
    const html1 = renderPixiScene(() => (
      <application>
        <container>
          <text>A</text>
          <text>B</text>
        </container>
      </application>
    ));

    const html2 = renderPixiScene(() => (
      <application>
        <container>
          <text>C</text>
        </container>
      </application>
    ));

    const app1Node = html1.getChildren()[0];
    const app2Node = html2.getChildren()[0];
    invariant(app1Node);
    invariant(app2Node);

    const app1Children = app1Node.getChildren();
    const app2Children = app2Node.getChildren();
    const lastApp1Child = app1Children[app1Children.length - 1];
    const firstApp2Child = app2Children[0];
    invariant(lastApp1Child);
    invariant(firstApp2Child);

    expect(firstApp2Child.id).toBeGreaterThan(lastApp1Child.id);
  });
});