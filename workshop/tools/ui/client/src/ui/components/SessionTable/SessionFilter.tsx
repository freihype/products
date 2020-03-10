import {
    Divider,
    Grid,
    Button,
    Drawer,
    IconButton,
    ListSubheader,
    Toolbar,
    Typography,
    withStyles,
    Theme,
    Icon
} from '@material-ui/core';
import List from '@material-ui/core/List';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import * as React from "react";
import { FilterGroups } from '../../../shared';
import { FilterProp } from './FilterProperty';
import { FilterSummary } from './FilterSummary';
import { SessionFiltersProperties } from './SessionFilterProperties';
import blue from '@material-ui/core/colors/blue';
import { Filter } from './types';
import ToggleButton from '@material-ui/lab/ToggleButton';
import { Navbar } from '../common/Navbar';

const drawerWidth = 400;

const styles = (theme: Theme) => {
    return {
        head: {
            ...theme.mixins.gutters(),
        },
        root: {
            width: '100%',
            backgroundColor: theme.palette.background.paper,
            padding: theme.spacing.unit * 2,
            margin: '0 auto'
        },
        nested: {
            paddingLeft: theme.spacing.unit * 4,
        },
        drawerPaper: {
            width: drawerWidth,
            ...theme.mixins.gutters()
        },
        button: {
            margin: theme.spacing.unit,
            color: blue[900]
        },
        grow: {
            flexGrow: 1,
        }
    }
};

const groupedLists = (classes, handler) => {
    return FilterGroups.map((g) => {
        return <div key={g.label + '_' + Date.now()}>
            <List
                dense={false}
                key={g.label + Date.now()}
                component="nav"
                subheader={<ListSubheader component="div">{g.label}</ListSubheader>}
                className={classes.root}>
                {
                    g.items.map((prop) => <FilterProp handler={handler} key={prop} prop={prop} />)
                }
            </List>
            <Divider key={g.label + '_div' + Date.now()} />
        </div >
    })
}

class FilterList extends React.PureComponent<any, any> {
    render() {
        const { handler, classes } = this.props;
        return groupedLists(classes, handler);
    }
}

export class SessionFiltersC extends React.
    Component<{
        values: any;
        handler: {
            onCreatedFilter: (prop: string, filter: Filter) => void;
            onRemovedFilter: (prop: string, filter: Filter) => void;
            applyFilters: () => void;
            onClose: () => void
        },
        classes: any;
        config: any;
        onFilterSticky: (sticky: boolean) => void;
        sticky: boolean;
    }, any> {
    sticky: boolean = false;
    constructor(args) {
        super(args);
        this.state = {
            open: args.selectedProp ? true : false,
            selected: args.selectedProp,
            status: 'create',
            filters: args.filters,
            showFilters: false,
            sticky: args.sticky
        }
        this.sticky = this.state.sticky;
    }
    toggleDrawer(open, selected?) {
        this.setState({
            open: open,
            selected: selected
        });
    };
    onClick(prop) {
        this.toggleDrawer(true, prop);
    }
    saveFilter(prop) {
        this.toggleDrawer(false, null);
    }
    onFilterChange(prop, op, value) {
        if (!this.state.filters[prop]) {
            this.state.filters[prop] = [];
        }
    }
    onFilterAdded(prop, filter) {
        this.setState({ open: false, showFilters: false });
        this.props.handler.onCreatedFilter(prop, filter);
    }
    onFilterCancel() {
        this.setState({ open: false });
    }
    onFilterDelete(prop, filter) {
        this.props.handler.onRemovedFilter(prop, filter);
    }
    onFilterEdit(prop, filter) {
        this.setState({ open: true, showFilters: false, selected: prop });
    }
    applyFilters() {
        this.props.handler.applyFilters();
        this.setState({
            open: false,
            selectedProp: null
        })
    }
    addNewFilter() {
        this.setState({ showFilters: true });
    }
    toggleSticky() {
        this.sticky = !this.state.sticky;
        // console.log('filter sticky : ', this.sticky);
        // this.setState({ sticky: this.sticky });
        this.props.onFilterSticky(this.sticky);
    }
    render() {
        const { classes, handler, config, sticky } = this.props;
        let { selected } = this.state;
        const selectedFilter = this.state.filters.find((f) => f.prop === selected) || { filter: { value: '' } };
        return <div className={classes.root}>
            <Drawer
                open={this.state.open}
                onClose={() => this.toggleDrawer(false, null)}
                className={classes.drawer + '2'}
                classes={{
                    // paper: classes.drawerPaper,
                }}
                anchor="right"
            >
                <div className={classes.toolbar} />
                <SessionFiltersProperties config={config} values={this.props.values} classes={classes} handler={this} filter={selectedFilter} value={selectedFilter.filter.value} prop={this.state.selected}></SessionFiltersProperties>
                <Divider />
            </Drawer>

            <Navbar title={'Add filter'} handler={{ onCancel: () => handler.onClose() }}>
                <ToggleButton value="true" onClick={() => this.toggleSticky()}>
                    <Icon style={{ fontSize: 16 }} className={'fa ' + (sticky ? 'fa-unlink' : 'fa-link')} color={'action'} />
                </ToggleButton>
            </Navbar>

            <Divider variant={'fullWidth'} />
            <FilterSummary handler={this} filters={[...this.state.filters]} />
            {
                !this.state.filters.length || this.state.showFilters ?
                    <FilterList classes={classes} handler={this} /> :

                    <Grid
                        container
                        spacing={0}
                        direction="column"
                        alignItems="center"
                        justify="center"
                        style={{}}
                    >
                        <Grid className={classes.gridItem} item xs={'auto'}>

                            <Button
                                key={'apply'}
                                onClick={() => { this.applyFilters() }}
                                size={"small"}
                                variant={'outlined'}
                                className={classes.button}>
                                Apply
                            </Button>
                            <Button
                                key={'saveAsBtn'}
                                onClick={() => { }}
                                size={"small"}
                                className={classes.button}
                                variant={'outlined'}>
                                Save as Segment
                                </Button>
                        </Grid>

                        <Grid className={classes.gridItem} item xs={'auto'}>
                            <Button
                                key={'addNewBtn'}
                                onClick={() => { this.addNewFilter() }}
                                size={"small"}
                                className={classes.button}
                                variant={'outlined'}>
                                Add new filter
                                </Button>

                        </Grid>
                    </Grid>
            }
        </div>
    }
}

export const SessionFilters = withStyles(styles)(SessionFiltersC);