import { win as win } from '../_html/window';
import { Tool } from './_Tool';
import { Metadata } from '../components/metadata';
import { WidgetUtils } from '..';
import { XPathUtils } from '../XPathUtils';
import { HtmlFileXPathAdapter } from '../components/html';
import { GeomUtils } from '../utils/GeomUtils';
import { create, stopEvent, style } from '../_html';
import { keys } from '../keys';
import { CompoundCommand } from '../commands/CompoundCommand';
import { MoveCommand } from '../commands/MoveCommand';
import { ResizeCommand } from '../commands/ResizeCommand';
import { Mover } from './Mover';
import * as $ from 'jquery';
import { Snap } from '../Snap';
import { States } from '../States';
import { AddCommand } from '../commands/AddCommand';
import { CreateTool } from './CreateTool';
import { ReparentCommand } from '../commands/ReparentCommand';
//@ximpl.
const dojo = {
    isMac: false
}
/*
define([
    "dojo/_base/declare",
    "dojo/dom-geometry",
    "../../Workbench",
    "../../workbench/Preferences",
    "./_Tool",
    "../widget",
    "../metadata",
    "dojo/dnd/Mover",
    "../../XPathUtils",
    "../../html/HtmlFileXPathAdapter",
    "../Snap",
    "../../commands/CompoundCommand",
    "../commands/AddCommand",
    "../commands/ReparentCommand",
    "../commands/MoveCommand",
    "../commands/ResizeCommand",
    "../tools/CreateTool",
    "../States",
    "../utils/GeomUtils"
], (
    declare,
    domGeom,
    Workbench,
    Preferences,
    tool,
    widgetUtils,
    Metadata,
    Mover,
    XPathUtils,
    HtmlFileXPathAdapter,
    Snap,
    CompoundCommand,
    AddCommand,
    ReparentCommand,
    MoveCommand,
    ResizeCommand,
    CreateTool,
    States,
    GeomUtils
) => declare("davinci.ve.tools.SelectTool", tool, {
*/

export class SelectTool extends Tool {
    _areaSelectDiv: any;
    _moverBox: any;
    _onMouseOverEventTargetXPath: any;
    _areaSelect: any;
    _lastMouseUp: any;
    _altKey: any;
    _mover: any;
    _moverDragDiv: any;
    _moverStartLocationsRel: any[];
    _moverStartLocations: any[];
    _moverLastEventTarget: any;
    _moverWidgets: any[];
    _moverWidget: any;
    _moverAbsolute: boolean;
    _mouseDownInfo: any;
    _sKey: boolean;
    _spaceKey: boolean;
    _shiftKey: any;
    declaredClass : string = 'davinci.ve.tools.SelectTool';
    CONSTRAIN_MIN_DIST: number = 3	// shiftKey constrained dragging only active if user moves object non-trivial amount

    activate(context) {
        this._context = context;
    }

    deactivate() {
        this._setTarget(null);
    }

    onMouseDown(event) {
        const context = this._context;
        if (context.isFocusNode(event.target)) {
            // Don't process mouse events on focus nodes. Focus.js already takes care of those events.
            return;
        }
        //FIXME: Don't allow both parent and child to be selected
        //FIXME: maybe listen for mouseout on doc, and if so, stop the dragging?

        this._shiftKey = event.shiftKey;
        this._spaceKey = false;
        this._sKey = false;
        this._areaSelectClear();

        // See if mouse is within selection rectangle for a primitive widget
        // Sometimes that rectangle is a bit bigger than _getTarget or getEnclosingWidget
        let widget = this._checkFocusXY(event.pageX, event.pageY);
        if (widget && Metadata.getAllowedChild(widget.type)[0] !== 'NONE') {
            widget = null;
        }

        let eventTargetWidget = this._getTarget() || WidgetUtils.getEnclosingWidget(event.target);
        if (!widget) {
            widget = eventTargetWidget;
        }
        while (widget) {
            if (widget.getContext()) { // managed widget
                break;
            }
            widget = WidgetUtils.getEnclosingWidget(widget.domNode.parentNode);
        }
        if (!widget) {
            return;
        }
        const canSelect = Metadata.getCanSelect(widget.type);
        if (canSelect[0] === 'NONE' && eventTargetWidget) {
            eventTargetWidget = widget;
        }

        /*
        if ((event.ctrlKey) || event.button == 2) {
            // this is a context menu ("right" click).  Select the widget, but skip the rest
            // of the logic.
            context.select(widget);
            return;
        }*/

        let selection = context.getSelection();

        // See if widget is a descendant of any widgets in selection
        let selectedAncestor = null;
        for (let i = 0; i < selection.length; i++) {
            const selWidget = selection[i];
            let w = widget;
            while (w && w != context.rootWidget) {
                if (w == selWidget) {
                    selectedAncestor = selWidget;
                    break;
                }
                w = w.getParent();
            }
            if (selectedAncestor) {
                break;
            }
        }
        let moverWidget = null;
        const ctrlKey = dojo.isMac ? event.metaKey : event.ctrlKey;
        this._mouseDownInfo = null;
        if (selection.indexOf(widget) >= 0) {
            if (ctrlKey) { // CTRL to toggle
                context.deselect(widget);
            } else {
                moverWidget = widget;
                this._mouseDownInfo = { widget: widget, eventTargetWidget: eventTargetWidget, pageX: event.pageX, pageY: event.pageY, dateValue: Date.now() };
            }
        } else {
            if (ctrlKey) {
                if (widget == context.rootWidget) {
                    // Ignore mousedown over body if Ctrl key is down
                    return;
                }
                context.select(widget, ctrlKey); // CTRL to add
            } else {
                if (selectedAncestor) {
                    moverWidget = selectedAncestor;
                    this._mouseDownInfo = { widget: widget, eventTargetWidget: eventTargetWidget, pageX: event.pageX, pageY: event.pageY, dateValue: Date.now() };
                } else {
                    if (widget == context.rootWidget) {
                        // Simple mousedown over body => deselect all (for now)
                        // FIXME: mousedown over body should initiate an area select operation
                        context.deselect();
                        this._areaSelectInit(event.pageX, event.pageY);
                        return;
                    }
                    if (Metadata.getAllowedChild(widget.type)[0] === 'NONE') {
                        context.select(widget, ctrlKey);
                        moverWidget = widget;
                    } else {
                        this._mouseDownInfo = { widget: widget, eventTargetWidget: eventTargetWidget, pageX: event.pageX, pageY: event.pageY, dateValue: Date.now() };
                        this._areaSelectInit(event.pageX, event.pageY);
                    }
                }
            }
        }
        if (moverWidget) {
            let position_prop;
            const userdoc = context.getDocument();	// inner document = user's document
            const userDojo = userdoc.defaultView && userdoc.defaultView.dojo;
            if (userDojo) {
                position_prop = style.get(moverWidget.domNode, 'position');
                this._moverAbsolute = (position_prop == 'absolute');
                const parent = moverWidget.getParent();
                const helper = moverWidget.getHelper();
                if (!(helper && helper.disableDragging && helper.disableDragging(moverWidget)) &&
                    (!parent || !parent.isLayout || !parent.isLayout())) {
                    this._moverWidget = moverWidget;
                    this._moverWidgets = [moverWidget];
                    this._moverLastEventTarget = null;
                    const cp = context._chooseParent;
                    cp.setProposedParentWidget(null);
                    selection = context.getSelection();	// selection might have changed since start of this function
                    this._moverStartLocations = [];
                    this._moverStartLocationsRel = [];
                    for (let i = 0; i < selection.length; i++) {
                        if (selection[i] != moverWidget) {
                            this._moverWidgets.push(selection[i]);
                        }
                        let marginBoxPageCoords = null;
                        const selectionHelper = selection[i].getHelper();
                        // tslint:disable-next-line:prefer-conditional-expression
                        if (selectionHelper && selectionHelper.getMarginBoxPageCoords) {
                            marginBoxPageCoords = selectionHelper.getMarginBoxPageCoords(selection[i]);
                        } else {
                            marginBoxPageCoords = GeomUtils.getMarginBoxPageCoordsCached(selection[i].domNode);
                        }
                        this._moverStartLocations.push(marginBoxPageCoords);
                        let relativeLeft;
                        let relativeTop;
                        const offsetParent = selection[i].domNode.offsetParent;
                        if (offsetParent && offsetParent.tagName != 'BODY') {
                            const parentBorderBoxPageCoordinates = GeomUtils.getBorderBoxPageCoordsCached(offsetParent);
                            const parentBorderExtents = GeomUtils.getBorderExtents(offsetParent);
                            relativeLeft = marginBoxPageCoords.l - (parentBorderBoxPageCoordinates.l + parentBorderExtents.l);
                            relativeTop = marginBoxPageCoords.t - (parentBorderBoxPageCoordinates.t + parentBorderExtents.t);
                        } else {
                            relativeLeft = marginBoxPageCoords.l;
                            relativeTop = marginBoxPageCoords.t;
                        }

                        //relativeLeft-=offset.x;
                        //relativeTop-=offset.y;

                        this._moverStartLocationsRel.push({ l: relativeLeft, t: relativeTop });
                    }
                    const n = moverWidget.domNode;
                    let offsetWidth = n.offsetWidth;
                    let offsetHeight = n.offsetHeight;
                    let moverWidgetMarginBoxPageCoords = null;
                    if (helper && helper.getMarginBoxPageCoords) {
                        moverWidgetMarginBoxPageCoords = helper.getMarginBoxPageCoords(moverWidget);
                        offsetWidth = moverWidgetMarginBoxPageCoords.w;
                        offsetHeight = moverWidgetMarginBoxPageCoords.h;
                    } else {
                        moverWidgetMarginBoxPageCoords = GeomUtils.getMarginBoxPageCoordsCached(n);
                    }
                    let l = moverWidgetMarginBoxPageCoords.l;
                    let t = moverWidgetMarginBoxPageCoords.t;
                    let w = moverWidgetMarginBoxPageCoords.w;
                    const h = moverWidgetMarginBoxPageCoords.h;

                    const offset = context.getScrollOffset();
                    l += offset.x;
                    t += offset.y;
                    if (this._moverAbsolute) {
                        this._moverDragDiv = create('div',
                            {
                                class: 'selectToolDragDiv',
                                style: 'left:' + l + 'px;top:' + t + 'px;width:' + w + 'px;height:' + h + 'px'
                            },
                            context.rootNode);
                        this._mover = new Mover(this._moverDragDiv, event, this);
                    } else {
                        // width/height adjustment factors, using inside knowledge of CSS classes
                        const adjust1 = 10;
                        const adjust2 = 8;
                        l -= adjust1 / 2;
                        t -= adjust1 / 2;
                        const w1 = offsetWidth + adjust1;
                        const h1 = offsetHeight + adjust1;
                        const w2 = w1 - adjust2;
                        const h2 = h1 - adjust2;

                        this._moverDragDiv = create('div', {
                            class: 'flowDragOuter',
                            style: 'left:' + l + 'px;top:' + t + 'px;width:' + w1 + 'px;height:' + h1 + 'px'
                        }, context.rootNode);

                        create('div', {
                            class: 'flowDragInner',
                            style: 'width:' + w2 + 'px;height:' + h2 + 'px'
                        }, this._moverDragDiv);

                        this._mover = new Mover(this._moverDragDiv, event, this);
                    }
                    this._altKey = event.altKey;
                    this._updateMoveCursor();

                    // Chrome doesn't blur active focus node when switching frames, so focus on something else focusable first to cause the blur
                    const _s = document.getElementById('maqetta_project_select');
                    if (_s) {
                        _s.focus();
                    }
                    userdoc.defaultView.focus();	// Make sure the userdoc is the focus object for keyboard events
                }
            }
        }
    }

    onMouseUp(event) {
        const context = this._context;
        if (context.isFocusNode(event.target)) {
            // Don't process mouse events on focus nodes. Focus.js already takes care of those events.
            return;
        }
        let doAreaSelect = (event.which === 1);		// Only do area select if LMB was down
        const clickInteral = 750;	// .75seconds: allow for leisurely click action
        const dblClickInteral = 750;	// .75seconds: big time slot for tablets
        const clickDistance = 10;	// within 10px: inexact for tablets
        const dateValue = Date.now();

        // Because we create a mover with mousedown, we need to include our own click
        // logic in case there was no actual move and user simple just clicked
        if (this._mouseDownInfo) {
            if (Math.abs(event.pageX - this._mouseDownInfo.pageX) <= clickDistance &&
                Math.abs(event.pageY - this._mouseDownInfo.pageY) <= clickDistance &&
                (dateValue - this._mouseDownInfo.dateValue) <= clickInteral) {
                const widgetToSelect = this._mouseDownInfo.eventTargetWidget ? this._mouseDownInfo.eventTargetWidget : this._mouseDownInfo.widget;
                this._context.select(widgetToSelect);
                doAreaSelect = false;
            }
            this._mouseDownInfo = null;
        }
        // Normal browser onDblClick doesn't work because we are interjecting
        // an overlay DIV with a mouseDown operation. As a result,
        // the browser's rules about what is required to trigger an ondblclick are not satisfied.
        // Therefore, we have to do our own double-click timer logic
        if (this._lastMouseUp) {
            if (Math.abs(event.pageX - this._lastMouseUp.pageX) <= clickDistance &&
                Math.abs(event.pageY - this._lastMouseUp.pageY) <= clickDistance &&
                (dateValue - this._lastMouseUp.dateValue) <= dblClickInteral) {
                this.onDblClick(event);
            }
        }
        this._lastMouseUp = { pageX: event.pageX, pageY: event.pageY, dateValue: dateValue };
        const offset = context.getScrollOffset();
        //this._lastMouseUp.pageX-=offset.x;
        //this._lastMouseUp.pageY-=offset.y;

        // Process case where user dragged out a selection rectangle
        // If so, select all widgets inside of that rectangle
        if (this._areaSelect && doAreaSelect) {
            this._areaSelectSelectWidgets(event.pageX, event.pageY);
        }
        this._areaSelectClear();

    }

    onDblClick(event) {
        const context = this._context;
        if (context.isFocusNode(event.target)) {
            // Don't process mouse events on focus nodes. Focus.js already takes care of those events.
            return;
        }
        // #2127 First check for the selectToolDragDiv, if found then use the selected widget that is hiding under it.
        const className = event.target.getAttribute('class');
        let widget = (className === 'selectToolDragDiv') ? this._context.getSelection()[0] : (this._getTarget() || WidgetUtils.getEnclosingWidget(event.target));
        //FIXME: I'm not sure this while() block make sense anymore.
        //Not sure what a "managed widget" is.
        /*
        while (widget) {
            if (widget.getContext()) { // managed widget
                break;
            }
            widget = WidgetUtils.getEnclosingWidget(widget.domNode.parentNode);
        }
        */
        if (!widget) {
            return;
        }

        const selection = this._context.getSelection();
        const ctrlKey = dojo.isMac ? event.ctrlKey : event.metaKey;
        if (selection.indexOf(widget) >= 0) {
            if (ctrlKey && event.button !== 2) { // CTRL to toggle
                this._context.deselect(widget);
            } else if (event.button !== 2) { // Right mouse not to alter selection
                this._context.select(widget, null, true);
            }
        } else {
            this._context.select(widget, ctrlKey, true); // CTRL to add
        }
    }

    onMouseMove(event) {
        const context = this._context;
        if (context.isFocusNode(event.target)) {
            // Don't process mouse events on focus nodes. Focus.js already takes care of those events.
            return;
        }
        this._setTarget(event.target, event);
        if (this._areaSelect) {
            if (event.which === 1) {		// 1=LMB
                this._areaSelectUpdate(event.pageX, event.pageY);
            } else {
                // Stop area select if LMB not down
                // We get here in WebKit if dragging on widget scrollbar
                this._areaSelectClear();
            }
        }
    }

    onMouseOver(event) {
        // FIXME: sometime an exception occurs...
        try {
            // The purpose of this monkey business is to remember the last
            // user document node which received a mouseover event so that we
            // can restore the "target" (i.e., the editFeedback rectangle)
            // upon wrapping up various mouse down/up/move event processing.
            // We ignore any overlay DIVs created by the page editor itself.
            if (!$(event.target).hasClass('editFeedback') && !$(event.target).hasClass('selectToolDragDiv')) {
                this._onMouseOverEventTargetXPath = XPathUtils.getXPath(event.target);
            }
            this._setTarget(event.target, event);
        } catch (e) {
        }
    }

    onMouseOut(event) {
        // FIXME: sometime an exception occurs...
        try {
            this._setTarget(event.relatedTarget, event);
        } catch (e) {
        }
    }

    onExtentChange(params) {

        console.log('onExtentChange', params);

        const index = params.index;
        const newBox = params.newBox;
        const copy = params.copy;
        const oldBoxes = params.oldBoxes;
        const applyToWhichStates = params.applyToWhichStates;
        let idx;

        const context = this._context;
        const cp = context._chooseParent;
        const selection = context.getSelection();
        const newselection = [];
        if (selection.length <= index) {
            return;
        }
        const widget = selection[index];
        let newWidget;
        let compoundCommand;
        if ('w' in newBox || 'h' in newBox) {
            const resizable = Metadata.queryDescriptor(widget.type, 'resizable');
            let w;
            let h;
            // Adjust dimensions from margin box to context box
            let _node = widget.domNode;
            const _win = _node.ownerDocument.defaultView;
            const _cs = _win.getComputedStyle(_node);
            const me = GeomUtils.getMarginExtents(_node, _cs);
            const be = GeomUtils.getBorderExtents(_node, _cs);
            const pe = GeomUtils.getPadExtents(_node, _cs);
            if (typeof newBox.w == 'number') {
                newBox.w -= (me.w + be.w + pe.w);
            }
            if (typeof newBox.h == 'number') {
                newBox.h -= (me.h + be.h + pe.h);
            }
            switch (resizable) {
                case 'width':
                    w = newBox.w;
                    break;
                case 'height':
                    h = newBox.h;
                case 'both':
                    w = newBox.w;
                    h = newBox.h;
                    break;
            }

            const resizeCommand = new ResizeCommand(widget, w, h, applyToWhichStates);
            if (!compoundCommand) {
                compoundCommand = new CompoundCommand();
            }
            compoundCommand.add(resizeCommand);
            const position_prop = style.get(widget.domNode, 'position');
            if ('l' in newBox && 't' in newBox && position_prop == 'absolute') {
                let left = newBox.l;
                let top = newBox.t;
                const moveCommand = new MoveCommand(widget, left, top, null, null, applyToWhichStates);
                compoundCommand.add(moveCommand);
            }
        } else {

            let _node = widget.getStyleNode();
            const absolute = (style.get(_node, 'position') == 'absolute');
            if (!absolute) {
                let ppw = cp.getProposedParentWidget();
                if (ppw) {
                    if (!compoundCommand) {
                        compoundCommand = new CompoundCommand();
                    }
                    let lastIdx = null;

                    //get the data
                    let reorderedSelection = context.reorderPreserveSiblingOrder(selection);
                    reorderedSelection.forEach((w) => {
                        if (ppw.refChild) {
                            if (lastIdx !== null) {
                                idx = lastIdx + 1;
                            } else {
                                const ppwChildren = ppw.parent.getChildren();
                                idx = ppwChildren.indexOf(ppw.refChild);
                                if (idx >= 0) {
                                    if (ppw.refAfter) {
                                        idx++;
                                    }
                                } else {
                                    idx = null;
                                }
                            }
                            lastIdx = idx;
                        }
                        if (copy) {
                            let newwidget;
                            const d = w.getData({ identify: false });
                            d.context = context;
                            win.withDoc(context.getDocument(), () => {
                                newwidget = WidgetUtils.createWidget(d);
                            }, this);
                            if (!newwidget) {
                                console.debug('Widget is null!!');
                                return;
                            }
                            compoundCommand.add(new AddCommand(newwidget, ppw.parent, idx));

                            // If preference says to add new widgets to the current custom state,
                            // then add appropriate StyleCommands
                            CreateTool.prototype.checkAddToCurrentState(compoundCommand, newwidget);

                            newselection.push(newwidget);
                        } else {
                            compoundCommand.add(new ReparentCommand(w, ppw.parent, idx));
                            newselection.push(w);
                        }
                    });
                    context.select(null);
                } else {
                    console.error('SelectTool: ppw is null');
                }

            } else {
                const OldParents = [];
                const OldIndex = [];
                selection.forEach((w, idx) => {
                    OldParents[idx] = selection[idx].getParent();
                    OldParents[idx].indexOf && (OldIndex[idx] = OldParents[idx].indexOf(w));
                });
                let left = newBox.l;
                let top = newBox.t;
                if (!compoundCommand) {
                    compoundCommand = new CompoundCommand();
                }
                let ppw = cp.getProposedParentWidget();
                const proposedParent = ppw ? ppw.parent : null;
                const currentParent = widget.getParent();
                let doReparent;
                const doMove = undefined;
                if (proposedParent && proposedParent != currentParent) {
                    doReparent = proposedParent;
                }
                const dx = left - oldBoxes[0].l;
                const dy = top - oldBoxes[0].t;
                if (copy) {
                    //get the data
                    let reorderedSelection = context.reorderPreserveSiblingOrder(selection);
                    reorderedSelection.forEach((w) => {
                        const parentWidget = w.getParent();
                        if (!parentWidget) {
                            console.debug('onExtentChange: parentWidget is null!!');
                            return;
                        }
                        const children = parentWidget.getChildren();
                        for (let widx = 0; widx < children.length; widx++) {
                            if (children[widx] == w) {
                                break;
                            }
                        }
                        let newwidget;
                        const d = w.getData({ identify: false });
                        d.context = context;

                        win.withDoc(context.getDocument(), () => {
                            newwidget = WidgetUtils.createWidget(d);
                        }, this);

                        if (!newwidget) {
                            console.debug('Widget is null!!');
                            return;
                        }
                        if (proposedParent) {
                            compoundCommand.add(new AddCommand(newwidget, proposedParent, -1));
                        } else {
                            compoundCommand.add(new AddCommand(newwidget, parentWidget, widx));
                        }

                        // If preference says to add new widgets to the current custom state,
                        // then add appropriate StyleCommands
                        CreateTool.prototype.checkAddToCurrentState(compoundCommand, newwidget);

                        newselection.push(newwidget);
                    });

                    newWidget = newselection[index];
                }
                let currWidget = copy ? newWidget : widget;
                const first_c = new MoveCommand(currWidget, left, top, null, oldBoxes[index], applyToWhichStates);
                compoundCommand.add(first_c);
                if (doReparent) {
                    compoundCommand.add(new ReparentCommand(currWidget, proposedParent, 'last'));
                    // redundant move command at same location because left/top properties need updating due to new parent
                    compoundCommand.add(new MoveCommand(currWidget, left, top, null, null, applyToWhichStates));
                }
                selection.forEach((w, idx) => {
                    currWidget = copy ? newselection[idx] : w;
                    if (w != widget) {
                        const newLeft = oldBoxes[idx].l + dx;
                        const newTop = oldBoxes[idx].t + dy;
                        if (w.getStyleNode().style.position == 'absolute') {
                            // Because snapping will shift the first widget in a hard-to-predict
                            // way, MoveCommand will store the actual shift amount on the
                            // command object (first_c). MoveCommand will use the shift amount
                            // for first_c for the other move commands.
                            const c = new MoveCommand(currWidget, newLeft, newTop, first_c, oldBoxes[idx], applyToWhichStates, true);
                            compoundCommand.add(c);
                        }
                        const currentParent = w.getParent();
                        if (proposedParent && proposedParent != currentParent) {
                            compoundCommand.add(new ReparentCommand(currWidget, proposedParent, 'last'));
                            // redundant move command at same location because left/top properties need updating due to new parent
                            compoundCommand.add(new MoveCommand(currWidget, newLeft, newTop, null, null, applyToWhichStates, true));
                        }
                    }
                });
                // If copying widgets, need to restore original widgets to their original parents and locations
                if (copy) {
                    selection.forEach((w, idx) => {
                        compoundCommand.add(new ReparentCommand(selection[idx], OldParents[idx], OldIndex[idx]));
                        compoundCommand.add(new MoveCommand(selection[idx], oldBoxes[idx].l, oldBoxes[idx].t, null, oldBoxes[idx], applyToWhichStates, true));
                    });
                }
            }
        }

        if (compoundCommand) {
            context.getCommandStack().execute(compoundCommand);
            newselection.forEach((w, i) => {
                context.select(w, i > 0);
            }, this);
        } else {
            context.select(widget); // update selection
        }

    }

    _updateMoveCursor() {
        const body = this._context.getDocument().body;
        if (this._moverDragDiv) {
            if (this._altKey) {
                //dojo.removeClass(body, 'selectToolDragMove');
                //dojo.addClass(body, 'selectToolDragCopy');
                $(body).addClass('selectToolDragCopy');
            } else {
                //dojo.removeClass(body, 'selectToolDragCopy');
                $(body).addClass('selectToolDragMove');
            }
        } else {
            //dojo.removeClass(body, 'selectToolDragMove');
            //dojo.removeClass(body, 'selectToolDragCopy');
        }
    }

    onKeyDown(event) {
        if (event) {
            stopEvent(event);
            switch (event.keyCode) {
                case keys.SHIFT:
                    this._shiftKey = true;
                    Snap.clearSnapLines(this._context);
                    break;
                case keys.ALT:
                    this._altKey = true;
                    this._updateMoveCursor();
                    break;
                case keys.SPACE:
                    this._spaceKey = true;
                    break;
                case 83:	// 's' key means apply only to current state
                    this._sKey = true;
                    break;
                case keys.TAB:
                    if (this._moveFocus(event)) {
                        //focus should not break away from containerNode
                        stopEvent(event);
                    } else {
                        //nop: propagate event for next focus
                        //FIXME: focus may move to the focusable widgets on containerNode
                    }
                    break;
                case keys.RIGHT_ARROW:
                case keys.LEFT_ARROW:
                case keys.DOWN_ARROW:
                case keys.UP_ARROW:
                    this._move(event);
            }
        }
    }

    onKeyUp(event) {
        if (event && this._moverWidget) {
            stopEvent(event);
            switch (event.keyCode) {
                case keys.SHIFT:
                    this._shiftKey = false;
                    break;
                case keys.ALT:
                    this._altKey = false;
                    this._updateMoveCursor();
                    break;
                case keys.SPACE:
                    this._spaceKey = false;
                    break;
                case 83:	// 's' key means apply only to current state
                    this._sKey = false;
                    break;
            }
        }
    }

    _move(event) {
        const selection = this._context.getSelection();
        if (selection.length === 0) {
            return;
        }
        let dx = 0;
        let dy = 0;
        const pitch = event.shiftKey ? 10 : 1;
        switch (event.keyCode) {
            case keys.RIGHT_ARROW: dx = pitch; break;
            case keys.LEFT_ARROW: dx = -pitch; break;
            case keys.DOWN_ARROW: dy = pitch; break;
            case keys.UP_ARROW: dy = -pitch; break;
            default: break;
        }
        const command = new CompoundCommand();
        selection.forEach((w) => {
            let marginBoxPageCoords = null;
            const helper = w.getHelper();
            // tslint:disable-next-line:prefer-conditional-expression
            if (helper && helper.getMarginBoxPageCoords) {
                marginBoxPageCoords = helper.getMarginBoxPageCoords(w);
            } else {
                marginBoxPageCoords = GeomUtils.getMarginBoxPageCoords(w.domNode);
            }
            const position = { x: marginBoxPageCoords.l + dx, y: marginBoxPageCoords.t + dy };
            command.add(new MoveCommand(w, position.x, position.y));
        }, this);
        if (!command.isEmpty()) {
            this._context.getCommandStack().execute(command);
            this._updateTargetOverlays();	// Recalculate bounds for "target" overlay rectangle
        }
    }

    //FIXME: tab is supposed to cycle through the widgets
    //Doesn't really work at this point
    _moveFocus(event) {
        const direction = event.shiftKey ? -1 : +1;
        const current = this._context.getSelection()[0];
        const widgets = this._context.getTopWidgets();
        let nextIndex = current ? widgets.indexOf(current) + direction : (direction > 0 ? 0 : widgets.length - 1);
        let next = widgets[nextIndex];

        while (next && !next.getContext()) { // !managed widget
            nextIndex = nextIndex + direction;
            next = widgets[nextIndex];
        }
        if (next) {
            this._context.select(next);
        }
        return next;
    }

    /**
     * Callback routine from dojo.dnd.Mover with every mouse move.
     * What that means here is dragging currently selected widgets around.
     * @param {object} mover - return object from dojo.dnd.Mover constructor
     * @param {object} box - {l:,t:} top/left corner of where drag DIV should go
     * @param {object} event - the mousemove event
     */
    onMove(mover, box, event) {
        //FIXME: For tablets, might want to add a check for minimum initial move
        //distance to prevent accidental moves due to fat fingers.

        // If there was any dragging, prevent a mousedown/mouseup combination
        // from triggering a select operation
        this._mouseDownInfo = null;

        const context = this._context;
        const cp = context._chooseParent;
        const selection = context.getSelection();
        const index = selection.indexOf(this._moverWidget);
        if (index < 0) {
            console.error('SelectTool.js onMove error. move widget is not selected');
            return;
        }
        this._selectionHideFocus();

        // If event.target isn't a subnode of current proposed parent widget,
        // then need to recompute proposed parent widget
        let eventTargetWithinPPW = false;
        const currentPPW = cp.getProposedParentWidget();
        if (currentPPW && currentPPW.parent && currentPPW.parent.domNode) {
            const currentPPWNode = currentPPW.parent.domNode;
            if (currentPPW.parent.domNode.tagName == 'BODY') {
                eventTargetWithinPPW = true;
            } else {
                let n = event.target;
                while (n && n.tagName != 'BODY') {
                    if (n == currentPPWNode) {
                        eventTargetWithinPPW = true;
                        break;	// event.target is a descendant of currentPPW's domNode
                    }
                    n = n.parentNode;
                }
            }
        }

        if (!eventTargetWithinPPW || event.target != this._moverLastEventTarget) {
            // If mouse has moved over a different widget, then null out the current
            // proposed parent widget, which will force recalculation of the list of possible parents
            cp.setProposedParentWidget(null);
        }
        this._moverLastEventTarget = event.target;
        this._moverBox = box;
        this._moverDragDiv.style.left = box.l + 'px';
        this._moverDragDiv.style.top = box.t + 'px';
        if (this._moverAbsolute) {
            const newLeft = box.l;
            const newTop = box.t;
            let dx = newLeft - this._moverStartLocations[index].l;
            let dy = newTop - this._moverStartLocations[index].t;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            if (this._shiftKey && (absDx >= this.CONSTRAIN_MIN_DIST || absDy >= this.CONSTRAIN_MIN_DIST)) {
                if (absDx > absDy) {
                    dy = 0;
                } else {
                    dx = 0;
                }
            }

            selection.forEach((w, i) => {
                const l = this._moverStartLocationsRel[i].l;
                const t = this._moverStartLocationsRel[i].t;
                w.domNode.style.left = (l + dx) + 'px';
                w.domNode.style.top = (t + dy) + 'px';
            });
        }
        const widgetType = this._moverWidget.type;
        const currentParent = this._moverWidget.getParent();

        let parentListDiv = cp.parentListDivGet();
        if (!parentListDiv) {// Make sure there is a DIV into which list of parents should be displayed
            parentListDiv = cp.parentListDivCreate({
                widgetType: widgetType,
                absolute: this._moverAbsolute,
                doCursor: !this._moverAbsolute,
                beforeAfter: null,
                currentParent: currentParent
            });
        }
        const parentIframe = context.getParentIframe();
        if (parentIframe) {
            // Ascend iframe's ancestors to calculate page-relative x,y for iframe
            let offsetLeft = 0;
            let offsetTop = 0;
            let offsetNode = parentIframe;
            while (offsetNode && offsetNode.tagName != 'BODY') {
                offsetLeft += offsetNode.offsetLeft;
                offsetTop += offsetNode.offsetTop;
                offsetNode = offsetNode.offsetParent;
            }
            const scrollLeft = GeomUtils.getScrollLeft(context.rootNode.parentNode);
            const scrollTop = GeomUtils.getScrollTop(context.rootNode.parentNode);
            parentListDiv.style.left = (offsetLeft + event.pageX - scrollLeft) + 'px';
            parentListDiv.style.top = (offsetTop + event.pageY - scrollTop) + 'px';
        }

        /*
        const editorPrefs = Preferences.getPreferences('davinci.ve.editorPrefs',
            Workbench.getProject());*/

        const editorPrefs = {
            snap: true
        }
        const doSnapLinesX = (!this._shiftKey && editorPrefs.snap && this._moverAbsolute);

        const doSnapLinesY = doSnapLinesX;
        let showParentsPref = true; //context.getPreference('showPossibleParents');
        const spaceKeyDown = (cp.isSpaceKeyDown() || this._spaceKey);
        const showCandidateParents = (!showParentsPref && spaceKeyDown) || (showParentsPref && !spaceKeyDown);
        const data = { type: widgetType };
        const position = { x: event.pageX, y: event.pageY };
        let snapBox = null;
        const helper = this._moverWidget.getHelper();
        // tslint:disable-next-line:prefer-conditional-expression
        if (helper && helper.getMarginBoxPageCoords) {
            snapBox = helper.getMarginBoxPageCoords(this._moverWidget);
        } else {
            snapBox = GeomUtils.getMarginBoxPageCoords(this._moverWidget.domNode);
        }

        // Call the dispatcher routine that updates snap lines and
        // list of possible parents at current (x,y) location
        context.dragMoveUpdate({
            widgets: this._moverWidgets,
            data: data,
            eventTarget: event.target,
            position: position,
            absolute: this._moverAbsolute,
            currentParent: currentParent,
            rect: snapBox,
            doSnapLinesX: doSnapLinesX,
            doSnapLinesY: doSnapLinesY,
            doFindParentsXY: showCandidateParents,
            doCursor: !this._moverAbsolute
        });
    }

    //Part of Mover interface
    onFirstMove(mover) {
    }

    //Part of Mover interface
    onMoveStart(mover) {
    }

    //Part of Mover interface
    onMoveStop(mover) {
        const context = this._context;
        const cp = this._context._chooseParent;

        // Find xpath to the this_moverWidget's _srcElement and save that xpath
        let xpath;

        let oldId;
        if (this._moverWidget && this._moverWidget._srcElement) {
            xpath = XPathUtils.getXPath(this._moverWidget._srcElement, HtmlFileXPathAdapter);
            oldId = this._moverWidget.id;
        }

        let doMove = true;
        let index;
        let moverBox;
        if (!this._moverBox || !this._moverWidget || !this._moverWidget.domNode) {
            doMove = false;
        } else {
            moverBox = { l: this._moverBox.l, t: this._moverBox.t };
            const selection = context.getSelection();
            index = selection.indexOf(this._moverWidget);
            if (index < 0) {
                doMove = false;
            }
        }
        if (doMove) {
            // If 's' key is held down, then CSS parts of MoveCommand only applies to current state
            let applyToWhichStates;

            if (this._sKey) {
                const currentStatesList = States.getStatesListCurrent(this._moverWidget.domNode);
                for (let i = 0; i < currentStatesList.length; i++) {
                    if (currentStatesList[i]) {
                        applyToWhichStates = currentStatesList[i];
                        break;
                    }
                }
            } else {
                // See if any of left/top/right/bottom have been set in any of the currently active states
                // (i.e., one of the states whose results are currently showing on the screen).
                // If so, then apply the move to that state.
                applyToWhichStates = States.propertyDefinedForAnyCurrentState(this._moverWidget.domNode, ['left', 'top', 'right', 'bottom']);
            }

            const offsetParentLeftTop = this._getPageLeftTop(this._moverWidget.domNode.offsetParent);
            const offset = context.getScrollOffset();
            //offsetParentLeftTop.l-=offset.x;
            //offsetParentLeftTop.t-=offset.y;
            const newLeft = (moverBox.l - offsetParentLeftTop.l);
            const newTop = (moverBox.t - offsetParentLeftTop.t);
            const dx = newLeft - this._moverStartLocations[index].l;
            const dy = newTop - this._moverStartLocations[index].t;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (this._shiftKey && (absDx >= this.CONSTRAIN_MIN_DIST || absDy >= this.CONSTRAIN_MIN_DIST)) {
                if (absDx > absDy) {
                    moverBox.t = this._moverStartLocations[index].t;
                } else {
                    moverBox.l = this._moverStartLocations[index].l;
                }
            }
            moverBox.t -= offset.y;
            moverBox.l -= offset.x;

            try {
                this.onExtentChange({
                    index: index,
                    newBox: moverBox,
                    oldBoxes: this._moverStartLocations,
                    copy: this._altKey,
                    applyToWhichStates: applyToWhichStates
                });
            } catch (e) {
                console.error('error : content extend ', e);
            }
        }
        if (this._moverDragDiv) {
            //return;
            const parentNode = this._moverDragDiv.parentNode;
            if (parentNode) {
                parentNode.removeChild(this._moverDragDiv);
            }
            this._moverDragDiv = null;

        }
        this._mover = this._moverBox = this._moverWidget = this._moverWidgets = this._moverLastEventTarget = null;
        this._updateMoveCursor();
        context.dragMoveCleanup();
        cp.parentListDivDelete();
        this._selectionShowFocus();

        // Attempt to restore the "target" rectangle (i.e., editFeedback)
        // over current widget to intercept mouse events that the widget
        // itself might attempt to process.
        const query = XPathUtils.toCssPath(this._onMouseOverEventTargetXPath);
        const userDoc = context.getDocument();
        const targetNode = query ? userDoc.querySelector(query) : null;
        if (targetNode) {
            this._setTarget(targetNode);
        }
    }

    _getPageLeftTop(node) {
        if (node) {
            let leftAdjust = node.offsetLeft;
            let topAdjust = node.offsetTop;
            let pn = node.offsetParent;

            while (pn && pn.tagName != 'BODY') {
                leftAdjust += pn.offsetLeft;
                topAdjust += pn.offsetTop;
                pn = pn.offsetParent;
            }
            return { l: leftAdjust, t: topAdjust };
        } else {
            return { l: 0, t: 0 };
        }
    }

    _areaSelectInit(initPageX, initPageY) {
        this._areaSelect = { x: initPageX, y: initPageY, attached: false };
        this._areaSelectDiv = create('div',
            { class: 'areaSelectDiv', style: 'display:none' });
    }

    _areaSelectUpdate(endX, endY) {
        if (!this._areaSelect || !this._areaSelectDiv) {
            return;
        }
        const o = this._getBounds(this._areaSelect.x, this._areaSelect.y, endX, endY);
        const style = this._areaSelectDiv.style;
        style.display = 'block';
        style.left = o.l + 'px';
        style.top = o.t + 'px';
        style.width = o.w + 'px';
        style.height = o.h + 'px';
        if (!this._areaSelect.attached) {
            this._context.rootNode.appendChild(this._areaSelectDiv);
            this._areaSelect.attached = true;
        }
    }

    _areaSelectClear() {
        this._areaSelect = null;
        if (this._areaSelectDiv) {
            const parentNode = this._areaSelectDiv.parentNode;
            if (parentNode) {
                parentNode.removeChild(this._areaSelectDiv);
            }
            this._areaSelectDiv = null;
        }

    }

    _areaSelectSelectWidgets(endX, endY) {
        if (!this._areaSelect) {
            return;
        }
        const o: any = this._getBounds(this._areaSelect.x, this._areaSelect.y, endX, endY);
        const l = o.l;
        const t = o.t;
        const w = o.w;
        const h = o.h;
        const context = this._context;
        context.deselect();
        const topWidgets = context.getTopWidgets();
        for (let i = 0; i < topWidgets.length; i++) {
            this._areaSelectRecursive(topWidgets[i], l, t, w, h);
        }
    }

    _areaSelectRecursive(widget, l, t, w, h) {
        if (!widget || !widget.domNode) {
            return;
        }
        const bounds = GeomUtils.getBorderBoxPageCoordsCached(widget.domNode);
        if (bounds.l >= l && bounds.t >= t &&
            bounds.l + bounds.w <= l + w &&
            bounds.t + bounds.h <= t + h) {
            this._context.select(widget, true);
        } else {
            const children = widget.getChildren();
            for (let i = 0; i < children.length; i++) {
                this._areaSelectRecursive(children[i], l, t, w, h);
            }
        }

    }

    _getBounds(startX, startY, endX, endY) {
        const o: any = {};
        if (startX <= endX) {
            o.l = startX;
            o.w = endX - startX;
        } else {
            o.l = endX;
            o.w = startX - endX;
        }
        if (startY <= endY) {
            o.t = startY;
            o.h = endY - startY;
        } else {
            o.t = endY;
            o.h = startY - endY;
        }
        return o;
    }

    /**
     * Sees if (pageX,pageY) is within bounds of any of the selection rectangles
     * If so, return the corresponding selected widget
     */
    _checkFocusXY(pageX, pageY) {
        const context = this._context;
        const selection = context.getSelection();
        for (let i = 0; i < selection.length; i++) {
            const box = context._focuses[i].getBounds();
            if (pageX >= box.l && pageX <= box.l + box.w &&
                pageY >= box.t && pageY <= box.t + box.h) {
                return selection[i];
            }
        }
        return null;
    }

    // Hide all focus objects associated with current selection
    _selectionHideFocus() {
        const context = this._context;
        const selection = context.getSelection();
        for (let i = 0; i < selection.length; i++) {
            context._focuses[i].hide();
        }
    }

    // Show all focus objects associated with current selection
    _selectionShowFocus() {
        const context = this._context;
        const selection = context.getSelection();
        for (let i = 0; i < selection.length; i++) {
            context._focuses[i].show(selection[i], {});
        }
    }
}
