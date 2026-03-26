import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {xRangeBasicData} from 'src/__stories__/__data__';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

test.describe('X-Range series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={xRangeBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
