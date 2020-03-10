import { Divider, Icon, IconButton, InputBase, ListItemSecondaryAction } from '@material-ui/core';
import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import Paper from '@material-ui/core/Paper';
import LinkIcon from '@material-ui/icons/Link';
import * as React from 'react';
import { parse } from 'url';
import { eventAt, ISessionEvents, visibleEvents } from '../../../shared';
import { withMediaProps } from '../Player2/decorators/with-media-props';
import { capitalize } from '../../../shared/Formatter';
import { getConfig } from '../../config';
let renderer;
const fa = require('@fortawesome/fontawesome-free/js/all');

type SessionEventProps = {
    events: ISessionEvents;
    player: any;
    currentEvent: any;
    owner: any
}
const secondary = (event) => {
    switch (event.type) {
        case 'view': {
            return url(event.payload.url)
        }
        case 'input': {
            let str: string = (event.payload.value || '');
            if (str.length > 30) {
                str = str.substring(0, 30) + ' ...';
            }
            return str;
        }
        case 'click': {
            let str: string = (event.payload.name || event.payload.sel || '');
            if (str.length > 30) {
                str = str.substring(0, 30) + ' ...';
            }
            return str;
        }
        case 'error': {
            return event.payload.info.message
        }
        default: return ''
    }
}
const url = (url) => {
    url = url.replace(getConfig('root', ''), '');
    return parse(url).pathname;
}
const domain = (url) => parse(url).hostname;
const map = (event, current) => {
    return {
        label: capitalize(event.type),
        time: event.time,
        type: event.type,
        secondary: `${secondary(event)}`,
        selected: event.time === current.time,
        event: event
    }
}
const iconMap = {
    move: 'fa-play',
    click: 'fa fa-mouse-pointer',
    input: 'fa fa-edit',
    view: 'fa fa-desktop',
    error: 'fa fa-error'
}
const colorMap = {
    view: 'primary',
    // click: 'action',
    input: 'action',
    error: 'secondary'
}
const icon = (type: string) => iconMap[type]
class ListView2 extends React.Component<any, any> {
    list: any;
    render() {
        const { currentEvent, events, start, player } = this.props;
        const chipData = [
            { key: 0, label: 'Mouse' },
            { key: 1, label: 'Error' },
            { key: 2, label: 'View' },
            { key: 3, label: 'Input' },
            { key: 4, label: 'Network' },
            { key: 5, label: 'Tags' }
        ]
        function handleDelete() {
            alert('You clicked the delete icon.'); // eslint-disable-line no-alert
        }

        function handleClick() {
            alert('You clicked the Chip.'); // eslint-disable-line no-alert
        }
        return <div>
            <InputBase
                style={{ padding: '0px 22px' }}
                placeholder="Search…"
                classes={{}}
            />
            <Divider />
            <Paper style={{
                display: 'flex',
                justifyContent: 'left',
                flexWrap: 'wrap',
                padding: '8px'
            }}>
                {chipData.map(data => {
                    let icon = null;
                    return (
                        <Chip variant={'outlined'}
                            color={'default'}
                            key={data.key}
                            icon={icon}

                            label={data.label}
                            style={{
                                margin: 2 / 2,
                                fontSize: 12
                            }}
                            onClick={handleClick}
                            onDelete={handleDelete}
                        />
                    );
                })}
            </Paper>
            <Divider />

            <List style={{ width: '100%', maxHeight: '400px', overflow: 'auto' }}>{
                events.map((e) =>
                    <ListItemImpl
                        key={e.time}
                        event={map(e, currentEvent)}
                        handler={() => {
                            player.seekTo(((e.time + 20) - start) / 1000);
                            player.play();
                        }
                        }
                    />
                )
            }
            </List>
        </div >
    }
}


class ListView extends React.Component<any, any> {
    list: any;
    render() {
        const { currentEvent, events, start, player, owner } = this.props;
        const chipData = [
            { key: 0, label: 'Mouse' },
            { key: 1, label: 'Error' },
            { key: 2, label: 'View' },
            { key: 3, label: 'Input' },
            { key: 4, label: 'Network' },
            { key: 5, label: 'Tags' }
        ]
        function handleDelete() {
            alert('You clicked the delete icon.'); // eslint-disable-line no-alert
        }

        function handleClick() {
            alert('You clicked the Chip.'); // eslint-disable-line no-alert
        }
        return <List dense={true} style={{ width: '100%', maxHeight: '400px', overflow: 'auto' }}>{
            events.map((e) =>
                <ListItemImpl
                    key={e.time}
                    event={map(e, currentEvent)}
                    handler={() => {
                        const time = (e.time - start) / 1000;
                        // console.log('s', time);
                        player.seekTo(time);
                        owner.currentEvent = null;
                        // owner.onTime(e.time - start - 20);
                        /*
                        player.player.play();
                        setTimeout(() => {
                            player.player.pause();
                        });*/
                    }
                    }
                />
            )
        }
        </List>;
    }
}
class ListItemImpl extends React.Component<any, any> {
    list: any;
    render() {
        const { event, handler } = this.props;
        return <div ref={(ref) => event.selected}>
            <ListItem
                autoFocus={true}
                focusRipple={true}
                focusVisibleClassName={'.focusedListItem'}
                key={'_eventItem' + event.time} button selected={event.selected} onClick={handler}>
                <ListItemAvatar>
                    <Avatar style={{ height: 28, width: 28, backgroundColor: 'white' }}>
                        <Icon style={{ fontSize: 12 }} className={icon(event.type)} color={colorMap[event.type] || 'inherit'} />
                    </Avatar>
                </ListItemAvatar>
                <ListItemText
                    primary={event.label}
                    secondary={event.secondary}
                >
                </ListItemText>
                {
                    event.type === 'view' ?
                        <ListItemSecondaryAction>
                            <IconButton onClick={(e) => {
                                window.open(event.event.payload.url)
                            }}>
                                <LinkIcon />
                            </IconButton>
                        </ListItemSecondaryAction> : <div></div>
                }
            </ListItem>
        </div >
    }
}
export class SessionEventsImpl extends React.Component<SessionEventProps, SessionEventProps> {
    currentEvent: any;
    state = {
        events: {
            events: [],
            owner: null,
            end: 0,
            id: 0,
            start: 0,
            visitID: ''
        } as ISessionEvents,
        player: null,
        currentEvent: null,
        owner: null
    }
    view: ListView;
    _player: any;
    componentWillUnmount() {
        this._player = null;
    }
    onTime(time) {
        let next: any = this.getCurrentEvent(time);
        if (next) {
            // tslint:disable-next-line:triple-equals
            if (this.currentEvent != next) {
                // console.log('next at ' + time, next);
                this.currentEvent = next;
                this.setState({
                    currentEvent: this.currentEvent,
                    events: this.props.events
                })
                if (this.props.owner && this.currentEvent.type === 'view') {
                    this.props.owner.setState({
                        toolbarTitle: domain(this.currentEvent.payload.url) + url(this.currentEvent.payload.url)
                    })
                }
            }
        }
    }
    setup(player) {
        player = player.player;
        // tslint:disable-next-line:triple-equals
        if (this._player == player) {
            return;
        }
        this._player = player;
        const renderer = player.renderer;
        renderer.addListener('time', this.onTime.bind(this));
    }

    getCurrentEvent(now) {
        return eventAt(now, visibleEvents(this.props.events.events), 1000)
    }

    render() {
        const data = this.props.events as any;
        const { player } = this.props;
        if (player) {
            renderer = player.player.renderer;
            this.setup(player);
        }
        return data && data.events ? <ListView
            currentEvent={this.state.currentEvent || {}}
            owner={this}
            events={visibleEvents(data.events).map((e) => e)} start={data.start} player={player}></ListView>
            : <div></div >;

    }
}
export const SessionEvents = withMediaProps(SessionEventsImpl);
