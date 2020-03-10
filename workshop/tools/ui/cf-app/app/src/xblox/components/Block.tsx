import * as React from 'react';
import { Block } from '../../xblox';

// tslint:disable-next-line:no-var-requires
const FontAwesome = require('react-fontawesome');

export interface IBlockProperties {
    model: Block
    owner: any
}

export class BlockItem extends React.Component<IBlockProperties, IBlockProperties> {

    public text() {

    }

    public render() {

        // console.log('render block ', this.props.model.icon);
        const model = this.props.model;
        const icon = (model.icon || 'fa-info').
            replace('fa-', '').
            replace('text-success', '').
            replace('text-danger', '');

        const send = model['send'] || '';
        return (
            <div>
                <h3> <FontAwesome name={icon} /> {this.props.model.name}</h3>
                {send ? <span> Send: <span style={{ color: 'blue' }}>{send}</span> </span> : ''}
            </div>
        );
    }
}

export class BlockValue extends React.Component<IBlockProperties, IBlockProperties> {

    public text() {

    }

    public render() {
        const model = this.props.model;
        const icon = (model.icon || 'fa-info').
            replace('fa-', '').
            replace('text-success', '').
            replace('text-danger', '');

        const value = model['value'] || '';
        return (
            <div>
                {value ? <span> <span style={{ color: 'gray' }}>{value}</span> </span> : ''}
            </div>
        );
    }
}
