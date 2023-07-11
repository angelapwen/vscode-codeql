import * as React from "react";
import { ChangeEvent } from "react";
import styled from "styled-components";

const StyledDropdown = styled.select`
  width: 100%;
  height: calc(var(--input-height) * 1px);
  background: var(--vscode-dropdown-background);
  color: var(--vscode-foreground);
  border: none;
  padding: 2px 6px 2px 8px;
`;

type Props = {
  value: string | undefined;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
};

/**
 * A dropdown implementation styled to look like `VSCodeDropdown`.
 *
 * The reason for doing this is that `VSCodeDropdown` doesn't handle fitting into
 * available space and truncating content, and this leads to breaking the
 * `VSCodeDataGrid` layout. This version using `select` directly will truncate the
 * content as necessary and fit into whatever space is available.
 * See https://github.com/github/vscode-codeql/pull/2582#issuecomment-1622164429
 * for more info on the problem and other potential solutions.
 */
export function Dropdown({ value, options, disabled, onChange }: Props) {
  return (
    <StyledDropdown
      value={disabled ? undefined : value}
      disabled={disabled}
      onChange={onChange}
    >
      {!disabled && (
        <>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </>
      )}
    </StyledDropdown>
  );
}