import topicGroups from './gallery-groups.json';

interface GalleryOptions {
    group?: string;
    order?: number;
}

export interface ExampleMeta {
    title: string;
    description: string;
    seriesType: string;
    docsUrl: string;
    gallery?: GalleryOptions;
}

export function getGalleryGroups(meta: Record<string, ExampleMeta>) {
    const groups = new Map<string, string[]>();
    for (const [id, example] of Object.entries(meta)) {
        const group = example.gallery?.group ?? example.seriesType;
        const ids = groups.get(group) ?? [];
        ids.push(id);
        groups.set(group, ids);
    }

    const topicOrder = (id: string) => topicGroups.findIndex((group) => group.id === id);
    return [...groups]
        .sort(([a], [b]) => topicOrder(a) - topicOrder(b) || a.localeCompare(b))
        .map(([group, ids]) => ({
            name: topicGroups.find((topic) => topic.id === group)?.title ?? group,
            ids: ids.sort(
                (a, b) =>
                    (meta[a].gallery?.order ?? 100) - (meta[b].gallery?.order ?? 100) ||
                    meta[a].title.localeCompare(meta[b].title) ||
                    a.localeCompare(b),
            ),
        }));
}
