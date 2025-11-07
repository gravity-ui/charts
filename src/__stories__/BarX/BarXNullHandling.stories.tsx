import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react-webpack5';

import type {BarXSeriesData, ChartData} from '../../types';
import {ChartStory} from '../ChartStory';
import {barXDataWithNulls} from '../__data__/bar-x/null-handling';

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

const BarXNullHandlingComparison = ({dataWithNulls}: {dataWithNulls: BarXSeriesData[]}) => {
    const skipData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullMode: "skip" (default)'},
        series: {
            data: [
                {
                    type: 'bar-x',
                    name: 'User Score',
                    data: dataWithNulls,
                    nullMode: 'skip',
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
                    type: 'bar-x',
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
                    <ChartStory data={skipData} />
                </Col>
                <Col s={12} m={6}>
                    <ChartStory data={zeroData} />
                </Col>
            </Row>
        </Container>
    );
};

export const BarXNullHandlingComparisonStory: StoryObj<typeof BarXNullHandlingComparison> = {
    name: 'Null Handling Comparison',
    args: {
        dataWithNulls: barXDataWithNulls,
    },
    argTypes: {
        dataWithNulls: {
            control: 'object',
            description: 'Array of bar-x series data with null values',
        },
    },
};

export default {
    title: 'Bar-X',
    component: BarXNullHandlingComparison,
};
