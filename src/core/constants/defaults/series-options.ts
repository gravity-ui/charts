import type {barXDefaults} from '../../../plugins/bar-x/defaults';
import type {barYDefaults} from '../../../plugins/bar-y/defaults';
import type {waterfallDefaults} from '../../../plugins/waterfall/defaults';
import type {xRangeDefaults} from '../../../plugins/x-range/defaults';
import type {ChartSeriesOptions, ChartSeriesRangeSliderOptions} from '../../types';

export type SeriesOptionsDefaults = Partial<ChartSeriesOptions> & {
    'bar-x': NonNullable<ChartSeriesOptions['bar-x']> &
        Pick<typeof barXDefaults, 'barMaxWidth' | 'barPadding' | 'groupPadding' | 'stackGap'>;
    'bar-y': NonNullable<ChartSeriesOptions['bar-y']> &
        Pick<typeof barYDefaults, 'barMaxWidth' | 'barPadding' | 'groupPadding' | 'stackGap'>;
    waterfall: NonNullable<ChartSeriesOptions['waterfall']> &
        Pick<typeof waterfallDefaults, 'barMaxWidth' | 'barPadding'>;
    'x-range': NonNullable<ChartSeriesOptions['x-range']> &
        Pick<typeof xRangeDefaults, 'borderRadius'>;
};

export const seriesRangeSliderOptionsDefaults: Required<ChartSeriesRangeSliderOptions> = {
    visible: true,
};
