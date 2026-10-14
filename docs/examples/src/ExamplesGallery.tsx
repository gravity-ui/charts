import React from 'react';

import {ChartPlayground} from './ChartPlayground';
import {registry} from './charts/registry';

import './examples-gallery.css';

const groups = new Map<string, [string, (typeof registry)[string]][]>();
for (const entry of Object.entries(registry)) {
    const seriesType = entry[1].meta.seriesType;
    const examples = groups.get(seriesType) ?? [];
    examples.push(entry);
    groups.set(seriesType, examples);
}

const sortedGroups = [...groups].sort(([a], [b]) => a.localeCompare(b));
const groupId = (name: string) => name.toLowerCase().replace(/ /g, '-');

interface ExampleCardProps {
    id: string;
    example: (typeof registry)[string];
}

function ExampleCard({id, example}: ExampleCardProps) {
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
                <p>{example.meta.description}</p>
            </header>
            <div className="chart-example-card__playground">
                {visible && (
                    <ChartPlayground code={example.code} Component={example.Component} compact />
                )}
            </div>
            <a className="chart-example-card__link" href={example.meta.docsUrl}>
                Learn more{' '}
                <span className="chart-example-card__sr-only">about {example.meta.title}</span>
                <span aria-hidden="true"> →</span>
            </a>
        </article>
    );
}

export function ExamplesGallery() {
    return (
        <div className="chart-examples-gallery">
            <nav className="chart-examples-gallery__nav" aria-label="Example series types">
                {sortedGroups.map(([name]) => (
                    <a key={name} href={`pages/examples.html#${groupId(name)}`}>
                        {name}
                    </a>
                ))}
            </nav>
            {sortedGroups.map(([name, examples]) => (
                <section key={name} aria-labelledby={groupId(name)}>
                    <h2 id={groupId(name)}>{name}</h2>
                    <div className="chart-examples-gallery__grid">
                        {examples.map(([id, example]) => (
                            <ExampleCard key={id} id={id} example={example} />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
