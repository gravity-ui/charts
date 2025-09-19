import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {areaBasicData} from '../__stories__/__data__';

test.describe('Area series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={areaBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
