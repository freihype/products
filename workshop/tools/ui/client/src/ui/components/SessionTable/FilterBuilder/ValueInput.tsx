import * as React from "react";
import FormControl from "@material-ui/core/FormControl";
import TextField from "@material-ui/core/TextField";
const DateFnsUtils = require('@date-io/date-fns').default;

import { MuiPickersUtilsProvider } from 'material-ui-pickers';
import { TimePicker } from "material-ui-pickers";
import { DatePicker } from "material-ui-pickers";
import { DateTimePicker } from "material-ui-pickers";
import Checkbox from "@material-ui/core/Checkbox";
import ArrowForward from "@material-ui/icons/ArrowForward";
import ArrowBack from "@material-ui/icons/ArrowBack";
import { Value2SQLValue } from "./Value2SQLValue";
import { MenuItem, withStyles, Paper, Popper } from "@material-ui/core";
import * as Autosuggest from 'react-autosuggest';
const match = require('autosuggest-highlight/match');
const parse = require('autosuggest-highlight/parse');

function renderInputComponent(inputProps) {
  const { classes, inputRef = () => { }, ref, ...other } = inputProps;

  return (
    <TextField
      fullWidth
      InputProps={{
        inputRef: node => {
          ref(node);
          inputRef(node);
        },
        classes: {
          input: classes.input,
        },
      }}
      {...other}
    />
  );
}

function renderSuggestion(suggestion, { query, isHighlighted }) {
  const matches = match(suggestion.label, query);
  const parts = parse(suggestion.label, matches);

  return (
    <MenuItem selected={isHighlighted} component="div">
      <div>
        {parts.map((part, index) => {
          return part.highlight ? (
            <span key={String(index)} style={{ fontWeight: 500 }}>
              {part.text}
            </span>
          ) : (
              <strong key={String(index)} style={{ fontWeight: 300 }}>
                {part.text}
              </strong>
            );
        })}
      </div>
    </MenuItem>
  );
}

function getSuggestions(options, value) {
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
}

function getSuggestionValue(suggestion) {
  return suggestion.label;
}

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  container: {
    position: 'relative',
    fontSize: '14px'
  },
  suggestionsContainerOpen: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing.unit,
    left: 0,
    right: 0,
  },
  formControl: {
    fontSize: '14px'
  },
  suggestion: {
    display: 'block',
  },
  suggestionsList: {
    margin: 0,
    padding: 0,
    listStyleType: 'none',
  }
});

class IntegrationAutosuggest extends React.Component<any, any> {
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
  popperNode: any;

  render() {
    const { classes } = this.props;

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
          {...autosuggestProps}
          shouldRenderSuggestions={(val) => { return true; }}
          inputProps={{
            classes,
            placeholder: '',
            value: this.state.single,
            onChange: this.handleChange('single'),
          }}
          theme={{
            container: classes.container,
            suggestionsContainerOpen: classes.suggestionsContainerOpen,
            suggestionsList: classes.suggestionsList,
            suggestion: classes.suggestion
          }}
          renderSuggestionsContainer={options => (
            <Paper {...options.containerProps} square>
              {options.children}
            </Paper>
          )}
        />
      </div>
    );
  }
}


const IntegrationAutosuggestC = withStyles(styles as any)(IntegrationAutosuggest);


const toSuggestions = (options: any[]) => {
  return options.map((o) => {
    return {
      label: o
    }
  })
}

export class ValueInput extends React.Component<any, any> {
  state: any = {

  }
  render() {
    const props = this.props;
    let { classes, defaultValue, prop, values, value, conditionColumn, conditionColumnIndex, handleChange } = this.props;
    switch (this.props.type) {
      case "date":
        return (
          <FormControl className={classes.formControl} >
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <DateTimePicker
                ampm={false}
                error={!(value && value)}
                autoOk={true}
                value={this.state.value || defaultValue}
                rightArrowIcon={< ArrowForward />}
                leftArrowIcon={< ArrowBack />}
                onChange={e => {
                  handleChange(e);
                  this.setState({ value: e });
                }
                }
              />
            </MuiPickersUtilsProvider>
          </FormControl>
        );
      case "time":
        return (
          <FormControl className={classes.formControl} >
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <TimePicker
                ampm={false}
                error={!(value)}
                autoOk={true}
                seconds
                format="mm:ss"
                value={this.state.value || defaultValue}
                onChange={(e: Date) => {
                  handleChange(e);
                  this.setState({ value: e });
                }}
              />
            </MuiPickersUtilsProvider>
          </FormControl>
        );
      case "number":
        return (
          <FormControl className={classes.formControl} >
            <TextField
              id="standard-dense"
              type={"number"}
              className={classes.textField}
              variant="outlined"
              label="Insert value"
              error={!(value)}
              defaultValue={defaultValue || 0}
              onChange={e =>
                handleChange(e.target.value)
              }
            />
          </FormControl>
        );
      case "boolean":
        return (
          <FormControl className={classes.formControl} >
            <Checkbox
              onChange={e =>
                handleChange(
                  conditionColumn,
                  conditionColumnIndex,
                  e.target.checked,
                  "value",
                  Value2SQLValue.get(props.type)(e.target.checked)
                )
              }
              checked={value ? value.value : ""}
            />
          </FormControl>
        );
      default: {
        const options = values[prop];
        if (options && options.length) {
          const suggestions = toSuggestions(options);
          return <FormControl className={classes.formControl} >
            <IntegrationAutosuggestC value={defaultValue || ''} onChange={(e) => { handleChange(e) }} options={suggestions} />
          </FormControl>
        }
        return (
          <FormControl className={classes.formControl} >
            <TextField
              id="standard-dense"
              className={classes.textField}
              error={!(value)}
              defaultValue={defaultValue ? defaultValue : ""}
              onChange={e =>
                handleChange(e.target.value)
              }
            />
          </FormControl>
        );
      }
    }
  }
}
