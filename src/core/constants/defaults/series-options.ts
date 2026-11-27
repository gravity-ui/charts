import type {ChartSeriesOptions, ChartSeriesRangeSliderOptions} from '../../types';

type DefaultBarXSeriesOptions = Partial<ChartSeriesOptions['bar-x']> & {
    'bar-x': {barMaxWidth: number; barPadding: number; groupPadding: number; stackGap: number};
};

type DefaultBarYSeriesOptions = Partial<ChartSeriesOptions['bar-y']> & {
    'bar-y': {barMaxWidth: number; barPadding: number; groupPadding: number; stackGap: number};
};

type DefaultWaterfallSeriesOptions = Partial<ChartSeriesOptions['waterfall']> & {
    waterfall: {barMaxWidth: number; barPadding: number};
};

export type SeriesOptionsDefaults = Partial<ChartSeriesOptions> &
    DefaultBarXSeriesOptions &
    DefaultBarYSeriesOptions &
    DefaultWaterfallSeriesOptions & {
        'x-range': {borderRadius: number};
    };

export const seriesRangeSliderOptionsDefaults: Required<ChartSeriesRangeSliderOptions> = {
    visible: true,
};
