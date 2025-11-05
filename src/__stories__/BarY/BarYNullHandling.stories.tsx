import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';

import type {BarYSeriesData, ChartData} from '../../types';
import {ChartStory} from '../ChartStory';
import nintendoGames from '../__data__/nintendoGames';

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

// Create default data with intentional null gaps (every 5th item)
const createDataWithNulls = (): {data: BarYSeriesData[]; categories: string[]} => {
    const dataset = nintendoGames.filter((d) => d.title && d.user_score).slice(0, 30);
    const categories = dataset.map((d) => d.title);
    const data = dataset.map((d, i) => ({
        y: d.title,
        x: i % 5 === 0 ? null : d.user_score || undefined,
        custom: d,
    }));
    return {data, categories};
};

const BarYNullHandlingComparison = ({
    dataWithNulls,
}: {
    dataWithNulls: {data: BarYSeriesData[]; categories: string[]};
}) => {
    const filterData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullHandling: "filter" (default)'},
        series: {
            data: [
                {
                    type: 'bar-y',
                    name: 'User Score',
                    data: dataWithNulls.data,
                    nullHandling: 'filter',
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
        title: {text: 'nullHandling: "replaceByZero"'},
        series: {
            data: [
                {
                    type: 'bar-y',
                    name: 'User Score',
                    data: dataWithNulls.data,
                    nullHandling: 'replaceByZero',
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
        dataWithNulls: createDataWithNulls(),
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
