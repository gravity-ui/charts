import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';

import type {ChartData, WaterfallSeriesData} from '../../types';
import {ChartStory} from '../ChartStory';

const sharedChartData = {
    xAxis: {
        type: 'category' as const,
        labels: {autoRotation: false},
    },
    legend: {enabled: true},
};

// Create default data with intentional null values
const createDataWithNulls = (): WaterfallSeriesData[] => {
    return [
        {y: 100, x: 'Start'},
        {y: 20, x: 'Revenue Q1'},
        {y: null, x: 'Revenue Q2'}, // Null value
        {y: 15, x: 'Revenue Q3'},
        {y: -30, x: 'Costs Q1'},
        {y: null, x: 'Costs Q2'}, // Null value
        {y: -10, x: 'Costs Q3'},
        {total: true, x: 'End'},
    ];
};

const WaterfallNullHandlingComparison = ({
    dataWithNulls,
}: {
    dataWithNulls: WaterfallSeriesData[];
}) => {
    const filterData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullMode: "skip" (default)'},
        xAxis: {
            ...sharedChartData.xAxis,
            categories: dataWithNulls.map((d) => d.x).filter((x) => x !== undefined) as string[],
        },
        series: {
            data: [
                {
                    type: 'waterfall',
                    name: 'Profit',
                    data: dataWithNulls,
                    nullMode: 'skip',
                    legend: {
                        itemText: {
                            positive: 'income',
                            negative: 'outcome',
                            totals: 'totals',
                        },
                    },
                },
            ],
        },
    };

    const replaceByZeroData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullMode: "zero"'},
        xAxis: {
            ...sharedChartData.xAxis,
            categories: dataWithNulls.map((d) => d.x).filter((x) => x !== undefined) as string[],
        },
        series: {
            data: [
                {
                    type: 'waterfall',
                    name: 'Profit',
                    data: dataWithNulls,
                    nullMode: 'zero',
                    legend: {
                        itemText: {
                            positive: 'income',
                            negative: 'outcome',
                            totals: 'totals',
                        },
                    },
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

export const WaterfallNullHandlingComparisonStory: StoryObj<
    typeof WaterfallNullHandlingComparison
> = {
    name: 'Null Handling Comparison',
    args: {
        dataWithNulls: createDataWithNulls(),
    },
    argTypes: {
        dataWithNulls: {
            control: 'object',
            description: 'Array of waterfall series data with null values',
        },
    },
};

export default {
    title: 'Waterfall',
    component: WaterfallNullHandlingComparison,
};
