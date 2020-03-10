import { Icon, IconButton, ListItemSecondaryAction } from '@material-ui/core';
import Avatar from '@material-ui/core/Avatar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import DeleteIcon from '@material-ui/icons/Delete';
import * as React from 'react';
// import { parse } from 'url';
import { toMinutesString, formatDate } from '../../../shared';
import { SessionAPI } from './SessionAPI';
import { parse } from 'query-string';
import { replaceUrlParam } from '../../../lib/url';
type SessionListProps = {
    selected?: string;
    visitor?: string;
    onChange: (session: string) => void;
    onSessions: (sessions: []) => void;
};

const url = (url) => parse(url).hostname;
const map = (session, selected) => {
    return {
        label: url(session.referer),
        secondary: `Clicks: ${session.clicks} | Views: ${session.viewCount} | Errors: ${session.errors}`,
        selected: selected,
        session: session
    }
}
class ListView extends React.Component<any, any> {
    list: any;
    render() {
        const { currentSession, sessions, handler } = this.props;
        return <List dense={true}>{
            sessions.map((session) => {
                const ref = session.start + 'x' + session.end + 'x' + session.session;
                return <ListItemImpl
                    key={session.session}
                    session={map(session, currentSession === ref)}
                    handler={{
                        open: () => {
                            /*
                            const parsed = parse(location.hash);
                            // https://nowproject.eu:8081/#view=player&app=play&selected=1547290442924x1547290468991xHFJ6DNYPQIJOJCMIO5NH279X3E09GXMY&visitor=MXVGKCLFALTVXJSGDRWAIXGJBLFMZKVH
                            let str = "";
                            for (let key in parsed) {
                                if (str !== "") {
                                    str += "&";
                                }
                                if (parsed[key]) {
                                    if (key !== 'selected') {
                                        str += key + "=" + (parsed[key]);
                                    } else {
                                        str += key + "=" + ref;
                                    }
                                }
                            }

                            let href = '' + location.href;
                            href = '' + href.split('#')[0] + '#' + str;
                            */
                            location.href = replaceUrlParam('selected', ref);

                            // location.replace(('' + window.location).split('#')[0] + '#' + str);
                            /*
                            const newSrc = ref;
                            const newLink = queryStringUrlReplacement(location.href, 'selected', newSrc);
                            location.href = newLink;
                            */

                        },
                        remove: (session) => {
                            handler.removeSession(session.session)
                        }
                    }}
                />
            }
            )
        }
        </List>
    }
}
class ListItemDetail extends React.PureComponent<any, any> {
    render() {
        const { session } = this.props;
        // `Date: ${formatDate(session.start)} | Clicks: ${session.clicks} | Views: ${session.viewCount} | Errors: ${session.errors} | Duration: ${toMinutesString(session.start, session.end)}`,
        return <span>
            Clicks: ${session.clicks}
        </span>;
    }
}
class ListItemImpl extends React.Component<any, any> {
    list: any;
    render() {
        const { session, handler } = this.props;
        return <ListItem
            disableGutters={false}
            key={'_eventItem' + session.session} button selected={session.selected} onClick={(e) => handler.open(session.session)}>
            <ListItemAvatar>
                <Avatar style={{ height: 28, width: 28, backgroundColor: 'white' }}>
                    <Icon style={{ fontSize: 12 }} className={'fa fa-play'} color={'primary'} />
                </Avatar>
            </ListItemAvatar>



            <ListItemText
                disableTypography={false}
                primary={formatDate(session.start) + ' | ' + toMinutesString(session.session.start, session.session.end)}
                secondary={session.secondary}
            >

            </ListItemText>

            <ListItemSecondaryAction>
                <IconButton aria-label="Delete" onClick={(e) => {
                    handler.remove(session.session);
                }}>
                    <DeleteIcon />
                </IconButton>
            </ListItemSecondaryAction>
        </ListItem>
    }
}
export class SessionList extends React.Component<SessionListProps, {
    sessions: any[]
}> {
    public state = { sessions: [] }
    container: any;
    async init() {
        const sessions = await SessionAPI.sessions(this.props.visitor);
        this.setState({ sessions: sessions.sessions });
        this.props.onSessions(sessions);
    }
    async removeSession(session: string) {
        SessionAPI.removeSession(session);
        this.setState({ sessions: [] });
        setTimeout(() => {
            this.init();
        }, 100);

    }
    componentWillMount() {
        this.init();
    }
    render() {
        const { sessions } = this.state;
        return <div
            className="sessionList"
            ref={(ref) => this.container = ref} style={{ width: '100%' }} >
            <ListView handler={this} currentSession={this.props.selected} sessions={sessions} {...this.props} ></ListView>
        </div>;
    }
}