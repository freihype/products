import { WidgetUtils } from '..';
import { GeomUtils, mergeStyleArrays } from '../utils';
import { States } from '../States';

/*
define([
    "dojo/_base/declare",
    "dojo/dom-geometry",
    "davinci/ve/widget",
    "davinci/ve/States",
    "davinci/ve/utils/StyleArray"
], (declare, Geometry, Widget, States, StyleArray) => declare("davinci.ve.commands.ResizeCommand", null, {
*/

// name: "resize",

export class ResizeCommand {
    _context: any;
    _oldStyleValuesAllStates: any;
    _oldBox: { w: number; h: number; };
    _applyToStateIndex: any;
    _newBox: { w: any; h: any; };
    _id: any;
    constructor(widget, width, height, applyToWhichState?: any) {
        this._id = (widget ? widget.id : undefined);
        const number_regex = /^\s*[-+]?[0-9]*\.?[0-9]+\s*$/;
        this._context = widget.getContext();
        /* make sure these values are numeric */
        if (number_regex.test(width)) {
            width = parseFloat(width);
        }
        if (number_regex.test(height)) {
            height = parseFloat(height);
        }

        this._newBox = { w: width, h: height };

        // applyToWhichState controls whether style change is attached to Normal or other states
        //   (null|undefined|"undefined"|"Normal") => apply to Normal state
        //   other string => apply to that particular state
        this._applyToStateIndex = (!applyToWhichState || applyToWhichState == 'Normal' || applyToWhichState == 'undefined')
            ? 'undefined' : applyToWhichState;
    }

    execute() {
        console.log('resize command!', this);
        if (!this._id || !this._newBox) {
            return;
        }
        const context = this._context;
        const widget = context.byId(this._id);
        if (!widget || !widget.domNode) {
            return;
        }
        const node = widget.domNode;

        // Adjustments for widgets whose root tag has special CSS treatment
        // where width/height specify border-box instead of content-box
        //FIXME: This logic doesn't take into account the possibility that
        //uses have set borders and padding to different values for different states
        //Unlikely combination, but nevertheless not dealt with here properly
        const cs = node.ownerDocument.defaultView.getComputedStyle(node);
        const oldBox = GeomUtils.getContentBox(node, cs);
        this._oldBox = { w: oldBox.w, h: oldBox.h };
        let w = this._newBox.w;
        let h = this._newBox.h;
        if (this._usesBorderBox(node)) {
            const pb = GeomUtils.getPadBorderExtents(node, cs);
            if (typeof w == 'number' && w >= 0) {
                w += pb.w;
            }
            if (typeof h == 'number' && h >= 0) {
                h += pb.h;
            }
        }

        //var newStyleArray = [{width:w+'px'},{height:h+'px'}] ;
        const empty: any = {};
        const newStyleArray = [empty];
        if (typeof w == 'number') {
            newStyleArray[0].width = w + 'px';
        } else if (typeof w == 'string') {
            newStyleArray[0].width = w;
        }
        if (typeof h == 'number') {
            newStyleArray[0].height = h + 'px';
        } else if (typeof h == 'string') {
            newStyleArray[0].height = h;
        }
        const styleValuesAllStates = widget.getStyleValuesAllStates();
        this._oldStyleValuesAllStates = { ...styleValuesAllStates };
        if (this._oldBox) {
            //FIXME: Undo will force a width/height values onto inline style
            //that might not have been there before.
            this._oldStyleValuesAllStates[this._applyToStateIndex] =
                mergeStyleArrays(this._oldStyleValuesAllStates[this._applyToStateIndex],
                    [{ width: this._oldBox.w + 'px' }, { height: this._oldBox.h + 'px' }]);
        }
        // tslint:disable-next-line:prefer-conditional-expression
        if (styleValuesAllStates[this._applyToStateIndex]) {
            styleValuesAllStates[this._applyToStateIndex] = mergeStyleArrays(styleValuesAllStates[this._applyToStateIndex], newStyleArray);
        } else {
            styleValuesAllStates[this._applyToStateIndex] = newStyleArray;
        }

        widget.setStyleValuesAllStates(styleValuesAllStates);
        const currentStatesList = States.getStatesListCurrent(widget.domNode);
        let styleValuesCanvas = mergeStyleArrays([], styleValuesAllStates['undefined']);
        for (let i = 0; i < currentStatesList.length; i++) {
            if (styleValuesAllStates[currentStatesList[i]]) {
                styleValuesCanvas = mergeStyleArrays(styleValuesCanvas, styleValuesAllStates[currentStatesList[i]]);
            }
        }
        widget.setStyleValuesCanvas(styleValuesCanvas);
        widget.setStyleValuesModel(styleValuesAllStates['undefined']);
        this._resize(widget);

        // Recompute styling properties in case we aren't in Normal state
        States.resetState(widget.domNode);

        //FIXME: Various widget changed events (/davinci/ui/widget*Changed) need to be cleaned up.
        // I defined yet another one here (widgetPropertiesChanged) just before Preview3
        // rather than re-use or alter one of the existing widget*Changed events just before
        // the Preview 3 release to minimize risk of bad side effects, with idea we would clean up later.
        // For time being, I made payload compatible with /davinci/ui/widgetSelectionChanged.
        // Double array is necessary because dojo.publish strips out the outer array.
        // dojo.publish("/davinci/ui/widgetPropertiesChanged", [[widget]]);
    }
    setContext(context) {
        this._context = context;
    }

    undo() {
        if (!this._id) {
            return;
        }
        const widget = WidgetUtils.byId(this._id);
        if (!widget) {
            return;
        }
        const styleValuesAllStates = this._oldStyleValuesAllStates;
        const currentStateIndex = this._applyToStateIndex;
        widget.setStyleValuesAllStates(styleValuesAllStates);
        const styleValuesCanvas = mergeStyleArrays(styleValuesAllStates['undefined'], styleValuesAllStates[currentStateIndex]);
        widget.setStyleValuesCanvas(styleValuesCanvas);
        widget.setStyleValuesModel(this._oldStyleValuesAllStates['undefined']);

        this._resize(widget);

        // Recompute styling properties in case we aren't in Normal state
        States.resetState(widget.domNode);

        // dojo.publish("/davinci/ui/widgetPropertiesChanged", [[widget]]);
    }

    /**
     * Mostly a duplicate of private function found in dojo/dom-geometry.js
     * Returns true if node uses border-box layout
     * TABLE and BUTTON (and INPUT type=button) are always border-box by default.
     */
    _usesBorderBox(/*DomNode*/node) {
        const tagName = node.tagName.toLowerCase();
        let type = node.getAttribute('type');
        if (type) {
            type = type.toLowerCase(type);
        }
        return tagName == 'table' || tagName == 'button' || (tagName == 'input' && type == 'button'); // boolean
    }

    _resize(widget) {
        const parent = widget.getParent();
        if (parent && parent.dijitWidget && parent.dijitWidget.isLayoutContainer) {
            parent.resize();
        } else if (widget.resize) {
            widget.resize();
        }
        widget.renderWidget();
        widget._updateSrcStyle();
    }
}
