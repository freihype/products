import { WidgetUtils } from '.';
import { Metadata } from './components/metadata';
import { create, stopEvent } from './_html';
import { Widget } from './_Widget';
import { GeomUtils } from './utils/GeomUtils';
import { keys } from './keys';
import { EditorContext } from './EditorContext';
import * as $ from 'jquery';
/*define([
    "dojo/_base/declare",
    "davinci/Runtime",
    "./widget",
    "./_Widget",
    "./metadata",
    "davinci/ve/utils/GeomUtils"
], (declare, Runtime, widget, _Wdget, metadata, GeomUtils) => declare("davinci.ve.ChooseParent", null, {
*/

export class ChooseParent {
    _lastAllowedParentList: any;
    _cursorSpan: any;
    _timer: any;
    _XYRefChild: any;
    _XYRefAfter: any;
    newWidgetParent: any;
    findParentsXYLastPosition: any;
    _oldActiveElement: any;
    _keyDownHandler: any;
    _keyUpHandler: any;
    _parentListDiv: any;
    _spaceKeyDown: boolean;
    _lastProposedParentWidget: any;
    _proposedParentWidget: any;
    _XYParent: any;
    _context: EditorContext;
    constructor(context) {
        this._context = context;
    }
    /**
     * Create a candidate list of valid parents for the dropped widget, based on the widgets'
     * 'allowedChild' and 'allowedParent' properties. The logic ascends the DOM hierarchy
     * starting with "target" to find all possible valid parents. If no valid parent is
     * found, then return an empty array.
     *
     * @param target {davinci.ve._Widget}
     *            The widget on which the user dropped the new widget.
     * @param data {Array|Object}
     *            Data for the dropped widget. (This routine only looks for 'type' property)
     * @param climb {boolean}
     *            Whether to climb the DOM looking for matches.
     * @param params {Object}
     *            Various properties representing current state of app. So far, only this:
     *                params.absolute {boolean} - widget will be added using position:absolute
     * @return an array of widgets which are possible valid parents for the dropped widget
     * @type davinci.ve._Widget
     */
    getAllowedTargetWidget(target, data, climb, params) {
        // get data for widget we are adding to page
        const getEnclosingWidget = WidgetUtils.getEnclosingWidget;

        let newTarget = target;
        const allowedParentList = [];
        const children = [];
        data = data.length ? data : [data];

        if (target.type === 'dijit/form/Button') {
            //        console.error('test allowed');
        }

        // 'data' may represent a single widget or an array of widgets.
        // Get data for all widgets, for use later in isAllowed().
        const _this = this;
        data.forEach(elem => {
            children.push({
                type: elem.type,
                allowedParent: Metadata.getAllowedParent(elem.type),
                classList: _this.getClassList(elem.type)
            });
        });

        do {
            const parentType = newTarget instanceof Widget ?
                newTarget.type : newTarget._dvWidget.type;
            const parentClassList = this.getClassList(parentType);
            if (this.isAllowed(children, newTarget, parentType, parentClassList, params)) {
                allowedParentList.push(newTarget);
            }
            newTarget = getEnclosingWidget(newTarget);
        } while (newTarget && climb);

        return allowedParentList;
    }

    // Returns 'true' if the dropped widget(s) is(are) allowed as a child of the
    // given parent.
    isAllowed(children, parent, parentType, parentClassList, params) {
        //console.log('is allowed ' + parentType);

        // returns 'true' if any of the elements in 'classes' are in 'arr'
        function containsClass(arr, classes) {
            return classes.some(elem => arr.indexOf(elem) !== -1);
        }

        let allowedChild = Metadata.getAllowedChild(parentType);

        // special case for HTML <body>
        if (parentType === 'html.body') {
            allowedChild = ['ANY'];
        }
        // Cycle through children, making sure that all of them work for
        // the given parent.
        return children.every(child => {
            const isAllowedChild = allowedChild[0] !== 'NONE' &&
                (allowedChild[0] === 'ANY' ||
                    allowedChild[0] === 'BLOCK' ||
                    containsClass(allowedChild, child.classList));

            const isAllowedParent = child.allowedParent[0] === 'ANY' ||
                containsClass(child.allowedParent, parentClassList);

            const helper = WidgetUtils.getWidgetHelper(child.type);

            if (helper && helper.isAllowed) {
                return helper.isAllowed({
                    childType: child.type,
                    childClassList: child.classList,
                    parentType: parentType,
                    parentClassList: parentClassList,
                    absolute: params.absolute,
                    isAllowedChild: isAllowedChild,
                    isAllowedParent: isAllowedParent
                });
            } else {
                return isAllowedChild && isAllowedParent;
            }
        });
    }

    // returns an array consisting of 'type' and any 'class' properties
    getClassList(type) {
        let classList = Metadata.queryDescriptor(type, 'class');
        if (classList) {
            classList = classList.split(/\s+/);
            classList.push(type);
            return classList;
        }
        return [type];
    }

    /**
     * If showCandidateParents is true, then update the DIV that is being dragged around
     * on the screen to show the list of possible parent widgets.
     * If false, clear any existing list of possible parent widgets.
     *
     * @param {object} params  object with following properties:
     *    {string} widgetType  For example, 'dijit.form.Button'
     *    {boolean} showCandidateParents  Whether the DIV being dragged around should show possible parents
     *    {boolean} doCursor  Whether to show drop point cursor (for flow layouts)
     *    {boolean} absolute  true if current widget will be positioned absolutely
     *    {object} currentParent  if provided, then current parent widget for thing being dragged
     */
    dragUpdateCandidateParents(params) {
        const widgetType = params.widgetType;
        const showCandidateParents = params.showCandidateParents;
        const doCursor = params.doCursor;
        const absolute = params.absolute;
        const currentParent = params.currentParent;

        const allowedParentList = this._XYParent;
        if (!this._proposedParentWidget) {
            this._proposedParentWidget = this._getDefaultParent(widgetType, allowedParentList, absolute, currentParent);
        }
        if (showCandidateParents || doCursor) {
            this.highlightNewWidgetParent(this._proposedParentWidget);
        }

        const context = this._context;
        // NOTE: For CreateTool, the activeDragDiv is a DIV attached to dragClone
        // For SelectTool, the activeDragDiv is created by calling parentListDivCreate() (in this JS file)
        const activeDragDiv = context.getActiveDragDiv();
        let parentListDiv;
        if (activeDragDiv) {
            // Palette.js stuffs in an extra DIV with class maqCandidateParents into DIV that is being dragged around by user
            const elems = $(activeDragDiv).find('.maqCandidateParents'); // , activeDragDiv);
            if (elems.length == 1) {
                parentListDiv = elems[0];
            }
        }
        if (parentListDiv) {
            if (showCandidateParents) {
                // Don't recreate DIV with every mousemove if parent list is the same
                let same = true;
                if (this._lastProposedParentWidget != this._proposedParentWidget) {
                    same = false;
                } else if (typeof this._lastAllowedParentList == 'undefined' || this._lastAllowedParentList === null) {
                    same = false;
                } else if (this._lastAllowedParentList.length != allowedParentList.length) {
                    same = false;
                } else {

                    for (let i = 0; i < allowedParentList.length; i++) {
                        if (this._lastAllowedParentList[i] != allowedParentList[i]) {
                            same = false;
                            break;
                        }
                    }
                }

                this._lastProposedParentWidget = this._proposedParentWidget;

                if (!same) {
                    const langObj: any = {
                        noValidParents: 'not valid',
                        willBeChildOf: 'will be child of'
                    };
                    let len;
                    parentListDiv.innerHTML = '';
                    if (typeof allowedParentList == 'undefined' || allowedParentList === null) {
                        this._lastAllowedParentList = null;
                        len = 0;
                    } else {
                        this._lastAllowedParentList = allowedParentList.slice();	// clone the array
                        len = allowedParentList.length;
                        const headerDiv = create('div', { class: 'maqCandidateParentsHeader' }, parentListDiv);
                        const listDiv = create('div', { class: 'maqCandidateParentsList' }, parentListDiv);
                        const helpDiv = create('div', { class: 'maqCandidateParentsHelp' }, parentListDiv);
                        let div;
                        if (len === 0) {
                            headerDiv.innerHTML = langObj.noValidParents;
                        } else if (len == 1) {
                            headerDiv.innerHTML = langObj.willBeChildOf;
                            div = create('div', {
                                class: 'maqCandidateListItem maqCandidateCurrent',
                                innerHTML: WidgetUtils.getLabel(allowedParentList[0])
                            }, listDiv);
                        } else {
                            headerDiv.innerHTML = langObj.candidateParents;
                            let s = '<table>';
                            for (let i = allowedParentList.length - 1, j = 1; i >= 0; i-- , j++) {
                                let className = 'maqCandidateListItem';
                                if (allowedParentList[i] == this._proposedParentWidget) {
                                    className += ' maqCandidateCurrent';
                                }
                                s += '<tr class="' + className +
                                    '"><td class="maqCandidateCheckedColumn">&rarr;</td><td class="maqCandidateNumberColumn">' + j +
                                    '</td><td class="maqCandidateParentColumn">' + WidgetUtils.getLabel(allowedParentList[i]) +
                                    '</td></tr>';
                            }
                            s += '</table>';
                            listDiv.innerHTML = s;
                            helpDiv.innerHTML = langObj.toChangePress;
                        }
                    }
                }
            } else {
                parentListDiv.innerHTML = '';
                this._lastAllowedParentList = null;
            }
        }

        if (doCursor) {
            let idx;
            for (let i = 0; i < this._XYParent.length; i++) {
                if (this._XYParent[i] === this._proposedParentWidget) {
                    idx = i;
                    break;
                }
            }
            if (idx !== undefined) {
                if (!this._cursorSpan) {
                    this._cursorSpan = create('span', { className: 'editCursor' });
                    const userWin = context.getGlobal();
                    if (userWin) {
                        this._timer = userWin.setInterval((node, context) => {
                            const currentEditor = this._context.editor;
                            const currentContext = currentEditor.getContext();
                            if (currentContext !== context) {
                                this.cleanup();
                                return;
                            }
                            $(node).toggleClass('editCursorBlink');
                        }, 400, this._cursorSpan, context);
                    }
                }
                const parentNode = this._XYParent[idx].domNode;
                const refChild = this._XYRefChild[idx];
                const refChildNode = refChild ? refChild.domNode : null;
                const refAfter = this._XYRefAfter[idx];
                let borderBoxPageCoords;
                let cursL;
                let cursT;
                let cursH;
                if (refChildNode) {
                    if (refAfter) {
                        if (refChildNode.nextSibling && refChildNode.nextSibling._dvWidget) {
                            const nextSibling = refChildNode.nextSibling;
                            borderBoxPageCoords = GeomUtils.getBorderBoxPageCoordsCached(nextSibling);
                            cursL = borderBoxPageCoords.l;
                            cursT = borderBoxPageCoords.t;
                            cursH = borderBoxPageCoords.h;
                        } else {
                            borderBoxPageCoords = GeomUtils.getBorderBoxPageCoordsCached(refChildNode);
                            cursL = borderBoxPageCoords.l + borderBoxPageCoords.w;
                            cursT = borderBoxPageCoords.t;
                            cursH = borderBoxPageCoords.h;
                        }
                    } else {
                        borderBoxPageCoords = GeomUtils.getBorderBoxPageCoordsCached(refChildNode);
                        cursL = borderBoxPageCoords.l;
                        cursT = borderBoxPageCoords.t;
                        cursH = borderBoxPageCoords.h;
                    }
                } else {
                    borderBoxPageCoords = GeomUtils.getBorderBoxPageCoordsCached(parentNode);
                    cursL = borderBoxPageCoords.l;
                    cursT = borderBoxPageCoords.t;
                    cursH = 16;
                }
                const style = this._cursorSpan.style;
                style.height = cursH + 'px';
                style.left = cursL + 'px';
                style.top = cursT + 'px';
                const body = parentNode.ownerDocument.body;
                body.appendChild(this._cursorSpan);
            }
        }
    }

    /**
     * Choose a parent widget. For flow layout, default to nearest valid parent.
     * For absolute layout, default to the current outer container widget (e.g., the BODY)
     *
     * @param {string} widgetType  For example, 'dijit.form.Button'
     * @param {[object]} allowedParentList  List of ancestor widgets of event.target that can be parents of the new widget
     * @param {boolean} absolute  true if current widget will be positioned absolutely
     * @param {object} currentParent  if provided, then current parent widget for thing being dragged
     */
    _getDefaultParent(widgetType, allowedParentList, absolute, currentParent) {
        const context = this._context;
        let proposedParentWidget;
        if (allowedParentList) {
            const helper = WidgetUtils.getWidgetHelper(widgetType);
            if (allowedParentList.length > 1 && helper && helper.chooseParent) {
                //FIXME: Probably should pass all params to helper
                proposedParentWidget = helper.chooseParent(allowedParentList);
            } else if (allowedParentList.length === 0) {
                proposedParentWidget = null;
            } else {
                if (absolute && currentParent) {
                    proposedParentWidget = currentParent;
                } else {
                    const last = allowedParentList.length - 1;
                    proposedParentWidget = allowedParentList[last];
                }
            }
        }
        return proposedParentWidget;
    }

    /**
     * Cleanup operations after drag operation is complete
     */
    cleanup() {
        if (this._cursorSpan) {
            this._cursorSpan.parentNode.removeChild(this._cursorSpan);
            this._cursorSpan = null;
        }
        if (this._timer) {
            const userWin = this._context.getGlobal();
            if (userWin) {
                userWin.clearInterval(this._timer);
                this._timer = null;
            }
        }
        const context = this._context;
        this.highlightNewWidgetParent(null);
        this._lastAllowedParentList = null;
    }
    /**
     * During widget drag/drop creation, highlight the widget that would
     * be the parent of the new widget
     * @param {davinci.ve._Widget} newWidgetParent  Parent widget to highlight
     */
    highlightNewWidgetParent(newWidgetParent) {
        const context = this._context;
        if (newWidgetParent != this.newWidgetParent) {
            if (this.newWidgetParent) {
                this.newWidgetParent.domNode.style.outline = '';
            }
            this.newWidgetParent = newWidgetParent;
            if (newWidgetParent && newWidgetParent.domNode) {
                //FIXME: This quick hack using 'outline' property is problematic:
                //(1) User won't see the brown outline on BODY
                //(2) If widget actually uses 'outline' property, it will get clobbered
                newWidgetParent.domNode.style.outline = '1px solid rgba(165,42,42,.7)'; // brown at .7 opacity
            }
        }
    }
    /**
     * During drag operation, returns the widget that will become the parent widget
     * when the drag operation ends (assuming nothing changes in mean time).
     * @return {object|null}   Widget that is the new proposed parent widget
     */
    getProposedParentWidget() {
        let ppw = null;
        if (this._XYParent) {
            const idx = this._XYParent.indexOf(this._proposedParentWidget);
            if (idx >= 0) {
                ppw = {};
                ppw.parent = this._XYParent[idx];
                ppw.refChild = this._XYRefChild[idx];
                ppw.refAfter = this._XYRefAfter[idx];
            }
        }
        return ppw;
    }
    /**
     * During drag operation, sets the widget that will become the parent widget
     * when the drag operation ends assuming nothing changes in mean time.
     * @param {object|null} wdgt  Widget that is the new proposed parent widget
     */
    setProposedParentWidget(wdgt) {
        this._proposedParentWidget = wdgt;
    }

    /**
     * During drag operation, returns the list of valid parent widgets at the
     * current mouse location.
     * @return {array[object]}   Array of possible parent widgets at current (x,y)
     */
    getProposedParentsList() {
        return this._XYParent;
    }
    /**
     * Preparatory work before traversing widget tree for possible parent
     * widgets at a given (x,y) location
     * @param {object} params  object with following properties:
     *        [array{object}] widgets  Array of widgets being dragged (can be empty array)
     *      {object|array{object}} data  For widget being dragged, either {type:<widgettype>} or array of similar objects
     *      {object} eventTarget  Node (usually, Element) that is current event.target (ie, node under mouse)
     *      {object} position x,y properties hold current mouse location
     *      {boolean} absolute  true if current widget will be positioned absolutely
     *      {object} currentParent  if provided, then current parent widget for thing being dragged
     *        {object} rect  l,t,w,h properties define rectangle being dragged around
     *        {boolean} doSnapLinesX  whether to show dynamic snap lines (x-axis)
     *        {boolean} doSnapLinesY  whether to show dynamic snap lines (y-axis)
     *        {boolean} doFindParentsXY  whether to show candidate parent widgets
     * @return {boolean} true if current (x,y) is different than last (x,y), false if the same.
     */
    findParentsXYBeforeTraversal(params) {
        const position = params.position;
        this._XYParent = [];
        this._XYRefChild = [];
        this._XYRefAfter = [];
        if (typeof this.findParentsXYLastPosition == 'undefined') {
            this.findParentsXYLastPosition = {};
        }

        const last = this.findParentsXYLastPosition;
        if (position.x === last.x && position.y === last.y) {
            return false;
        } else {
            last.x = position.x;
            last.y = position.y;
            return true;
        }
    }
    /**
     * If this widget overlaps given x,y position, then add to
     * list of possible parents at current x,y position
     * @param {object} params  object with following properties:
     *    {object|array{object}} data  For widget being dragged, either {type:<widgettype>} or array of similar objects
     *    {object} widget  widget to check (dvWidget)
     *    {boolean} absolute  true if current widget will be positioned absolutely
     *    {object} position  object with properties x,y (in page-relative coords)
     *    {boolean} doCursor  whether to show drop cursor (when dropping using flow layout)
     *    {string|undefined} beforeAfter  either 'before' or 'after' or undefined (which means default behavior)
     */
    findParentsXY(params) {
        const data = params.data;
        const wdgt = params.widget;
        const absolute = params.absolute;
        const position = params.position;
        const doCursor = params.doCursor;
        const beforeAfter = params.beforeAfter;

        const context = this._context;
        const offset = context.getScrollOffset();

        const x = position.x;
        const y = position.y;

        const helper = wdgt.getHelper();

        let marginBoxPageCoords = null;
        if (helper && helper.getMarginBoxPageCoords) {
            marginBoxPageCoords = helper.getMarginBoxPageCoords(wdgt);
        } else {
            const domNode = wdgt.domNode;
            marginBoxPageCoords = GeomUtils.getMarginBoxPageCoordsCached(domNode);
        }
        let l = marginBoxPageCoords.l;
        let t = marginBoxPageCoords.t;
        let w = marginBoxPageCoords.w;
        let h = marginBoxPageCoords.h;

        let r = l + w;
        let b = t + h;
        let i;
        let child;
        if (x >= l && x <= r && y >= t && y <= b) {
            const allowedParents = this.getAllowedTargetWidget(wdgt, data, false, { absolute: absolute });

            if (allowedParents.length === 1) {

                if (absolute === true) {
                    // Absolutely positioned widgets get added as last child
                    this._XYParent.push(wdgt);
                    this._XYRefChild.push(null);
                    this._XYRefAfter.push(true);
                } else {
                    const children = wdgt.getChildren();
                    const childData = [];
                    for (i = 0; i < children.length; i++) {
                        child = children[i];
                        const node = child.domNode;
                        const childBorderBoxPageCoords = GeomUtils.getBorderBoxPageCoordsCached(node);
                        w = node.offsetWidth;
                        h = node.offsetHeight;
                        l = childBorderBoxPageCoords.l;
                        t = childBorderBoxPageCoords.t;
                        r = l + w;
                        b = t + h;
                        const c = l + w / 2;
                        childData.push({ l: l, t: t, r: r, b: b, c: c });
                    }
                    let refChild;
                    let refAfter;
                    let biggestY;
                    for (i = 0; i < childData.length; i++) {
                        const cd = childData[i];
                        child = children[i];
                        if (x >= cd.l && x <= cd.r && y >= cd.t && y <= cd.b) {
                            // If mouse is over one of the children, then
                            // insert either before or after that child (and jump out of loop)
                            refChild = child;
                            refAfter = x >= cd.c ? true : false;
                            break;
                        }
                        if (i === 0) {
                            // If there is at least one child, set default solution
                            // to being either before or after that first child
                            refChild = child;
                            refAfter = (y > cd.b || x >= cd.c) ? true : false;
                            biggestY = cd.b;
                        } else if ((y >= cd.t || y >= biggestY) && x >= cd.l) {
                            // Else if mouse is below top of this child or further down page than any previous child
                            // and mouse isn't to left of this child,
                            // then this child is a candidate refChild
                            refChild = child;
                            refAfter = (y > cd.b || x >= cd.c) ? true : false;
                        } else if (y >= biggestY && y >= cd.b) {
                            // Else if mouse is below bottom of this child and all previous childs
                            // then this child is candidate refChild
                            refChild = child;
                            refAfter = true;
                        }
                        if (cd.b > biggestY) {
                            biggestY = cd.b;
                        }
                    }
                    this._XYParent.push(wdgt);
                    this._XYRefChild.push(refChild);
                    refAfter = beforeAfter === 'after' ? true : (beforeAfter === 'before' ? false : refAfter);
                    this._XYRefAfter.push(refAfter);
                }
            }
        }
    }
    /**
     * Wrap-up work after traversing widget tree for possible parent
     * widgets at a given (x,y) location
     * @param {object} params  see params description for findParentsXYBeforeTraversal
     */
    findParentsXYAfterTraversal(params) {
        const widgets = params.widgets;
        const eventTarget = params.eventTarget;
        const currentParent = params.currentParent;
        const absolute = params.absolute;
        const bodyWidget = eventTarget.ownerDocument.body._dvWidget;
        if (absolute && currentParent && currentParent != bodyWidget) {
            let found = false;
            this._XYParent.forEach(w => {
                if (w == currentParent) {
                    found = true;
                }
            });
            if (!found) {
                this._XYParent.push(currentParent);
                this._XYRefChild.push(widgets[0]);
                this._XYRefAfter.push(true);
            }
        }
        this.findParentsXYLastPosition = {};
        // For a more intuitive result, force refAfter=true for all candidate parents except the deepest one.
        // To explain more fully, the refAfter logic in findParentsXY() sets refAFter=true if pointer is on right side
        // of a primitive widget and refAfter=false if point is on left-side. But this left/right logic only makes
        // sense for the deepest widget under the mouse, not for the ancestors of that deepest widget.
        // Note loop goes through every item in array except the last one.
        for (let i = 0; i < this._XYRefAfter.length - 1; i++) {
            this._XYRefAfter[i] = true;
        }
    }
    /**
     * Cleanup work after updating the displayed list of candidate parents
     * @param {object} params  see params description for findParentsXYBeforeTraversal
     */
    findParentsXYCleanup(params) {
        this.findParentsXYLastPosition = {};
    }
    /**
     * Create a floating DIV that will hold the list of proposed parent widgets
     * @param {object} params  object with following properties:
     *    {string} widgetType  widget type (e.g., 'dijit.form.Button')
     *    {boolean} absolute  true if current widget will be positioned absolutely
     *    {boolean} doCursor  whether to show drop cursor (when dropping using flow layout)
     *    {string|undefined} beforeAfter  either 'before' or 'after' or undefined (which means default behavior)
     *    {object} currentParent  if provided, then current parent widget for thing being dragged
     */
    parentListDivCreate(params) {
        const widgetType = params.widgetType;
        const absolute = params.absolute;
        const doCursor = params.doCursor;
        const beforeAfter = params.beforeAfter;
        const currentParent = params.currentParent;
        const context = this._context;
        if (!widgetType) {
            return;
        }
        const userdoc = context.getDocument();	// inner document = user's document
        this._oldActiveElement = document.activeElement;
        //TODO it is possible that giving focus to defaultView will break the PageEditor split view mode. Needs investigation.
        //JF: I don't think this will break split view. This code is only activated during drag operations
        //on the canvas, and drag operations on canvas should have all focus things on the canvas.
        userdoc.defaultView.focus();	// Make sure the userdoc is the focus object for keyboard events
        /*
        this._keyDownHandler = dojo.connect(userdoc, 'onkeydown', dojo.hitch(this, (args, evt) => {
            const widgetType = args[0];
            const absolute = args[1];
            const doCursor = args[2];
            const beforeAfter = args[3];
            const currentParent = args[4];
            this.onKeyDown(evt, widgetType, absolute, doCursor, beforeAfter, currentParent);
        }, [widgetType, absolute, doCursor, beforeAfter, currentParent]));

        this._keyUpHandler = dojo.connect(userdoc, 'onkeyup', dojo.hitch(this, (args, evt) => {
            const widgetType = args[0];
            const absolute = args[1];
            const doCursor = args[2];
            const beforeAfter = args[3];
            const currentParent = args[4];
            this.onKeyUp(evt, widgetType, absolute, doCursor, beforeAfter, currentParent);
        }, [widgetType, absolute, doCursor, beforeAfter, currentParent]));
        */
        const body = document.body;	// outer document = Maqetta app
        const parentListDiv = this._parentListDiv = create('div', {
            class: 'maqParentListDiv'
        }, body);
        context.setActiveDragDiv(parentListDiv);
        // Downstream logic stuffs the list of candidate parents into DIV with class 'maqCandidateParents'
        create('div', { class: 'maqCandidateParents' }, parentListDiv);
        return parentListDiv;
    }

    /**
     * Return the floating DIV that will hold the list of proposed parent widgets
     * @returns {object}  DIV's domNode
     */
    parentListDivGet() {
        return this._parentListDiv;
    }

    /**
     * Delete the floating DIV that held the list of proposed parent widgets
     */
    parentListDivDelete() {
        const context = this._context;
        const parentListDiv = this._parentListDiv;
        if (parentListDiv) {
            if (this._oldActiveElement) {
                this._oldActiveElement.focus();
                this._oldActiveElement = null;
            }
            // dojo.disconnect(this._keyDownHandler);
            // dojo.disconnect(this._keyUpHandler);
            this._keyDownHandler = this._keyUpHandler = null;
            const parentNode = parentListDiv.parentNode;
            parentNode.removeChild(parentListDiv);
            context.setActiveDragDiv(null);
            this._parentListDiv = null;
        }
    }

    _keyEventDoUpdate(widgetType, absolute, doCursor, beforeAfter, currentParent) {
        // Under certain conditions, show list of possible parent widgets
        const showParentsPref = true; // this._context.getPreference('showPossibleParents');
        const showCandidateParents = (!showParentsPref && this._spaceKeyDown) || (showParentsPref && !this._spaceKeyDown);
        this.dragUpdateCandidateParents({
            widgetType: widgetType,
            showCandidateParents: showCandidateParents,
            doCursor: doCursor,
            beforeAfter: beforeAfter,
            absolute: absolute,
            currentParent: currentParent
        });
    }

    onKeyDown(event, widgetType, absolute, doCursor, beforeAfter, currentParent) {
        stopEvent(event);
        if (event.keyCode == keys.SPACE) {
            this._spaceKeyDown = true;
        } else {
            this._processKeyDown(event.keyCode);
        }
        this._keyEventDoUpdate(widgetType, absolute, doCursor, beforeAfter, currentParent);
    }

    onKeyUp(event, widgetType, absolute, doCursor, beforeAfter, currentParent) {
        stopEvent(event);
        if (event.keyCode == keys.SPACE) {
            this._spaceKeyDown = false;
        }
        this._keyEventDoUpdate(widgetType, absolute, doCursor, beforeAfter, currentParent);
    }

    /**
     * Update currently proposed parent widget based on latest keydown event
     *
     * @param {number} keyCode  The keyCode for the key that the user pressed
     */
    _processKeyDown(keyCode) {
        if (keyCode >= 49 && keyCode <= 57) {		// 1-9
            const context = this._context;
            const proposedParentsList = this.getProposedParentsList();
            if (proposedParentsList.length > 1) {
                // Number character: select parent that has the given number
                // Note that the presentation is 1-based (versus 0-based) and backwards
                const index = proposedParentsList.length - (keyCode - 48);
                if (index >= 0) {
                    this.setProposedParentWidget(proposedParentsList[index]);
                }
            }
        }
    }

    isSpaceKeyDown() {
        return this._spaceKeyDown;
    }
}
