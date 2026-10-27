import type {ChartData} from '../../../types';

export const barYStackedOverlayData: ChartData = {
    series: {
        options: {'bar-y': {barMaxWidth: 1000}},
        data: [
            {stackId: 'Plan', segments: [60, 40]},
            {stackId: 'Actual', segments: [40, 35]},
        ].flatMap(({stackId, segments}) =>
            segments.map((value, index) => ({
                type: 'bar-y',
                name: `${stackId} ${index + 1}`,
                stackId,
                stacking: 'normal',
                grouping: false,
                barPadding: stackId === 'Plan' ? 0.2 : 0.6,
                dataLabels: {enabled: stackId === 'Actual', placement: ['inside-center']},
                data: [{y: 'A', x: value}],
            })),
        ),
    },
    yAxis: [{type: 'category', categories: ['A']}],
};
