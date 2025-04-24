import React from 'react';

import {MobileProvider, ThemeProvider} from '@gravity-ui/uikit';
import {beforeMount} from '@playwright/experimental-ct-react/hooks';

import '@gravity-ui/uikit/styles/styles.scss';

beforeMount(async ({App}) => {
    return (
        <ThemeProvider>
            <MobileProvider>
                <App />
            </MobileProvider>
        </ThemeProvider>
    );
});
