import React from 'react';

import {useThemeValue} from '@gravity-ui/uikit';

interface Props {
    code: string;
}

export function CodeBlock({code}: Props) {
    const theme = useThemeValue();
    const [highlighted, setHighlighted] = React.useState<{code: string; html: string}>();

    React.useEffect(() => {
        let cancelled = false;
        import('./highlight-code')
            .then(({highlightCode}) => highlightCode(code, theme === 'dark'))
            .then((html) => {
                if (!cancelled) setHighlighted({code, html});
            })
            .catch(() => {
                // The source remains readable if syntax highlighting cannot load.
            });
        return () => {
            cancelled = true;
        };
    }, [code, theme]);

    return (
        <pre
            style={{
                margin: 0,
                padding: 16,
                overflow: 'auto',
                fontSize: 13,
                lineHeight: 1.6,
                backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            }}
        >
            {highlighted?.code === code ? (
                // Monaco colorize escapes HTML entities in the source.
                <code dangerouslySetInnerHTML={{__html: highlighted.html}} />
            ) : (
                <code>{code}</code>
            )}
        </pre>
    );
}
