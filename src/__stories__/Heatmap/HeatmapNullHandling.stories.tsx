import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react-webpack5';

import type {ChartData, HeatmapSeriesData} from '../../types';
import {ChartStory} from '../ChartStory';
import {heatmapDataWithNulls} from '../__data__/heatmap/null-handling';

const sharedChartData = {
    yAxis: [{type: 'category' as const, categories: ['Row 1', 'Row 2', 'Row 3', 'Row 4', 'Row 5']}],
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
        dataWithNulls: heatmapDataWithNulls,
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
