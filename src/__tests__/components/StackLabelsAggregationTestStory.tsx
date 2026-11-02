import React from 'react';

import {ChartTestStory} from '../../../playwright/components/ChartTestStory';
import {getStackLabelsAggregationData} from '../../__stories__/__data__/stack-labels';

interface Props {
    type: 'bar-x' | 'bar-y' | 'area';
}

export function StackLabelsAggregationTestStory({type}: Props) {
    const data = getStackLabelsAggregationData(type);

    return <ChartTestStory data={data} styles={{width: 600}} />;
}
