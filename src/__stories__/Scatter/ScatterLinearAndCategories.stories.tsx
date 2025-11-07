import React from 'react';

import type {Meta, StoryFn} from '@storybook/react-webpack5';
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

const categoriesTypes = ['none', 'x', 'y'] as const;
type CategoriesType = (typeof categoriesTypes)[number];

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

type ShapeChartDataOptions = {
    series: ScatterSeries[];
    categoriesType: CategoriesType;
    categories?: string[];
    title: string;
    xAxisTitle: string;
    yAxisTitle: string;
};

const shapeScatterChartData = ({
    series,
    categoriesType,
    categories,
    title,
    xAxisTitle,
    yAxisTitle,
}: ShapeChartDataOptions): ChartData => {
    let xAxis: ChartAxis = {
        title: {
            text: xAxisTitle,
        },
    };

    let yAxis: ChartAxis = {
        title: {
            text: yAxisTitle,
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
            text: title,
        },
    };
};

type StoryArgs = {
    title?: string;
    x: string;
    y: string;
    xAxisTitle?: string;
    yAxisTitle?: string;
    groupBy: string;
    category: string;
    categoriesType: CategoriesType;
};

const Template: StoryFn<StoryArgs> = ({
    x,
    y,
    category,
    groupBy,
    categoriesType,
    title = '',
    xAxisTitle = '',
    yAxisTitle = '',
}) => {
    const categoryValue = categoriesType === 'none' ? undefined : category;

    let categories: string[] | undefined;
    if (categoriesType !== 'none' && categoryValue) {
        categories = penguins.reduce<string[]>((acc, p) => {
            // @ts-expect-error
            const currentCategory = p[categoryValue];
            if (typeof currentCategory === 'string' && !acc.includes(currentCategory)) {
                acc.push(currentCategory);
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
    const data = shapeScatterChartData({
        series: shapedScatterSeries,
        categoriesType,
        categories,
        title,
        xAxisTitle,
        yAxisTitle,
    });

    return <ChartStory data={data} />;
};

export const LinearAndCategories = Template.bind({});

const meta: Meta = {
    title: 'Scatter',
    argTypes: {
        x: {
            control: 'select',
            options: ['culmen_length_mm', 'culmen_depth_mm', 'flipper_length_mm', 'body_mass_g'],
        },
        y: {
            control: 'select',
            options: ['culmen_length_mm', 'culmen_depth_mm', 'flipper_length_mm', 'body_mass_g'],
        },
        groupBy: {
            control: 'select',
            options: ['species', 'island', 'sex'],
        },
        category: {
            control: 'select',
            options: ['species', 'island', 'sex'],
        },
        categoriesType: {
            control: 'inline-radio',
            options: categoriesTypes,
        },
        xAxisTitle: {
            control: 'text',
            name: 'X-axis title',
        },
        yAxisTitle: {
            control: 'text',
            name: 'Y-axis title',
        },
        title: {
            control: 'text',
            name: 'Chart title',
        },
    },

    args: {
        x: 'culmen_length_mm',
        y: 'culmen_depth_mm',
        category: 'island',
        groupBy: 'species',
        categoriesType: 'none',
    },
};

export default meta;
