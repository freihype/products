import { ListSubheader } from '@material-ui/core';
import List from '@material-ui/core/List';
import Paper from '@material-ui/core/Paper';
import * as React from "react";
import { FilterProp } from './FilterProperty';
import { Filter, PropertyFilter } from './types';
import { FilterValueFormatter, defaultMessages } from '../../../shared';


class FilterText extends React.PureComponent<any, any> {
    render() {
        const { filter, prop } = this.props;
        return <span key={'f_' + prop + filter.op} style={{ fontSize: 'smaller' }}>
            {
                filterText(prop, filter)
            }
            {
                filter.next ? filter.next.map((f, i) => {
                    return <span key={'d_' + i}><br /> {f.type.toUpperCase()} <br />
                        <FilterText prop={prop} filter={f}></FilterText></span>
                }) : ''
            }
        </span>
    }
}

const filterText = (prop, filter: Filter) => {
    let ret = ''
    if (prop in FilterValueFormatter) {
        ret = `${defaultMessages[filter.op]} ${FilterValueFormatter[prop](filter.value)}`
    } else {
        ret = `${defaultMessages[filter.op]} ${filter.value}`
    }
    return ret;
}

export class FilterSummary extends React.Component<{
    filters: PropertyFilter[];
    handler: any;
}, any> {

    render() {
        const { filters, handler } = this.props;
        if (!filters.length) {
            return <div></div>;
        }
        return <div className={'content'} style={{ padding: '8px' }}>
            <Paper elevation={2} style={{

            }}>
                <List dense={true}
                    component="nav"
                    subheader={<ListSubheader component="div">Selected Filters</ListSubheader>}>
                    {
                        filters.map((f) => {
                            return <FilterProp
                                handler={handler}
                                itemProps={{ disableGutters: false }}
                                showEnable={true}
                                showEdit={true}
                                showDelete={true}
                                key={f.prop}
                                filter={f.filter}
                                secondary={<FilterText filter={f.filter} prop={f.prop}></FilterText>}
                                prop={f.prop} />
                        })
                    }
                </List>
            </Paper>
        </div>
    }
}