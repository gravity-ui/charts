import {getBandBoundaries, getDistanceToBand} from '../band';

const columns = [{x: 0, y0: 100, y1: 0}, {x: 10, y0: 100, y1: 50}, null, {x: 30, y0: 100, y1: 0}];

describe('getDistanceToBand', () => {
    test('returns zero inside the interpolated band', () => {
        expect(getDistanceToBand({point: [5, 30], columns})).toBe(0);
    });

    test('measures outside the band', () => {
        expect(getDistanceToBand({point: [-5, 50], columns})).toBe(5);
    });

    test('does not fill across a gap', () => {
        expect(getDistanceToBand({point: [20, 80], columns})).toBe(10);
    });

    test('measures a single column without neighbours', () => {
        expect(getDistanceToBand({point: [34, 50], columns: [columns[3]]})).toBe(4);
    });
});

describe('getBandBoundaries', () => {
    test('splits the boundaries into runs at the gaps', () => {
        expect(getBandBoundaries(columns)).toEqual({
            upper: [
                [
                    [0, 0],
                    [10, 50],
                ],
                [[30, 0]],
            ],
            lower: [
                [
                    [0, 100],
                    [10, 100],
                ],
                [[30, 100]],
            ],
        });
    });
});
