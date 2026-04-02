import type {AreaSeriesData, ChartData} from '../../../types';

import h3Units from '../h3-units.json';

function prepareData(): ChartData {
    const units = h3Units.filter((u) => u.Castle !== 'Neutral' && typeof u.Level === 'number');
    const levels = [...new Set(units.map((u) => u.Level as number))].sort((a, b) => a - b);

    const data: AreaSeriesData[] = levels.map((level) => {
        const group = units.filter((u) => u.Level === level);
        const avgGold = Math.round(group.reduce((s, u) => s + u.Gold, 0) / group.length);

        return {
            x: level,
            y: avgGold,
            annotation: level === 4 ? {label: {text: `${avgGold} gold`}} : undefined,
            marker: level === 4 ? {color: '#e74c3c', states: {normal: {enabled: true}}} : undefined,
        };
    });

    return {
        title: {text: 'Heroes III: average unit cost by level'},
        series: {
            data: [
                {
                    type: 'area',
                    name: 'Average cost',
                    data,
                    opacity: 0.4,
                },
            ],
        },
        xAxis: {title: {text: 'Unit level'}},
        yAxis: [{title: {text: 'Avg gold cost'}}],
    } satisfies ChartData;
}

export const areaAnnotationsData = prepareData();
