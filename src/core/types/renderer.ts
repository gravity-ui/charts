/**
 * Framework-agnostic renderer return type.
 * Structurally compatible with React.ReactElement — callers in React contexts
 * may narrow to it without changes.
 */
export interface RendererElement {
    type: unknown;
    props: unknown;
    key: unknown;
}

/**
 * SVG text element attributes map.
 * Replaces React.SVGTextElementAttributes<SVGTextElement> in core types.
 */
export type SVGTextAttributes = object;
