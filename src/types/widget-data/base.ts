export type BaseSeries = {
    /** Initial visibility of the series */
    visible?: boolean;
    /**
     * Options for the series data labels, appearing next to each data point.
     * */
    dataLabels?: {
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
    };
    /** You can set the cursor to "pointer" if you have click events attached to the series, to signal to the user that the points and lines can be clicked. */
    cursor?: string;
};

export type BaseSeriesData<T = any> = {
    /**
     * A reserved subspace to store options and values for customized functionality
     *
     * Here you can add additional data for your own event callbacks and formatter callbacks
     */
    custom?: T;
    /** Individual color for the data chunk (point in scatter, segment in pie, bar etc) */
    color?: string;
};

export type BaseTextStyle = {
    fontSize: string;
    fontWeight?: string;
    fontColor?: string;
};
