import React from 'react';

import {settings} from '@gravity-ui/date-utils';
import type {Lang} from '@gravity-ui/uikit';
import {configure} from '@gravity-ui/uikit';
import type {Decorator} from '@storybook/react';

export const WithLang: Decorator = (Story, context) => {
    const lang = context.globals.lang;
    const [key, forceRender] = React.useState(0);

    React.useEffect(() => {
        configure({
            lang: lang as Lang,
        });

        settings.loadLocale(lang).then(() => {
            settings.setLocale(lang);
            forceRender((c) => c + 1);
        });
    }, [lang]);

    return <Story key={key} {...context} />;
};
