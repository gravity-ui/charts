import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {BarPointClickEventsTestStory} from './BarPointClickEventsTestStory';

for (const seriesType of ['bar-x', 'bar-y'] as const) {
    test(`${seriesType} equal data replacement refreshes source objects and preserves legend selection and pin @webkit`, async ({
        mount,
        page,
    }) => {
        const component = await mount(<BarPointClickEventsTestStory seriesType={seriesType} />);
        const bars = component.locator(`.gcharts-${seriesType}__segment`);
        const firstLegendItem = component.locator('.gcharts-legend__item', {hasText: 'First'});
        const secondLegendItem = component.locator('.gcharts-legend__item', {hasText: 'Second'});
        const pointClicks = component.getByTestId('point-clicks');
        const expectedPoint = {
            name: 'Second',
            x: seriesType === 'bar-x' ? 1 : 8,
            y: seriesType === 'bar-y' ? 1 : 8,
            customId: 'Second-1',
            currentPoint: true,
            currentSeries: true,
            nativeEvent: true,
        };

        await expect(bars).toHaveCount(4);
        await secondLegendItem.click();
        await expect(bars).toHaveCount(2);
        await bars.last().click();
        await expect(pointClicks).toHaveText(JSON.stringify([expectedPoint]));
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toHaveClass(/gcharts-tooltip_pinned/);
        const originalBar = await bars.last().elementHandle();
        if (!originalBar) throw new Error('Expected a rendered bar before replacing data');

        await component.update(
            <BarPointClickEventsTestStory seriesType={seriesType} generation={1} />,
        );
        await expect(component.getByTestId('generation')).toHaveText('1');
        await expect.poll(() => originalBar.evaluate((element) => element.isConnected)).toBe(false);
        await originalBar.dispose();
        await expect(component.locator('svg').first()).toHaveAttribute('width', '400');
        await expect(component.locator('.gcharts-chart__content')).toHaveAttribute('width', '320');
        await expect(bars).toHaveCount(2);
        await expect(bars.first()).toHaveAttribute('fill', '#8ad554');
        await expect(bars.last()).toHaveAttribute('fill', '#8ad554');
        await expect(firstLegendItem.locator('text')).toHaveClass(/item-text_unselected/);
        await expect(secondLegendItem.locator('text')).toHaveClass(/item-text_selected/);
        await expect(tooltip).toHaveClass(/gcharts-tooltip_pinned/);

        await bars.last().click();
        await expect(pointClicks).toHaveText(JSON.stringify([expectedPoint, expectedPoint]));
        await expect(tooltip).not.toHaveClass(/gcharts-tooltip_pinned/);
    });
}
