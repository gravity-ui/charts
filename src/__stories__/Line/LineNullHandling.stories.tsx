import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react-webpack5';

import type {ChartData, LineSeriesData} from '../../types';
import {ChartStory} from '../ChartStory';
import {lineDataWithNulls} from '../__data__/line/null-handling';

const sharedChartData = {
    yAxis: [
        {
            title: {
                text: 'User score',
            },
        },
    ],
    xAxis: {
        type: 'datetime' as const,
        title: {
            text: 'Release dates',
        },
    },
};

const LineNullHandlingComparison = ({dataWithNulls}: {dataWithNulls: LineSeriesData[]}) => {
    const skipData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullMode: "skip" (default)'},
        series: {
            data: [
                {
                    type: 'line',
                    name: 'User Score',
                    data: dataWithNulls,
                    nullMode: 'skip',
                },
            ],
        },
    };

    const connectData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullMode: "connect"'},
        series: {
            data: [
                {
                    type: 'line',
                    name: 'User Score',
                    data: dataWithNulls,
                    nullMode: 'connect',
                },
            ],
        },
    };

    const zeroData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullMode: "zero"'},
        series: {
            data: [
                {
                    type: 'line',
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
                <Col s={12} m={4}>
                    <ChartStory data={skipData} />
                </Col>
                <Col s={12} m={4}>
                    <ChartStory data={connectData} />
                </Col>
                <Col s={12} m={4}>
                    <ChartStory data={zeroData} />
                </Col>
            </Row>
        </Container>
    );
};

export const LineNullHandlingComparisonStory: StoryObj<typeof LineNullHandlingComparison> = {
    name: 'Null Handling Comparison',
    args: {
        dataWithNulls: lineDataWithNulls,
    },
    argTypes: {
        dataWithNulls: {
            control: 'object',
            description: 'Array of line series data with null values',
        },
    },
};

export default {
    title: 'Line',
    component: LineNullHandlingComparison,
};
