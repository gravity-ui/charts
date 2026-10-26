import React from 'react';

import {Provider} from '@gravity-ui/uikit';
import type {Decorator} from '@storybook/react-vite';

export const WithContext: Decorator = (Story, context) => {
    return (
        <React.StrictMode>
            <Provider
                theme={context.globals.theme}
                direction={context.globals.direction}
                mobile={context.globals.platform === 'mobile'}
            >
                <Story {...context} />
            </Provider>
        </React.StrictMode>
    );
};
