export const V_TRIGGER_AUTOSCROLL = 32;
export const H_TRIGGER_AUTOSCROLL = 32;

export const V_AUTOSCROLL_VALUE = 16;
export const H_AUTOSCROLL_VALUE = 16;

// These are set by autoScrollStart().
// Set to default values in case autoScrollStart() isn't called. (back-compat, remove for 2.0)
let viewport;
let doc = window.document;
let maxScrollTop = Infinity;
let maxScrollLeft = Infinity;
import { win as win } from '../_html';

export const autoScrollStart = (d) => {
    // summary:
    //		Called at the start of a drag.
    // d: Document
    //		The document of the node being dragged.

    doc = d;
    viewport = win.getBox(doc);

    // Save height/width of document at start of drag, before it gets distorted by a user dragging an avatar past
    // the document's edge
    let html = win.body(doc).parentNode;
    maxScrollTop = Math.max(html.scrollHeight - viewport.h, 0);
    maxScrollLeft = Math.max(html.scrollWidth - viewport.w, 0);	// usually 0
};

export const autoScroll = (e) => {
    // summary:
    //		a handler for mousemove and touchmove events, which scrolls the window, if
    //		necessary
    // e: Event
    //		mousemove/touchmove event

    // FIXME: needs more docs!
    let v = viewport || win.getBox(doc); // getBox() call for back-compat, in case autoScrollStart() wasn't called
    let html = win.body(doc).parentNode;
    let dx = 0;
    let dy = 0;
    if (e.clientX < H_TRIGGER_AUTOSCROLL) {
        dx = -H_AUTOSCROLL_VALUE;
    } else if (e.clientX > v.w - H_TRIGGER_AUTOSCROLL) {
        dx = Math.min(H_AUTOSCROLL_VALUE, maxScrollLeft - html.scrollLeft);	// don't scroll past edge of doc
    }
    if (e.clientY < V_TRIGGER_AUTOSCROLL) {
        dy = -V_AUTOSCROLL_VALUE;
    } else if (e.clientY > v.h - V_TRIGGER_AUTOSCROLL) {
        dy = Math.min(V_AUTOSCROLL_VALUE, maxScrollTop - html.scrollTop);	// don't scroll past edge of doc
    }
    window.scrollBy(dx, dy);
};
