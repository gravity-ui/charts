import type {BaseTextStyle} from './base';

export type ChartKitWidgetLegend = {
    enabled?: boolean;
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
     * Defines the pixel distance between each legend item
     *
     * @default 20
     * */
    itemDistance?: number;
    /** CSS styles for each legend item */
    itemStyle?: BaseTextStyle;
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
};

export type BaseLegendSymbol = {
    /**
     * The pixel padding between the legend item symbol and the legend item text.
     *
     * @default 5
     * */
    padding?: number;
};

export type RectLegendSymbolOptions = BaseLegendSymbol & {
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
};

export type PathLegendSymbolOptions = BaseLegendSymbol & {
    /**
     * The pixel width of the symbol for series types that use a path in the legend
     *
     * @default 16
     * */
    width?: number;
};

export type SymbolLegendSymbolOptions = BaseLegendSymbol & {
    /**
     * The pixel width of the symbol for series types that use a symbol in the legend
     *
     * @default 8
     * */
    width?: number;
};
