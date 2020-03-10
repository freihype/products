import * as lodash from 'lodash';
import * as React from 'react';
import { HTMLWidget } from '../..';
import { PropertiesComponent } from '../../../components/Properties';
import { RESOURCE_VARIABLES } from '../../../config';
import { Handle, destroy } from '../../../shared/Evented';
import { IContentHandler } from '../../../types';
import { EditorContext } from '../../EditorContext';
import { EVENTS } from '../../types';
import { WidgetPalette } from '../Palette/WidgetPalette';
import { HTMLFile } from '../html/HTMLFile';
import { Metadata } from '../metadata';
import { Frame } from './Frame';
import { WidgetToProperties, createHandler } from './WidgetProperties';
import './index.scss';
import { WidgetCommandBar, IWidgetCommand } from '../CommandBar/WidgetCommandBar';
import { v4 } from 'uuid';
import { DeleteCommand } from '../../commands';

const map = {
    // tslint:disable-next-line:object-literal-key-quotes
    'delete': DeleteCommand
}

export const runAction = (_command: string, context: EditorContext) => {

    if (_command === 'undo') {
        return context.getCommandStack().undo();
    }

    const selection = context.getSelection();
    const commandType = map[_command];
    if (!commandType) {
        console.error('unknown command ' + _command);
        return false;
    }

    return selection.map((w) => {
        const cmd = new commandType(w);
        return context.getCommandStack().execute(cmd);
    })

}
