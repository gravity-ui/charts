import React from 'react';

import {Tab, TabList, TabPanel, TabProvider} from '@gravity-ui/uikit';

import {CodeBlock} from './CodeBlock';
import {DocsTheme} from './DocsTheme';

type View = 'chart' | 'code';

interface Props {
    code: string;
    Component: () => React.ReactElement;
}

export function ChartPlayground({code, Component}: Props) {
    const [view, setView] = React.useState<View>('chart');

    return (
        <DocsTheme>
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
                        <div style={{height: 320, padding: '16px'}}>
                            <Component />
                        </div>
                    </TabPanel>
                    <TabPanel value="code">{view === 'code' && <CodeBlock code={code} />}</TabPanel>
                </TabProvider>
            </div>
        </DocsTheme>
    );
}
