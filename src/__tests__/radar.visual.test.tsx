import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {radarBasicData} from 'src/__stories__/__data__';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

test.describe('Radar series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={radarBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
