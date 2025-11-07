import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';

import type {ChartData, ScatterSeriesData} from '../../types';
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
const createDataWithNulls = (): ScatterSeriesData[] => {
    const dataset = nintendoGames.filter((d) => d.date && d.user_score).slice(0, 30);
    return dataset.map((d, i) => ({
        x: i % 3 === 0 ? null : d.date || undefined,
        y: i % 2 === 0 ? null : d.user_score || undefined,
        custom: d,
    }));
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
        dataWithNulls: createDataWithNulls(),
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
