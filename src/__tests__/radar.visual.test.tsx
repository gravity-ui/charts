import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {radarBasicData} from '../__stories__/__data__';

test.describe('Radar series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={radarBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
