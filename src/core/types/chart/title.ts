import type {BaseTextStyle} from './base';

export interface ChartTitle {
    text: string;
    style?: Partial<BaseTextStyle>;
    /**
     * Maximum number of text rows. If the text exceeds this limit, it is truncated with an ellipsis.
     * Default: 1
     * Not applicable when `html: true` — HTML content manages its own layout.
     */
    maxRowCount?: number;
    /**
     * Space between the title and the chart area (in pixels).
     * Default: 10
     */
    margin?: number;
    /**
     * Can be used for the UI automated test.
     * It is assigned as a data-qa attribute to an element.
     */
    qa?: string;
    /**
     * Enables HTML rendering for the chart title.
     * When true, the title is rendered as an HTML element on top of the SVG
     * instead of an SVG text node. This allows using arbitrary HTML tags
     * (e.g. links, styled spans) that cannot be embedded in SVG.
     * The element will be displayed outside the box of the SVG element.
     */
    html?: boolean;
    /**
     * Maximum height of the title area. Accepts a pixel value (`number` or `"100px"`)
     * or a percentage string (`"50%"`) relative to the full chart height.
     * When the title content exceeds this height, it is clipped.
     * Only applicable when `html: true`.
     *
     * Default: 50%
     */
    maxHeight?: string | number;
}
