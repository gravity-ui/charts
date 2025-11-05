import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';

import type {BarXSeriesData, ChartData} from '../../types';
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
const createDataWithNulls = (): BarXSeriesData[] => {
    const dataset = nintendoGames.filter((d) => d.date && d.user_score).slice(0, 30);
    return dataset
        .map((d, i) => ({
            x: d.date || undefined,
            y: i % 5 === 0 ? null : d.user_score || undefined,
            custom: d,
        }))
        .filter((d) => d.x);
};

const BarXNullHandlingComparison = ({dataWithNulls}: {dataWithNulls: BarXSeriesData[]}) => {
    const filterData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullHandling: "filter" (default)'},
        series: {
            data: [
                {
                    type: 'bar-x',
                    name: 'User Score',
                    data: dataWithNulls,
                    nullHandling: 'filter',
                },
            ],
        },
    };

    const replaceByZeroData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullHandling: "replaceByZero"'},
        series: {
            data: [
                {
                    type: 'bar-x',
                    name: 'User Score',
                    data: dataWithNulls,
                    nullHandling: 'replaceByZero',
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

export const BarXNullHandlingComparisonStory: StoryObj<typeof BarXNullHandlingComparison> = {
    name: 'Null Handling Comparison',
    args: {
        dataWithNulls: createDataWithNulls(),
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
