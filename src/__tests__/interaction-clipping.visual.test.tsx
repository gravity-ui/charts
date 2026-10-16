import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {InteractionClippingTestStory} from './components/InteractionClippingTestStory';

test('exact targets exclude rectangular ancestor clips in transformed coordinates', async ({
    mount,
}) => {
    const component = await mount(<InteractionClippingTestStory />);
    const svg = component.locator('svg');
    const output = component.getByTestId('clipped-targets');
    // Both points are inside the shape's fill and the SVG, but outside the ancestor clip.
    for (const position of [
        {x: 110, y: 40},
        {x: 50, y: 100},
    ]) {
        await svg.click({position: {x: 50, y: 40}});
        await expect(output).toHaveText('["Bar"]');
        expect(
            await component.locator('g rect').evaluate((node, point) => {
                const element = node as SVGRectElement;
                const svgMatrix = element.ownerSVGElement?.getScreenCTM();
                const matrix = element.getScreenCTM();
                if (!svgMatrix || !matrix) throw new Error('Missing SVG transform');
                const svgPoint = new DOMPoint(point.x, point.y).matrixTransform(svgMatrix);
                return element.isPointInFill(svgPoint.matrixTransform(matrix.inverse()));
            }, position),
        ).toBe(true);
        await svg.click({position});
        await expect(output).toHaveText('[]');
    }
});
