import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react-webpack5';

import type {BarYSeriesData, ChartData} from '../../types';
import {ChartStory} from '../ChartStory';
import {barYDataWithNulls} from '../__data__/bar-y/null-handling';

const sharedChartData = {
    xAxis: {
        title: {
            text: 'User score',
        },
    },
    yAxis: [
        {
            type: 'category' as const,
            categories: [] as string[],
            title: {
                text: 'Games',
            },
        },
    ],
};

const BarYNullHandlingComparison = ({
    dataWithNulls,
}: {
    dataWithNulls: {data: BarYSeriesData[]; categories: string[]};
}) => {
    const filterData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullMode: "skip" (default)'},
        series: {
            data: [
                {
                    type: 'bar-y',
                    name: 'User Score',
                    data: dataWithNulls.data,
                    nullMode: 'skip',
                },
            ],
        },
        yAxis: [
            {
                ...sharedChartData.yAxis[0],
                categories: dataWithNulls.categories,
            },
        ],
    };

    const replaceByZeroData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullMode: "zero"'},
        series: {
            data: [
                {
                    type: 'bar-y',
                    name: 'User Score',
                    data: dataWithNulls.data,
                    nullMode: 'zero',
                },
            ],
        },
        yAxis: [
            {
                ...sharedChartData.yAxis[0],
                categories: dataWithNulls.categories,
            },
        ],
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

export const BarYNullHandlingComparisonStory: StoryObj<typeof BarYNullHandlingComparison> = {
    name: 'Null Handling Comparison',
    args: {
        dataWithNulls: barYDataWithNulls,
    },
    argTypes: {
        dataWithNulls: {
            control: 'object',
            description: 'Object with bar-y series data and categories with null values',
        },
    },
};

export default {
    title: 'Bar-Y',
    component: BarYNullHandlingComparison,
};
