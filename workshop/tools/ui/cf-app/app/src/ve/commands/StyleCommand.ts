import { mixin, clone } from '@xblox/core/objects';
import { mergeStyleArrays } from '../utils';
import { States } from '../States';
import { WidgetUtils } from '..';

/*
define([
    	"dojo/_base/declare",
	"davinci/ve/utils/StyleArray"
    	//"davinci/ve/widget", // circular dep
    	//"davinci/ve/States" // circular dep
], (declare, StyleArray) => declare("davinci.ve.commands.StyleCommand", null, {
*/
export class StyleCommand {
    _oldStyleValuesAllStates: any;
    _applyToStateIndex: any;
    _id: any;
    _newValues: any;
    name: string = 'style';

    constructor(widget, values, applyToWhichState?: any) {
        debugger;
        this._newValues = values;
        this._id = widget ? widget.id : undefined;
        // applyToWhichState controls whether style change is attached to Normal or other states
        //   (null|undefined|"undefined"|"Normal") => apply to Normal state
        //   other string => apply to that particular state
        this._applyToStateIndex = (!applyToWhichState || applyToWhichState == 'Normal' || applyToWhichState == 'undefined')
            ? 'undefined' : applyToWhichState;
    }

    add(command) {
        if (!command || command._id != this._id) {
            return;
        }

        if (command._newValues) {
            mixin(this._newValues, command._newValues);
        }
    }

    execute(context, quite) {
        if (!this._id || !this._newValues) {
            return;
        }
        const widget = WidgetUtils.byId(this._id);
        if (!widget || !widget.domNode) {
            return;
        }

        // const veStates = require('davinci/ve/States');
        const styleValuesAllStates = widget.getStyleValuesAllStates();
        this._oldStyleValuesAllStates = clone(styleValuesAllStates);
        // tslint:disable-next-line:prefer-conditional-expression
        if (styleValuesAllStates[this._applyToStateIndex]) {
            styleValuesAllStates[this._applyToStateIndex] = mergeStyleArrays(styleValuesAllStates[this._applyToStateIndex], this._newValues);
        } else {
            styleValuesAllStates[this._applyToStateIndex] = this._newValues;
        }

        // Remove any properties that are flagged for removal.
        const styleArrayThisState = styleValuesAllStates[this._applyToStateIndex];
        for (let i = styleArrayThisState.length - 1; i >= 0; i--) {
            const obj = styleArrayThisState[i];
            let anyValuesLeft = false;
            // tslint:disable-next-line:forin
            for (const prop in obj) {
                const value = obj[prop];
                if (value == '$MAQ_DELETE_PROPERTY$') {
                    delete obj[prop];
                } else {
                    anyValuesLeft = true;
                }
            }
            if (!anyValuesLeft) {
                styleArrayThisState.splice(i, 1);
            }
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
        widget.refresh();
        // Recompute styling properties in case we aren't in Normal state
        States.resetState(widget.domNode);

        //FIXME: Various widget changed events (/davinci/ui/widget*Changed) need to be cleaned up.
        // I defined yet another one here (widgetPropertiesChanged) just before Preview3
        // rather than re-use or alter one of the existing widget*Changed events just before
        // the Preview 3 release to minimize risk of bad side effects, with idea we would clean up later.
        // For time being, I made payload compatible with /davinci/ui/widgetSelectionChanged.
        // Double array is necessary because dojo.publish strips out the outer array.
        if (quite !== true) {
            dojo.publish('/davinci/ui/widgetPropertiesChanged', [[widget]]);
        }
    }

    undo() {
        if (!this._id || !this._oldStyleValuesAllStates) {
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

        widget.refresh();
        // Recompute styling properties in case we aren't in Normal state
        States.resetState(widget.domNode);

        //FIXME: Various widget changed events (/davinci/ui/widget*Changed) need to be cleaned up.
        // I defined yet another one here (widgetPropertiesChanged) just before Preview3
        // rather than re-use or alter one of the existing widget*Changed events just before
        // the Preview 3 release to minimize risk of bad side effects, with idea we would clean up later.
        // For time being, I made payload compatible with /davinci/ui/widgetSelectionChanged.
        // Double array is necessary because dojo.publish strips out the outer array.
        dojo.publish('/davinci/ui/widgetPropertiesChanged', [[widget]]);
    }
}
