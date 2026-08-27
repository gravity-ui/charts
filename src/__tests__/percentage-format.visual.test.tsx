import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import type {Locator, Page} from '@playwright/test';

import {PercentageFormatTestStory} from './components/PercentageFormatTestStory';
import {getLocatorBoundingBox} from './utils';

async function hoverCenter(page: Page, locator: Locator) {
    const box = await getLocatorBoundingBox(locator);
    await page.mouse.move(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2));
}

test.describe('Percentage formatter context', () => {
    test('pie labels and tooltip follow currently visible slices', async ({mount, page}) => {
        const component = await mount(<PercentageFormatTestStory seriesType="pie" />);
        const labels = component.locator('.gcharts-pie__label');

        await expect(labels).toContainText(['Alpha label (25%)', 'Beta label (75%)']);

        await component.locator('.gcharts-legend__item', {hasText: 'Beta'}).click();
        await expect(labels).toHaveCount(1);
        await expect(labels.first()).toHaveText('Beta label (100%)');

        await hoverCenter(page, component.locator('.gcharts-pie__segment').first());
        await expect(page.locator('.gcharts-tooltip')).toContainText('75 (100%)');
    });

    test('bar-x percent stack exposes percentages in labels and tooltip', async ({mount, page}) => {
        const component = await mount(<PercentageFormatTestStory seriesType="bar-x" />);
        const labels = component.locator('.gcharts-bar-x__label');

        await expect(labels).toContainText(['25 (25%)', '75 (75%)']);

        await hoverCenter(page, component.locator('.gcharts-bar-x__segment').first());
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toContainText('25 (25%)');
        await expect(tooltip).toContainText('75 (75%)');

        await component.locator('.gcharts-legend__item', {hasText: 'Second'}).click();
        await expect(labels).toHaveCount(1);
        await expect(labels.first()).toHaveText('75 (100%)');

        await hoverCenter(page, component.locator('.gcharts-bar-x__segment').first());
        await expect(tooltip).toContainText('75 (100%)');
    });

    test('bar-y percent stack exposes percentages in labels and tooltip', async ({mount, page}) => {
        const component = await mount(<PercentageFormatTestStory seriesType="bar-y" />);
        const labels = component.locator('.gcharts-bar-y__label');

        await expect(labels).toContainText(['25 (25%)', '75 (75%)']);

        await hoverCenter(page, component.locator('.gcharts-bar-y__segment').first());
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toContainText('25 (25%)');
        await expect(tooltip).toContainText('75 (75%)');

        await component.locator('.gcharts-legend__item', {hasText: 'Second'}).click();
        await expect(labels).toHaveCount(1);
        await expect(labels.first()).toHaveText('75 (100%)');

        await hoverCenter(page, component.locator('.gcharts-bar-y__segment').first());
        await expect(tooltip).toContainText('75 (100%)');
    });

    test('area percent stack exposes percentages in labels and tooltip', async ({mount, page}) => {
        const component = await mount(<PercentageFormatTestStory seriesType="area" />);
        const labels = component.locator('.gcharts-area__label');

        await expect(labels.filter({hasText: '25 (25%)'})).toHaveCount(2);
        await expect(labels.filter({hasText: '75 (75%)'})).toHaveCount(2);

        await hoverCenter(page, labels.filter({hasText: '25 (25%)'}).first());
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toContainText('25 (25%)');
        await expect(tooltip).toContainText('75 (75%)');

        await component.locator('.gcharts-legend__item', {hasText: 'Second'}).click();
        await expect(labels).toHaveCount(2);
        await expect(labels.filter({hasText: '75 (100%)'})).toHaveCount(2);

        await hoverCenter(page, labels.first());
        await expect(tooltip).toContainText('75 (100%)');
    });
});
