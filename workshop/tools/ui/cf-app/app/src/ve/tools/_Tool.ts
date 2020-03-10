import { Widget, WidgetUtils } from '..';
import { Metadata } from '../components/metadata';
import { GeomUtils } from '../utils/GeomUtils';
/*define(["dojo/_base/declare",
    "davinci/ve/widget",
    "davinci/ve/utils/GeomUtils"], (declare, widget, GeomUtils) => declare("davinci.ve.tools._Tool", null, {
*/
export class Tool {
    _context: any;
    _target: any;
    _targetOverlays: any;
    _getTarget() {
        return this._target;
    }
    activate(context) {
        this._context = context;
    }

    deactivate() {
        this._setTarget(null);
    }
    onMouseDown(e: any) {

    }
    onMouseOver(e: any) {

    }
    onMouseOut(e: any) {

    }
    onMouseUp(e: any) {

    }
    onKeyDown(event) {
        //FIXME: Research task. This routine doesn't get fired when using CreateTool and drag/drop from widget palette.
        // Perhaps the drag operation created a DIV in application's DOM causes the application DOM
        // to be the keyboard focus?
    }
    onKeyUp(event) {
        //FIXME: Research task. This routine doesn't get fired when using CreateTool and drag/drop from widget palette.
        // Perhaps the drag operation created a DIV in application's DOM causes the application DOM
        // to be the keyboard focus?
    }

    /**
     * Update the editFeedback box(es) that are superimposed over the canvas to capture
     * mouse events over primitive widgets, thereby preventing default mouse event handlers
     * on widgets from receiving events during page editing
     * @param {object} target  A DOM node which (in almost all cases) has received a mouseover event
     * @param {object) event  The event object
     */
    _setTarget(target, event?: any) {

        if (!this._targetOverlays) {
            this._targetOverlays = [];
        }

        if (this._matchesTargetOverlay(target)) {
            return;
        }

        const containerNode = this._context.getContainerNode();
        let w;

        while (target && target != containerNode) {
            w = WidgetUtils.getEnclosingWidget(target);
            // Not sure when w.getContext() won't be true. Maybe that check deals with
            // widgets that are either not completely ready or in process of being deleted?
            // If anyone knows answer, please update this comment.
            if (w && !w.getContext()) {
                target = w.domNode.parentNode;
                w = null;
            } else if (w && Metadata.queryDescriptor(w.type, 'enablePointerEvents')) {
                // By default, this function posts an overlay DIV over primitive widgets to mask/capture
                // mouse/touch/pointer events  that might otherwise trigger a widget's own interactive logic,
                // such as bringing up popup menus or onhover styling.
                // The "enablePointerEvents" descriptor property says don't mask/capture these events
                // and let those events go right through into the underlying widget.
                w = null;
                break;
            } else {
                // Flow typically comes to here. The following check determines if
                // current widget is a container, which means it can contain other widgets.
                // If a container, then don't put editFeedback overlay over this DOM node
                // because we want user to be able to click-select on child widgets,
                // (unless the "isControl" metadata override is set for this widget type).
                if (w && w.getContainerNode()) {
                    // Some Dijit widgets inherit from dijit._Container even those
                    // they aren't really meant to contain child widgets.
                    // "isControl" metadata flag overrides and says this is really
                    // a primitive widget not a container widget.
                    if (!Metadata.queryDescriptor(w.type, 'isControl')) {
                        w = null;
                    }
                }
                break;
            }
        }

        if (w) {
            //target is what we calculated for "w"
            this._target = w;

            //Change the dimensions of the overlay region based on the target
            this._updateTargetOverlays(event);

            //Insert overlay element(s)
            this._insertTargetOverlays();
        } else {
            //No target, so remove the overlay region(s)
            this._removeTargetOverlays();
            this._target = null;
        }
    }

    // Calculate bounds for "target" overlay rectangle(s)
    _updateTargetOverlays(event?: any) {
        //Let's clear out overlay regions array
        this._removeTargetOverlays();
        if (!this._target) {
            return;
        }

        const domNode = this._target.domNode;
        const maxZIndex = this._getMaxZIndex(domNode);
        if (this._targetOverlays) {

            //See if helper wants to tell us what to use for target overlays
            const helper = this._target.getHelper();
            if (helper && helper.getTargetOverlays) {
                const customTargetOverlays = helper.getTargetOverlays(this._target);
                if (customTargetOverlays && customTargetOverlays.length > 0) {
                    customTargetOverlays.forEach((customOverlay) => {
                        //Create a new overlay div and set up according to dimensions
                        //from the helper
                        const overlay =
                            this._getNewTargetOverlay(customOverlay,
                                customOverlay.x, customOverlay.y,
                                customOverlay.width, customOverlay.height,
                                maxZIndex);

                        //Add new overlay div to our overall list
                        this._targetOverlays.push(overlay);
                    });
                    //We're done here
                    return;
                }
            }

            let left = domNode.offsetLeft;
            let top = domNode.offsetTop;
            let width = domNode.offsetWidth;
            let height = domNode.offsetHeight;

            if (event) {

                // This code addresses #2136, where CSS transforms shift the widget and
                // therefore offsetLeft/Top/Width/Height are not reliable indicators
                // of a node's bounds. Unfortunately, there are no getBoundingBox APIs
                // in browsers today that give the post-transform bounds on a node.
                // However, at least WebKit is smart enough to have onmouseover event
                // deal with the post-transform location of a particular node.
                // So, to deal with this issue, increase the bounding box to include pageX/pageY.
                let diff;
                const borderBoxPageCoords = GeomUtils.getBorderBoxPageCoordsCached(domNode);
                if (event.pageX < borderBoxPageCoords.l) {
                    diff = borderBoxPageCoords.l - event.pageX;
                    left -= diff;
                    width += diff;
                }
                if (event.pageY < borderBoxPageCoords.t) {
                    diff = borderBoxPageCoords.t - event.pageY;
                    top -= diff;
                    height += diff;
                }
                if (event.pageX > borderBoxPageCoords.l + borderBoxPageCoords.w) {
                    diff = event.pageX - (borderBoxPageCoords.l + borderBoxPageCoords.w);
                    width += diff;
                }
                if (event.pageY > borderBoxPageCoords.t + borderBoxPageCoords.h) {
                    diff = event.pageY - (borderBoxPageCoords.t + borderBoxPageCoords.h);
                    height += diff;
                }
            }

            //No special overlay regions, so let's just do the normal thing and calculate
            //overlay region dimensions ourselves
            const overlay =
                this._getNewTargetOverlay(domNode, left, top, width, height, maxZIndex);

            //Add new overlay div to our overall list
            this._targetOverlays.push(overlay);
        }
    }

    //Calculate zIndex -- we want a zIndex at least equal to the maximum
    //zIndex of domNode and it's descendants. This comes into play
    //with HorizontalSlider/VerticalSlider where the progress bar and the
    //knob on the progress bar have higher zIndex values than the slider
    //itself.
    _getMaxZIndex(startNode) {
        //We want to look at the computed zIndex of the startNode and all
        //descendant's of startNode to find the maximum zIndex value
        let max_zIndexStr = $(startNode).css('zIndex');
        debugger;
        /*
        dojo.query('*', startNode).forEach(node => {
            const node_zIndexStr = $(node).css('zIndex');
            const node_zIndexNumber = Number(node_zIndexStr);
            const max_zIndexNumber = Number(max_zIndexStr);
            if (!isNaN(node_zIndexNumber)) {
                //Our node's zIndex maps to a valid number
                if (isNaN(max_zIndexNumber)) {
                    //Our max is not a valid number, so replace it
                    max_zIndexStr = node_zIndexStr;
                } else if (node_zIndexNumber > max_zIndexNumber) {
                    //Both our node and max zIndices map to valid numbers,
                    //so replace max with node zIndex if greater
                    max_zIndexStr = node_zIndexStr;
                }
            }
            //We don't care about the else case (where node's zIndex does not represent a number)
        });

        */
        return max_zIndexStr;
    }

    _getNewTargetOverlay(domNode, x, y, width, height, zIndex) {
        const overlay = this._context.getDojo().create('div', {
            class: 'editFeedback',
            style: {
                position: 'absolute',
                opacity: 0.1,
                left: x + 'px',
                top: y + 'px',
                width: width + 'px',
                height: height + 'px',
                zIndex: zIndex
            }
        });
        return overlay;
    }

    _insertTargetOverlays() {
        if (this._targetOverlays && this._target) {
            const domNode = this._target.domNode;
            const parentNode = domNode.parentNode;
            this._targetOverlays.forEach((overlay) => {
                parentNode.insertBefore(overlay, domNode.nextSibling);
            }, this);
        }
    }

    _removeTargetOverlays() {
        if (this._targetOverlays && this._target) {
            //Need to go in reverse order so pop removes right item from array
            for (let i = this._targetOverlays.length - 1; i >= 0; i--) {
                const overlay = this._targetOverlays[i];
                $(overlay).remove();
                this._targetOverlays.pop();
            }
        }
    }
    _matchesTargetOverlay(target) {
        return this._targetOverlays.some((entry) => target == entry, this);
    }
}
