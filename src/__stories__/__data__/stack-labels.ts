import type {ChartData, StackLabelsOptions} from '../../types';

export function getStackLabelsData(
    type: 'bar-x' | 'bar-y' | 'area',
    stacking: 'normal' | 'percent' = 'normal',
): ChartData {
    const horizontal = type === 'bar-y';
    const categoryAxis = {type: 'category' as const, categories: ['A', 'B', 'C']};
    const valueAxis = {min: 0, max: stacking === 'percent' ? 100 : 90};
    return {
        xAxis: horizontal ? valueAxis : categoryAxis,
        yAxis: [horizontal ? categoryAxis : valueAxis],
        series: {
            data: [
                [10, 20, 30],
                [20, 30, 40],
            ].map((values, index) => ({
                type,
                name: index === 0 ? 'Desktop' : 'Mobile',
                stacking,
                data: values.map((value, category) =>
                    horizontal ? {x: value, y: category} : {x: category, y: value},
                ),
                dataLabels: {enabled: type !== 'area', inside: true},
            })),
            options: {
                [type]: {
                    stackLabels: {enabled: true, format: {type: 'number', precision: 0}},
                },
            },
        },
    };
}

export function getStackLabelsAggregationData(type: 'bar-x' | 'bar-y' | 'area'): ChartData {
    const data = getStackLabelsData(type);
    const orders = [
        [12, 10, 18],
        [8, 6, 12],
    ];

    data.series.data.forEach((series, seriesIndex) => {
        if (series.type !== 'bar-x' && series.type !== 'bar-y' && series.type !== 'area') return;

        series.data.forEach((point, pointIndex) => {
            point.custom = {orders: orders[seriesIndex][pointIndex]};
            point.label = `${point.custom.orders} orders`;
        });
    });
    const stackLabels: StackLabelsOptions = {
        enabled: true,
        aggregation: ({points}) =>
            points.reduce((sum, point) => sum + (point.custom?.orders ?? 0), 0),
        format: {type: 'number', postfix: ' orders'},
    };

    data.series.options = {[type]: {stackLabels}};

    return data;
}
