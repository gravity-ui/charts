import type {ChartData} from '../../types';

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

export function getCustomStackLabelsData(type: 'bar-x' | 'bar-y'): ChartData {
    const horizontal = type === 'bar-y';
    const categoryAxis = {type: 'category' as const, categories: ['January', 'February', 'March']};
    const valueAxis = {min: 0, max: 500};
    return {
        xAxis: horizontal ? valueAxis : categoryAxis,
        yAxis: [horizontal ? categoryAxis : valueAxis],
        series: {
            data: [
                {name: 'Desktop', values: [100, 150, 200], orders: [3, 5, 8]},
                {name: 'Mobile', values: [200, 100, 150], orders: [7, 4, 6]},
            ].map(({name, values, orders}) => ({
                type,
                name,
                stacking: 'normal',
                dataLabels: {enabled: true, inside: true},
                data: values.map((value, category) => ({
                    x: horizontal ? value : category,
                    y: horizontal ? category : value,
                    label: orders[category],
                    stackLabelValue: orders[category],
                })),
            })),
            options: {
                [type]: {
                    stackLabels: {
                        enabled: true,
                        valueSource: 'custom',
                        allowOverlap: true,
                        format: {type: 'number', precision: 0, postfix: ' orders'},
                    },
                },
            },
        },
    };
}
