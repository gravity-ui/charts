import type {AxisCrosshair, BaseTextStyle, ChartAxis, ChartAxisType} from '../../types';
import {DASH_STYLE} from '../line-styles';

export const axisLabelsDefaults = {
    margin: 10,
    padding: 10,
    fontSize: 11,
    maxWidth: 80,
};

type AxisTitleDefaults = Required<ChartAxis['title']> & {
    style: BaseTextStyle;
};

type AxisCrosshairDefaults = Required<AxisCrosshair>;

const axisTitleDefaults: AxisTitleDefaults = {
    text: '',
    margin: 0,
    style: {
        fontSize: '14px',
    },
    align: 'center',
    maxRowCount: 1,
};

export const axisCrosshairDefaults: AxisCrosshairDefaults = {
    enabled: false,
    color: 'var(--g-color-line-generic)',
    width: 1,
    snap: true,
    dashStyle: DASH_STYLE.Solid,
    opacity: 1,
    layerPlacement: 'after',
};

export const xAxisTitleDefaults: AxisTitleDefaults = {
    ...axisTitleDefaults,
    margin: 4,
};

export const yAxisTitleDefaults: AxisTitleDefaults = {
    ...axisTitleDefaults,
    margin: 8,
};

export const DEFAULT_AXIS_TYPE: ChartAxisType = 'linear';
