import {line} from 'd3-shape';

import type {LineSeriesInterpolation} from '../../../types';
import {getCurveFactory} from '../interpolation';

describe('line interpolation', () => {
    test.each<{interpolation?: LineSeriesInterpolation; path: string}>([
        {path: 'M0,10L10,30'},
        {interpolation: {type: 'linear'}, path: 'M0,10L10,30'},
        {interpolation: {type: 'step'}, path: 'M0,10L10,10L10,30'},
        {interpolation: {type: 'step', position: 'middle'}, path: 'M0,10L5,10L5,30L10,30'},
        {interpolation: {type: 'step', position: 'before'}, path: 'M0,10L0,30L10,30'},
        {interpolation: {type: 'step', position: 'after'}, path: 'M0,10L10,10L10,30'},
    ])('draws $interpolation as $path', ({interpolation, path}) => {
        expect(
            line().curve(getCurveFactory(interpolation))([
                [0, 10],
                [10, 30],
            ]),
        ).toBe(path);
    });
});
