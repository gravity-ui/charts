import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ReflowFailure} from './fixtures/ReflowFailure';

test.describe('Reflow asynchronous diagnostics', () => {
    for (const mode of ['awaited', 'ignored', 'no-reflow'] as const) {
        test(`${mode} preserves original preparation error @webkit`, async ({mount, page}) => {
            const errors: Error[] = [];
            page.on('pageerror', (error) => errors.push(error));
            const component = await mount(<ReflowFailure mode={mode} />);
            await expect(component.getByLabel('status')).toHaveText('ready');
            await expect(component.locator('.gcharts-line path')).not.toHaveCount(0);
            await component.getByRole('button', {name: 'Fail preparation'}).click();
            if (mode === 'awaited') {
                await expect(component.getByLabel('status')).toHaveText('awaited original');
                await expect(component.getByLabel('unhandled')).toHaveText('none');
                expect(errors).toHaveLength(0);
            } else {
                await expect(component.getByLabel('unhandled')).toHaveText('original');
                await expect
                    .poll(() =>
                        errors.some((error) =>
                            error.message.includes('real asynchronous preparation failure'),
                        ),
                    )
                    .toBe(true);
            }
        });
    }
});
