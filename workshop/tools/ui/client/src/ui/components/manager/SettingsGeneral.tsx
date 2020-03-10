import { Icon, IconButton, ListItemSecondaryAction, withStyles, Divider } from '@material-ui/core';
import Avatar from '@material-ui/core/Avatar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import LinkIcon from '@material-ui/icons/Link';
import * as React from 'react';
import { parse } from 'url';
import { capitalize } from '../../../shared/Formatter';
import { getConfig } from '../../config';
import { Toggle } from './Toggle';
import { Text } from './Input';


const styles = theme => {
    return {
        field: {
            padding: theme.spacing.unit * 3,
            margin: theme.spacing.unit * 3
        },
        ListItem: {
            padding: 8
        },
        content: {
            display: 'flex',
            flexWrap: 'wrap'
        },
        textField: {
            marginLeft: theme.spacing.unit,
            marginRight: theme.spacing.unit,
            width: 200,
        }
    }
};


type SessionEventProps = {
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

class ListView extends React.Component<any, any> {
    list: any;
    render() {
        const { currentEvent, events } = this.props;

        return <List dense={true} style={{ width: '100%', maxHeight: '400px', overflow: 'auto' }}>{
            events.map((e) =>
                <ListItemImpl
                    key={e.time}
                    event={map(e, currentEvent)
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
        return <div ref={() => event.selected}>
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
                            <IconButton onClick={() => {
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
export class SettingsGeneralC extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            config: props.config
        }
    }

    view: ListView;
    onChange(name, value) {
        this.props.config[name] = value;
        console.log('changed : ' + name, value, this.props.config);
    }
    render() {
        const { classes } = this.props;
        const { config } = this.state;
        return <div className={classes.container}>
            <Toggle className={classes.field} owner={this} name={'enabled'} value={config.enabled} label={'Enable Recording'} />
            <Toggle className={classes.field} owner={this} name={'enabledMobile'} value={config.enabledMobile} label={'Enable Mobile Recording'} />
            <Text help={'The site`s main URL'} className={classes.textField} owner={this} name={'root'} value={config.root} label={'Site Root Url'} />

        </div>
    }
}
export const SettingsGeneral = (withStyles(styles as any, { withTheme: true })(SettingsGeneralC));
