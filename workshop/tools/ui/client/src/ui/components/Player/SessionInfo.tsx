import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import * as React from 'react';
import { parse } from 'url';
import * as utils from '../../../shared/Events';
import moment = require('moment');
import { Divider, Icon, IconButton, InputBase, ListItemSecondaryAction } from '@material-ui/core';
const fa = require('@fortawesome/fontawesome-free/js/all');
type SessionListProps = {
    events: any;
};

const url = (url) => parse(url).hostname;
const map = (event) => {
    return {
        label: url(event.name),
        secondary: event.secondary
    }
}
function queryStringUrlReplacement(url, param, value) {
    let re = new RegExp("[\\?&]" + param + "=([^&#]*)"), match = re.exec(url), delimiter, newString;

    if (match === null) {
        // append new param
        let hasQuestionMark = /\?/.test(url);
        delimiter = hasQuestionMark ? "&" : "?";
        newString = url + delimiter + param + "=" + value;
    } else {
        delimiter = match[0].charAt(0);
        newString = url.replace(re, delimiter + param + "=" + value);
    }

    return newString;
}
class ListView extends React.Component<any, any> {
    list: any;
    render() {
        const { events } = this.props;
        return <List style={{ width: '100%' }} dense={true} disablePadding={true} color={'secondary'} >{
            events.map((event) =>
                <ListItemImpl event={event} key={event.name + Date.now()}
                />
            )
        }
        </List>
    }
}
class ListItemImpl extends React.Component<any, any> {
    list: any;
    render() {
        const { event } = this.props;
        return <ListItem
            disableGutters={false}
            key={'_eventItem' + event.name}>
            <ListItemText
                disableTypography={false}
                primary={event.name}
                style={{ fontWeight: 'bold' }}
            />
            <ListItemText style={{ textAlign: 'right' }}
                disableTypography={false}
                primary={event.secondary}
            >
            </ListItemText>
            {
                event.icon ? event.icon.indexOf('http') === -1 ?
                    <Icon style={{ fontSize: 12 }} className={'fab fa-' + event.icon} color={'secondary'} />
                    : <img style={{ width: 16 }} src={event.icon} />
                    : ''
            }
        </ListItem>
    }
}

export class SessionInfo extends React.Component<SessionListProps, {
    sessions: any[]
}> {
    public state = { sessions: [] }
    container: any;
    shouldComponentUpdate(nextProps, nextState) {
        // shouldComponentUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): boolean
        // tslint:disable-next-line:triple-equals
        return nextProps.events != this.props.events;
    }
    render() {
        let events = this.props.events.events || [];
        let tags = this.props.events.tags || {};
        const clicks = utils.filterByType('click', events).length;
        const views = utils.filterByType('view', events).length;
        const errors = utils.filterByType('error', events).length;
        const item = (label, secondary, icon?) => {
            return {
                name: label,
                secondary: secondary,
                icon: icon
            }
        }

        const agent = tags.agent || {};
        const location = tags.location || {
            country_name: 'unknown',
            continent_name: 'unknown',
            location: {
                country_flag: ''
            }
        };
        const browser: string = (agent.family || 'unknown');
        events = [
            item('Date', utils.formatDate(this.props.events.start)),
            item('User', tags.user || 'anonymous'),
            item('Location', location.country_name + ' (' + location.continent_name + ')', location.location.country_flag),
            item('IP', tags.ip),
            item('Browser', browser + (agent.mobile ? ' (Mobile)' : ''), browser.toLowerCase()),
            item('Duration', utils.toMinutesString(this.props.events.start, this.props.events.end)),
            item('Clicks', clicks),
            item('Views', views),
            item('Errors', errors),
            // item('Mouse travel', Math.round(utils.distanceMoves(events))),
            // item('Scroll travel', Math.round(utils.distanceScroll(events))),
            // item('Reading Time', '~10 seconds')
        ];
        return <div style={{ width: '100%', 'margin': '0 auto', display: 'flex' }}
            className="sessionList"
            ref={(ref) => this.container = ref}>
            <ListView
                handler={this} events={events}>
            </ListView>
        </div>;
    }
}