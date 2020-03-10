import { WidgetUtils, Widget } from '..';
import { States } from '../States';
import { Command } from '.';
import { EditorContext } from '../EditorContext';
import { WIDGET_CHANGE } from '../types';

export class AddCommand extends Command {
    _data: any;
    _index: any;
    _parentId: any;
    _id: any;
    name: string = 'add';
    constructor(widget, parent, index) {
        super();
        if (widget) {
            if (widget.domNode) { // widget
                this._id = widget.id;
            } else { // data
                this._data = widget;
            }
        }
        this._parentId = parent.id;
        this._index = index;
        this._widget = widget;
    }

    execute() {
        const context = this._widget.getContext();
        const parent = context.byId(this._parentId);
        if (!parent) {
            return;
        }
        let widget;
        if (this._data) {
            //this.undo(); // try to remove old widget first, mostly for redo
            if (this._id && this._data.properties) {
                this._data.properties.id = this._id;
            }
            widget = WidgetUtils.createWidget(this._data);
            this._id = widget.id;
        } else if (this._id) {
            widget = WidgetUtils.byId(this._id, context.getDocument());
        }
        if (!widget) {
            return;
        }
        // after creating the widget we need to refresh the data, the createWidget function removes the id's of the widgets and
        // children. We need the id's to be consistent for undo/redo to work -- wdr
        this._data = widget.getData();
        this._data.properties.id = this._id;
        this._data.context = context;

        // TODO: this._index is typically a number... when is it passed in as a widget?
        if (this._index && typeof this._index != 'number') {
            if (this._index.domNode) { // widget
                this._index = parent.indexOf(this._index);
            } else {
                // _index is no longer valid since it was replaced, lets find it
                const w = WidgetUtils.byId(this._index.id, context.getDocument());
                this._index = parent.indexOf(w);
            }
        }

        // IMG elements don't have a size until they are actually loaded
        // so selection/focus box will be wrong upon creation.
        // To fix, register an onload handler which calls updateFocus()
        if (widget.domNode.tagName === 'IMG') {
            //  ImageUtils.ImageUpdateFocus(widget, context);
        }

        parent.addChild(widget, this._index);

        if (context) {
            context.attach(widget);
            widget.startup();
            widget.renderWidget();
            context.widgetAddedOrDeleted();
            context.widgetChanged(WIDGET_CHANGE.WIDGET_ADDED, widget);
        }

        // Some situations require that we recreate an ancestor widget (e.g., RoundRectList) so that we
        // will invoke the widget library creation logic to re-initialize everything properly
        const ancestor = this._isRefreshOnDescendantChange(widget);

        // Note we're executing the ModifyCommand directly as opposed to adding to it to the
        // command stack since we're not really changing anything on the parent and don't
        // need to allow user to undo it.
        if (ancestor) {
            const command = new ModifyCommand(ancestor, null, null, parent._edit_context);
            command.execute();
        }

        // Recompute styling properties in case we aren't in Normal state
        States.resetState(widget.domNode);
    }

    undo() {

        if (!this._id || !this._parentId) {
            return;
        }
        const widget = WidgetUtils.byId(this._id);
        if (!widget) {
            return;
        }

        const parent = WidgetUtils.byId(this._parentId);
        if (!parent) {
            return;
        }

        // Some situations require that we recreate an ancestor widget (e.g., RoundRectList) so that we
        // will invoke the widget library creation logic to re-initialize everything properly
        const ancestor = this._isRefreshOnDescendantChange(widget);

        const context = widget.getContext();
        if (context) {
            context.detach(widget);
            context.deselect(widget);
        }

        parent.removeChild(widget);

        // make sure we call right after it was removed but before being destroyed
        context.widgetChanged(context.WIDGET_REMOVED, widget);

        widget.destroyWidget();
        if (context) {
            context.widgetAddedOrDeleted();
        }

        // Note we're executing the ModifyCommand directly as opposed to adding to it to the
        // command stack since we're not really changing anything on the parent and don't
        // need to allow user to undo it.
        if (ancestor) {
            const command = new ModifyCommand(ancestor, null, null, parent._edit_context);
            command.execute();
        }

        // Recompute styling properties in case we aren't in Normal state
        States.resetState(widget.domNode);
    }
}
