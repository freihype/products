import { Command } from './Command';
import { WidgetUtils, HTMLWidget } from '..';
import { States } from '../States';

export class DeleteCommand extends Command {
    constructor(widget) {
        super({});
        this._id = (widget ? widget.id : undefined);
        this._widget = widget;
    }

    execute() {
        if (!this._id) {
            return;
        }
        const widget = this._widget; //WidgetUtils.byId(this._id);
        if (!widget) {
            return;
        }
        const context = widget.getContext();
        const parent = widget.getParent() || context.getContainerNode();
        let onRemoveCallback;
        const helper = widget.getHelper();
        if (helper && helper.onRemove) {
            // onRemove helper optionally returns a function to call after delete remove command
            // has finished the removal.
            onRemoveCallback = helper.onRemove(widget);
        }

        if (!this._data) {
            this._index = parent.getChildren().indexOf(widget);
            if (this._index < 0) {
                return;
            }
            this._data = widget.getData();
            this._parentId = parent.id;
        }
        this._data.context = context;

        // Some situations require that we recreate an ancestor widget (e.g., RoundRectList) so that we
        // will invoke the widget library creation logic to re-initialize everything properly
        const ancestor = this._isRefreshOnDescendantChange(widget);

        if (context) {
            context.detach(widget);
        }

        parent.removeChild(widget);

        // make sure we call right after it was removed but before being destroyed
        if (context) {
            context.widgetChanged(context.WIDGET_REMOVED, widget);
        }

        widget.destroyWidget();

        // Note we're executing the ModifyCommand directly as opposed to adding to it to the
        // command stack since we're not really changing anything on the parent and don't
        // need to allow user to undo it.
        if (ancestor) {
            /*
            const command = new ModifyCommand(ancestor,
                    null, null, parent._edit_context);
            command.execute();*/
        }

        // Recompute styling properties in case we aren't in Normal state
        // States.resetState(widget.domNode);

        if (onRemoveCallback) {
            onRemoveCallback();
        }
        console.log('run undo', this);
    }

    undo() {
        if (!this._data || !this._parentId) {
            return;
        }
        const parent: HTMLWidget = this._widget.getContext().byId(this._parentId);
        if (!parent) {
            console.error('have no parent');
            return;
        }
        const widget = WidgetUtils.createWidget(this._data, null, null, this._widget.getContext());
        if (!widget) {
            return;
        }
        widget.then((w) => {
            parent.addChild(w, this._index);
            const context = parent.getContext();
            if (context) {
                context.attach(w);
                w.startup();
                w.renderWidget();
                context.widgetAddedOrDeleted();

                // context.widgetChanged(context.WIDGET_ADDED, widget);

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
        })
    }
}
