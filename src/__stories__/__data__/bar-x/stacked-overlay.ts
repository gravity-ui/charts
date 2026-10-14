import type {ChartData} from '../../../types';

export const barXStackedOverlayData: ChartData = {
    series: {
        data: [
            {stackId: 'Plan', segments: [60, 40]},
            {stackId: 'Actual', segments: [40, 35]},
        ].flatMap(({stackId, segments}) =>
            segments.map((value, index) => ({
                type: 'bar-x',
                name: `${stackId} ${index + 1}`,
                stackId,
                stacking: 'normal',
                grouping: false,
                opacity: 0.6,
                dataLabels: {enabled: true, inside: true},
                data: [{x: 'A', y: value}],
            })),
        ),
    },
    xAxis: {type: 'category', categories: ['A']},
};
