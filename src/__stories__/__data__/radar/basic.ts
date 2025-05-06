import {max} from 'd3';
import get from 'lodash/get';

import type {ChartData, RadarSeriesCategory, RadarSeriesData} from '../../../types';

import h3Units from '../h3-units.json';

function prepareData(): ChartData {
    const units = h3Units.filter((d) => d.Special_abilities.split(',').includes('Dragon'));
    const categories: RadarSeriesCategory[] = [
        'Attack',
        'Defence',
        'Health',
        'Speed',
        'AI_Value',
    ].map((key) => ({
        key,
        maxValue: max(h3Units, (d) => get(d, key)),
    }));

    return {
        series: {
            data: units.map((unit, index) => ({
                type: 'radar',
                categories: index === 0 ? categories : [],
                name: unit.Unit_name,
                data: categories.map<RadarSeriesData>((category) => ({
                    value: Number(get(unit, category.key)),
                })),
            })),
        },
        title: {
            text: 'Heroes of Might and Magic 3 Units (dragons)',
        },
    };
}

export const radarBasicData = prepareData();
