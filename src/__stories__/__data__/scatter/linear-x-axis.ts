import type {ChartData, ScatterSeries, ScatterSeriesData} from '../../../types';

import penguins from '../penguins.json';

function prepareData(): ChartData {
    const femalePenguinsDataset = penguins.filter(
        (d) => d.species === 'Adelie' && d.sex === 'FEMALE',
    );
    const femalePenguinsData: ScatterSeriesData[] = femalePenguinsDataset.map((d) => ({
        x: d.body_mass_g || undefined,
        y: d.flipper_length_mm || undefined,
    }));
    const femalePenguinsSeriesData = {
        data: femalePenguinsData,
        name: 'Adelie penguins (female)',
    };
    const malePenguinsDataset = penguins.filter((d) => d.species === 'Adelie' && d.sex === 'MALE');
    const malePenguinsData: ScatterSeriesData[] = malePenguinsDataset.map((d) => ({
        x: d.body_mass_g || undefined,
        y: d.flipper_length_mm || undefined,
    }));
    const malePenguinsSeriesData = {
        data: malePenguinsData,
        name: 'Adelie penguins (male)',
    };

    return {
        series: {
            data: [femalePenguinsSeriesData, malePenguinsSeriesData].map<ScatterSeries>((s) => ({
                type: 'scatter',
                data: s.data.filter((d) => d.x),
                name: s.name,
            })),
        },
        title: {
            text: 'Adelie penguins',
        },
        yAxis: [
            {
                title: {
                    text: 'Flipper length (mm)',
                    maxRowCount: 1,
                },
            },
        ],
        xAxis: {
            title: {
                text: 'Body mass (g)',
            },
        },
    };
}

export const scatterLinearXAxisData = prepareData();
