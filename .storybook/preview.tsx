import React from 'react';

import {Lang, configure} from '@gravity-ui/uikit';
import {Controls, Description, Primary, Subtitle, Title} from '@storybook/addon-docs/blocks';
import type {Preview} from '@storybook/react-vite';
import {MINIMAL_VIEWPORTS} from 'storybook/viewport';

import '../src/plugins/index';

import {WithContext} from './decorators/withContext';
import {WithLang} from './decorators/withLang';

import '@gravity-ui/uikit/styles/fonts.scss';
import '@gravity-ui/uikit/styles/styles.scss';

configure({
    lang: Lang.En,
});

const preview: Preview = {
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
        jsx: {showFunctions: false}, // Do not show functions in sources
        viewport: {
            viewports: MINIMAL_VIEWPORTS,
        },
        options: {
            storySort: {
                order: ['From Tests', 'Showcase'],
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
