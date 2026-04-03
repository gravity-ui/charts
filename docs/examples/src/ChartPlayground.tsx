import React from 'react';

import {Tab, TabList, TabPanel, TabProvider, ThemeProvider} from '@gravity-ui/uikit';
import * as monaco from 'monaco-editor';

declare global {
    interface Window {
        MonacoEnvironment?: {getWorker: () => Worker};
    }
}

// Disable web workers — we only use the tokenizer, not language services.
// Each call creates and immediately revokes a fresh blob URL to avoid leaking
// object URLs while still satisfying Monaco's worker contract.
let monacoInitialized = false;
function initMonaco() {
    if (monacoInitialized) return;
    monacoInitialized = true;

    window.MonacoEnvironment = {
        getWorker() {
            const url = URL.createObjectURL(new Blob([''], {type: 'application/javascript'}));
            const worker = new Worker(url);
            URL.revokeObjectURL(url);
            return worker;
        },
    };
}

type View = 'chart' | 'code';

type Props = {
    code: string;
    Component: () => React.ReactElement;
};

// --- Singleton theme manager ---

function detectDarkTheme(): boolean {
    if (document.body.classList.contains('g-root_theme_dark')) {
        return true;
    }
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

export function ChartPlayground({code, Component}: Props) {
    const [view, setView] = React.useState<View>('chart');
    const [isDark, setIsDark] = React.useState(detectDarkTheme);
    const [highlighted, setHighlighted] = React.useState('');

    // Mount: initialise Monaco, start listening for theme changes
    React.useEffect(() => {
        initMonaco();
        initGlobalObserver();
        const listener = (dark: boolean) => setIsDark(dark);
        themeListeners.add(listener);
        return () => {
            themeListeners.delete(listener);
        };
    }, []);

    // Theme: update Monaco theme — colourisation uses CSS classes, so no re-colorize needed
    React.useEffect(() => {
        monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');
    }, [isDark]);

    // Colorize: only re-run when code changes, not on every theme toggle
    React.useEffect(() => {
        let cancelled = false;
        monaco.editor.colorize(code, 'typescript', {}).then((html: string) => {
            if (!cancelled) setHighlighted(html);
        });
        return () => {
            cancelled = true;
        };
    }, [code]);

    return (
        <ThemeProvider theme={isDark ? 'dark' : 'light'}>
            <div
                style={{
                    border: '1px solid var(--g-color-line-generic)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    margin: '24px 0',
                }}
            >
                <TabProvider value={view} onUpdate={(v) => setView(v as View)}>
                    <TabList style={{padding: '0 8px'}}>
                        <Tab value="chart">Preview</Tab>
                        <Tab value="code">Code</Tab>
                    </TabList>

                    <TabPanel value="chart">
                        <div style={{height: '320px', padding: '16px'}}>
                            <Component />
                        </div>
                    </TabPanel>

                    <TabPanel value="code">
                        <pre
                            style={{
                                margin: 0,
                                padding: '16px',
                                overflow: 'auto',
                                fontSize: '13px',
                                lineHeight: '1.6',
                                backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
                            }}
                            // Monaco's colorize() escapes HTML entities in the code
                            // content, so its output is safe to inject.
                            // IMPORTANT: when runtime editing is added, the code
                            // string will come from user input — verify that Monaco
                            // still escapes it before removing this note or consider
                            // running the output through DOMPurify.

                            dangerouslySetInnerHTML={{__html: highlighted}}
                        />
                    </TabPanel>
                </TabProvider>
            </div>
        </ThemeProvider>
    );
}
