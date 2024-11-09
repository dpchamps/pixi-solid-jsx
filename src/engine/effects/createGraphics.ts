import {ColorSource, FillInput, FillStyle, Graphics, GraphicsContext, GraphicsOptions, StrokeInput} from "pixi.js";

type GFXOptions = GraphicsOptions|GraphicsContext;

type GraphicsProps = {
    graphicsOptions?: GFXOptions|undefined,
    build: (gfx: Graphics) => void;
}
export const createGraphics = (props: GraphicsProps) => {
    const graphics = new Graphics(props.graphicsOptions);

    props.build(graphics);

    return graphics;
}

type CreateRectProps = {
    graphicsOptions?: GFXOptions,
    x: number,
    y: number,
    height: number,
    width: number,
    fill: FillInput
}
export const createRect = (props: CreateRectProps) => {

    return createGraphics({
        graphicsOptions: props.graphicsOptions,
        build: (graphics) => {
            graphics
                .rect(props.x, props.y, props.width, props.height)
                .fill(props.fill);
        }})
}