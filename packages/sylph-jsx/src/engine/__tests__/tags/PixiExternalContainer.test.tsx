import { describe, test, expect } from "vitest";
import { createSignal } from "../../../pixi-jsx/solidjs-universal-renderer";
import { Container, Text } from "pixi.js";
import { renderApplicationNode } from "../../../__tests__/test-utils/test-utils";
import { PixiExternalContainer } from "../../../engine/tags/PixiExternalContainer";

describe("PixiExternalContainer", () => {
  test("adds external container to scene graph", async () => {
    const externalContainer = new Container();
    externalContainer.label = "external";

    const stage = await renderApplicationNode(() => (
      <PixiExternalContainer container={externalContainer} />
    ));

    const wrapperContainer = stage.children[0] as Container;
    expect(wrapperContainer.children.length).toBe(1);
    expect(wrapperContainer.children[0]).toBe(externalContainer);
    expect((wrapperContainer.children[0] as Container).label).toBe("external");
  });

  test("undefined container renders empty", async () => {
    const stage = await renderApplicationNode(() => (
      <PixiExternalContainer container={undefined} />
    ));

    const wrapperContainer = stage.children[0] as Container;
    expect(wrapperContainer.children.length).toBe(0);
  });

  test("reactively swaps containers", async () => {
    const [container, setContainer] = createSignal<Container | undefined>(
      undefined,
    );

    const stage = await renderApplicationNode(() => (
      <PixiExternalContainer container={container()} />
    ));

    const wrapperContainer = stage.children[0] as Container;
    expect(wrapperContainer.children.length).toBe(0);

    const firstContainer = new Container();
    firstContainer.label = "first";
    setContainer(firstContainer);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapperContainer.children.length).toBe(1);
    expect((wrapperContainer.children[0] as Container).label).toBe("first");

    const secondContainer = new Container();
    secondContainer.label = "second";
    setContainer(secondContainer);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapperContainer.children.length).toBe(1);
    expect((wrapperContainer.children[0] as Container).label).toBe("second");
    expect(wrapperContainer.children).not.toContain(firstContainer);
  });

  test("removes external container when swapped to undefined", async () => {
    const externalContainer = new Container();
    const [container, setContainer] = createSignal<Container | undefined>(
      externalContainer,
    );

    const stage = await renderApplicationNode(() => (
      <PixiExternalContainer container={container()} />
    ));

    const wrapperContainer = stage.children[0] as Container;
    expect(wrapperContainer.children.length).toBe(1);

    setContainer(undefined);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapperContainer.children.length).toBe(0);
  });

  test("JSX children coexist with external container", async () => {
    const externalContainer = new Container();
    externalContainer.label = "external";

    const stage = await renderApplicationNode(() => (
      <PixiExternalContainer container={externalContainer}>
        <text>Tracked Child</text>
      </PixiExternalContainer>
    ));

    const wrapperContainer = stage.children[0] as Container;
    expect(wrapperContainer.children.length).toBe(2);

    const trackedText = wrapperContainer.children.find(
      (child) => child instanceof Text,
    ) as Text;
    expect(trackedText).toBeDefined();
    expect(trackedText.text).toBe("Tracked Child");

    const untrackedContainer = wrapperContainer.children.find(
      (child) => child instanceof Container && child.label === "external",
    ) as Container;
    expect(untrackedContainer).toBeDefined();
    expect(untrackedContainer).toBe(externalContainer);
  });

  test("swapping external container preserves JSX children", async () => {
    const firstContainer = new Container();
    firstContainer.label = "first";
    const [container, setContainer] = createSignal<Container | undefined>(
      firstContainer,
    );

    const stage = await renderApplicationNode(() => (
      <PixiExternalContainer container={container()}>
        <text>Tracked Child</text>
      </PixiExternalContainer>
    ));

    const wrapperContainer = stage.children[0] as Container;
    expect(wrapperContainer.children.length).toBe(2);

    const secondContainer = new Container();
    secondContainer.label = "second";
    setContainer(secondContainer);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapperContainer.children.length).toBe(2);

    const trackedText = wrapperContainer.children.find(
      (child) => child instanceof Text,
    ) as Text;
    expect(trackedText).toBeDefined();
    expect(trackedText.text).toBe("Tracked Child");

    expect(wrapperContainer.children).not.toContain(firstContainer);
    expect(wrapperContainer.children).toContain(secondContainer);
  });

  test("multiple PixiExternalContainer instances do not interfere", async () => {
    const container1 = new Container();
    container1.label = "container1";
    const container2 = new Container();
    container2.label = "container2";

    const stage = await renderApplicationNode(() => (
      <container>
        <PixiExternalContainer container={container1} />
        <PixiExternalContainer container={container2} />
      </container>
    ));

    const parentContainer = stage.children[0] as Container;
    expect(parentContainer.children.length).toBe(2);

    const wrapper1 = parentContainer.children[0] as Container;
    const wrapper2 = parentContainer.children[1] as Container;

    expect(wrapper1.children.length).toBe(1);
    expect(wrapper2.children.length).toBe(1);
    expect((wrapper1.children[0] as Container).label).toBe("container1");
    expect((wrapper2.children[0] as Container).label).toBe("container2");
  });

  test("props are applied to wrapper container", async () => {
    const externalContainer = new Container();

    const stage = await renderApplicationNode(() => (
      <PixiExternalContainer
        container={externalContainer}
        x={100}
        y={200}
        alpha={0.5}
      />
    ));

    const wrapperContainer = stage.children[0] as Container;
    expect(wrapperContainer.x).toBe(100);
    expect(wrapperContainer.y).toBe(200);
    expect(wrapperContainer.alpha).toBe(0.5);
  });

  test("reactive props update wrapper container", async () => {
    const [x, setX] = createSignal(0);
    const [y, setY] = createSignal(0);
    const externalContainer = new Container();

    const stage = await renderApplicationNode(() => (
      <PixiExternalContainer container={externalContainer} x={x()} y={y()} />
    ));

    const wrapperContainer = stage.children[0] as Container;
    expect(wrapperContainer.x).toBe(0);
    expect(wrapperContainer.y).toBe(0);

    setX(100);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapperContainer.x).toBe(100);

    setY(200);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapperContainer.y).toBe(200);
  });

  test("external container with nested children", async () => {
    const externalContainer = new Container();
    const child1 = new Container();
    child1.label = "child1";
    const child2 = new Container();
    child2.label = "child2";

    externalContainer.addChild(child1);
    externalContainer.addChild(child2);

    const stage = await renderApplicationNode(() => (
      <PixiExternalContainer container={externalContainer} />
    ));

    const wrapperContainer = stage.children[0] as Container;
    const external = wrapperContainer.children[0] as Container;

    expect(external.children.length).toBe(2);
    expect((external.children[0] as Container).label).toBe("child1");
    expect((external.children[1] as Container).label).toBe("child2");
  });

  test("swapping does not affect external container internal state", async () => {
    const [container, setContainer] = createSignal<Container | undefined>(
      undefined,
    );
    const firstContainer = new Container();
    const nestedChild = new Container();
    nestedChild.label = "nested";
    firstContainer.addChild(nestedChild);

    await renderApplicationNode(() => (
      <PixiExternalContainer container={container()} />
    ));

    setContainer(firstContainer);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(firstContainer.children.length).toBe(1);
    expect((firstContainer.children[0] as Container).label).toBe("nested");

    const secondContainer = new Container();
    setContainer(secondContainer);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(firstContainer.children.length).toBe(1);
    expect((firstContainer.children[0] as Container).label).toBe("nested");
  });

  test("multiple sequential swaps maintain correct state", async () => {
    const [container, setContainer] = createSignal<Container | undefined>(
      undefined,
    );

    const stage = await renderApplicationNode(() => (
      <PixiExternalContainer container={container()} />
    ));

    const wrapperContainer = stage.children[0] as Container;

    const containers = Array.from({ length: 5 }, (_, i) => {
      const c = new Container();
      c.label = `container${i}`;
      return c;
    });

    for (let i = 0; i < containers.length; i++) {
      setContainer(containers[i]);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapperContainer.children.length).toBe(1);
      expect((wrapperContainer.children[0] as Container).label).toBe(
        `container${i}`,
      );

      for (let j = 0; j < i; j++) {
        expect(wrapperContainer.children).not.toContain(containers[j]);
      }
    }
  });

  test("external container position is independent of wrapper", async () => {
    const externalContainer = new Container();
    externalContainer.x = 50;
    externalContainer.y = 75;

    const stage = await renderApplicationNode(() => (
      <PixiExternalContainer container={externalContainer} x={100} y={200} />
    ));

    const wrapperContainer = stage.children[0] as Container;
    const external = wrapperContainer.children[0] as Container;

    expect(wrapperContainer.x).toBe(100);
    expect(wrapperContainer.y).toBe(200);
    expect(external.x).toBe(50);
    expect(external.y).toBe(75);
  });

  test("reactive JSX children updates work alongside external container", async () => {
    const [text, setText] = createSignal("Initial");
    const externalContainer = new Container();

    const stage = await renderApplicationNode(() => (
      <PixiExternalContainer container={externalContainer}>
        <text>{text()}</text>
      </PixiExternalContainer>
    ));

    const wrapperContainer = stage.children[0] as Container;
    const textNode = wrapperContainer.children.find(
      (child) => child instanceof Text,
    ) as Text;

    expect(textNode.text).toBe("Initial");
    expect(wrapperContainer.children).toContain(externalContainer);

    setText("Updated");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(textNode.text).toBe("Updated");
    expect(wrapperContainer.children).toContain(externalContainer);
  });
});
