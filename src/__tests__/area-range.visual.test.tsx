import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {areaRangeBasicData} from '../__stories__/__data__';

import {AreaRangeEventsTestStory} from './components/AreaRangeEventsTestStory';
import {getLocatorBoundingBox} from './utils';

test.describe('Area range series', () => {
    test('Basic @webkit', async ({mount}) => {
        const component = await mount(<ChartTestStory data={areaRangeBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Hover and click expose the range point', async ({mount, page}) => {
        const component = await mount(<AreaRangeEventsTestStory data={areaRangeBasicData} />);
        const region = component.locator('.gcharts-area-range__region');
        const initialFill = await region.getAttribute('fill');
        const box = await getLocatorBoundingBox(region);

        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

        await expect(page.locator('.gcharts-tooltip')).toContainText('–');
        expect(await region.getAttribute('fill')).not.toBe(initialFill);

        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await expect(component.locator('[data-qa="clicked-range"]')).toContainText('–');
    });
});
