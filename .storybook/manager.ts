import React from 'react';

import {getThemeType} from '@gravity-ui/uikit';
import {addons, types, useGlobals, useStorybookApi} from 'storybook/manager-api';

import {themes} from './theme';

const ADDON_ID = 'yc-theme-addon';
const TOOL_ID = `${ADDON_ID}tool`;

function Tool() {
    const [{theme}] = useGlobals();
    const api = useStorybookApi();

    React.useEffect(() => {
        api.setOptions({
            theme: themes[getThemeType(theme)],
        });
    }, [theme, api]);

    return null;
}

addons.setConfig({theme: themes.light});
addons.register(ADDON_ID, () => {
    addons.add(TOOL_ID, {
        type: types.TOOL,
        title: 'Theme',
        render: Tool,
    });
});
