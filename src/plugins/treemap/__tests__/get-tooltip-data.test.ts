import {scaleOrdinal} from 'd3-scale';
import get from 'es-toolkit/compat/get';

import type {PreparedLegendOptions} from '~core/series/types';

import {getTooltipData} from '../get-tooltip-data';
import {prepareTreemapData} from '../prepare-data';
import {prepareTreemap} from '../prepare-treemap-series';

const POINT_COLOR = '#0000c8';
const LEVEL_COLOR = '#c80000';
const SERIES_COLOR = '#008000';

describe('treemap getTooltipData', () => {
    test('returns the tile fill with point > level > series precedence', async () => {
        const [series] = prepareTreemap({
            colorScale: scaleOrdinal<string, string>().range(['red']),
            legend: {enabled: false} as PreparedLegendOptions,
            series: [
                {
                    type: 'treemap',
                    name: 'Values',
                    color: SERIES_COLOR,
                    levels: [{index: 1, color: LEVEL_COLOR}],
                    dataLabels: {enabled: false},
                    data: [
                        {id: 'point', name: 'Point', value: 1, color: POINT_COLOR},
                        {id: 'level', name: 'Level', value: 1},
                        {id: 'group', name: 'Group'},
                        {id: 'series', name: 'Series', value: 1, parentId: 'group'},
                    ],
                },
            ],
        });
        const shape = await prepareTreemapData({series, width: 300, height: 100});
        const colors = Object.fromEntries(
            shape.leaves.map((leaf) => {
                const {chunks} = getTooltipData({
                    data: [shape],
                    position: [(leaf.x0 + leaf.x1) / 2, (leaf.y0 + leaf.y1) / 2],
                    boundsWidth: 300,
                    boundsHeight: 100,
                    measureDistance: false,
                });
                return [leaf.data.id, get(chunks[0], 'color')];
            }),
        );

        expect(colors).toEqual({point: POINT_COLOR, level: LEVEL_COLOR, series: SERIES_COLOR});
        expect(series.data.find((d) => d.id === 'level')).not.toHaveProperty('color');
    });
});
