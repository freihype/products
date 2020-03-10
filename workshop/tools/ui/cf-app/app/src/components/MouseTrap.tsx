import * as React from 'react';
import * as mousetrap from 'mousetrap';

export class MouseTrap<P, S> extends React.Component<P, S> {
    public root: HTMLElement;
    private __mousetrapBindings = [];
    constructor(props) {
        super(props);
    }
    bindShortcut(key, callback) {
        mousetrap(this.root).bind(key, callback);
        this.__mousetrapBindings.push(key);
    }

    unbindShortcut(key) {
        const index = this.__mousetrapBindings.indexOf(key);
        if (index > -1) {
            this.__mousetrapBindings.splice(index, 1);
        }

        mousetrap(this.root).unbind(key);
    }

    unbindAllShortcuts() {
        if (this.__mousetrapBindings.length < 1) {
            return;
        }

        this.__mousetrapBindings.forEach(binding => {
            mousetrap(this.root).unbind(binding);
        });
        this.__mousetrapBindings = [];
    }

    componentWillUnmount() {
        this.unbindAllShortcuts();
    }
}
