/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {getTextSizeFn} from '../text';

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
