import { Command } from './Command';

export class CompoundCommand extends Command {
    _newId: any;
    _oldId: any;
    // summary:
    //	Represents a command that consists of multiple subcommands.

    name: string = 'compound'
    _commands: any[];

    constructor(command?: any) {
        super({});
        this._commands = [];
        if (command) {
            this._commands = [command];
        }

    }

    add(command) {
        // summary:
        //		Adds the command to this command's list of commands to execute.
        if (!command) {
            return;
        }

        if (!this._commands) {
            // tslint:disable-next-line:prefer-conditional-expression
            if (command.name === 'compound') {
                this._commands = command._commands;
            } else {
                this._commands = [command];
            }
        } else {
            if (command.name === 'compound') {
                // merge commands
                command._commands.forEach((c) => {
                    this.add(c);
                });
                return;
            } else if (command.name == 'modify') {
                // merge modify command
                const id = command._oldId;
                for (let i = 0; i < this._commands.length; i++) {
                    const c = this._commands[i];
                    if (c.name === 'modify' && c._oldId == id) {
                        c.add(command);
                        return;
                    }
                }
            }
            this._commands.push(command);
        }
    }

    setContext(context) {
        for (let i = 0; i < this._commands.length; i++) {
            if (this._commands[i].setContext) {
                this._commands[i].setContext(context);
            }
        }

    }
    isEmpty() {
        // summary:
        //		Returns whether this command has any subcommands to execute.
        return (!this._commands || this._commands.length === 0);
    }

    execute() {
        // summary:
        //		Executes this command, which in turn executes each child command in the order they were added.
        if (!this._commands) {
            return;
        }

        for (let i = 0; i < this._commands.length; i++) {
            this._commands[i].execute();
            if (this._commands[i]._oldId && this._commands[i]._newId) {
                this._oldId = this._commands[i]._oldId;
                this._newId = this._commands[i]._newId;
            }
        }
    }

    undo() {
        // summary:
        //		Undoes each of the child commands (in reverse order).
        if (!this._commands) {
            return;
        }

        for (let i = this._commands.length - 1; i >= 0; i--) {
            this._commands[i].undo();
        }
    }
}
