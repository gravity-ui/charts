import React from 'react';

import {Provider} from '@gravity-ui/uikit';
import {beforeMount} from '@playwright/experimental-ct-react/hooks';

import '../../src/plugins';

import '@gravity-ui/uikit/styles/styles.scss';

beforeMount(async ({App}) => {
    return (
        <Provider>
            <App />
        </Provider>
    );
});
