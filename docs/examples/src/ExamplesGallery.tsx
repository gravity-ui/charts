import React from 'react';

import {Button, Dialog} from '@gravity-ui/uikit';

import {CodeBlock} from './CodeBlock';
import {galleryGroups, registry} from './charts/registry';

import './examples-gallery.css';

const groupId = (name: string) => name.toLowerCase().replace(/ /g, '-');

interface ExampleCardProps {
    id: string;
    example: (typeof registry)[string];
    onShowCode: () => void;
}

function ExampleCard({id, example, onShowCode}: ExampleCardProps) {
    const ref = React.useRef<HTMLElement>(null);
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                setVisible(entries.some((entry) => entry.isIntersecting));
            },
            {rootMargin: '200px'},
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <article ref={ref} className="chart-example-card" id={id}>
            <header className="chart-example-card__header">
                <h3>{example.meta.title}</h3>
            </header>
            <div className="chart-example-card__chart">{visible && <example.Component />}</div>
            <p className="chart-example-card__description">{example.meta.description}</p>
            <div className="chart-example-card__actions">
                <Button onClick={onShowCode} aria-label={`Code for ${example.meta.title}`}>
                    Code
                </Button>
                <a className="chart-example-card__link" href={example.meta.docsUrl}>
                    Learn more{' '}
                    <span className="chart-example-card__sr-only">about {example.meta.title}</span>
                    <span aria-hidden="true"> →</span>
                </a>
            </div>
        </article>
    );
}

export function ExamplesGallery() {
    const ref = React.useRef<HTMLDivElement>(null);
    const [codeExampleId, setCodeExampleId] = React.useState<string>();
    const codeTitleId = React.useId();
    const codeExample = codeExampleId ? registry[codeExampleId] : undefined;

    React.useEffect(() => {
        const scrollToHash = () => {
            let id: string;
            try {
                id = decodeURIComponent(window.location.hash.slice(1));
            } catch {
                return;
            }
            const target = document.getElementById(id);
            if (target && ref.current?.contains(target)) target.scrollIntoView();
        };

        // Gallery anchors do not exist when the browser first processes the URL.
        scrollToHash();
        window.addEventListener('hashchange', scrollToHash);
        return () => window.removeEventListener('hashchange', scrollToHash);
    }, []);

    return (
        <div ref={ref} className="chart-examples-gallery">
            <nav className="chart-examples-gallery__nav" aria-label="Example groups">
                {galleryGroups.map(({name}) => (
                    <a key={name} href={`pages/examples.html#${groupId(name)}`}>
                        {name}
                    </a>
                ))}
            </nav>
            {galleryGroups.map(({name, ids}) => (
                <section key={name} aria-labelledby={groupId(name)}>
                    <h2 id={groupId(name)}>{name}</h2>
                    <div className="chart-examples-gallery__grid">
                        {ids.map((id) => (
                            <ExampleCard
                                key={id}
                                id={id}
                                example={registry[id]}
                                onShowCode={() => setCodeExampleId(id)}
                            />
                        ))}
                    </div>
                </section>
            ))}
            <Dialog
                open={Boolean(codeExample)}
                onClose={() => setCodeExampleId(undefined)}
                size="l"
                contentOverflow="auto"
                className="chart-examples-gallery__code-dialog"
                aria-labelledby={codeTitleId}
            >
                <Dialog.Header id={codeTitleId} caption={codeExample?.meta.title} />
                <Dialog.Body>{codeExample && <CodeBlock code={codeExample.code} />}</Dialog.Body>
            </Dialog>
        </div>
    );
}
