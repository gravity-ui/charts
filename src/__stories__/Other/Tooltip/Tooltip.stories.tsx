import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../../components';
import {ChartStory} from '../../ChartStory';
import {
    tooltipOverflowedRowsData,
    tooltipTotalsSumData,
    tooltipWithDateFormat,
    tooltipWithNumberFormat,
} from '../../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Other/Tooltip',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const TotalsSum = {
    name: 'Totals Sum',
    args: {
        data: tooltipTotalsSumData,
    },
} satisfies Story;

const TooltipFormattedValues = () => {
    return (
        <Container spaceRow={5}>
            <Row space={2}>
                <Col s={6}>
                    <ChartStory data={tooltipWithNumberFormat} />
                </Col>
                <Col s={6}>
                    <ChartStory data={tooltipWithDateFormat} />
                </Col>
            </Row>
        </Container>
    );
};

export const SeriesWithDifferentFormats = {
    name: 'Formatted values',
    render: TooltipFormattedValues,
} satisfies Story;

export const OverflowedRows = {
    name: 'Overflowed Rows',
    args: {
        data: tooltipOverflowedRowsData,
    },
} satisfies Story;
