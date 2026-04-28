import styled from 'styled-components';

const StyledWrapper = styled.div`
  flex: 1;

  .textInputWrapper {
    position: relative;
    width: 100%;
    --accent-color: #8B5CF6;
  }

  .textInputWrapper:before,
  .textInputWrapper:after {
    content: "";
    left: 0;
    right: 0;
    position: absolute;
    pointer-events: none;
    bottom: -1px;
    z-index: 4;
    width: 100%;
  }

  .textInputWrapper:before {
    transition: border-bottom-color 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }

  .textInputWrapper:focus-within:before {
    border-bottom: 1px solid var(--accent-color);
  }

  .textInputWrapper:after {
    content: "";
    transform: scaleX(0);
    transition: transform 250ms cubic-bezier(0, 0, 0.2, 1) 0ms;
    will-change: transform;
    border-bottom: 2px solid var(--accent-color);
  }

  .textInputWrapper:focus-within:after {
    transform: scaleX(1);
  }

  .textInput::placeholder {
    transition: opacity 250ms cubic-bezier(0, 0, 0.2, 1) 0ms;
    opacity: 1;
    user-select: none;
    color: rgba(255, 255, 255, 0.3);
  }

  .textInputWrapper .textInput {
    border-radius: 5px 5px 0px 0px;
    box-shadow: 0px 2px 5px rgb(0 0 0 / 35%);
    max-height: 36px;
    background-color: rgba(255, 255, 255, 0.04);
    transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
    transition-duration: 200ms;
    transition-property: background-color;
    color: #e8e8e8;
    font-size: 13.5px;
    font-weight: 400;
    letter-spacing: 0.01em;
    padding: 10px 14px;
    width: 100%;
    border-left: none;
    border-bottom: none;
    border-right: none;
    border-top: none;
  }

  .textInputWrapper .textInput:focus,
  .textInputWrapper .textInput:active {
    outline: none;
  }

  .textInputWrapper:focus-within .textInput,
  .textInputWrapper .textInput:focus,
  .textInputWrapper .textInput:active {
    background-color: rgba(255, 255, 255, 0.07);
  }

  .textInputWrapper:focus-within .textInput::placeholder {
    opacity: 0;
  }

  .textInputWrapper .textInput:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export default function MessageTextInput({ value, onChange, onKeyDown, placeholder, disabled, autoFocus }) {
  return (
    <StyledWrapper>
      <div className="textInputWrapper">
        <input
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? "Écrire un message…"}
          disabled={disabled}
          autoFocus={autoFocus}
          type="text"
          className="textInput"
        />
      </div>
    </StyledWrapper>
  );
}
