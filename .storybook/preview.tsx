// eslint-disable-next-line import/order
import '@gravity-ui/uikit/styles/styles.scss';

import React from 'react';

import {Lang, configure} from '@gravity-ui/uikit';
import {Controls, Description, Primary, Subtitle, Title} from '@storybook/addon-docs/blocks';
import type {Preview} from '@storybook/react-webpack5';
import {MINIMAL_VIEWPORTS} from 'storybook/viewport';

import {WithContext} from './decorators/withContext';
import {WithLang} from './decorators/withLang';

configure({
    lang: Lang.En,
});

const preview: Preview = {
    tags: ['autodocs'],
    parameters: {
        docs: {
            page: () => (
                <React.Fragment>
                    <Title />
                    <Subtitle />
                    <Description />
                    <Primary />
                    <Controls />
                </React.Fragment>
            ),
        },
        jsx: {
            // Do not show functions in sources
            showFunctions: false,
        },
        viewport: {
            options: MINIMAL_VIEWPORTS,
        },
        options: {
            storySort: {
                order: ['Showcase'],
                method: 'alphabetical',
            },
        },
    },
    decorators: [WithLang, WithContext],
    globalTypes: {
        theme: {
            defaultValue: 'light',
            toolbar: {
                title: 'Theme',
                icon: 'mirror',
                items: [
                    {value: 'light', right: '☼', title: 'Light'},
                    {value: 'dark', right: '☾', title: 'Dark'},
                    {value: 'light-hc', right: '☼', title: 'High Contrast Light (beta)'},
                    {value: 'dark-hc', right: '☾', title: 'High Contrast Dark (beta)'},
                ],
                dynamicTitle: true,
            },
        },
        lang: {
            defaultValue: 'en',
            toolbar: {
                title: 'Language',
                icon: 'globe',
                items: [
                    {value: 'en', right: '🇬🇧', title: 'En'},
                    {value: 'ru', right: '🇷🇺', title: 'Ru'},
                ],
                dynamicTitle: true,
            },
        },
        platform: {
            defaultValue: 'desktop',
            toolbar: {
                title: 'Platform',
                items: [
                    {value: 'desktop', title: 'Desktop', icon: 'browser'},
                    {value: 'mobile', title: 'Mobile', icon: 'mobile'},
                ],
                dynamicTitle: true,
            },
        },
    },
};

export default preview;
