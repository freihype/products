import * as React from 'react';
import {
    GroupedList,
    IGroup
} from 'office-ui-fabric-react/lib/components/GroupedList/index';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { DetailsRow } from 'office-ui-fabric-react/lib/components/DetailsList/DetailsRow';
import {
    FocusZone
} from 'office-ui-fabric-react/lib/FocusZone';
import {
    Selection,
    SelectionMode,
    SelectionZone
} from 'office-ui-fabric-react/lib/utilities/selection/index';
import { IconButton, ActionButton } from 'office-ui-fabric-react/lib/Button';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

import { MessageBar, MessageBarType, IMessageBarProps } from 'office-ui-fabric-react/lib/MessageBar';
/** Message item */
export interface IServerMessageProps {
    event: string;
    error: number;
    data: any;
    detail: string;
}
const MessageComponent: React.SFC<IServerMessageProps> = (props) => (
    <MessageBar style={{ width: '100%' }}
        messageBarType={props.error ? MessageBarType.error : MessageBarType.info} >#{props.event} - Code : {props.data.code} , {props.data.description}
        <br /><span> {props.detail} </span>
    </MessageBar>
);

/** Messages view */
export interface IServerMessagesProps {
    messages: IServerMessageProps[]
}

export class ServerMessagesComponent extends React.Component<IServerMessagesProps, {}> {
    state: IServerMessagesProps = {
        messages: [
        ]
    }
    public render() {
        const messages = this.props.messages;
        return <div data-is-scrollable='true'>{
            messages.map((m, i) => {
                let description = '';
                if (m.data && m.data.device) {
                    description = m.data.device.protocol + '://' + m.data.device.host + ':' + m.data.device.port;
                }
                return <div key={i}>
                    <MessageComponent event={m.event} error={m.error} data={m.data} detail={description} />
                </div>
            })
        }
        </div>
    }
}
