import * as React from "react";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import { operatorTypes } from "./Settings";
import { ValueInput } from "./ValueInput";
import { MenuItem } from "@material-ui/core";

function ConditionLine(props) {
  let { classes, condition, index, handleChange, columns } = props;
  return (
    <React.Fragment>
      <FormControl className={classes.formControl + ' formCntro'}>
        <Select

          error={!(condition.column && condition.column.header)}
          value={
            condition.column && condition.column.header
              ? condition.column.header
              : "None"
          }
          onChange={e =>
            handleChange(condition, index, e.target.value, "column")
          }
          inputProps={{
            name: "column",
            id: "column-select"
          }}
        >
          {columns
            .filter(c => c.isHidden === undefined || c.isHidden === true)
            .map(c => (
              <MenuItem value={c.header} key={c.accessor}>
                {c.header}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
      {condition.column ? (
        <FormControl className={classes.formControl}>
          <Select
            error={!(condition.operator && condition.operator.Label)}
            value={
              condition.operator && condition.operator.Label
                ? condition.operator.Label
                : "None"
            }
            onChange={e =>
              handleChange(condition, index, e.target.value, "operator")
            }
            inputProps={{
              name: "operator",
              id: "operator-select"
            }}
          >
            {condition.column && condition.column.dataType
              ? operatorTypes.get(condition.column.dataType).map(opt => (
                <MenuItem value={opt.Label} key={opt.Label}>
                  {opt.Label}
                </MenuItem>
              ))
              : null}
          </Select>
        </FormControl>
      ) : null}
      {condition.operator && condition.column.dataType ? (
        <ValueInput
          classes={classes}
          conditionColumn={condition}
          conditionColumnIndex={index}
          dataType={condition.column.dataType}
          handleChange={(
            selectedColumn,
            index,
            value,
            changeType,
            translateValue
          ) =>
            handleChange(
              selectedColumn,
              index,
              value,
              changeType,
              translateValue
            )
          }
        />
      ) : null}
    </React.Fragment>
  );
}

export default ConditionLine;
