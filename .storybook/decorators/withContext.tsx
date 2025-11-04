import React from 'react';

import {MobileProvider, ThemeProvider} from '@gravity-ui/uikit';
import type {Decorator} from '@storybook/react-webpack5';

export const WithContext: Decorator = (Story, context) => {
    return (
        <React.StrictMode>
            <ThemeProvider theme={context.globals.theme} direction={context.globals.direction}>
                <MobileProvider mobile={context.globals.platform === 'mobile'}>
                    <Story {...context} />
                </MobileProvider>
            </ThemeProvider>
        </React.StrictMode>
    );
};
