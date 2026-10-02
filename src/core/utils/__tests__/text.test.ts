/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {
    decodeHtmlEntities,
    getMultilineTextInfo,
    getTextSizeFn,
    wrapTextWithEllipsis,
} from '../text';

test.each([
    {decodeEntities: undefined, width: 1},
    {decodeEntities: true, width: 1},
    {decodeEntities: false, width: 5},
])('measures entities with decodeEntities=$decodeEntities', async ({decodeEntities, width}) => {
    const getContext = jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        measureText: (text: string) => ({
            width: text.length,
            fontBoundingBoxAscent: 10,
            fontBoundingBoxDescent: 2,
        }),
    } as CanvasRenderingContext2D);
    try {
        const measure = getTextSizeFn({decodeEntities});
        expect(await measure('&amp;')).toMatchObject({width, height: 12, hangingOffset: 2});
    } finally {
        getContext.mockRestore();
    }
});

test.each([
    ['<foo> & <bar>', '<foo> & <bar>'],
    ['<img src="x">', '<img src="x">'],
    ['<img src="x"> &amp;', '<img src="x"> &'],
    ['&lt;foo&gt; &quot;bar&quot; &copy; &#169; &#x1F600;', '<foo> "bar" © © 😀'],
    ['&amp;lt; &amp;lt;', '&lt; &lt;'],
    ['<!-- comment --> <![CDATA[text]]> &amp;', '<!-- comment --> <![CDATA[text]]> &'],
    ['  first\r\n\tsecond  ', '  first\r\n\tsecond  '],
])('decodes entities once without interpreting tags: %s', (text, expected) => {
    expect(decodeHtmlEntities(text)).toBe(expected);
});

const getTextWidth = async (text: string) => Array.from(text).length * 10;

test.each([
    {text: 'one two three', width: 70, maxRowCount: 3, rows: ['one two', 'three']},
    {text: 'one two three four', width: 70, maxRowCount: 2, rows: ['one two', 'three…']},
    {text: 'ABCDEFGHIJK', width: 40, maxRowCount: 3, rows: ['ABCD', 'EFGH', 'IJK']},
    {text: 'ABCDEFGHIJK', width: 40, maxRowCount: 2, rows: ['ABCD', 'EFG…']},
    {text: 'ABCDEFGHIJK a', width: 50, maxRowCount: 3, rows: ['ABCDE', 'FGHIJ', 'K a']},
    {text: 'one\n\ntwo\r\nthree', width: 70, maxRowCount: 4, rows: ['one', '', 'two', 'three']},
    {text: 'one\ntwo', width: 70, maxRowCount: 1, rows: ['one…']},
    {text: 'one\n', width: 70, maxRowCount: 1, rows: ['one']},
    {text: 'one\n  ', width: 70, maxRowCount: 1, rows: ['one']},
    {text: '😀😀😀', width: 20, maxRowCount: 2, rows: ['😀😀', '😀']},
    {text: 'one two', width: 0, maxRowCount: 3, rows: []},
    {text: 'one', width: 5, maxRowCount: 2, rows: ['', '']},
])('wraps and caps text (%j)', async ({rows, ...args}) => {
    const result = await wrapTextWithEllipsis({...args, getTextWidth});
    expect(result).toEqual(rows);
    for (const row of result) {
        expect(await getTextWidth(row)).toBeLessThanOrEqual(Math.max(0, args.width));
    }
});

const measureMultiline = async (text: string) => ({
    width: Array.from(text).length * 10,
    height: 12,
    hangingOffset: 2,
});

test.each([
    {text: 'Alpha', lines: ['Alpha'], width: 50},
    {text: 'Alpha\nBeta', lines: ['Alpha', 'Beta'], width: 50},
    {text: 'Alpha\nBeta\n', lines: ['Alpha', 'Beta'], width: 50},
    {text: 'Alpha\n\n\n', lines: ['Alpha'], width: 50},
    {text: 'A\n\n      \n\t', lines: ['A'], width: 10},
    {text: 'Alpha\n\nBeta', lines: ['Alpha', '', 'Beta'], width: 50},
    {text: '\nAlpha', lines: ['', 'Alpha'], width: 50},
    {text: '\n\n', lines: [''], width: 0},
    {text: '', lines: [''], width: 0},
])('measures visible rows only and reports the rows it renders (%j)', async ({text, ...rest}) => {
    const {lines, width} = rest;

    // `lines` is both the measurement input and the rendered row list, so `height` must agree
    // with it. Blank rows between visible rows stay; trailing ones are dropped.
    expect(await getMultilineTextInfo({text, getTextSize: measureMultiline})).toEqual({
        lines,
        width,
        height: lines.length * 12,
        lineHeight: 12,
        hangingOffset: 2,
    });
});
