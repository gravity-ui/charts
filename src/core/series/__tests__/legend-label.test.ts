import {wrapLegendLabel} from '../legend-label';

const getTextWidth = async (text: string) => Array.from(text).length * 10;

test.each([
    {text: 'one two three', width: 70, maxRowCount: 3, rows: ['one two', 'three']},
    {text: 'one two three four', width: 70, maxRowCount: 2, rows: ['one two', 'three…']},
    {text: 'ABCDEFGHIJK', width: 40, maxRowCount: 3, rows: ['ABCD', 'EFGH', 'IJK']},
    {text: 'ABCDEFGHIJK', width: 40, maxRowCount: 2, rows: ['ABCD', 'EFG…']},
    {text: 'ABCDEFGHIJK a', width: 50, maxRowCount: 3, rows: ['ABCDE', 'FGHIJ', 'K a']},
    {text: 'one\n\ntwo\r\nthree', width: 70, maxRowCount: 4, rows: ['one', '', 'two', 'three']},
    {text: 'one\ntwo', width: 70, maxRowCount: 1, rows: ['one…']},
    {text: '😀😀😀', width: 20, maxRowCount: 2, rows: ['😀😀', '😀']},
    {text: 'one two', width: 0, maxRowCount: 3, rows: []},
    {text: 'one', width: 5, maxRowCount: 2, rows: ['', '']},
])('wraps and caps labels (%j)', async ({rows, ...args}) => {
    const result = await wrapLegendLabel({...args, getTextWidth});
    expect(result).toEqual(rows);
    for (const row of result) {
        expect(await getTextWidth(row)).toBeLessThanOrEqual(Math.max(0, args.width));
    }
});
