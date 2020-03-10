import { Evented, Handle } from '../../shared/Evented';
import { byId } from '../_html';
import { GeomUtils } from '../utils';
import { WidgetUtils } from '..';
import { autoScrollStart, autoScroll } from './_AutoScroll';
import { style } from '../_html/DomStyle';
import * as $ from 'jquery';

// import * as autoscroll from './_AutoScroll';

export class Mover extends Evented {
    events: Handle[];
    host: any;
    mouseButton: any;
    marginBox: { l: any; t: any; };
    node: HTMLElement;
    // summary:
    //		an object which makes a node follow the mouse, or touch-drag on touch devices.
    //		Used as a default mover, and as a base class for custom movers.

    constructor(node, e, host) {
        super();

        // node: Node
        //		a node (or node's id) to be moved
        // e: Event
        //		a mouse event, which started the move;
        //		only pageX and pageY properties are used
        // host: Object?
        //		object which implements the functionality of the move,
        //	 	and defines proper events (onMoveStart and onMoveStop)
        this.node = byId(node);
        this.marginBox = { l: e.pageX, t: e.pageY };
        this.mouseButton = e.button;
        let h = (this.host = host);
        let d = node.ownerDocument;

        function stopEvent(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const $doc = $(d);

        this.events = [
            // At the start of a drag, onFirstMove is called, and then the following
            // listener is disconnected.
            this.on('mousemove', this.onFirstMove, $doc),

            // These are called continually during the drag
            // on(d, touch.move, lang.hitch(this, "onMouseMove")),
            this.on('mousemove', this.onMouseMove, $doc),

            // And these are called at the end of the drag
            // on(d, touch.release, lang.hitch(this, "onMouseUp")),
            this.on('mouseup', this.onMouseUp, $doc),

            // cancel text selection and text dragging
            this.on('dragstart', stopEvent, $doc),
            this.on('selectstart', stopEvent, $(d.body)),
            // on(d.body, "selectstart", stopEvent)
        ];

        // Tell autoscroll that a drag is starting
        autoScrollStart(d);

        // notify that the move has started
        if (h && h.onMoveStart) {
            h.onMoveStart(this);
        }
    }
    // mouse event processors
    onMouseMove(e) {
        // summary:
        //		event processor for onmousemove/ontouchmove
        // e: Event
        //		mouse/touch event
        autoScroll(e);
        let m = this.marginBox;
        this.host.onMove(this, { l: m.l + e.pageX, t: m.t + e.pageY }, e);
        e.preventDefault();
        e.stopPropagation();
    }
    onMouseUp(e) {
        if (this.mouseButton == e.button) { // TODO Should condition be met for touch devices, too?
            this.destroy();
        }
        e.preventDefault();
        e.stopPropagation();
    }
    // utilities
    onFirstMove(e) {
        // summary:
        //		makes the node absolute; it is meant to be called only once.
        //		relative and absolutely positioned nodes are assumed to use pixel units
        let s = this.node.style;
        let l;
        let t;
        let h = this.host;
        switch (s.position) {
            case 'relative':
            case 'absolute':
                // assume that left and top values are in pixels already
                l = Math.round(parseFloat(s.left)) || 0;
                t = Math.round(parseFloat(s.top)) || 0;
                break;
            default:
                s.position = 'absolute';	// enforcing the absolute mode
                let m = GeomUtils.getMarginBox(this.node);
                // event.pageX/pageY (which we used to generate the initial
                // margin box) includes padding and margin set on the body.
                // However, setting the node's position to absolute and then
                // doing domGeom.marginBox on it *doesn't* take that additional
                // space into account - so we need to subtract the combined
                // padding and margin.  We use getComputedStyle and
                // _getMarginBox/_getContentBox to avoid the extra lookup of
                // the computed style.
                let b = document.body;
                let bs = style.getComputedStyle(b);
                let bm = GeomUtils.getMarginBox(b, bs);
                let bc = GeomUtils.getContentBox(b, bs);
                l = m.l - (bc.l - bm.l);
                t = m.t - (bc.t - bm.t);
                break;
        }
        this.marginBox.l = l - this.marginBox.l;
        this.marginBox.t = t - this.marginBox.t;
        if (h && h.onFirstMove) {
            h.onFirstMove(this, e);
        }

        // Disconnect touch.move that call this function
        this.events.shift().destroy();
    }
    destroy() {
        // summary:
        //		stops the move, deletes all references, so the object can be garbage-collected
        // this.events, function (handle) { handle.remove(); });
        // undo global settings
        this.destroyHandles();
        let h = this.host;
        if (h && h.onMoveStop) {
            h.onMoveStop(this);
        }
        this.events.forEach((e) => e.destroy());
        // destroy objects
        this.events = this.node = this.host = null;
    }
}
