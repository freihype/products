import * as React from 'react';
import * as lodash from 'lodash';

import { ReactMonacoEditorProps } from 'react-monaco-editor';
// tslint:disable-next-line:no-var-requires
// const Editor = require('react-monaco-editor').default;
import { default as Editor } from 'react-monaco-editor';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { ConsoleCommands } from './Commands';
import { IConsoleHandler } from '../../../types';

export interface IConsoleProperties {
    handler: IConsoleHandler;
}

export class Console extends React.Component<IConsoleProperties, any> implements IConsoleHandler {
    onConsoleEnter(val: string) {
        this.props.handler.onConsoleEnter(this.editor.getValue());
    };
    onConsoleClear() {
        this.editor.setValue('');
        this.props.handler.onConsoleClear();
    };
    onChangeOptions(options: any) {
        this.props.handler.onChangeOptions(options);
    }
    getCompletions: () => any[];
    public editor: monaco.editor.ICodeEditor = null;
    public editor2: Editor = null;
    public commands: ConsoleCommands;
    constructor(props) {
        super(props);
        this.state = {
            code: '// type your code...',
        }
    }
    @autobind
    editorDidMount?(editor: monaco.editor.IStandaloneCodeEditor, monacoModule: typeof monaco): void {

        this.editor = editor;
        const handler = this.props.handler;

        monaco.languages.registerCompletionItemProvider('javascript', {
            provideCompletionItems: function (model, position) {
                const ret = handler.getCompletions() || [];
                return ret;
            }
        });

        editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, (val: any) => {
            const selection = this.editor.getModel().getValueInRange(this.editor.getSelection());
            const what = selection ? selection : this.editor.getValue();
            what && this.props.handler.onConsoleEnter(what);
        }, null);

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, (val: any) => {
            this.editor.setValue('');
            this.props.handler.onConsoleClear();
        }, null);

        /*
        // Explanation:
        // Press F1 (Alt-F1 in IE) => the action will appear and run if it is enabled
        // Press Ctrl-F10 => the action will run if it is enabled
        // Press Chord Ctrl-K, Ctrl-M => the action will run if it is enabled

        editor.addAction({
            // An unique identifier of the contributed action.
            id: 'my-unique-id',

            // A label of the action that will be presented to the user.
            label: 'My Label!!!',

            // An optional array of keybindings for the action.
            keybindings: [
                monaco.KeyMod.Shift | monaco.KeyCode.F10,
                // chord
                monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_K, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_M)
            ],

            // A precondition for this action.
            precondition: null,

            // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
            keybindingContext: null,

            contextMenuGroupId: 'navigation',

            contextMenuOrder: 1.5,

            // Method that will be executed when the action is triggered.
            // @param editor The editor instance is passed in as a convinience
            run: function (ed) {
                alert("i'm running => " + ed.getPosition());
                return null;
            }
        });
        */

        /*
        monacoModule.languages.setLanguageConfiguration('js', {
            onEnterRules: [
                {
                    beforeText: /[0-9]$/,
                    action: {
                        indentAction: monaco.languages.IndentAction.None,
                        appendText: 'hello world!'
                    }
                }
            ]
        })*/
        // debugger;
        // console.log('editorDidMount', editor);
        // editor.setValue('editorDidMount');
        //editor.focus();

    }
    onChange(newValue, e) {
        // console.log('onChange', newValue, e);
    }

    render() {
        // console.log('render console', Editor);
        const code = this.state.code;
        const options: monaco.editor.IEditorOptions = {
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: 'line',
            automaticLayout: true
        };
        return (
            <div style={{ height: '148px' }}>
                <ConsoleCommands ref={(ref) => this.commands = ref} handler={this} style={{ height: '48px' }} />
                <Editor
                    language='javascript'
                    theme='vs-light'
                    value={''}
                    options={options}
                    editorDidMount={this.editorDidMount}
                    ref={(ref) => this.editor2 = ref}
                    requireConfig={
                        {
                            url: '/vs/loader.js',
                            baseUrl: '/',
                            paths: [{ vs: '/vs/' }]
                        }
                    }
                />
            </div>
        );
    }
}
