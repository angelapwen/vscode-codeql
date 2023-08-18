import * as React from "react";
import { styled } from "styled-components";

type Size = "x-small" | "small" | "medium" | "large" | "x-large";

const StyledButton = styled.button<{ size: Size }>`
  background: none;
  color: var(--vscode-textLink-foreground);
  border: none;
  cursor: pointer;
  font-size: ${(props) => props.size ?? "1em"};
  padding: 0;
`;

const TextButton = ({
  size,
  onClick,
  children,
}: {
  size?: Size;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) => (
  <StyledButton size={size} onClick={onClick}>
    {children}
  </StyledButton>
);

export default TextButton;
