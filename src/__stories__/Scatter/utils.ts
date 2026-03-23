import random from 'lodash/random';
import range from 'lodash/range';

import {randomString} from '~core/utils';

import type {ScatterSeries} from '../../types';

const TEMPLATE_STRING = '0123456789abcdefghijklmnopqrstuvwxyz';

export const generateSeriesData = (seriesCount = 5): ScatterSeries[] => {
    return range(0, seriesCount).map(() => {
        return {
            type: 'scatter',
            data: [
                {
                    x: random(0, 1000),
                    y: random(0, 1000),
                },
            ],
            name: `${randomString(random(3, 15), TEMPLATE_STRING)}`,
        };
    });
};
