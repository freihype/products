/**
 * Adapter for `XPathUtils.getXPath()`; handles the HTMLFile-specific
 * characteristics.  See XPathUtils.js for more info.
 */

export class HtmlFileXPathAdapter {
    elem: any;
    constructor(elem: any) {
        this.elem = elem;
    }

    name() {
        return this.elem.tag;
    }

    parent() {
        const parent = this.elem.parent;
        if (parent.elementType !== 'HTMLFile') {
            return new HtmlFileXPathAdapter(parent);
        }
    }

    index() {
        const tag = this.elem.tag;
        const children = this.elem.parent.children;
        let elems;
        let idx = 0;

        if (children.length === 1) {
            // if parent has only one child, no reason to calculate idx
            return 0;
        }

        elems = children.filter(child => child.tag === tag);

        if (elems.length > 1) {
            elems.some((child, index) => {
                if (child === this.elem) {
                    idx = index + 1;
                    return true;
                }
            }, this);
        }
        return idx;
    }
};
