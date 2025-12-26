import type {ChartLegend} from '../../types';

export const legendDefaults = {
    align: 'center' as Required<ChartLegend>['align'],
    verticalAlign: 'top' as Required<ChartLegend>['verticalAlign'],
    justifyContent: 'center' as Required<ChartLegend>['justifyContent'],
    itemDistance: 20,
    margin: 15,
    itemStyle: {
        fontSize: '12px',
    },
};

export const CONTINUOUS_LEGEND_SIZE = {
    height: 12,
    width: 200,
};
