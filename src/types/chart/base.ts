import type {FormatNumberOptions} from '../formatter';
import type {MeaningfulAny} from '../misc';

import type {ChartLegendItem} from './legend';

type NumberFormat = {
    type: 'number';
} & FormatNumberOptions;
type DateFormat = {
    type: 'date';
    format?: string;
};
export type CustomFormat = {
    type: 'custom';
    formatter: (args: {value: unknown; formattedValue?: string}) => string;
};
export type ValueFormat = NumberFormat | DateFormat;

export interface BaseDataLabels {
    /**
     * Enable or disable the data labels
     * @default true
     */
    enabled?: boolean;
    style?: Partial<BaseTextStyle>;
    /**
     * @default 5
     * */
    padding?: number;
    /**
     * @default false
     * */
    allowOverlap?: boolean;
    /**
     * Allows to use any html-tags to display the content.
     * The element will be displayed outside the box of the SVG element.
     *
     * @default false
     * */
    html?: boolean;
    /** Formatting settings for labels. */
    format?: ValueFormat;
}

export interface BaseSeries {
    /** Initial visibility of the series */
    visible?: boolean;
    /**
     * Options for the series data labels, appearing next to each data point.
     * */
    dataLabels?: BaseDataLabels;
    /** You can set the cursor to "pointer" if you have click events attached to the series, to signal to the user that the points and lines can be clicked. */
    cursor?: string;
    /**
     * Options for the tooltip that appears when the user hovers over a series or point.
     */
    tooltip?: {
        /** Formatting settings for tooltip value. */
        valueFormat?: ValueFormat;
    };
}

export interface BaseSeriesData<T = MeaningfulAny> {
    /**
     * A reserved subspace to store options and values for customized functionality
     *
     * Here you can add additional data for your own event callbacks and formatter callbacks
     */
    custom?: T;
    /** Individual color for the data chunk (point in scatter, segment in pie, bar etc) */
    color?: string;
}

export interface BaseSeriesLegend extends ChartLegendItem {
    /** If grouping is enabled in the legend, then for multiple series with the same groupId, only one label in the legend will be displayed.
     * The first non-empty name and symbol of the legend from the group's series is used for the legend's label.
     */
    groupId?: string;
    /** The text is displayed in the legend instead of the series name. */
    itemText?: string;
}

export interface BaseTextStyle {
    fontSize: string;
    fontWeight?: string;
    fontColor?: string;
}
