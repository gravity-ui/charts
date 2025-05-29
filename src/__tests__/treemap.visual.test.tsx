import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {treemapBasicData} from 'src/__stories__/__data__';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

test.describe.only('Treemap series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={treemapBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
