import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';

import type {ChartData, LineSeriesData} from '../../types';
import {ChartStory} from '../ChartStory';
import nintendoGames from '../__data__/nintendoGames';

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

// Create default data with intentional null gaps (every 5th item)
const createDataWithNulls = (): LineSeriesData[] => {
    const dataset = nintendoGames.filter((d) => d.date && d.user_score).slice(0, 30);
    return dataset
        .map((d, i) => ({
            x: d.date || undefined,
            y: i % 5 === 0 ? null : d.user_score || undefined,
            custom: d,
        }))
        .filter((d) => d.x);
};

const LineNullHandlingComparison = ({dataWithNulls}: {dataWithNulls: LineSeriesData[]}) => {
    const breakData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullHandling: "break" (default)'},
        series: {
            data: [
                {
                    type: 'line',
                    name: 'User Score',
                    data: dataWithNulls,
                    nullHandling: 'break',
                },
            ],
        },
    };

    const connectData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullHandling: "connect"'},
        series: {
            data: [
                {
                    type: 'line',
                    name: 'User Score',
                    data: dataWithNulls,
                    nullHandling: 'connect',
                },
            ],
        },
    };

    const asZeroData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullHandling: "asZero"'},
        series: {
            data: [
                {
                    type: 'line',
                    name: 'User Score',
                    data: dataWithNulls,
                    nullHandling: 'asZero',
                },
            ],
        },
    };

    return (
        <Container spaceRow={5}>
            <Row space={3}>
                <Col s={12} m={4}>
                    <ChartStory data={breakData} />
                </Col>
                <Col s={12} m={4}>
                    <ChartStory data={connectData} />
                </Col>
                <Col s={12} m={4}>
                    <ChartStory data={asZeroData} />
                </Col>
            </Row>
        </Container>
    );
};

export const LineNullHandlingComparisonStory: StoryObj<typeof LineNullHandlingComparison> = {
    name: 'Null Handling Comparison',
    args: {
        dataWithNulls: createDataWithNulls(),
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
