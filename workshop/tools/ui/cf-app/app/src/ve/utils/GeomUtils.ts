/*define([
    "dojo/_base/window",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/has"
], (win, domGeom, domStyle, has) => {
*/
const tableElems = ['TABLE', 'TBODY', 'TR', 'TD', 'TH'];
import { win as win } from '../_html/window';
import { isFirefox, isOpera } from '../_html/browser';
import { style } from '../_html/DomStyle';
import { byId } from '../_html';
export class GeomUtils {

    static getPadBorderExtents (/*DomNode*/ node, /*Object*/ computedStyle) {
        // summary:
        //		Returns object with properties useful for box fitting with
        //		regards to padding.
        // description:
        //		- l/t/r/b = the sum of left/top/right/bottom padding and left/top/right/bottom border (respectively)
        //		- w = the sum of the left and right padding and border
        //		- h = the sum of the top and bottom padding and border
        //
        //		The w/h are used for calculating boxes.
        //		Normally application code will not need to invoke this
        //		directly, and will use the ...box... functions instead.
        // node: DOMNode
        // computedStyle: Object?
        //		This parameter accepts computed styles object.
        //		If this parameter is omitted, the functions will call
        //		dojo/dom-style.getComputedStyle to get one. It is a better way, calling
        //		dojo/dom-style.getComputedStyle once, and then pass the reference to this
        //		computedStyle parameter. Wherever possible, reuse the returned
        //		object of dojo/dom-style.getComputedStyle().

        node = byId(node);
        const s = computedStyle || style.getComputedStyle(node);
        const p = this.getPadExtents(node, s);
        const b = this.getBorderExtents(node, s);
        return {
            l: p.l + b.l,
            t: p.t + b.t,
            r: p.r + b.r,
            b: p.b + b.b,
            w: p.w + b.w,
            h: p.h + b.h
        };
    }

    static position(/*DomNode*/ node, /*Boolean?*/ includeScroll) {
        // summary:
        //		Gets the position and size of the passed element relative to
        //		the viewport (if includeScroll==false), or relative to the
        //		document root (if includeScroll==true).
        //
        // description:
        //		Returns an object of the form:
        //		`{ x: 100, y: 300, w: 20, h: 15 }`.
        //		If includeScroll==true, the x and y values will include any
        //		document offsets that may affect the position relative to the
        //		viewport.
        //		Uses the border-box model (inclusive of border and padding but
        //		not margin).  Does not act as a setter.
        // node: DOMNode|String
        // includeScroll: Boolean?
        // returns: Object

        node = byId(node);
        const db = win.body(node.ownerDocument);
        let ret = node.getBoundingClientRect();
        ret = { x: ret.left, y: ret.top, w: ret.right - ret.left, h: ret.bottom - ret.top };
        // account for document scrolling
        // if offsetParent is used, ret value already includes scroll position
        // so we may have to actually remove that value if !includeScroll
        if (includeScroll) {
            const scroll = this.docScroll(node.ownerDocument);
            ret.x += scroll.x;
            ret.y += scroll.y;
        }

        return ret; // Object
    };
    static docScroll(doc) {
        // summary:
        //		Returns an object with {node, x, y} with corresponding offsets.
        // doc: Document?
        //		Optional document to query.   If unspecified, use win.doc.
        // returns: Object

        let node = (window.document as any).parentWindow || (window.document).defaultView;   // use UI window, not dojo.global window.   TODO: use dojo/window::get() except for circular dependency problem
        return { x: node.pageXOffset, y: node.pageYOffset };
    };

    static getPadExtents(/*DomNode*/ node, /*Object*/ computedStyle) {
        // summary:
        //		Returns object with special values specifically useful for node
        //		fitting.
        // description:
        //		Returns an object with `w`, `h`, `l`, `t` properties:
        //	|		l/t/r/b = left/top/right/bottom padding (respectively)
        //	|		w = the total of the left and right padding
        //	|		h = the total of the top and bottom padding
        //		If 'node' has position, l/t forms the origin for child nodes.
        //		The w/h are used for calculating boxes.
        //		Normally application code will not need to invoke this
        //		directly, and will use the ...box... functions instead.
        // node: DOMNode
        // computedStyle: Object?
        //		This parameter accepts computed styles object.
        //		If this parameter is omitted, the functions will call
        //		dojo/dom-style.getComputedStyle to get one. It is a better way, calling
        //		dojo/dom-style.getComputedStyle once, and then pass the reference to this
        //		computedStyle parameter. Wherever possible, reuse the returned
        //		object of dojo/dom-style.getComputedStyle().

        node = byId(node);
        const s = computedStyle || style.getComputedStyle(node);
        const px = style.toPixelValue;
        const l = px(node, s.paddingLeft);
        const t = px(node, s.paddingTop);
        const r = px(node, s.paddingRight);
        const b = px(node, s.paddingBottom);
        return { l: l, t: t, r: r, b: b, w: l + r, h: t + b };
    };
    static getBorderExtents(/*DomNode*/ node, /*Object*/ computedStyle?: any) {
        // summary:
        //		returns an object with properties useful for noting the border
        //		dimensions.
        // description:
        //		- l/t/r/b = the sum of left/top/right/bottom border (respectively)
        //		- w = the sum of the left and right border
        //		- h = the sum of the top and bottom border
        //
        //		The w/h are used for calculating boxes.
        //		Normally application code will not need to invoke this
        //		directly, and will use the ...box... functions instead.
        // node: DOMNode
        // computedStyle: Object?
        //		This parameter accepts computed styles object.
        //		If this parameter is omitted, the functions will call
        //		dojo/dom-style.getComputedStyle to get one. It is a better way, calling
        //		dojo/dom-style.getComputedStyle once, and then pass the reference to this
        //		computedStyle parameter. Wherever possible, reuse the returned
        //		object of dojo/dom-style.getComputedStyle().
        const none = 'none';
        node = byId(node);
        const px = style.toPixelValue;
        const s = computedStyle || style.getComputedStyle(node);
        const l = s.borderLeftStyle != none ? px(node, s.borderLeftWidth) : 0;
        const t = s.borderTopStyle != none ? px(node, s.borderTopWidth) : 0;
        const r = s.borderRightStyle != none ? px(node, s.borderRightWidth) : 0;
        const b = s.borderBottomStyle != none ? px(node, s.borderBottomWidth) : 0;
        return { l: l, t: t, r: r, b: b, w: l + r, h: t + b };
    };
    /** @scope davinci.ve.utils.GeomUtils */

    /*
     * Page geometry utilities
     */

    static getContentBox(node, computedStyle) {
        // summary:
        //		Returns an object that encodes the width, height, left and top
        //		positions of the node's content box, irrespective of the
        //		current box model.
        // node: DOMNode
        // computedStyle: Object?
        //		This parameter accepts computed styles object.
        //		If this parameter is omitted, the functions will call
        //		dojo/dom-style.getComputedStyle to get one. It is a better way, calling
        //		dojo/dom-style.getComputedStyle once, and then pass the reference to this
        //		computedStyle parameter. Wherever possible, reuse the returned
        //		object of dojo/dom-style.getComputedStyle().

        // clientWidth/Height are important since the automatically account for scrollbars
        // fallback to offsetWidth/Height for special cases (see #3378)
        node = byId(node);
        let s = computedStyle || style.getComputedStyle(node);
        let w = node.clientWidth;
        let h;
        let pe = this.getPadExtents(node, s);
        let be = this.getBorderExtents(node, s);
        if (!w) {
            w = node.offsetWidth;
            h = node.offsetHeight;
        } else {
            h = node.clientHeight;
            be.w = be.h = 0;
        }
        // On Opera, offsetLeft includes the parent's border
        return { l: pe.l, t: pe.t, w: w - pe.w - be.w, h: h - pe.h - be.h };
    }

    static getMarginBox(/*DomNode*/ node, /*Object*/ computedStyle?: any) {
        // summary:
        //		returns an object that encodes the width, height, left and top
        //		positions of the node's margin box.
        // node: DOMNode
        // computedStyle: Object?
        //		This parameter accepts computed styles object.
        //		If this parameter is omitted, the functions will call
        //		dojo/dom-style.getComputedStyle to get one. It is a better way, calling
        //		dojo/dom-style.getComputedStyle once, and then pass the reference to this
        //		computedStyle parameter. Wherever possible, reuse the returned
        //		object of dojo/dom-style.getComputedStyle().
        const none = 'none';
        node = byId(node);
        if (!node) {
            console.error('have no node');
            return {
                l: 0,
                t: 0,
                w: 0,
                h: 0
            };
        }
        let s = computedStyle || style.getComputedStyle(node);
        let me = this.getMarginExtents(node, s);
        let l = node.offsetLeft - me.l;
        let t = node.offsetTop - me.t;
        let p = node.parentNode;
        let px = style.toPixelValue;
        let pcs;
        if (isFirefox) {
            // Mozilla:
            // If offsetParent has a computed overflow != visible, the offsetLeft is decreased
            // by the parent's border.
            // We don't want to compute the parent's style, so instead we examine node's
            // computed left/top which is more stable.
            let sl = parseFloat(s.left);
            let st = parseFloat(s.top);
            if (!isNaN(sl) && !isNaN(st)) {
                l = sl;
                t = st;
            } else {
                // If child's computed left/top are not parseable as a number (e.g. "auto"), we
                // have no choice but to examine the parent's computed style.
                if (p && p.style) {
                    pcs = style.getComputedStyle(p);
                    if (pcs.overflow != 'visible') {
                        l += pcs.borderLeftStyle != none ? px(node, pcs.borderLeftWidth) : 0;
                        t += pcs.borderTopStyle != none ? px(node, pcs.borderTopWidth) : 0;
                    }
                }
            }
        } /*else if (isOpera || (has('ie') == 8 && !has('quirks'))) {
            // On Opera and IE 8, offsetLeft/Top includes the parent's border
            if (p) {
                pcs = style.getComputedStyle(p);
                l -= pcs.borderLeftStyle != none ? px(node, pcs.borderLeftWidth) : 0;
                t -= pcs.borderTopStyle != none ? px(node, pcs.borderTopWidth) : 0;
            }
        }
        */
        return { l: l, t: t, w: node.offsetWidth + me.w, h: node.offsetHeight + me.h };
    }

    /**
     * Returns an object of form {l:, t:, w:, h: }
     * with coordinates of the margin box for the given node
     * in page absolute coordinates
     * @param {object} node  A dom node
     * @returns {object}  margin box coordinates for given node
     */
    static getMarginBoxPageCoords(node) {
        let MarginBoxPageCoords;
        win.withDoc(node.ownerDocument, () => {
            const BorderBoxPageCoords = this.getBorderBoxPageCoords(node);
            const MarginExtents = this.getMarginExtents(node);
            MarginBoxPageCoords = {
                l: BorderBoxPageCoords.l - MarginExtents.l,
                t: BorderBoxPageCoords.t - MarginExtents.t,
                w: BorderBoxPageCoords.w + MarginExtents.l +
                MarginExtents.r,
                h: BorderBoxPageCoords.h + MarginExtents.t + MarginExtents.b
            };
        });
        return MarginBoxPageCoords;
    }

    /**
     * Same as getMarginBoxPageCoords, except it will use the cached version
     * in node._maqMarginBoxPageCoords if present.
     * If no cached version, then set the cached version to current marginbox values.
     * @param {object} node  A dom node
     * @returns {object}  margin box coordinates for given node
     */
    static getMarginBoxPageCoordsCached(node) {
        if (!node._maqMarginBoxPageCoords) {

        }
        //@ximpl.
        // node._maqMarginBoxPageCoords = this.getMarginBoxPageCoords(node);
        //return node._maqMarginBoxPageCoords;
        return this.getMarginBoxPageCoords(node);
    }

    /* Rewrite of Dojo's dom-geometry.position() to not use getBoundingClientRect()
     * which messes up Maqetta in presence of CSS3 transforms. Maqetta's calculations
     * are all based on CSS box model (margins, borders, padding, left/top)
     * not the actual screen locations resulting after applying transforms.
     */
    static getBorderBoxPageCoords(/*DomNode*/node) {
        let o;
        win.withDoc(node.ownerDocument, () => {
            if (tableElems.indexOf(node.tagName)) {
                const bcr = node.getBoundingClientRect();
                const scrollLeft = this.getScrollLeft(node);
                const scrollTop = this.getScrollTop(node);
                o = { l: bcr.left + scrollLeft, t: bcr.top + scrollTop, w: bcr.width, h: bcr.height };
            } else {
                let l = node.offsetLeft;
                let t = node.offsetTop;
                let pn = node.parentNode;
                let opn = node.offsetParent;
                while (pn && pn.tagName != 'BODY') {
                    if (typeof pn.scrollLeft == 'number' && typeof pn.scrollTop == 'number') {
                        l -= pn.scrollLeft;
                        t -= pn.scrollTop;
                    }
                    if (pn == opn) {
                        const BorderExtents = this.getBorderExtents(opn);
                        l += opn.offsetLeft + BorderExtents.l;
                        t += opn.offsetTop + BorderExtents.t;
                        opn = opn.offsetParent;
                    }
                    pn = pn.parentNode;
                }
                o = { l: l, t: t, w: node.offsetWidth, h: node.offsetHeight };
            }
        });
        return o;
    }

    /**
     * Same as getBorderBoxPageCoords, except it will use the cached version
     * in node._maqBorderBoxPageCoords if present.
     * If no cached version, then set the cached version to current borderbox values.
     * @param {object} node  A dom node
     * @returns {object}  border box coordinates for given node
     */
    static getBorderBoxPageCoordsCached(node) {
        if (!node._maqBorderBoxPageCoords) {
            node._maqBorderBoxPageCoords = this.getBorderBoxPageCoords(node);
        }
        return node._maqBorderBoxPageCoords;
    }

    /**
     * Get what IE and WebKit implement as body.scrollLeft, but with special
     * code for Mozilla, which has wrong value. Instead, use window.pageXOffset
     */
    static getScrollLeft(/*DomNode*/node) {
        const doc = node && node.ownerDocument;
        if (isFirefox) {
            const win = doc && doc.defaultView;
            return win ? win.pageXOffset : 0;
        } else {
            const body = doc && doc.body;
            return body ? body.scrollLeft : 0;
        }
    }

    /**
     * Get what IE and WebKit implement as body.scrollTop, but with special
     * code for Mozilla, which has wrong value. Instead, use window.pageYOffset
     */
    static getScrollTop(/*DomNode*/node) {
        const doc = node && node.ownerDocument;
        if (isFirefox) {
            const win = doc && doc.defaultView;
            return win ? win.pageYOffset : 0;
        } else {
            const body = doc && doc.body;
            return body ? body.scrollTop : 0;
        }
    }

    /**
     * Maqetta-specific version of getMarginExtents because dojo's version
     * always equates marginRight = marginLeft due to old Safari quirk.
     * (Same signature as dom-geometry.js's getMarginExtents
     */
    static getMarginExtents(/*DomNode*/node, computedStyle?: any) {
        const s = computedStyle || style.getComputedStyle(node);
        let l;
        let t;
        let r;
        let b;

        function px(value) {
            return parseFloat(value) || 0;
        }

        if (s) {
            l = px(s.marginLeft);
            t = px(s.marginTop);
            r = px(s.marginRight);
            b = px(s.marginBottom);
        } else {
            l = t = r = b = 0;
        }
        return { l: l, t: t, r: r, b: b, w: l + r, h: t + b };
    }

    /**
     * Clear any cached geometry values for the given DOM node
     * @param node  A DOM node
     */
    clearGeomCache(node) {
        delete node._maqBorderBoxPageCoords;
        delete node._maqMarginBoxPageCoords;
    }
}
