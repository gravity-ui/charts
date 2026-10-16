import React from 'react';

function getReadableText(html: string) {
    const template = document.createElement('template');
    template.innerHTML = html;
    template.content.querySelectorAll('script, style, template').forEach((node) => node.remove());
    template.content.querySelectorAll('br, p, div, li').forEach((node) => {
        node.before(' ');
        node.after(' ');
    });
    return (template.content.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function useHtmlTextOverflow() {
    const [element, ref] = React.useState<HTMLElement | null>(null);
    const [truncated, setTruncated] = React.useState(false);
    const [text, setText] = React.useState('');

    React.useLayoutEffect(() => {
        if (!element) return undefined;
        let frame = 0;
        let measuredHtml: string | undefined;
        const measure = () => {
            const nodes = [element, ...element.querySelectorAll<HTMLElement>('*')];
            setTruncated(
                nodes.some((node) => {
                    const style = getComputedStyle(node);
                    return (
                        (/(hidden|clip|auto|scroll)/.test(style.overflowX) &&
                            node.scrollWidth > node.clientWidth) ||
                        (/(hidden|clip|auto|scroll)/.test(style.overflowY) &&
                            node.scrollHeight > node.clientHeight)
                    );
                }),
            );
            const html = element.innerHTML;
            if (html !== measuredHtml) {
                measuredHtml = html;
                setText(getReadableText(html));
            }
        };
        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
        };
        const resize = new ResizeObserver(schedule);
        const observe = () => {
            resize.disconnect();
            resize.observe(element);
            element.querySelectorAll('*').forEach((node) => resize.observe(node));
        };
        const mutation = new MutationObserver((records) => {
            if (records.some((record) => record.type === 'childList')) observe();
            schedule();
        });
        observe();
        mutation.observe(element, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
        });
        document.fonts?.addEventListener('loadingdone', schedule);
        measure();
        return () => {
            cancelAnimationFrame(frame);
            resize.disconnect();
            mutation.disconnect();
            document.fonts?.removeEventListener('loadingdone', schedule);
        };
    }, [element]);

    return {ref, text, truncated};
}
