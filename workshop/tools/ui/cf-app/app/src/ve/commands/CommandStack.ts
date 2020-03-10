import { win as win } from '../_html/window';
import { EditorContext } from '../EditorContext';
import { Command } from '.';
import { Evented } from '../../shared/Evented';
export class CommandStack extends Evented {
    _redoStack: any[];
    _undoStack: any[];
    _context: EditorContext;
    // summary:
    //	A history of commands that have occurred that keeps track of undo and redo history.

    constructor(context) {
        super();
        this._context = context;
        this._undoStack = [];
        this._redoStack = [];
    }

    execute(command: Command, quite: boolean = false) {
        // summary:
        //		Runs the specified command, records the execution state in the undo history, and clears the redo buffer.
        if (!command) {
            return;
        }

        let quietExecute;
        // tslint:disable-next-line:prefer-conditional-expression
        if (this._context) {
            // changing doc root causes problems with Style palette
            quietExecute = win.withDoc(this._context.getDocument(), 'execute', command, [this._context, quite]);
        } else {
            quietExecute = command.execute(quite);
        }
        this._undoStack.push(command);
        this._redoStack = [];

        if (!quietExecute) {
            this.onExecute(command, 'execute');
        }
    }

    undo() {
        // summary:
        //		Undoes the last executed command, and records the undone command state in the redo history.
        if (!this.canUndo()) {
            return;
        }

        const command = this._undoStack.pop();
        if (command._runDelegate) {
            command._runDelegate.undoDelegate(command);
        } else {
            if (this._context) {
                //changing doc root causes problems with Style palette
                win.withDoc(this._context.getDocument(), 'undo', command);
            } else {
                command.undo();
            }
        }
        this._redoStack.push(command);

        this.onExecute(command, 'undo');
    }

    redo() {
        // summary:
        //		Redo any commands that have been undone (most recently undone first).
        if (!this.canRedo()) {
            return;
        }

        const command = this._redoStack.pop();
        if (command._runDelegate) {
            command._runDelegate.redoDelegate(command);
        } else {
            if (this._context) {
                // changing doc root causes problems with Style palette
                win.withDoc(this._context.getDocument(), 'execute', command);
            } else {
                command.execute();
            }
        }

        this._undoStack.push(command);

        this.onExecute(command, 'redo');
    }

    canUndo() {
        // summary:
        //		Returns true if there are any commands that have been executed that can be undone, false otherwise
        return this._undoStack.length > 0;
    }

    canRedo() {
        // summary:
        //		Returns true if there are any commands that have been undone that can be redone, false otherwise.
        return this._redoStack.length > 0;
    }

    getUndoCount() {
        // summary:
        //		Returns how many commands are in the undo stack.
        return this._undoStack.length;
    }

    getRedoCount() {
        // summary:
        //		Returns how many commands are in the redo stack.
        return this._redoStack.length;
    }

    clear() {
        // summary:
        //		Clears the undo and redo stacks.
        this._undoStack = [];
        this._redoStack = [];
    }

    jump(point, silent) {
        const undoCount = this.getUndoCount();
        const redoCount = this.getRedoCount();
        if (point == undoCount) {
            return point; // nothing to do
        }
        if (point < 0 || point > undoCount + redoCount) {
            return -1; // invalid point
        }

        let n = point - undoCount;
        if (silent) {
            // when called with "silent" true, no command is executed/undone
            // the caller is responsible to set content
            if (n < 0) {
                while (n < 0) {
                    this._redoStack.push(this._undoStack.pop());
                    n++;
                }
            } else {
                while (n > 0) {
                    this._undoStack.push(this._redoStack.pop());
                    n--;
                }
            }
        } else {
            if (n < 0) {
                while (n < 0) {
                    this.undo();
                    n++;
                }
            } else {
                while (n > 0) {
                    this.redo();
                    n--;
                }
            }
        }
        return point;
    }

    onExecute(command, reason) {
        this.emit('excecute', command);
    }

    undoDelegate(command) {
    }

    redoDelegate(command) {
    }
}
