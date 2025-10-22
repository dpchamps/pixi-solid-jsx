import { describe, test, expect } from "vitest";
import { Container } from "pixi.js";
import { renderApplicationNode } from "../../../__tests__/test-utils/test-utils";
import { ContainerNode } from "../../proxy-dom";

describe("untracked child operations", () => {
  test("addChildProxyUntracked adds to PixiJS but not tracked children", async () => {
    await renderApplicationNode(() => (
      <container>
        <text>Tracked Child</text>
      </container>
    ));

    const containerNode = ContainerNode.create();
    const untrackedContainer = new Container();

    containerNode.addChildProxyUntracked(untrackedContainer);

    expect(containerNode.container.children).toContain(untrackedContainer);
    expect(containerNode.getChildren().length).toBe(0);
  });

  test("removeChildProxyUntracked removes from PixiJS", async () => {
    const containerNode = ContainerNode.create();
    const untracked1 = new Container();
    const untracked2 = new Container();

    containerNode.addChildProxyUntracked(untracked1);
    containerNode.addChildProxyUntracked(untracked2);

    expect(containerNode.container.children.length).toBe(2);

    containerNode.removeChildProxyUntracked(untracked1);

    expect(containerNode.container.children.length).toBe(1);
    expect(containerNode.container.children).toContain(untracked2);
    expect(containerNode.container.children).not.toContain(untracked1);
  });

  test("syncUntracked restores untracked children after removal", () => {
    const containerNode = ContainerNode.create();
    const untracked = new Container();

    containerNode.addChildProxyUntracked(untracked);
    expect(containerNode.container.children).toContain(untracked);

    containerNode.container.removeChild(untracked);
    expect(containerNode.container.children).not.toContain(untracked);

    containerNode.syncUntracked();
    expect(containerNode.container.children).toContain(untracked);
  });

  test("tracked and untracked children coexist", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <text>Tracked 1</text>
        <text>Tracked 2</text>
      </container>
    ));

    const containerPixi = stage.children[0] as Container;
    expect(containerPixi.children.length).toBe(2);

    const containerNode = ContainerNode.create();
    const untracked = new Container();

    containerNode.container.addChild(containerPixi);
    containerNode.addChildProxyUntracked(untracked);

    expect(containerNode.container.children.length).toBe(2);
    expect(containerNode.getChildren().length).toBe(0);
  });

  test("multiple untracked children maintain order", () => {
    const containerNode = ContainerNode.create();
    const untracked1 = new Container();
    const untracked2 = new Container();
    const untracked3 = new Container();

    untracked1.label = "first";
    untracked2.label = "second";
    untracked3.label = "third";

    containerNode.addChildProxyUntracked(untracked1);
    containerNode.addChildProxyUntracked(untracked2);
    containerNode.addChildProxyUntracked(untracked3);

    expect(containerNode.container.children.length).toBe(3);
    expect((containerNode.container.children[0] as Container).label).toBe(
      "first",
    );
    expect((containerNode.container.children[1] as Container).label).toBe(
      "second",
    );
    expect((containerNode.container.children[2] as Container).label).toBe(
      "third",
    );
  });

  test("removing all untracked children", () => {
    const containerNode = ContainerNode.create();
    const untracked1 = new Container();
    const untracked2 = new Container();

    containerNode.addChildProxyUntracked(untracked1);
    containerNode.addChildProxyUntracked(untracked2);

    expect(containerNode.container.children.length).toBe(2);

    containerNode.removeChildProxyUntracked(untracked1);
    containerNode.removeChildProxyUntracked(untracked2);

    expect(containerNode.container.children.length).toBe(0);
  });

  test("syncUntracked handles multiple untracked children", () => {
    const containerNode = ContainerNode.create();
    const untracked1 = new Container();
    const untracked2 = new Container();

    containerNode.addChildProxyUntracked(untracked1);
    containerNode.addChildProxyUntracked(untracked2);

    containerNode.container.removeChild(untracked1);
    containerNode.container.removeChild(untracked2);

    expect(containerNode.container.children.length).toBe(0);

    containerNode.syncUntracked();

    expect(containerNode.container.children.length).toBe(2);
    expect(containerNode.container.children).toContain(untracked1);
    expect(containerNode.container.children).toContain(untracked2);
  });

  test("untracked children survive tracked child operations", async () => {
    const stage = await renderApplicationNode(() => <container />);

    const trackedContainer = stage.children[0] as Container;
    const containerNode = ContainerNode.create();
    const untracked = new Container();

    containerNode.container.addChild(trackedContainer);
    containerNode.addChildProxyUntracked(untracked);

    const trackedChild = ContainerNode.create();
    containerNode.addChild(trackedChild as any);

    expect(containerNode.container.children).toContain(untracked);
    expect(containerNode.getChildren().length).toBe(1);
  });

  test("removing untracked child by uid", () => {
    const containerNode = ContainerNode.create();
    const untracked1 = new Container();
    const untracked2 = new Container();

    containerNode.addChildProxyUntracked(untracked1);
    containerNode.addChildProxyUntracked(untracked2);

    const uid1 = untracked1.uid;
    containerNode.removeChildProxyUntracked(untracked1);

    const remaining = containerNode.container.children as Container[];
    expect(remaining.every((c) => c.uid !== uid1)).toBe(true);
  });

  test("syncUntracked is idempotent", () => {
    const containerNode = ContainerNode.create();
    const untracked = new Container();

    containerNode.addChildProxyUntracked(untracked);

    containerNode.syncUntracked();
    const lengthAfterFirstSync = containerNode.container.children.length;

    containerNode.syncUntracked();
    const lengthAfterSecondSync = containerNode.container.children.length;

    expect(lengthAfterFirstSync).toBe(lengthAfterSecondSync);
    expect(lengthAfterSecondSync).toBe(1);
  });
});
