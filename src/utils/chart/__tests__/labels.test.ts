import type {LabelData} from '../../../types';
import {filterOverlappingLabels} from '../labels';

describe('filterOverlappingLabels', () => {
    const label1 = {
        text: 'A',
        x: 10,
        y: 5,
        size: {
            width: 20,
            height: 15,
        },
        textAnchor: 'middle',
    };

    it('overlap by X and Y -> remove overlapping', () => {
        const label2 = {
            text: 'B',
            x: 22,
            y: 7,
            size: {
                width: 10,
                height: 15,
            },
            textAnchor: 'middle',
        };
        const labels = [label1, label2];
        expect(filterOverlappingLabels(labels as LabelData[])).toEqual([label1]);
    });

    it('overlap only by X -> do nothing ', () => {
        const label2 = {
            text: 'B',
            x: 22,
            y: 100,
            size: {
                width: 10,
                height: 15,
            },
            textAnchor: 'middle',
        };
        const labels = [label1, label2];
        expect(filterOverlappingLabels(labels as LabelData[])).toEqual([label1, label2]);
    });

    it('overlap only by Y -> do nothing ', () => {
        const label2 = {
            text: 'B',
            x: 200,
            y: 7,
            size: {
                width: 10,
                height: 15,
            },
            textAnchor: 'middle',
        };
        const labels = [label1, label2];
        expect(filterOverlappingLabels(labels as LabelData[])).toEqual([label1, label2]);
    });
});
