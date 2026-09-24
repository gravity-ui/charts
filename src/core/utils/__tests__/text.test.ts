/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {decodeHtmlEntities, getTextSizeFn} from '../text';

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
        expect(await measure('&amp;')).toEqual({width, height: 12, hangingOffset: 2});
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
