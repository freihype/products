import { Grid, IconButton, MenuItem, Paper, withStyles } from "@material-ui/core";
import Divider from '@material-ui/core/Divider';
import TextField from "@material-ui/core/TextField";
import CancelIcon from '@material-ui/icons/CancelRounded';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import * as React from "react";
import * as Autosuggest from 'react-autosuggest';
import { FilterGroups, FilterLabelMap } from "../../../shared";
import { capitalize } from '../../../shared/Formatter';
const match = require('autosuggest-highlight/match');
const parse = require('autosuggest-highlight/parse');

function renderInputComponent(inputProps) {
  const { classes, onClear, value, inputRef = () => { }, ref, ...other } = inputProps;
  return (
    <Paper className={classes.root} elevation={1}>
      <IconButton className={classes.iconButton} aria-label="Menu">
        <MenuIcon />
      </IconButton>
      <TextField
        InputProps={{
          autoFocus: false,
          disableUnderline: true,
          inputRef: node => {
            ref(node);
            inputRef(node);
          },
          classes: {
            input: classes.input,
          },
          value: value
        }}
        {...other} className={classes.input} placeholder="Search Sessions ..." />
      <IconButton className={classes.iconButton} aria-label="Search">
        <SearchIcon />
      </IconButton>
      {value ? <Divider className={classes.divider} /> <IconButton onClick={onClear} color="primary" className={classes.iconButton} aria-label="Directions">
        <CancelIcon />
      </IconButton> : ''
      }
    </Paper>
  );
}
// const InputSearch = withStyles(input_styles)(renderInputComponent2);

function renderSuggestion(suggestion, { query, isHighlighted }) {
  // return (<Typography>{suggestion}</Typography>);
  const matches = match(suggestion.label, query);
  const parts = parse(suggestion.label, matches);

  return (
    <MenuItem style={{ padding: '0px' }} disableGutters={true} selected={isHighlighted} component={'div'}>
      <ul>
        <li>
          {parts.map((part, index) => {
            return part.highlight ? (
              <span key={String(index)} style={{ fontWeight: 300 }}>
                {capitalize(part.text)}
              </span>
            ) : (
                <strong key={String(index)} style={{ fontWeight: 200 }}>
                  {capitalize(part.text)}
                </strong>
              );
          })}
        </li>
      </ul>
    </MenuItem>
  );
}
function escapeRegexCharacters(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function getSuggestions(options, value) {

  const escapedValue = escapeRegexCharacters(value.trim());

  if (escapedValue === '') {
    return options;
  }

  const regex = new RegExp('^' + escapedValue, 'i');

  return options
    .map(section => {
      return {
        label: section.label,
        filters: section.filters.filter(language => regex.test(language.label))
      };
    })
    .filter(section => section.filters.length > 0);
  /*
  const inputValue = value.trim().toLowerCase();
  const inputLength = inputValue.length;
  let count = 0;

  return inputLength === 0
    ? options
    : options.filter(suggestion => {
      const keep =
        count < 5 && suggestion.label.slice(0, inputLength).toLowerCase() === inputValue;

      if (keep) {
        count += 1;
      }

      return keep;
    });
    */
}
function renderSectionTitle(section) {
  return (
    <MenuItem ><strong>{section.label}</strong></MenuItem>
  );
}
const renderSuggestionsContainer = ({ containerProps, children, query }) => {
  if (!children || !children.length) {
    return <div></div>;
  }
  return <Paper {...containerProps} style={{ padding: 16 }}>
    <Grid
      container
      spacing={16}
      direction="row"
      alignItems="flex-start"
      justify="flex-start"
      style={{ display: 'flex' }}>
      {
        (children || []).map((c, i) => {
          if (i % 3) {
            return (
              <Grid key={'grid_spa' + i} className={''} item xs={'auto'}>
                {c}
              </Grid>
            );
          }
          return (
            <Grid key={'grid_spa' + i} className={''} item xs={'auto'}>
              {c}
            </Grid>);
        })
      }
    </Grid>
  </Paper>
}
function getSectionSuggestions(section) {
  return section.filters;
}
function getSuggestionValue(suggestion) {
  return suggestion.label;
}

const styles = theme => ({
  root2: {
    flexGrow: 1,
  },
  container: {
    position: 'relative',
  },
  suggestionsContainerOpen: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing.unit,
    left: 0,
    right: 0,
  },
  suggestion: {
    display: 'block',
  },
  suggestionsList: {
    margin: 0,
    padding: 0,
    listStyleType: 'none',
  },
  root: {
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    width: 400
  },
  input: {
    marginLeft: 8,
    flex: 1,
  },
  iconButton: {
    padding: 10,
  },
  divider: {
    width: 1,
    height: 28,
    margin: 4,
  },
});

class SessionSearchC extends React.Component<any, any> {
  constructor(args) {
    super(args);
    this.state.single = args.value;
  }
  state = {
    single: '',
    popper: '',
    suggestions: [],
  };

  handleSuggestionsFetchRequested = ({ value }) => {
    this.setState({
      suggestions: getSuggestions(this.props.options, value),
    });
  };

  handleSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  handleChange = name => (event, { newValue }) => {
    this.setState({
      [name]: newValue,
    });
    this.props.onChange(newValue);
  };
  render() {
    const { classes, onSuggestion, onClear, defaultValue } = this.props;
    const autosuggestProps = {
      renderInputComponent,
      suggestions: this.state.suggestions,
      onSuggestionsFetchRequested: this.handleSuggestionsFetchRequested,
      onSuggestionsClearRequested: this.handleSuggestionsClearRequested,
      getSuggestionValue,
      renderSuggestion
    };

    return (
      <div className={classes.root}>
        <Autosuggest
          multiSection={true}
          renderSectionTitle={renderSectionTitle}
          {...autosuggestProps}
          shouldRenderSuggestions={(val) => { return val.length === 0; }}
          alwaysRenderSuggestions={false}
          getSectionSuggestions={getSectionSuggestions}
          renderSuggestionsContainer={renderSuggestionsContainer}
          onSuggestionSelected={(event, data) => {
            console.log('on render suggestion', data);
            onSuggestion(data.suggestion);
            this.setState({
              single: `Active filter (${data.suggestion.label})`
            })
          }}
          inputProps={{
            classes,
            placeholder: '',
            value: defaultValue || this.state.single,
            onChange: this.handleChange('single'),
            onClear: () => {
              this.setState({ single: '' });
              onClear();
            }
          }}
          theme={{
            container: classes.container,
            suggestionsContainerOpen: classes.suggestionsContainerOpen,
            suggestionsList: classes.suggestionsList,
            suggestion: classes.suggestion
          }}
        />
      </div>
    );
  }
}


const SessionSearch = withStyles(styles as any)(SessionSearchC);


const suggestedFilters = () => {
  return FilterGroups.map((g) => {
    return {
      label: g.label,
      filters: g.items.map((f) => {
        return {
          label: FilterLabelMap[f] || f,
          value: f
        }
      })
    }
  })
}


export class SessionSearchInput extends React.Component<any, any> {
  constructor(args) {
    super(args)
    this.state = {
      value: args.value || ''
    }
  }
  render() {
    let {defaultValue } = this.props;
    let { value } = this.state;
    const suggestions = suggestedFilters();
    return <SessionSearch
      value={value || ''}
      defaultValue={defaultValue}
      onSuggestion={(suggestion) => {
        this.props.onSuggestion(suggestion);
      }}
      onClear={this.props.onClear}
      onChange={(e) => {
        this.setState({
          value: e
        })
        this.props.onChange(e);
      }}
      options={suggestions} />
  }
}
