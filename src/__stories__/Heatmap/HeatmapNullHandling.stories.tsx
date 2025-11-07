import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';
import {interpolateRgb} from 'd3';

import {DEFAULT_PALETTE} from '../../constants';
import type {ChartData, HeatmapSeriesData} from '../../types';
import {ChartStory} from '../ChartStory';

const sharedChartData = {
    yAxis: [{type: 'category' as const, categories: ['Row 1', 'Row 2', 'Row 3']}],
};

// Create default data with intentional null gaps (every 5th item)
const createDataWithNulls = (): HeatmapSeriesData[] => {
    const data = new Array(99).fill(null).map((_, index) => index);
    const getColor = interpolateRgb(DEFAULT_PALETTE[0], DEFAULT_PALETTE[1]);

    return data.map((d, index) => {
        const colorValue = Math.abs(d / 100);
        return {
            x: Math.ceil((d + 1) / 3),
            y: d % 3,
            value: index % 5 === 0 ? null : d,
            color: getColor(colorValue),
        };
    });
};

const HeatmapNullHandlingComparison = ({dataWithNulls}: {dataWithNulls: HeatmapSeriesData[]}) => {
    const breakData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullMode: "skip" (default)'},
        series: {
            data: [
                {
                    type: 'heatmap',
                    name: 'Series 1',
                    data: dataWithNulls,
                    dataLabels: {enabled: true},
                    nullMode: 'skip',
                },
            ],
        },
    };

    const replaceByZeroData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullMode: "zero"'},
        series: {
            data: [
                {
                    type: 'heatmap',
                    name: 'Series 1',
                    data: dataWithNulls,
                    dataLabels: {enabled: true},
                    nullMode: 'zero',
                },
            ],
        },
    };

    return (
        <Container spaceRow={5}>
            <Row space={3}>
                <Col s={12} m={6}>
                    <ChartStory data={breakData} />
                </Col>
                <Col s={12} m={6}>
                    <ChartStory data={replaceByZeroData} />
                </Col>
            </Row>
        </Container>
    );
};

export const HeatmapNullHandlingComparisonStory: StoryObj<typeof HeatmapNullHandlingComparison> = {
    name: 'Null Handling Comparison',
    args: {
        dataWithNulls: createDataWithNulls(),
    },
    argTypes: {
        dataWithNulls: {
            control: 'object',
            description: 'Array of heatmap series data with null values',
        },
    },
};

export default {
    title: 'Heatmap',
    component: HeatmapNullHandlingComparison,
};
