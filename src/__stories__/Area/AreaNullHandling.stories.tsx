import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';

import type {AreaSeriesData, ChartData} from '../../types';
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
const createDataWithNulls = (): AreaSeriesData[] => {
    const dataset = nintendoGames.filter((d) => d.date && d.user_score).slice(0, 30);
    return dataset
        .map((d, i) => ({
            x: d.date || undefined,
            y: i % 5 === 0 ? null : d.user_score || undefined,
            custom: d,
        }))
        .filter((d) => d.x);
};

const AreaNullHandlingComparison = ({dataWithNulls}: {dataWithNulls: AreaSeriesData[]}) => {
    const breakData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullHandling: "break" (default)'},
        series: {
            data: [
                {
                    type: 'area',
                    name: 'User Score',
                    data: dataWithNulls,
                    nullHandling: 'break',
                },
            ],
        },
    };

    const filterData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullHandling: "filter"'},
        series: {
            data: [
                {
                    type: 'area',
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
                    type: 'area',
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
                <Col s={12} m={4}>
                    <ChartStory data={breakData} />
                </Col>
                <Col s={12} m={4}>
                    <ChartStory data={filterData} />
                </Col>
                <Col s={12} m={4}>
                    <ChartStory data={replaceByZeroData} />
                </Col>
            </Row>
        </Container>
    );
};

export const AreaNullHandlingComparisonStory: StoryObj<typeof AreaNullHandlingComparison> = {
    name: 'Null Handling Comparison',
    args: {
        dataWithNulls: createDataWithNulls(),
    },
    argTypes: {
        dataWithNulls: {
            control: 'object',
            description: 'Array of area series data with null values',
        },
    },
};

export default {
    title: 'Area',
    component: AreaNullHandlingComparison,
};
