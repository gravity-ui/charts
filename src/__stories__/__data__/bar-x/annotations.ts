import type {BarXSeriesData, ChartData} from '../../../types';

import h3Units from '../h3-units.json';

function prepareData(): ChartData {
    const units = h3Units.filter((u) => u.Castle !== 'Neutral' && typeof u.Level === 'number');
    const levels = [...new Set(units.map((u) => u.Level as number))].sort((a, b) => a - b);

    const data: BarXSeriesData[] = levels.map((level, i) => {
        const group = units.filter((u) => u.Level === level);
        const avgGold = Math.round(group.reduce((s, u) => s + u.Gold, 0) / group.length);

        return {
            x: i,
            y: avgGold,
            annotation: level === 4 ? {label: {text: `${avgGold} gold`}} : undefined,
        };
    });

    return {
        title: {text: 'Heroes III: average unit cost by level'},
        series: {
            data: [
                {
                    type: 'bar-x',
                    name: 'Average cost',
                    data,
                },
            ],
        },
        xAxis: {
            type: 'category',
            categories: levels.map((l) => `Level ${l}`),
            title: {text: 'Unit level'},
        },
        yAxis: [{title: {text: 'Avg gold cost'}}],
    } satisfies ChartData;
}

export const barXAnnotationsData = prepareData();
