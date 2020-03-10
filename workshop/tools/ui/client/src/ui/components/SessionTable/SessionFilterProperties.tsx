import { Button, Divider, FormControl, Grid, withStyles, TableHead, Theme, Paper } from '@material-ui/core';
import * as React from "react";
import { FilterTypeMap, defaultOperandsValue, defaultOperands, SessionValuesFilter, remove } from '../../../shared';
import { Navbar } from '../common/Navbar';
import { ValueInput } from './FilterBuilder/ValueInput';
import { NativeTypeFilter } from './Filters';
const drawerWidth = 300;

const styles = (theme: Theme) => ({
    head: {
        ...theme.mixins.gutters(),
    },
    formControl: {
        margin: theme.spacing.unit * 2,
        fontSize: theme.typography.pxToRem(10),
        padding: theme.spacing.unit * 4,
        width: '90%',
        marginBottom: 16
    },
    button: {
        margin: theme.spacing.unit
    },
    opPaper: {
        margin: theme.spacing.unit * 4,
    },
    buttonAdd: {
        margin: theme.spacing.unit,
        maxWidth: '50px',
        fontSize: theme.typography.pxToRem(10),
        color: theme.palette.primary.main,
        textAlign: 'center'
    },
    gridItem: {
        padding: theme.spacing.unit,
    },
    formControlInput: {
        padding: '4px'
    },
    grow: {
        flexGrow: 1,
    },
    root: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: theme.palette.background.paper
    },
    saveButton: {

    },
    nested: {
        paddingLeft: theme.spacing.unit * 4,
    },
    drawerPaper: {
        width: drawerWidth,
    },
});

class FilterComponent extends React.PureComponent<any, any> {
    render() {
        let { prop, value, selected, handler, config } = this.props;
        const type = FilterTypeMap[prop];
        switch (type) {
            case 'string':
            case 'time':
            case 'date':
            case 'array':
            case 'number': {
                return <NativeTypeFilter config={config} value={value} handleChange={handler} selected={selected} prop={prop} />
            }
        }
        return <div>Unkown type {type + ' @ ' + prop}</div >
    }
}
export class SessionFiltersPropsC extends React.Component<any, any> {
    constructor(args) {
        super(args);
        this.state = {
            open: false
        }
        if (!args.filter) {
            this.filter.op = defaultOperands[FilterTypeMap[args.prop]];
            this.filter.value = defaultOperandsValue[FilterTypeMap[args.prop]];
        } else {
            this.filter = args.filter.filter;
        }
        if (!this.filter.op) {
            this.filter.op = defaultOperands[FilterTypeMap[args.prop]];
        }
        if (!this.filter.value) {
            this.filter.value = defaultOperandsValue[FilterTypeMap[args.prop]];
        }
    }
    shouldComponentUpdate(nextProps, nextState) {
        // console.log('shouldComponentUpdate', nextProps, this);
        if (nextProps.filter !== this.filter) {
            return true;
        }
        return false;
    }
    filter: any = {}
    state: {
        open: false
    }
    toggleDrawer(open) {
        this.setState({
            open: open
        });
    };

    onClick(prop) {
        this.toggleDrawer(true);
    }
    add(type) {
        if (!this.filter.next) {
            this.filter.next = [];
        }
        this.filter.next.push(
            { ...this.filter, next: null, type }
        );
        this.setState({
            filter: this.filter
        })
    }
    remove(filter) {
        remove(this.filter.next, filter);
        this.setState({
            filter: this.filter
        })
    }
    render() {
        let { classes, value, prop, handler, values, config } = this.props;
        if (SessionValuesFilter[prop]) {
            values = SessionValuesFilter[prop](config, values);
        }
        // console.log('render filter props ' + prop, value, this.filter);
        return <div key={'FilterRoot'} className={classes.root}>
            <Navbar title={'Create filter'}
                handler={{ onCancel: () => handler.onFilterCancel() }} />
            <Grid
                container
                spacing={0}
                direction="column"
                alignItems="center"
                justify="center"
                style={{}}>
                <Grid className={classes.gridItem} item xs={'auto'}>

                    <Divider variant={'fullWidth'} />
                    <Paper className={classes.opPaper} elevation={1}>
                        <FilterComponent prop={prop}
                            value={value}
                            selected={this.filter.op}
                            handler={(op) => { this.filter.op = op }}
                            config={this.props.config} />

                        <ValueInput
                            prop={prop}
                            values={values}
                            defaultValue={value || defaultOperandsValue[FilterTypeMap[prop]]}
                            handleChange={(value) => { this.filter.value = value }}
                            classes={classes} type={FilterTypeMap[prop]} />
                    </Paper>
                    {
                        this.filter.next ?
                            this.filter.next.map((filter, i) => {
                                // console.log('render filter : ', filter);
                                return <Paper className={classes.opPaper} elevation={1} key={'and_' + i}>

                                    <Button
                                        className={classes.buttonAdd}
                                        key={'andBtn'}
                                        onClick={() => { this.remove(filter) }}
                                        size={"small"}
                                        variant={'text'}>
                                        {filter.type}
                                    </Button>

                                    <FilterComponent
                                        prop={prop}
                                        selected={filter.op}
                                        handler={(op) => { filter.op = op }}
                                        config={this.props.config} />

                                    <ValueInput
                                        prop={prop}
                                        values={values}
                                        defaultValue={filter.value || defaultOperandsValue[FilterTypeMap[prop]]}
                                        handleChange={(value) => { filter.value = value }}
                                        classes={classes} type={FilterTypeMap[prop]} />
                                </Paper>
                            })
                            : ''
                    }

                    <FormControl className={classes.formControl} style={{ width: '100%' }}>
                        <Button
                            className={classes.buttonAdd}
                            key={'andBtn'}
                            onClick={() => { this.add('and') }}
                            size={"small"}
                            variant={'outlined'}>
                            AND
                        </Button>

                        <Button
                            className={classes.buttonAdd}
                            key={'orBtn'}
                            onClick={() => { this.add('or') }}
                            size={"small"}
                            variant={'outlined'}>
                            OR
                        </Button>

                    </FormControl>

                    <FormControl className={classes.formControl} style={{ width: '100%' }}>
                        <Button
                            color={'secondary'}
                            key={'saveBtn'}
                            onClick={() => handler.onFilterAdded(prop, this.filter)}
                            size={"small"}
                            variant={'outlined'}
                            className={classes.button}>
                            Save
                        </Button>
                        <Button
                            className={classes.button}
                            key={'cancelBtn'}
                            onClick={() => handler.onFilterCancel()}
                            size={"small"}
                            variant={'outlined'}>
                            Cancel
                        </Button>

                    </FormControl>
                </Grid>
            </Grid>
        </div>
    }
}

export const SessionFiltersProperties = withStyles(styles as any)(SessionFiltersPropsC);