import * as React from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import type { TextFieldProps } from '@mui/material/TextField';
import ClearIcon from '@mui/icons-material/Clear';

// we intentionally do not extend TextFieldProps directly because the
// library types are a bit too complex for our mutation. instead we
// create a wrapper that includes all of the usual props via
// intersection and then add our extras.
export type ClearableTextFieldProps = Omit<
  TextFieldProps,
  'value' | 'onChange' | 'InputProps'
> & {
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  InputProps?: TextFieldProps['InputProps'];
  clearable?: boolean;
  onClear?: () => void;
};

export default function ClearableTextField(props: ClearableTextFieldProps) {
  const {
    value,
    onChange,
    clearable = true,
    onClear,
    InputProps,
    ...rest
  } = props as ClearableTextFieldProps;

  const showClear =
    clearable &&
    value !== undefined &&
    value !== null &&
    String(value).length > 0;

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (onClear) {
      onClear();
    } else if (onChange) {
      // synthesize an input event
      const event = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
  };

  return (
    <TextField
      {...rest}
      variant={rest.variant ?? 'filled'}
      size={rest.size ?? 'small'}
      value={value}
      onChange={onChange}
      InputProps={{
        ...InputProps,
        endAdornment: showClear ? (
          <InputAdornment position="end">
            <IconButton size="small" edge="end" onClick={handleClear} aria-label="clear" title="Clear">
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : (
          InputProps?.endAdornment || null
        ),
      }}
    />
  );
}
