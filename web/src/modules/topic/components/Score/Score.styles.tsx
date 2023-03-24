import styled from "@emotion/styled";
import { Button, Popper, css } from "@mui/material";

interface StyledButtonProps {
  buttonLength: number;
  fontScaler?: number;
}

// seems like MUI automatically forwards invalid props to underlying HTML components?
// this seems wrong, or at least that it shouldn't be the default
const buttonOptions = {
  shouldForwardProp: (prop: string) => !["buttonLength", "fontScaler"].includes(prop),
};
export const StyledButton = styled(Button, buttonOptions)<StyledButtonProps>`
  height: ${({ buttonLength }) => `${buttonLength}px`};
  width: ${({ buttonLength }) => `${buttonLength}px`};
  min-width: ${({ buttonLength }) => `${buttonLength}px`};
  line-height: ${({ fontScaler = 1 }) => `${16 * fontScaler}px`};
  font-size: ${({ fontScaler = 1 }) => `${16 * fontScaler}px`};
  padding: 0px;
  border-radius: 50%;
`;

export const ScorePopper = styled(Popper)`
  display: flex;
  position: absolute;
  border-radius: 50%;
  ${({ theme }) =>
    css`
      z-index: ${theme.zIndex.tooltip};
    `}
`;

interface BackdropProps {
  isPieSelected: boolean;
}

const backdropOptions = {
  shouldForwardProp: (props: string) => !["isPieSelected"].includes(props),
};

export const BackdropPopper = styled(Popper, backdropOptions)<BackdropProps>`
  inset: 0;
  ${({ theme }) => css`
    z-index: ${theme.zIndex.tooltip};
  `}
  ${({ isPieSelected }) => {
    if (isPieSelected)
      return css`
        background: black;
        opacity: 0.5;
      `;
  }}
`;

interface CircleProps {
  circleDiameter: number;
}

const circleOptions = {
  shouldForwardProp: (prop: string) => !["circleDiameter"].includes(prop),
};

export const CircleDiv = styled("div", circleOptions)<CircleProps>`
  /* Center content based on parent center*/
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  border-radius: 50%;
  pointer-events: none;

  height: ${({ circleDiameter }) => `${circleDiameter}px`};
  width: ${({ circleDiameter }) => `${circleDiameter}px`};
`;