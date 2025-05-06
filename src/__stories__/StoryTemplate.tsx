import React from 'react';

import {Controls, Primary, Stories, Subtitle, Title} from '@storybook/blocks';

export const StoryTemplate = ({children}: {children: any}) => (
    <React.Fragment>
        <Title />
        <Subtitle />
        {children}
        <Primary />
        <Controls />
        <Stories />
    </React.Fragment>
);
