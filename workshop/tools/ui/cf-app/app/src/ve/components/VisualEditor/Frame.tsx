import * as React from 'react';
import * as Axios from 'axios';  // import axios types
import { default as axios } from 'axios';  // import axios public API
import { HTMLParser } from '../html';
import { HTMLFile } from '../html/HTMLFile';
import { Metadata } from '../metadata';
import { RESOURCE_VARIABLES } from '../../../config';
import { VisualEditor } from '..';
import * as jQuery from 'jquery';
export interface Props {
    editor: VisualEditor;
}

export interface State {

}

// tslint:disable-next-line:no-var-requires
// const template = require('./template.html');
// console.clear();
// console.log('tm', template);
export class Frame extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {};
    }

    public _frame: HTMLIFrameElement;
    public templateText: string = '';
    public container: HTMLElement;
    public document: HTMLDocument;

    public async template(url: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            axios.get(url, {
                responseType: 'text',
            }).then((data) => {
                resolve(data.data as string);
            })
        });
    }

    public async componentWillMount() {

    }

    public frame() {
        const props = {
            ref: (ref => { this._frame = ref }),
            frameBorder: '0',
            target: '_parent',
            allowFullScreen: false,
            style:
                {
                    position: 'absolute',
                    display: 'block',
                    height: '100%',
                    width: '100%'
                },
            height: '100%',
            name: '',
            width: '100%'
        }
        return React.createElement('iframe', props);
    }

    public componentDidMount() {
        // this._frame = this.frame();
        this.template('/frame.html').then((data) => {
            this.templateText = data;
            const props = {
                frameBorder: '0',
                allowFullScreen: false,
                style:
                    {
                        position: 'absolute',
                        display: 'block',
                        height: '100%',
                        width: '100%'
                    },
                height: '100%',
                name: '',
                width: '100%'
            }
            const frame = document.createElement('iframe', {

            });
            this.container.appendChild(frame);
            jQuery(frame).addClass('iframe');
            this._frame = frame;

            const doc = frame.contentWindow.document;

            /*
            const hFile = new HTMLFile('./test.html');
            let ret = null;
            try {
                ret = hFile.setText(this.templateText, null);
                console.log('set text', ret, hFile);
                console.log('guest window', frame.contentWindow);
            } catch (e) {
                console.error('error settings text', e);
            }
            */

            /*
            const t = HTMLParser.parse(this.templateText, null);
            debugger;*/
            // console.log('did mount frame', this.templateText.length);
            doc.open();
            doc.write(this.templateText);
            doc.close();
            this.document = doc;
            this.props.editor.frameReady(this.templateText, this);

        });
    }

    render() {
        return <div ref={(ref) => this.container = ref} className={'frameContainer'}> </div>
    }
}
