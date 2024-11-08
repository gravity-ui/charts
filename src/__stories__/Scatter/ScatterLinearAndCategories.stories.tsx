import React from 'react';

import {radios, select, text, withKnobs} from '@storybook/addon-knobs';
import type {Meta, StoryFn} from '@storybook/react';
import random from 'lodash/random';

import type {
    ChartAxis,
    ChartData,
    MeaningfulAny,
    ScatterSeries,
    ScatterSeriesData,
} from '../../types';
import {ChartStory} from '../ChartStory';

import penguins from '../__data__/penguins.json';

const shapeScatterSeriesData = (args: {
    data: Record<string, MeaningfulAny>[];
    groupBy: string;
    map: MeaningfulAny;
}) => {
    const {data, groupBy, map} = args;

    return data.reduce<Record<string, ScatterSeriesData[]>>((acc, d) => {
        const seriesName = d[groupBy] as string;

        if (!seriesName) {
            return acc;
        }

        if (!acc[seriesName]) {
            acc[seriesName] = [];
        }

        const categoriesType = map.categoriesType as 'x' | 'y' | 'none' | undefined;
        const isCategorical = categoriesType === 'x' || categoriesType === 'y';

        if (isCategorical && map.category) {
            acc[seriesName].push({
                x: d[map.x],
                y: d[map.y],
                radius: random(3, 6),
                [map.categoriesType]: d[map.category],
            });
        } else if (!isCategorical) {
            acc[seriesName].push({
                x: d[map.x],
                y: d[map.y],
                radius: random(3, 6),
            });
        }

        return acc;
    }, {});
};

const shapeScatterSeries = (data: Record<string, ScatterSeriesData[]>) => {
    return Object.keys(data).reduce<ScatterSeries[]>((acc, name) => {
        acc.push({
            type: 'scatter',
            data: data[name],
            name,
        });

        return acc;
    }, []);
};

const shapeScatterChartData = (
    series: ScatterSeries[],
    categoriesType: 'none' | 'x' | 'y',
    categories?: string[],
): ChartData => {
    let xAxis: ChartAxis = {
        title: {
            text: text('X axis title', ''),
        },
    };

    let yAxis: ChartAxis = {
        title: {
            text: text('Y axis title', ''),
        },
    };

    if (categories && categoriesType === 'x') {
        xAxis = {
            ...xAxis,
            type: 'category',
            categories,
        };
    }

    if (categories && categoriesType === 'y') {
        yAxis = {
            ...yAxis,
            type: 'category',
            categories,
        };
    }

    return {
        series: {
            data: series,
        },
        xAxis,
        yAxis: [yAxis],
        title: {
            text: text('title', 'Chart title'),
        },
    };
};

const Template: StoryFn = () => {
    const x = select(
        'x',
        ['culmen_length_mm', 'culmen_depth_mm', 'flipper_length_mm', 'body_mass_g'],
        'culmen_length_mm',
    );
    const y = select(
        'y',
        ['culmen_length_mm', 'culmen_depth_mm', 'flipper_length_mm', 'body_mass_g'],
        'culmen_depth_mm',
    );

    const groupBy = select('groupBy', ['species', 'island', 'sex'], 'species');
    const categoriesType = radios('categoriesType', {none: 'none', x: 'x', y: 'y'}, 'none');
    const category =
        categoriesType === 'none'
            ? undefined
            : select('category', ['species', 'island', 'sex'], 'island');
    let categories: string[] | undefined;

    if (categoriesType !== 'none' && category) {
        categories = penguins.reduce<string[]>((acc, p) => {
            const cerrentCategory = p[category];

            if (typeof cerrentCategory === 'string' && !acc.includes(cerrentCategory)) {
                acc.push(cerrentCategory);
            }

            return acc;
        }, []);
    }
    const shapedScatterSeriesData = shapeScatterSeriesData({
        data: penguins,
        groupBy,
        map: {x, y, category, categoriesType},
    });
    const shapedScatterSeries = shapeScatterSeries(shapedScatterSeriesData);
    const data = shapeScatterChartData(shapedScatterSeries, categoriesType, categories);

    return <ChartStory data={data} />;
};

export const LinearAndCategories = Template.bind({});

const meta: Meta = {
    title: 'Scatter',
    decorators: [withKnobs],
};

export default meta;
