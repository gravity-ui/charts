import type {BaseTextStyle} from './base';

export interface ChartLegendItem {
    enabled?: boolean;
    /**
     * Defines the pixel distance between each legend item
     *
     * @default 20
     * */
    itemDistance?: number;
    /** CSS styles for each legend item */
    itemStyle?: BaseTextStyle;
}

export interface ChartLegend extends ChartLegendItem {
    /**
     * Different types for different color schemes.
     * If the color scheme is continuous, a gradient legend will be drawn.
     * Otherwise, samples for different point values
     *
     * @default 'discrete'
     */
    type?: 'discrete' | 'continuous';
    /**
     * The horizontal alignment of the legend box within the chart area.
     *
     * @default center
     * */
    align?: 'left' | 'center' | 'right';

    /**
     * The vertical alignment of the legend box within the chart area.
     * Only applies when position is 'left' or 'right'.
     *
     * @default top
     * */
    alignVertical?: 'top' | 'center' | 'bottom';
    /**
     * Defines how items should be positioned in the legend when overflowing (moving to the next line).
     *
     * @default center
     * */
    justifyContent?: 'start' | 'center';
    /**
     * The space between the legend and the axis labels or chart area.
     *
     * @default 15
     */
    margin?: number;
    /* The title that will be added on top of the legend. */
    title?: {
        text?: string;
        /** CSS styles for the title */
        style?: Partial<BaseTextStyle>;
        /** The distance(in pixels) between the main content of the legend and its title
         *
         * Defaults to 4 for horizontal axes, 8 for vertical.
         * */
        margin?: number;
        /** The horizontal alignment of the title. */
        align?: 'left' | 'center' | 'right';
    };
    /* Gradient color settings for continuous legend type */
    colorScale?: {
        /* Color stops for the gradient.
         * If not defined, it is distributed evenly according to the number of specified colors
         *  */
        stops?: number[];
        /* The colors that form the gradient */
        colors: string[];
        /* Data that is displayed as ticks.
         * It can be useful when the points are colored according to additional dimensions that are not involved in the chart display.
         * By default, it is formed depending on the type of series ("y" for bar-x or "value" for pie series, for example).
         **/
        domain?: number[];
    };
    /* Width of the legend */
    width?: number;
    /**
     * Allows to use any html-tags to display the content.
     *
     * @default false
     * */
    html?: boolean;
    /**
     * The position of the legend box within the chart area.
     *
     * @default 'bottom'
     * */
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface BaseLegendSymbol {
    /**
     * The pixel padding between the legend item symbol and the legend item text.
     *
     * @default 5
     * */
    padding?: number;
}

export interface RectLegendSymbolOptions extends BaseLegendSymbol {
    /**
     * The pixel width of the symbol for series types that use a rectangle in the legend
     *
     * @default 10
     * */
    width?: number;

    /**
     * The pixel width of the symbol for series types that use a rectangle in the legend
     *
     * @default 10
     * */
    height?: number;

    /**
     * The border radius of the symbol for series types that use a rectangle in the legend.
     *
     * Defaults to half the symbolHeight, effectively creating a circle.
     */
    radius?: number;
}

export interface PathLegendSymbolOptions extends BaseLegendSymbol {
    /**
     * The pixel width of the symbol for series types that use a path in the legend
     *
     * @default 16
     * */
    width?: number;
}

export interface SymbolLegendSymbolOptions extends BaseLegendSymbol {
    /**
     * The pixel width of the symbol for series types that use a symbol in the legend
     *
     * @default 8
     * */
    width?: number;
}
