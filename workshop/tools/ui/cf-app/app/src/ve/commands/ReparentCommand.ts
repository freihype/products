import { Command } from '.';
import { WidgetUtils } from '..';
import { byId } from '../_html';
import { States } from '../States';

export class ReparentCommand extends Command {
    _oldIndex: any;
    _oldParentId: any;
    _newIndex: any;
    _newParentId: any;
    name: string = 'reparent';

    constructor(widget, parent, index) {
        super();
        this._id = (widget ? widget.id : undefined);
        this._newParentId = (parent ? parent.id : 'myapp');
        this._newIndex = index;
    }

    execute() {
        if (!this._id || !this._newParentId) {
            return;
        }
        const widget = WidgetUtils.byId(this._id);
        if (!widget) {
            return;
        }
        let oldParent = widget.getParent();
        if (!oldParent) { oldParent = byId('myapp'); }
        let newParent = WidgetUtils.byId(this._newParentId);
        if (!newParent) { newParent = byId('myapp'); }

        // Some situations require that we recreate an ancestor widget (e.g., RoundRectList) so that we
        // will invoke the widget library creation logic to re-initialize everything properly
        const oldAncestor = this._isRefreshOnDescendantChange(widget);

        if (!this._oldParentId) {
            this._oldParentId = oldParent.id;
            this._oldIndex = oldParent.getChildren().indexOf(widget);
            if (this._newIndex && this._newIndex.domNode) { // widget
                this._newIndex = newParent.indexOf(this._newIndex);
            }
        }

        oldParent.removeChild(widget);

        const context = newParent.getContext();

        // If moving a widget within same parent, adjust newIndex in case the widget is being moved
        // to a latter point in list of children. If so, the removeChild operation has altered the child list
        // and we substract 1.  This way the index is the correct one in the original child list rather than the
        // index after the widgets have been re-arranged.
        const newIndex = (newParent == oldParent && this._oldIndex < this._newIndex) ? this._newIndex - 1 : this._newIndex;
        newParent.addChild(widget, newIndex);

        if (context) {
            const helper = widget.getHelper();
            if (helper && helper.reparent) {
                helper.reparent(widget);
            }
            widget.startup();
            widget.renderWidget();

            context.widgetChanged(context.WIDGET_REPARENTED, widget, [oldParent, newParent]);

            // Some situations require that we recreate an ancestor widget (e.g., RoundRectList) so that we
            // will invoke the widget library creation logic to re-initialize everything properly
            const newAncestor = this._isRefreshOnDescendantChange(widget);

            // Note we're executing the ModifyCommand directly as opposed to adding to it to the
            // command stack since we're not really changing anything on the parent and don't
            // need to allow user to undo it.
            if (oldAncestor) {
                const command = new ModifyCommand(oldAncestor, null, null, context);
                command.execute();
            }
            if (newAncestor) {
                const command = new ModifyCommand(newAncestor, null, null, context);
                command.execute();
            }
        }

        // Recompute styling properties in case we aren't in Normal state
        States.resetState(widget.domNode);
    }

    undo() {
        if (!this._id || !this._oldParentId || !this._newParentId) {
            return;
        }
        const widget = WidgetUtils.byId(this._id);
        if (!widget) {
            return;
        }
        const oldParent = WidgetUtils.byId(this._oldParentId);
        if (!oldParent) {
            return;
        }
        const newParent = WidgetUtils.byId(this._newParentId);
        if (!newParent) {
            return;
        }

        // Some situations require that we recreate an ancestor widget (e.g., RoundRectList) so that we
        // will invoke the widget library creation logic to re-initialize everything properly
        const newAncestor = this._isRefreshOnDescendantChange(widget);

        const context = oldParent.getContext();

        newParent.removeChild(widget);

        oldParent.addChild(widget, this._oldIndex);
        if (context) {
            const helper = widget.getHelper();
            if (helper && helper.reparent) {
                helper.reparent(widget);
            }
            widget.startup();
            widget.renderWidget();

            context.widgetChanged(context.WIDGET_REPARENTED, widget, [oldParent, newParent]);

            // Some situations require that we recreate an ancestor widget (e.g., RoundRectList) so that we
            // will invoke the widget library creation logic to re-initialize everything properly
            const oldAncestor = this._isRefreshOnDescendantChange(widget);

            // Note we're executing the ModifyCommand directly as opposed to adding to it to the
            // command stack since we're not really changing anything on the parent and don't
            // need to allow user to undo it.
            if (newAncestor) {
                const command = new ModifyCommand(newAncestor, null, null, context);
                command.execute();
            }
            if (oldAncestor) {
                const command = new ModifyCommand(oldAncestor, null, null, context);
                command.execute();
            }
        }

        // Recompute styling properties in case we aren't in Normal state
        States.resetState(widget.domNode);
    }
}
