import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';

import type {ChartData, SeriesInterpolation} from '../../types';
import {ChartStory} from '../ChartStory';

interface InterpolationVariant {
    title: string;
    interpolation?: SeriesInterpolation;
}

const variants: InterpolationVariant[] = [
    {title: 'Linear (default)'},
    {title: 'Monotone', interpolation: {type: 'monotone'}},
    {title: 'Cardinal (tension 0.5)', interpolation: {type: 'cardinal', tension: 0.5}},
    {title: 'Step (middle)', interpolation: {type: 'step', position: 'middle'}},
    {title: 'Step (before)', interpolation: {type: 'step', position: 'before'}},
    {title: 'Step (after)', interpolation: {type: 'step', position: 'after'}},
];

const charts = variants.map(
    ({title, interpolation}): ChartData => ({
        title: {text: title},
        series: {
            data: [
                {
                    type: 'area',
                    name: 'Series',
                    interpolation,
                    data: [10, 60, 20, 80, 30, 70, 40].map((y, x) => ({x, y})),
                    marker: {enabled: true},
                },
            ],
        },
        xAxis: {type: 'linear'},
    }),
);

const AreaInterpolationComparison = () => (
    <Container rowGap="spacing-5">
        {[charts.slice(0, 3), charts.slice(3)].map((row) => (
            <Row key={row[0].title?.text} gap="spacing-3">
                {row.map((data) => (
                    <Col key={data.title?.text} size={{xs: 12, m: 4}}>
                        <ChartStory data={data} />
                    </Col>
                ))}
            </Row>
        ))}
    </Container>
);

export const AreaInterpolationComparisonStory: StoryObj<typeof AreaInterpolationComparison> = {
    name: 'Interpolation types',
};

export default {
    title: 'Area',
    component: AreaInterpolationComparison,
};
