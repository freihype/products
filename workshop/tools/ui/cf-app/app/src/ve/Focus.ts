import { mixin } from '@xblox/core/objects';
import { create, byId, stopEvent } from './_html';
import { GeomUtils } from './utils/GeomUtils';
import { Metadata } from './components/metadata';
import { Evented, on, destroy } from '../shared/Evented';
import * as $ from 'jquery';
import './Focus.scss';
import { keys } from './keys';
import { Mover } from './tools/Mover';
import { States } from './States';
/*
define([
		"dojo/_base/declare",
		"dijit/_WidgetBase",
		"dojo/dnd/Mover",
		"../Runtime",
		"./metadata",
		"./States",
		"./utils/GeomUtils"
	],
	(declare, _WidgetBase, Mover, Runtime, Metadata, States, GeomUtils) => {
*/
// Nobs and frame constants
// nob and frame
const LEFT = 0;

const RIGHT = 1;
const TOP = 2;
const BOTTOM = 3;
// nob only
const LEFT_TOP = 4;

const LEFT_BOTTOM = 5;
const RIGHT_TOP = 6;
const RIGHT_BOTTOM = 7;

export class Focus extends Evented {

    _connections: any;
    _resizeBottom: any;
    _resizeRight: any;
    _op: any;
    _inline: any;
    _custom: any;
    _frames: any[];
    _stdChrome: any;
    _nobs: any[];
    _cm: any;
    declaredClass: any;
    _currentItem: boolean;
    _box: any;
    _displayedWidget: any;
    _contexDiv: any;
    _lastMouseUp: any;
    _moverMouseUpEvent: any;
    _lastEventTarget: any;
    _moverCurrentConstrained: { l: any; t: any; w: any; h: any; };
    _resizeTop: any;
    _resizeLeft: any;
    _keyUpHandler: any;
    _keyDownHandler: any;
    _moverMouseUpHandler: any;
    _moverMouseDownEvent: any;
    _mouseDownInfo: { widget: any; pageX: any; pageY: any; dateValue: number; };
    _mover: any;
    _moverDragDiv: any;
    _moverCurrent: any;
    _moverStart: { moverLeft: number; moverTop: number; l: any; t: any; w: any; h: any; };
    _frameIndex: any;
    _nobIndex: any;
    _sKey: boolean;
    _shiftKey: any;
    _context: any;
    _selectedWidget: any;
    domNode: any;
    // Inside knowledge about CSS classes used to style editFocusNob and editFocusFrame DIVs
    nobSize: number = 11;
    frameSize: number = 6;

    constructor(parent: any) {
        super();
        this.domNode = create('div', null, parent);
        this.postCreate();
    }

    postCreate() {
        //FIXME: maybe listen for mouseout on doc, and if so, stop the dragging?

        $(this.domNode).addClass('maqFocus');
        $(this.domNode).css({
            position: 'absolute',
            display: 'none'
        }); // FIXME: use CSS class to change display property
        this._stdChrome = create('div', {
            class: 'editFocusStdChrome'
        }, this.domNode);

        this._frames = [];
        for (let i = 0; i < 4; i++) {
            const frame = create('div', {
                class: 'editFocusFrame'
            }, this._stdChrome);
            this._frames.push(frame);
            // this.connect(frame, 'onmousedown', 'onMouseDown');
            this.on('mousedown', this.onMouseDown, $(frame));
        }

        $(this._frames[LEFT]).addClass('editFocusFrameLEFT');
        $(this._frames[RIGHT]).addClass('editFocusFrameRIGHT');
        $(this._frames[TOP]).addClass('editFocusFrameTOP');
        $(this._frames[BOTTOM]).addClass('editFocusFrameBOTTOM');

        this._nobs = [];
        for (let i = 0; i < 8; i++) {
            const nob = create('div', {
                class: 'editFocusNob'
            }, this._stdChrome);
            this._nobs.push(nob);
            // this.connect(nob, 'onmousedown', 'onMouseDown');
            this.on('mousedown', this.onMouseDown, $(nob));
        }
        this._nobIndex = -1;
        this._frameIndex = -1;

        this._custom = create('div', {
            class: 'editFocusCustom'
        }, this.domNode);

        window['fframe'] = this;
    }

    resize(box, widget) {
        if (widget) {
            this._selectedWidget = widget;
        }
        this._moverCurrent = mixin({}, box);
        this._moverCurrentConstrained = mixin({}, this._moverCurrent);
        this._updateFocusChrome(this._moverCurrent, true /*offScreenAdjust*/);
        if (this._contexDiv) { // Theme editor only
            const x = box.w + 10;
            this._contexDiv.style.left = x + 'px';
            this._updateSubwidgetList();
        }
        this._box = box; // Only used by theme editor's subwidget logic
    }

    getBounds() {
        return this._moverCurrent;
    }

    show(widget, params) {
        //console.log('show focus: ', widget);
        const inline = params && params.inline;
        if (!widget) {
            // sometimes you get no widget when  DnD in split screen
            return;
        }
        this._custom.innerHTML = '';
        const showStandardSelectionChrome = Metadata.queryDescriptor(widget.type, 'showStandardSelectionChrome');
        this._stdChrome.style.display = (showStandardSelectionChrome === false) ? 'none' : 'block';
        this.domNode.style.display = 'block';
        this._selectedWidget = widget;
        const helper = widget.getHelper();
        let delete_inline = true;
        if (helper && helper.onShowSelection) {
            helper.onShowSelection({
                widget: widget,
                customDiv: this._custom
            });
        }
        if (inline) {
            this.showInline(widget); // sometimes the widget changes from undo/redo som get the current widget
            delete_inline = false;
        }
        if (delete_inline) {
            delete this._inline; // delete any old inline kicking around
        }
    }

    showInline(widget) {
        this._selectedWidget = widget;
        const context = this._context;
        const self = this;
        Metadata.getSmartInput(widget.type).then(inline => {
            if (!inline) {
                return;
            }
            self._inline = inline;

            /* THE COMMENTED OUT CODE BELOW ACTUALLY WORKS BUT NO WIDGETS ARE USING IT TODAY
             * SO COMMENTING OUT OF PRODUCT.
            // Check ancestors for 'inlineEditDescendantIntercept' property.
            // If ancestor has such a property and if the current node matches
            // one of the selectors specific in that property's array
            var p = widget.getParent();
            var ancestor;
            while_loop:
            while(p && p.domNode && p.domNode.tagName != 'BODY'){
                var inlineEditDescendantIntercept = Metadata.queryDescriptor(p.type, 'inlineEditDescendantIntercept');
                if(inlineEditDescendantIntercept && inlineEditDescendantIntercept.length){
                    for(var i=0; i<inlineEditDescendantIntercept.length; i++){
                        var selector = inlineEditDescendantIntercept[i];
                        var nodelist = Query(selector, p.domNode);
                        for(var j=0; j<nodelist.length; j++){
                            if(nodelist[j] == widget.domNode){
                                ancestor = p;
                                break while_loop;
                            }
                        }
                    }
                }
                p = p.getParent();
            }
            if(ancestor){
                context.deselect(widget);
                context.select(ancestor);
                var parentFocusObject = context.getFocus(ancestor);
                parentFocusObject.showInline(ancestor);
            }else
            */
            if (inline.useParent) {
                const parentWidget = widget.getParent();
                if (parentWidget) {
                    context.deselect(widget);
                    context.select(parentWidget);
                    const parentFocusObject = context.getFocus(parentWidget);
                    parentFocusObject.showInline(parentWidget);
                }
            } else if (inline.show) {
                inline.show(widget.id);
            }
        });
    }

    inlineEditActive() {
        if (this._inline && this._inline.inlineEditActive) {
            return this._inline.inlineEditActive();
        }

        return false;
    }

    hide(inline) {

        const widget = this._selectedWidget;
        const helper = widget ? widget.getHelper() : undefined;
        if (helper && helper.onHideSelection) {
            helper.onHideSelection({
                widget: widget,
                customDiv: this._custom
            });
        }
        this.domNode.style.display = 'none';
        this._selectedWidget = null; // Used by page editor
        this._displayedWidget = null; // Used by theme editor
        if (this._inline) {
            this._inline.hide();
            delete this._inline;
        }
    }

    allow(op) {
        if (!op) {
            return;
        }
        this._op = op;

        if (!this._selectedWidget) {
            return;
        }

        const display: any = {};
        const helper = this._selectedWidget.getHelper();
        if (helper && helper.resizeAllowWhich) {
            helper.resizeAllowWhich(this._selectedWidget, display);
            this._resizeLeft = display.resizeLeft;
            this._resizeRight = display.resizeRight;
            this._resizeTop = display.resizeTop;
            this._resizeBottom = display.resizeBottom;
        } else {
            this._resizeLeft = this._resizeRight = op.resizeWidth;
            this._resizeTop = this._resizeBottom = op.resizeHeight;
        }
        display.left = (this._resizeLeft && !this._resizeTop && !this._resizeBottom) ? 'block' : 'none';
        display.right = (this._resizeRight && !this._resizeTop && !this._resizeBottom) ? 'block' : 'none';
        display.top = (this._resizeTop && !this._resizeLeft && !this._resizeRight) ? 'block' : 'none';
        display.bottom = (this._resizeBottom && !this._resizeLeft && !this._resizeRight) ? 'block' : 'none';
        display.left_top = (this._resizeLeft && this._resizeTop) ? 'block' : 'none';
        display.left_bottom = (this._resizeLeft && this._resizeBottom) ? 'block' : 'none';
        display.right_top = (this._resizeRight && this._resizeTop) ? 'block' : 'none';
        display.right_bottom = (this._resizeRight && this._resizeBottom) ? 'block' : 'none';
        this._nobs[LEFT].style.display = display.left;
        this._nobs[RIGHT].style.display = display.right;
        this._nobs[TOP].style.display = display.top;
        this._nobs[BOTTOM].style.display = display.bottom;
        this._nobs[LEFT_TOP].style.display = display.left_top;
        this._nobs[LEFT_BOTTOM].style.display = display.left_bottom;
        this._nobs[RIGHT_TOP].style.display = display.right_top;
        this._nobs[RIGHT_BOTTOM].style.display = display.right_bottom;
        this._nobs[LEFT].style.cursor = this._frames[LEFT].style.cursor = this._resizeLeft ? 'w-resize' : 'auto';
        this._nobs[RIGHT].style.cursor = this._frames[RIGHT].style.cursor = this._resizeRight ? 'e-resize' : 'auto';
        this._nobs[TOP].style.cursor = this._frames[TOP].style.cursor = this._resizeTop ? 'n-resize' : 'auto';
        this._nobs[BOTTOM].style.cursor = this._frames[BOTTOM].style.cursor = this._resizeBottom ? 's-resize' : 'auto';
        this._nobs[LEFT_TOP].style.cursor = display.left_top != 'none' ? 'nw-resize' : 'auto';
        this._nobs[LEFT_BOTTOM].style.cursor = display.left_bottom != 'none' ? 'sw-resize' : 'auto';
        this._nobs[RIGHT_TOP].style.cursor = display.right_top != 'none' ? 'ne-resize' : 'auto';
        this._nobs[RIGHT_BOTTOM].style.cursor = display.right_bottom != 'none' ? 'se-resize' : 'auto';
    }

    /**
     * Update the position of the various DIVs that make up the selection chrome
     * @param {object} rect - location/size for currently selected widget in form of {l:,t:,w:,h:}
     * @param {boolean} offScreenAdjust - whether to pull selection in from off edge of canvas
     */
    _updateFocusChrome(rect, offScreenAdjust) {
        if ('moverLeft' in rect) {
            this._context.isResizing = true;
        }
        offScreenAdjust = true;
        // Various constants leveraging knowledge about selection chrome CSS style rules
        const nobOffScreenAdjust = this.nobSize + 1;
        const frameOffScreenAdjusted = this.frameSize + 1;
        const normalFrameLeft = -6;
        const normalFrameTop = -6;
        const normalNobLeft = -11;
        const normalNobTop = -11;
        const frameSizeWidthAdjust = 4;
        const frameSizeBorderAdjust = 4;

        const focusContainer = byId('focusContainer');
        if (!focusContainer) {
            // Occasionally, timing is such that first time this routine is called,
            // focusContainer doesn't exist yet. No problem, this routine will get
            // called later again after the focusContainer has been created.
            return;
        }
        const focusContainerBounds = GeomUtils.getBorderBoxPageCoords(focusContainer);
        const context = this._context;
        const parentIframe = context.getParentIframe();
        const parentbounds = GeomUtils.getBorderBoxPageCoords(parentIframe);
        rect.l += parentbounds.l;
        rect.t += parentbounds.t;
        if (!parentIframe) {
            console.error('have no parent iframe');
            return;
        }
        if (!parentIframe.contentDocument) {
            console.error('have no contentDocument');
            return;
        }
        if (!parentIframe.contentDocument.body) {
            console.error('have no body');
            return;
        }
        const bodyElement = parentIframe.contentDocument.body;
        rect.l -= GeomUtils.getScrollLeft(bodyElement);
        rect.t -= GeomUtils.getScrollTop(bodyElement);
        const dH = parentbounds.h - parentbounds.t;
        //if (rect.h > parentbounds.h) {
        //	rect.h = dH;
        // }

        // FIXME: Disable the offscreen adjust in all cases - should just delete that code
        offScreenAdjust = true;

        this.domNode.style.left = (rect.l - focusContainerBounds.l) + 'px';
        this.domNode.style.top = (rect.t - focusContainerBounds.t) + 'px';

        const nobLeftsideAdjustedLeft = normalNobLeft;
        const nobTopsideAdjustedTop = normalNobTop;
        const nobRightsideAdjustedLeft = rect.w;
        const nobBottomsideAdjustedTop = rect.h;
        const nobWidthAdjusted = rect.w;
        const nobHeightAdjusted = rect.h;
        const frameLeftsideLeftAdjusted = normalFrameLeft;
        const frameTopsideTopAdjusted = normalFrameTop;
        const frameRightsideAdjustedLeft = rect.w;
        const frameBottomsideAdjustedTop = rect.h;

        const frameWidthAdjusted = rect.w + frameSizeWidthAdjust + frameSizeBorderAdjust;
        const frameHeightAdjusted = rect.h + frameSizeWidthAdjust + frameSizeBorderAdjust;

        const doc = this.domNode && this.domNode.ownerDocument;
        const body = doc && doc.body;

        /*
                        if (offScreenAdjust && body) {
                            // Determine if parts of selection are off screen
                            // If so, shift selection DIVs to make it visible
                            var farthestLeft, farthestTop, farthestRight, farthestBottom;
                            var canvasLeft = GeomUtils.getScrollLeft(body);
                            var canvasTop = GeomUtils.getScrollTop(body);
                            var canvasRight = canvasLeft + body.clientWidth;
                            var canvasBottom = canvasTop + body.clientHeight;

                            farthestLeft = rect.l - nobOffScreenAdjust;
                            farthestTop = rect.t - nobOffScreenAdjust;
                            var nobOffScreenAdjustLeft = farthestLeft < canvasLeft ? canvasLeft - farthestLeft : 0;
                            var nobOffScreenAdjustTop = farthestTop < canvasTop ? canvasTop - farthestTop : 0;
                            nobLeftsideAdjustedLeft += nobOffScreenAdjustLeft;
                            nobTopsideAdjustedTop += nobOffScreenAdjustTop;

                            farthestRight = rect.l + rect.w + nobOffScreenAdjust;
                            farthestBottom = rect.t + rect.h + nobOffScreenAdjust;
                            var nobRightAdjust = farthestRight > canvasRight ? canvasRight - farthestRight : 0;
                            var nobBottomAdjust = farthestBottom > canvasBottom ? canvasBottom - farthestBottom : 0;
                            nobRightsideAdjustedLeft += nobRightAdjust;
                            nobBottomsideAdjustedTop += nobBottomAdjust;

                            farthestLeft = rect.l - frameOffScreenAdjusted;
                            farthestTop = rect.t - frameOffScreenAdjusted;
                            var frameOffScreenAdjustedLeft = farthestLeft < canvasLeft ? canvasLeft - farthestLeft : 0;
                            var frameOffScreenAdjustedTop = farthestTop < canvasTop ? canvasTop - farthestTop : 0;
                            frameLeftsideLeftAdjusted += frameOffScreenAdjustedLeft;
                            frameTopsideTopAdjusted += frameOffScreenAdjustedTop;
                            frameWidthAdjusted -= frameOffScreenAdjustedLeft;
                            frameHeightAdjusted -= frameOffScreenAdjustedTop;

                            farthestRight = rect.l + rect.w + frameOffScreenAdjusted;
                            farthestBottom = rect.t + rect.h + frameOffScreenAdjusted;
                            var frameRightAdjust = farthestRight > canvasRight ? canvasRight - farthestRight : 0;
                            var frameBottomAdjust = farthestBottom > canvasBottom ? canvasBottom - farthestBottom : 0;
                            frameRightsideAdjustedLeft += frameRightAdjust;
                            frameBottomsideAdjustedTop += frameBottomAdjust;
                            farthestRight = frameOffScreenAdjustedLeft + frameWidthAdjusted;
                            farthestBottom = frameOffScreenAdjustedTop + frameHeightAdjusted;
                            var frameWAdjust = (farthestRight + frameSizeBorderAdjust) > canvasRight ? canvasRight - (farthestRight + frameSizeBorderAdjust) : 0;
                            var frameHAdjust = (farthestBottom + frameSizeBorderAdjust) > canvasBottom ? canvasBottom - (farthestBottom + frameSizeBorderAdjust) : 0;
                            frameWidthAdjusted += frameWAdjust;
                            frameHeightAdjusted += frameHAdjust;
                        }
        */
        const left = this._frames[LEFT];

        const right = this._frames[RIGHT];
        const top = this._frames[TOP];
        const bottom = this._frames[BOTTOM];

        this._frames[LEFT].style.left =
            this._frames[TOP].style.left =
            this._frames[BOTTOM].style.left = frameLeftsideLeftAdjusted + 'px';

        this._frames[LEFT].style.top =
            this._frames[TOP].style.top =
            this._frames[RIGHT].style.top = frameTopsideTopAdjusted + 'px';

        this._frames[LEFT].style.height = frameHeightAdjusted + 'px';

        this._frames[RIGHT].style.height = frameHeightAdjusted + 'px';
        this._frames[RIGHT].style.left = frameRightsideAdjustedLeft + 'px';

        this._frames[TOP].style.width = frameWidthAdjusted + 'px';

        this._frames[BOTTOM].style.top = frameBottomsideAdjustedTop + 'px';
        this._frames[BOTTOM].style.width = frameWidthAdjusted + 'px';

        const l = Math.round(nobWidthAdjusted / 2 - this.nobSize / 2);
        const t = Math.round(nobHeightAdjusted / 2 - this.nobSize / 2);

        this._nobs[LEFT].style.left =
            this._nobs[LEFT_TOP].style.left =
            this._nobs[LEFT_BOTTOM].style.left = nobLeftsideAdjustedLeft + 'px';
        this._nobs[TOP].style.top =
            this._nobs[LEFT_TOP].style.top =
            this._nobs[RIGHT_TOP].style.top = nobTopsideAdjustedTop + 'px';
        this._nobs[LEFT].style.top = t + 'px';
        this._nobs[RIGHT].style.left = nobRightsideAdjustedLeft + 'px';
        this._nobs[RIGHT].style.top = t + 'px';
        this._nobs[TOP].style.left = l + 'px';
        this._nobs[BOTTOM].style.left = l + 'px';
        this._nobs[BOTTOM].style.top = nobBottomsideAdjustedTop + 'px';
        this._nobs[LEFT_BOTTOM].style.top = nobBottomsideAdjustedTop + 'px';
        this._nobs[RIGHT_TOP].style.left = nobRightsideAdjustedLeft + 'px';
        this._nobs[RIGHT_BOTTOM].style.left = nobRightsideAdjustedLeft + 'px';
        this._nobs[RIGHT_BOTTOM].style.top = nobBottomsideAdjustedTop + 'px';

        // Hack to get around Chrome bug/quirk that is triggered by certain widgets.
        // See issue https://github.com/maqetta/maqetta/issues/2967
        // For some reason, even though the left/top coordinates of the focus box
        // are correctly updated, Chrome doesn't actually redraw the focus box until
        // some other "redraw trigger" happens within its code.
        // To force such an redraw trigger, fiddle with opacity property.
        /*
        #xmaqFix: this was leaking and seems no longer needed
        this.domNode.style.opacity = .95;
        setTimeout(function(){
            this.domNode.style.opacity = 1;
        }.bind(this), 1);
        */
    }

    onMouseDown(event) {
        this._removeKeyHandlers();

        if (!this._selectedWidget || !this._selectedWidget.domNode) {
            return;
        }
        // not to start Mover on the context menu
        if (event.button === 2 || event.ctrlKey) {
            return;
        }
        // Only process mousedown events when SelectTool is active
        // Mostly to allow CreateTool to drag out widget initial size even
        // when mouse is over focus nodes
        if (this._context._activeTool.declaredClass != 'davinci.ve.tools.SelectTool') {
            return;
        }
        this._shiftKey = event.shiftKey;
        this._sKey = false;

        this._nobIndex = this._nobs.indexOf(event.target);
        this._frameIndex = this._frames.indexOf(event.target);
        const moverDragDivSize = 800;
        const moverDragDivHalf = 400;
        const l = event.pageX - moverDragDivHalf;
        const t = event.pageY - moverDragDivHalf;
        let marginBoxPageCoords = null;
        const helper = this._selectedWidget.getHelper();
        if (helper && helper.getMarginBoxPageCoords) {
            marginBoxPageCoords = helper.getMarginBoxPageCoords(this._selectedWidget);
        } else {
            const node = this._selectedWidget.domNode;
            marginBoxPageCoords = GeomUtils.getMarginBoxPageCoords(node);
        }
        const parentIframeOffset = GeomUtils.getBorderBoxPageCoords(this._context.getParentIframe());
        this._moverStart = {
            moverLeft: l,
            moverTop: t,
            l: marginBoxPageCoords.l + parentIframeOffset.l,
            t: marginBoxPageCoords.t + parentIframeOffset.t,
            w: marginBoxPageCoords.w,
            h: marginBoxPageCoords.h
        };

        const bodyNode = document.body;
        this._moverCurrent = mixin({}, this._moverStart);
        this._moverDragDiv = create('div', {
            class: 'focusDragDiv',
            style: 'position:absolute;left:' + l + 'px;top:' + t + 'px;width:' + moverDragDivSize + 'px;height:' + moverDragDivSize + 'px'
        },
            bodyNode);

        this._mover = new Mover(this._moverDragDiv, event, this);
        stopEvent(event);

        this._mouseDownInfo = {
            widget: this._selectedWidget,
            pageX: event.pageX + parentIframeOffset.l,
            pageY: event.pageY + parentIframeOffset.t,
            dateValue: Date.now()
        };

        // Temporarily stash the mousedown event so that the upcoming
        // onMoveStop handler can process that event.
        this._moverMouseDownEvent = event;

        this._moverMouseUpEvent = null;
        this._moverMouseUpHandler = on('onmouseup', this.onMouseDown, $(this._moverDragDiv), this);
        const userdoc = this._context.getDocument(); // inner document = user's document

        // Chrome doesn't blur active focus node when switching frames, so focus on something else focusable first to cause the blur
        const _ps = document.getElementById('maqetta_project_select');
        if (_ps) {
            _ps.focus();
        }

        userdoc.defaultView.focus(); // Make sure the userdoc is the focus object for keyboard events
        /*

        this._keyDownHandler = dojo.connect(userdoc, 'onkeydown', dojo.hitch(this, function (e) {
            this.onKeyDown(e);
        }));
        this._keyUpHandler = dojo.connect(userdoc, 'onkeyup', dojo.hitch(this, function (e) {
            this.onKeyUp(e);
        }));*/
    }

    /**
     * Callback routine from dojo.dnd.Mover with every mouse move.
     * What that means here is dragging on selection nob or selection frame.
     * @param {object} mover - return object from dojo.dnd.Mover constructor
     * @param {object} box - {l:,t:} top/left corner of where drag DIV should go
     * @param {object} event - the mousemove event
     */
    onMove(mover, box, event) {
        // If there was any dragging, prevent a mousedown/mouseup combination
        // from triggering a select operation
        this._mouseDownInfo = null;

        // Update the transparent overlay DIV that tracks mouse and
        // intercepts mouse events from activating widgets under mouse
        if (this._moverDragDiv) {
            this._moverDragDiv.style.left = box.l + 'px';
            this._moverDragDiv.style.top = box.t + 'px';
        }

        // Don't do move operation if dragging on an edge where that dimension of the widget
        // is not resizable
        if ((this._frameIndex === LEFT && !this._resizeLeft) || (this._frameIndex === RIGHT && !this._resizeRight) ||
            (this._frameIndex === TOP && !this._resizeTop) || (this._frameIndex === BOTTOM && !this._resizeBottom)) {
            return;
        }

        // Recompute focus chrome's bounds for normal/unconstrained resizing (via dragging nob or frame)
        const start = this._moverStart;
        const dx = box.l - start.moverLeft;
        const dy = box.t - start.moverTop;
        if (this._frameIndex === LEFT || this._nobIndex === LEFT_TOP || this._nobIndex === LEFT || this._nobIndex === LEFT_BOTTOM) {
            this._moverCurrent.l = start.l + dx;
            this._moverCurrent.w = start.w - dx;
        } else if (this._frameIndex === RIGHT || this._nobIndex === RIGHT_TOP || this._nobIndex === RIGHT || this._nobIndex === RIGHT_BOTTOM) {
            this._moverCurrent.w = start.w + dx;
        }
        if (this._frameIndex === TOP || this._nobIndex === LEFT_TOP || this._nobIndex === TOP || this._nobIndex === RIGHT_TOP) {
            this._moverCurrent.t = start.t + dy;
            this._moverCurrent.h = start.h - dy;
        } else if (this._frameIndex === BOTTOM || this._nobIndex === LEFT_BOTTOM || this._nobIndex === BOTTOM || this._nobIndex === RIGHT_BOTTOM) {
            this._moverCurrent.h = start.h + dy;
        }

        // Compute constrained width and height (in case shift key is held down)
        let constrainedWidth = this._moverCurrent.w;
        let constrainedHeight = this._moverCurrent.h;
        let constraintSet = false;
        if (this._selectedWidget && this._selectedWidget.domNode.nodeName === 'IMG') {
            const domNode = this._selectedWidget.domNode;
            //FIXME: Add natural width/height feature for clip art widgets
            const naturalWidth = domNode.naturalWidth;
            const naturalHeight = domNode.naturalHeight;
            if (typeof naturalHeight == 'number' && naturalHeight > 0 && typeof naturalWidth == 'number' && naturalWidth > 0) {
                const aspectRatio = naturalWidth / naturalHeight;
                if (constrainedWidth < aspectRatio * constrainedHeight) {
                    constrainedWidth = constrainedHeight * aspectRatio;
                } else {
                    constrainedHeight = constrainedWidth / aspectRatio;
                }
                constraintSet = true;
            }
        }
        if (!constraintSet) {
            if (this._frameIndex === LEFT || this._nobIndex === LEFT || this._frameIndex === RIGHT || this._nobIndex === RIGHT) {
                constrainedHeight = constrainedWidth;
            } else if (this._frameIndex === TOP || this._nobIndex === TOP || this._frameIndex === BOTTOM || this._nobIndex === BOTTOM) {
                constrainedWidth = constrainedHeight;
            } else { // dragging corner - use max
                if (constrainedWidth > constrainedHeight) {
                    constrainedHeight = constrainedWidth;
                } else {
                    constrainedWidth = constrainedHeight;
                }
            }
        }
        // Set this._moverCurrentConstrained to hold selection bounds if shift key is held down
        this._moverCurrentConstrained = {
            l: this._moverCurrent.l,
            t: this._moverCurrent.t,
            w: constrainedWidth,
            h: constrainedHeight
        };
        if (this._frameIndex === LEFT || this._nobIndex === LEFT || this._frameIndex === RIGHT || this._nobIndex === RIGHT) {
            this._moverCurrentConstrained.t -= (this._moverCurrentConstrained.h - this._moverCurrent.h) / 2;
        }
        if (this._frameIndex === TOP || this._nobIndex === TOP || this._frameIndex === BOTTOM || this._nobIndex === BOTTOM) {
            this._moverCurrentConstrained.l -= (this._moverCurrentConstrained.w - this._moverCurrent.w) / 2;
        }

        const rect = mixin({}, this._shiftKey ? this._moverCurrentConstrained : this._moverCurrent);
        const parentIframeOffset = GeomUtils.getBorderBoxPageCoords(this._context.getParentIframe());
        rect.l -= parentIframeOffset.l;
        rect.t -= parentIframeOffset.t;
        this._updateFocusChrome(
            rect,
            false //offScreenAdjust
        );
    }

    //Part of Mover interface
    onFirstMove(mover) { }

    //Part of Mover interface
    onMoveStart(mover) { }

    _moverDoneCleanup() {
        const context = this._context;
        const cp = context._chooseParent;
        this._lastEventTarget = null;
        this._removeKeyHandlers();
        context.dragMoveCleanup();
        cp.parentListDivDelete();
        this._mover = undefined;
        this._nobIndex = -1;
        this._frameIndex = -1;
        context.isResizing = false;
    }

    onMoveStop(mover) {
        if (this._moverDragDiv) {
            const parentNode = this._moverDragDiv.parentNode;
            if (parentNode) {
                parentNode.removeChild(this._moverDragDiv);
            }
            this._moverDragDiv = null;
            // Change widget bounds if any dragging has occurred
            if (this._moverCurrent.l != this._moverStart.l || this._moverCurrent.t != this._moverStart.t ||
                this._moverCurrent.w != this._moverStart.w || this._moverCurrent.h != this._moverStart.h) {
                // If 's' key is held down, then CSS parts of MoveCommand only applies to current state
                let applyToWhichStates;
                if (this._selectedWidget && this._selectedWidget.domNode) {
                    if (this._sKey) {
                        const currentStatesList = States.getStatesListCurrent(this._selectedWidget.domNode);
                        for (let i = 0; i < currentStatesList.length; i++) {
                            if (currentStatesList[i]) {
                                applyToWhichStates = currentStatesList[i];
                                break;
                            }
                        }
                    } else {
                        // See if any of width/height have been set in any of the currently active states
                        // (i.e., one of the states whose results are currently showing on the screen).
                        // If so, then apply the move to that state.
                        applyToWhichStates = States.propertyDefinedForAnyCurrentState(this._selectedWidget.domNode, ['width', 'height']);
                    }
                }
                const newBox = this._shiftKey ? this._moverCurrentConstrained : this._moverCurrent;
                if (newBox.w == this._moverStart.w) {
                    delete newBox.w;
                }
                if (newBox.h == this._moverStart.h) {
                    delete newBox.h;
                }
                // MoveCommand requires either both l and t
                if (typeof newBox.l != 'number') {
                    newBox.l = this._moverStart.l;
                }
                if (typeof newBox.t != 'number') {
                    newBox.t = this._moverStart.t;
                }
                // Don't cause a move if left and top haven't changed
                if (newBox.l == this._moverStart.l && newBox.t == this._moverStart.t) {
                    delete newBox.l;
                    delete newBox.t;
                }
                const rect = mixin({}, newBox);
                if (rect.hasOwnProperty('l')) {
                    const parentIframeOffset = GeomUtils.getBorderBoxPageCoords(this._context.getParentIframe());
                    rect.l -= parentIframeOffset.l;
                    rect.t -= parentIframeOffset.t;
                }
                this.onExtentChange(this, this._moverStart, rect, applyToWhichStates);
            }
        }
        this._moverDoneCleanup();

        // If this._moverMouseUpEvent doesn't exist, then no move happened, which means
        // mouse down and mouse up were at same location.
        const event = (this._moverMouseUpEvent || this._moverMouseDownEvent);
        this._moverMouseDownEvent = null;
        this._moverMouseUpEvent = null;

        if (event && event.target) {
            const dblClickInterval = 750; // .75seconds: big time slot for tablets
            const clickDistance = 10; // within 10px: inexact for tablets
            const dateValue = Date.now();

            this._mouseDownInfo = null;

            // Normal browser onDblClick doesn't work because we are interjecting
            // an overlay DIV with a mouseDown operation. As a result,
            // the browser's rules about what is required to trigger an ondblclick are not satisfied.
            // Therefore, we have to do our own double-click timer logic
            if (this._lastMouseUp) {
                if (Math.abs(event.pageX - this._lastMouseUp.pageX) <= clickDistance &&
                    Math.abs(event.pageY - this._lastMouseUp.pageY) <= clickDistance &&
                    (dateValue - this._lastMouseUp.dateValue) <= dblClickInterval) {
                    this.onDblClick(event);
                }
            }
            this._lastMouseUp = {
                pageX: event.pageX,
                pageY: event.pageY,
                dateValue: dateValue
            };
            stopEvent(event);
        }
    }

    onMouseUp(event) {
        // Temporarily stash the mouseup event so that the upcoming
        // onMoveStop handler can process that event.
        this._moverMouseUpEvent = event;
    }

    onDblClick(event) {
        this.showInline(this._selectedWidget);
        event.stopPropagation();
    }

    onKeyDown(event) {
        if (event && this._moverDragDiv) {
            stopEvent(event);
            if (event.keyCode == keys.SHIFT) {
                this._shiftKey = true;
                this._updateFocusChrome(
                    this._shiftKey ? this._moverCurrentConstrained : this._moverCurrent,
                    false /*offScreenAdjust*/
                );
            } else if (event.keyCode == 83) { // 's' key means apply only to current state
                this._sKey = true;
            }
        } else {
            // If event is undefined, something is wrong - remove the key handlers
            this._removeKeyHandlers();
        }
    }

    onKeyUp(event) {
        if (event && this._moverDragDiv) {
            stopEvent(event);
            if (event.keyCode == keys.SHIFT) {
                this._shiftKey = false;
                this._updateFocusChrome(
                    this._shiftKey ? this._moverCurrentConstrained : this._moverCurrent,
                    false /*offScreenAdjust*/
                );
            } else if (event.keyCode == 83) { // 's' key means apply only to current state
                this._sKey = false;
            }
        } else {
            // If event is undefined, something is wrong - remove the key handlers
            this._removeKeyHandlers();
        }
    }

    _removeKeyHandlers() {
        if (this._keyDownHandler) {
            destroy(this._keyDownHandler);
            this._keyDownHandler = null;
        }
        if (this._keyUpHandler) {
            destroy(this._keyUpHandler);
            this._keyUpHandler = null;
        }
    }

    onExtentChange(focus, oldBox, newBox, applyToWhichStates) {
        this.emit('onExtentChange', {
            focus,
            oldBox,
            newBox,
            applyToWhichStates
        });
    }

    /**
     * Returns true if the given node is part of the focus (ie selection) chrome
     */
    isFocusNode(inNode) {
        let node = $(inNode);
        return node.hasClass('focusDragDiv') ||
            node.hasClass('editFocusNob') || node.hasClass('editFocusFrame') ||
            node.hasClass('maqFocus') || node.hasClass('editFocusStdChrome');
    }

    /**************************************
     * Theme editor selection routines
     **************************************/
    showContext(context, widget) {
        if (this._context.editor.declaredClass == 'davinci.ve.themeEditor.ThemeEditor') {
            if (!this._contexDiv) {
                this._context = context;
                //this._selectedWidget = null;
                this._createContextPopUp();
            }
            this._contexDiv.style.display = 'block';
        }
    }

    hideContext() {
        if (this._context.editor.declaredClass == 'davinci.ve.themeEditor.ThemeEditor') {
            if (this._contexDiv) {
                this._contexDiv.style.display = 'none';
            }
        }
    }

    _createContextPopUp() {
        const contexDiv = document.createElement('div');
        contexDiv.id = 'ieb';
        this._contexDiv = contexDiv;
        this.domNode.appendChild(contexDiv);

    }
    //FIXME: should this code be delegated to themeEditor somehow? This was moved here for future use by the page editor.
    // If the page editor every supports styling supwidgets...
    _createSubwidgetList() {
        //if(this._cm)return;
        const widget = this._context._selectedWidget;
        if (!widget) {
            return;
        }
        const themeMetadata = this._context.getThemeMeta().metadata;
        const widgetType = themeMetadata.getWidgetType(widget);
        const widgetMetadata = themeMetadata.getMetadata(widgetType);
        const subwidgets = widgetMetadata ? widgetMetadata.subwidgets : null;

        this._displayedWidget = widget;
        if (subwidgets) {
            const contexDiv = this._contexDiv;
            contexDiv.innerHTML = '<span></span>';
            contexDiv.style.position = 'absolute';
            const x = this._box.w + 10;
            contexDiv.style.left = x + 'px';
            contexDiv.className = 'themeSubwidgetMenu';
            dojo.connect(contexDiv, 'onmousedown', this, 'stopPropagation');
            contexDiv.style.display = 'none';
            this._contexDiv = contexDiv;
            this.domNode.appendChild(contexDiv);
            const span = this._contexDiv.firstElementChild;
            const menuId = this._context.theme.name + '_subwidgetmenu';
            let pMenu = byId(menuId);
            if (pMenu) {
                pMenu.destroyRecursive(false);
            }
            // get the version of dijit that the theme editor html template is using.
            // if we don't when we create the subwidget menu dojo/resources/blank.gif can't be found
            // and we have no check boxes on FF
            const localDijit = this._context.getDijit();
            pMenu = new localDijit.Menu({
                id: menuId
            }, span);
            let checked = false;
            if (!widget.subwidget) {
                checked = true; // no subwidget selected
            }
            const item = new localDijit.CheckedMenuItem({
                label: 'WidgetOuterContainer',
                id: this._context.theme.name + '_WidgetOuterContainer',
                checked: checked,
                onClick: dojo.hitch(this, '_subwidgetSelected', this._context.theme.name + '_WidgetOuterContainer')
            });
            /*
             *  Issue #3733 To support war file deployments and deployments with differnt root contexts other than maqetta
             *  the theme editor ex.dojo-theme-editor.html now loads dojo from a relative location instead of a static location
             *  That change confusses dijit when we create a menu item, the relative path to dojo/resources/blank.gif is not correct
             *  in the domNode. So the line of code below changes the src attribute of the node from the relative path to an absolute
             *  path. Interestingly teh node.src property has the correct absolute path, so we just use that.
             *  At some point in the future we want to move the subwidget context up from the theme editor document to the VE document
             *  but for now this hack works.
             */
            item.domNode.children[0].children[0].setAttribute('src', item.domNode.children[0].children[0].src);
            pMenu.addChild(item);
            this._currentItem = item;
            // tslint:disable-next-line:forin
            for (const s in subwidgets) {
                checked = (widget.subwidget === s);
                const menuItem = new localDijit.CheckedMenuItem({
                    label: s,
                    id: this._context.theme.name + '_' + s,
                    checked: checked,
                    onClick: dojo.hitch(this, '_subwidgetSelected', this._context.theme.name + '_' + s)
                });
                /*
                 *  Issue #3733 To support war file deployments and deployments with differnt root contexts other than maqetta
                 *  the theme editor ex.dojo-theme-editor.html now loads dojo from a relative location instead of a static location
                 *  That change confusses dijit when we create a menu item, the relative path to dojo/resources/blank.gif is not correct
                 *  in the domNode. So the line of code below changes the src attribute of the node from the relative path to an absolute
                 *  path. Interestingly teh node.src property has the correct absolute path, so we just use that.
                 *  At some point in the future we want to move the subwidget context up from the theme editor document to the VE document
                 *  but for now this hack works.
                 */
                menuItem.domNode.children[0].children[0].setAttribute('src', menuItem.domNode.children[0].children[0].src);
                pMenu.addChild(menuItem);
                if (checked) {
                    this._currentItem = menuItem;
                }
            }
            pMenu.startup();
            this._cm = pMenu;
            this._updateSubwidgetListForState();
            this._connections = [];
            this._connections.push(dojo.subscribe('/davinci/ui/subwidgetSelectionChanged', dojo.hitch(this, this._subwidgetSelectedChange)));
            this._connections.push(dojo.subscribe('/davinci/states/state/changed', dojo.hitch(this, this._updateSubwidgetListForState)));
        } else {
            this._contexDiv.innerHTML = '';
        }

    }

    stopPropagation(e) {
        e.stopPropagation();
    }

    _subwidgetSelected(id, e) {
        e.stopPropagation();
        const localDijit = this._context.getDijit();
        const item = localDijit.byId(id);
        let subwidget;
        if (item.checked) {
            if (this._currentItem && item != this._currentItem) {
                this._currentItem.set('checked', false);
            }
            this._currentItem = item;
            subwidget = this._currentItem.label;
        } else {
            this._currentItem = localDijit.byId(this._context.theme.name + '_WidgetOuterContainer');
            if (this._currentItem) {
                this._currentItem.set('checked', true);
            }
            subwidget = null;
        }
        if (e.currentTarget.id === (this._context.theme.name + '_WidgetOuterContainer')) {
            subwidget = null;
        }
        dojo.publish('/davinci/ui/subwidgetSelectionChanged', [{
            subwidget: subwidget,
            origin: this.declaredClass
        }]);

    }

    _subwidgetSelectedChange(e) {

        const localDijit = this._context.getDijit();
        if (e.origin === this.declaredClass) {
            // must be our own message

        } else {
            if (this._currentItem) {
                this._currentItem.set('checked', false); // unset the one we have
            }
            if (e.subwidget) {
                this._currentItem = localDijit.byId(this._context.theme.name + '_' + e.subwidget);
                if (this._currentItem) {
                    this._currentItem.set('checked', true);
                }
            } else {
                this._currentItem = localDijit.byId(this._context.theme.name + '_WidgetOuterContainer');
                if (this._currentItem) {
                    this._currentItem.set('checked', true);
                }
                //this._currentItem = null;
            }
        }
    }

    _updateSubwidgetListForState() {

        if (this._context.editor != Runtime.currentEditor) {
            // not for us
            return;
        }
        if (this._context._selectedWidget && this._displayedWidget === this._context._selectedWidget && this._cm) {
            const editor = Runtime.currentEditor;
            const themeMetadata = editor._theme;
            this._cm.getChildren().forEach(function (child) {
                let subwidget = child.label;
                if (subwidget === 'WidgetOuterContainer') {
                    subwidget = null;
                }
                child.setDisabled(!themeMetadata.isStateValid(
                    this._displayedWidget,
                    editor._currentState,
                    subwidget));
            }, this);
        } else {
            this._clearList();
            this._createSubwidgetList();
        }
    }

    _updateSubwidgetList() {
        if (this._displayedWidget === this._context._selectedWidget) {
            return;
        } // we are already displaying the subwidgets
        this._clearList();
        this._createSubwidgetList();
    }

    _clearList() {

        if (this._cm) {
            this._cm.destroyRecursive(false);
            delete this._cm;
            // tslint:disable-next-line:no-conditional-assignment
            while (connection = this._connections.pop()) {
                dojo.unsubscribe(connection);
            }
        }
        this._currentItem = null;
    }

    // FIXME: Temporary hack just before M5 release
    // Front-end to dojo.style that prevents possible reference through undefined
    dojoStyle(node, name, value) {
        if (node && node.ownerDocument && node.ownerDocument.defaultView) {
            const win = node.ownerDocument.defaultView;
            const cs = win.getComputedStyle(node);
            if (cs) {
                return dojo.style.apply(dojo, arguments);
            }
        }
    }
}
