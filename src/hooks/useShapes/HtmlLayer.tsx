import React from 'react';

import {Portal} from '@gravity-ui/uikit';

import type {HtmlItem, ShapeDataWithHtmlItems} from '../../types';

type Props = {
    htmlLayout: HTMLElement | null;
    preparedData: ShapeDataWithHtmlItems | ShapeDataWithHtmlItems[];
};

export const HtmlLayer = (props: Props) => {
    const {htmlLayout, preparedData} = props;

    const items = React.useMemo(() => {
        if (Array.isArray(preparedData)) {
            return preparedData.reduce<HtmlItem[]>((result, d) => {
                result.push(...d.htmlElements);
                return result;
            }, []);
        } else {
            return preparedData.htmlElements;
        }
    }, [preparedData]);

    if (!htmlLayout) {
        return null;
    }

    return (
        <Portal container={htmlLayout}>
            {items.map((item, index) => {
                return (
                    <div
                        key={index}
                        dangerouslySetInnerHTML={{__html: item.content}}
                        style={{position: 'absolute', left: item.x, top: item.y}}
                    />
                );
            })}
        </Portal>
    );
};
