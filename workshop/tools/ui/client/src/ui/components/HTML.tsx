import * as React from "react";
const DEBUG = false;

export class HTMLMock extends React.Component<{
    onRendered: () => void
    html: string
}, any> {

    state: any = { markup: '' };
    container: HTMLDivElement;
    render() {
        return <div ref={(ref) => this.container = ref} dangerouslySetInnerHTML={{ __html: this.state.markup }}></div>;
    }
    init() {
        this.setState({
            markup: this.props.html
        });

        // react glitch
        setTimeout(() => {
            window.requestAnimationFrame(() => this.props.onRendered());
            this.container.focus();
            this.container.lastElementChild && this.container.lastElementChild.scrollIntoView();
            DEBUG && console.log(`did render render ${this.container.getElementsByTagName('*').length} elements`, this.container.lastElementChild);
        }, 100);
    }
}