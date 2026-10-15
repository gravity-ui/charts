import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';

function detectDarkTheme(): boolean {
    if (document.body.classList.contains('g-root_theme_dark')) return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

const themeListeners = new Set<(dark: boolean) => void>();

let observerInitialized = false;
function initGlobalObserver() {
    if (observerInitialized) return;
    observerInitialized = true;

    const notify = () => themeListeners.forEach((fn) => fn(detectDarkTheme()));

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', notify);

    new MutationObserver(notify).observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
    });
}

interface Props {
    children: React.ReactNode;
}

export function DocsTheme({children}: Props) {
    const [isDark, setIsDark] = React.useState(detectDarkTheme);

    React.useEffect(() => {
        initGlobalObserver();
        themeListeners.add(setIsDark);
        return () => {
            themeListeners.delete(setIsDark);
        };
    }, []);

    return <ThemeProvider theme={isDark ? 'dark' : 'light'}>{children}</ThemeProvider>;
}
