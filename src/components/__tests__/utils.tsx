import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {act, render} from '@testing-library/react';

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 400;

export function renderChart(ui: React.ReactElement, options?: {width?: number; height?: number}) {
    const {width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT} = options ?? {};

    const container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', {value: width, configurable: true});
    Object.defineProperty(container, 'clientHeight', {value: height, configurable: true});
    document.body.appendChild(container);

    return render(<ThemeProvider theme="light">{ui}</ThemeProvider>, {container});
}

export function timeout(ms: number) {
    // https://testing-library.com/docs/react-testing-library/api/#act
    // https://reactjs.org/docs/test-utils.html#act
    return act(async () => {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    });
}
