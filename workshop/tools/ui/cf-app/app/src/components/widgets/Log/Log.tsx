import * as React from 'react';
import objectPath from 'object-path';
import * as _ from 'lodash';

function getFieldValue(event, field) {
    const value = objectPath.get(event, field.path);
    switch (field.type) {
        case 'time':
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return value;
            } else {
                return date.toUTCString();
            }
        default:
            return value;
    }
}

export function createEvent(event, matching) {
    const newEvent = {
        time: parseInt(event.timeStamp || new Date().getTime(), 10),
        data: event,
        source: event,
        match: null
    }
    if (matching && matching.length) {
        for (let i = 0; i < matching.length; i++) {
            let {
                pattern,
                bgColorOnMatch,
                paths
            } = matching[i];
            let isMatch = false;
            if (paths && paths.length) {
                isMatch = paths.every(path => {
                    const fieldValue = objectPath.get(newEvent.data, path);
                    return new RegExp(pattern).test(fieldValue);
                });
            } else {
                isMatch = new RegExp(pattern).test(newEvent.source);
            }

            if (isMatch) {
                newEvent.match = {
                    bgColorOnMatch
                }
                break;
            }
        }
    }

    return newEvent;
}

export class Log extends React.Component<any, any> {
    public source: any;
    static defaultProps = {
        config: {}
    };

    public view: any;

    constructor(props) {
        super(props)
        this.state = {
            events: [],
            error: null
        }
    }
    add(msg: any) {
        const newEvent = createEvent(msg, null);
        this.setState({
            events: [...this.state.events, newEvent]
        });
        this.scrollToBottom();
    }
    clear() {
        console.log('clear log');
        this.setState({
            events: []
        });
    }
    scrollToBottom() {

        /*
        scroller.scrollTo('logStreamLast', {

        });
        */
        this._scrollDown();
    }

    _scrollDown() {
        let view = document.getElementById('logStream');
        const last = document.getElementById('logStreamLast');
        last && last.scrollIntoView({ behavior: 'instant', block: 'end', inline: 'end' });
        // to make sure
        view.scrollTop = view.scrollTop + 100;
    }
    componentDidMount() {
        /*
        this.source = new EventSource(this.props.url);
        const { matching } = this.props.config;
        this.source.addEventListener('message', e => {
            const newEvent = createEvent(e, matching);
            this.setState({
                events: [...this.state.events, newEvent]
            });
        });*/
        /*
        Events.scrollEvent.register('begin', function (to, element) {
            console.log('begin', arguments);
        });

        Events.scrollEvent.register('end', function (to, element) {
            console.log('end', arguments);
        });*/
    }
    componentWillUnmount() {
        /*this.source.close()*/
    }
    render() {
        // const { mapping } = this.props.config;

        let mapping = [{
            type: 'str',
            path: 'message',
            label: 'Message'
        }];

        const defaultColumn = 'message';
        let headerRows;
        let rows = [];

        if (mapping && mapping.length) {
            headerRows = (
                <tr className='react-log-stream__header-row'>
                    {mapping.map(field => (
                        <th className='react-log-stream__header-row__cell' key={field.label}>{field.label}</th>
                    ))}
                </tr>
            )
            rows = (
                this.state.events.map((event, index) => (
                    <tr
                        style={(event.match) ? { backgroundColor: event.match.bgColorOnMatch } : {}}
                        className={'react-log-stream__row ' + (index % 2 === 0 ? 'react-log-stream__row--even' : 'react-log-stream__row--odd')}
                        key={event.time}
                    >
                        {mapping.map(field => (
                            <td className='react-log-stream__row__cell' key={field.label}>
                                <span style={{ color: event.data.color }}>
                                    {getFieldValue(event.data, field)}
                                </span>
                            </td>
                        ))}
                    </tr>
                ))
            )
        } else {
            headerRows = (
                <tr className='react-log-stream__header-row'>
                    <th className='react-log-stream__header-row__cell'>{defaultColumn}</th>
                </tr>
            )

            rows = (
                this.state.events.map((event, index) => (
                    <tr
                        className={'react-log-stream__row ' + (index % 2 === 0 ? 'react-log-stream__row--even' : 'react-log-stream__row--odd')}
                        key={event.time}
                    >
                        <td className='react-log-stream__row__cell'> <span style={{ color: event.data.color }}> {event.source}</span></td>
                    </tr>
                ))
            )
        }
        // console.log('render events ', this.state.events);
        return (
            <div ref={(ref) => this.view = ref} id='logStream'>
                <table className='react-log-stream'>
                    <thead>
                        {rows.length ? headerRows : null}
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
                <div id='logStreamLast' />
            </div>
        );
    }
}
