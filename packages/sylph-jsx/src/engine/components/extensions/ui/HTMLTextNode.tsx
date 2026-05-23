import { PixiExternalContainer } from "../../PixiExternalContainer.jsx";
import { HTMLText, type HTMLTextOptions } from "pixi.js";

/**
 * Props for {@link HTMLTextNode}.
 *
 * Mirrors Pixi's `HTMLTextOptions` for a simple UI-oriented HTML text wrapper.
 */
export type UIHTMLTextNodeProps = HTMLTextOptions;

/**
 * Simple Pixi `HTMLText` wrapper retained for Scoundrel UI component parity.
 *
 * This intentionally mirrors the original Scoundrel component: it creates a Pixi
 * `HTMLText` from the provided options and bridges that instance into the Sylph
 * JSX scene graph through `PixiExternalContainer`.
 *
 * @param props - Pixi `HTMLTextOptions` for the underlying `HTMLText` instance.
 * @returns A Pixi external-container bridge containing the Pixi `HTMLText`.
 *
 * @example
 * ```tsx
 * <UIHTMLTextNode
 *   text={'<strong>Ready</strong>'}
 *   style={{ fontSize: 18, fill: '#ffffff' }}
 * />
 * ```
 */
export const HTMLTextNode = (props: UIHTMLTextNodeProps) => (
  <PixiExternalContainer container={new HTMLText(props)} />
);
