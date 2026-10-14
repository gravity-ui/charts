import React from 'react';

import {ChartPlayground} from './ChartPlayground';
import {galleryGroups, registry} from './charts/registry';

import './examples-gallery.css';

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
            </header>
            <div className="chart-example-card__chart">
                {visible && <ChartPlayground Component={example.Component} />}
            </div>
            <p className="chart-example-card__description">{example.meta.description}</p>
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
                            <ExampleCard key={id} id={id} example={registry[id]} />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
