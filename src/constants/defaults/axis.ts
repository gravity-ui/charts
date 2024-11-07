import type {BaseTextStyle, ChartKitWidgetAxis, ChartKitWidgetAxisType} from '../../types';

export const axisLabelsDefaults = {
    margin: 10,
    padding: 10,
    fontSize: 11,
    maxWidth: 80,
};

type AxisTitleDefaults = Required<ChartKitWidgetAxis['title']> & {
    style: BaseTextStyle;
};

const axisTitleDefaults: AxisTitleDefaults = {
    text: '',
    margin: 0,
    style: {
        fontSize: '14px',
    },
    align: 'center',
    maxRowCount: 1,
};

export const xAxisTitleDefaults: AxisTitleDefaults = {
    ...axisTitleDefaults,
    margin: 4,
};

export const yAxisTitleDefaults: AxisTitleDefaults = {
    ...axisTitleDefaults,
    margin: 8,
};

export const DEFAULT_AXIS_TYPE: ChartKitWidgetAxisType = 'linear';
