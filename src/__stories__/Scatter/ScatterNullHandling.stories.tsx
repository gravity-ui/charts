import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react-webpack5';

import type {ChartData, ScatterSeriesData} from '../../types';
import {ChartStory} from '../ChartStory';
import {scatterDataWithNulls} from '../__data__/scatter/null-handling';

const sharedChartData = {
    yAxis: [
        {
            title: {
                text: 'Y values',
            },
        },
    ],
    xAxis: {
        type: 'linear' as const,
        title: {
            text: 'X values',
        },
    },
};

const ScatterNullHandlingComparison = ({dataWithNulls}: {dataWithNulls: ScatterSeriesData[]}) => {
    const filterData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullMode: "skip" (default)'},
        series: {
            data: [
                {
                    type: 'scatter',
                    name: 'User Score',
                    data: dataWithNulls,
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
                    type: 'scatter',
                    name: 'User Score',
                    data: dataWithNulls,
                    nullMode: 'zero',
                },
            ],
        },
    };

    return (
        <Container spaceRow={5}>
            <Row space={3}>
                <Col s={12} m={6}>
                    <ChartStory data={filterData} />
                </Col>
                <Col s={12} m={6}>
                    <ChartStory data={replaceByZeroData} />
                </Col>
            </Row>
        </Container>
    );
};

export const ScatterNullHandlingComparisonStory: StoryObj<typeof ScatterNullHandlingComparison> = {
    name: 'Null Handling Comparison',
    args: {
        dataWithNulls: scatterDataWithNulls,
    },
    argTypes: {
        dataWithNulls: {
            control: 'object',
            description: 'Array of scatter series data with null values',
        },
    },
};

export default {
    title: 'Scatter',
    component: ScatterNullHandlingComparison,
};
