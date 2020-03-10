import { IconButton, ListItem, ListItemSecondaryAction } from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox';
import ListItemText from '@material-ui/core/ListItemText';
import AddIcon from '@material-ui/icons/AddCircle';
import RemoveIcon from '@material-ui/icons/DeleteForeverRounded';
import SettingsIcon from '@material-ui/icons/Settings';
import * as React from "react";
import { FilterLabelMap } from '../../../shared';
import { capitalize } from '../../../shared/Formatter';
import gray from '@material-ui/core/colors/grey';
export class FilterProp extends React.PureComponent<any, any> {
    render() {
        const { prop, secondary, showEnable, handler, showDelete, showEdit, itemProps, filter } = this.props;
        return <ListItem {...itemProps} key={prop} button onClick={() => handler.onClick(prop)}>
            {/**
                showEnable ? <Checkbox
                    checked={filter.visible}
                    tabIndex={-1}
                    disableRipple
                /> : ''
            **/}
            <ListItemText secondary={secondary} primary={capitalize(FilterLabelMap[prop] || prop)} />
            <ListItemSecondaryAction>

                {
                    showEdit ? <IconButton onClick={() => handler.onFilterEdit(prop, filter)}>
                        <SettingsIcon fontSize={'small'} />
                    </IconButton> :
                        <IconButton>
                            <AddIcon fontSize={'small'} />
                        </IconButton>
                }
                {
                    showDelete ? <IconButton onClick={() => handler.onFilterDelete(prop, filter)}>
                        <RemoveIcon fontSize={'small'} />
                    </IconButton> : ''
                }
            </ListItemSecondaryAction>
        </ListItem>;
    }
}