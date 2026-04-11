import React from 'react';
import styled from 'styled-components';

const ChatButton = ({ onClick }) => {
  return (
    <StyledWrapper onClick={onClick}>
      <ul>
        <li style={{"--i": '#56CCF2', "--j": '#2F80ED'}}>
          <span className="icon">💬</span>
          <span className="title">Messages</span>
        </li>
      </ul>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  ul {
    position: relative;
    display: flex;
    gap: 25px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  ul li {
    position: relative;
    list-style: none;
    width: 42px;
    height: 42px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 60px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    transition: 0.5s;
  }

  ul li:hover {
    width: 160px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0);
  }

  ul li::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 60px;
    background: linear-gradient(45deg, var(--i), var(--j));
    opacity: 0;
    transition: 0.5s;
  }

  ul li:hover::before {
    opacity: 1;
  }

  ul li::after {
    content: "";
    position: absolute;
    top: 10px;
    width: 100%;
    height: 100%;
    border-radius: 60px;
    background: linear-gradient(45deg, var(--i), var(--j));
    transition: 0.5s;
    filter: blur(15px);
    z-index: -1;
    opacity: 0;
  }

  ul li:hover::after {
    opacity: 0.5;
  }

  ul li .icon {
    color: #a0a0b8;
    font-size: 1.3em;
    transition: 0.5s;
    transition-delay: 0.25s;
    position: absolute;
  }

  ul li:hover .icon {
    transform: scale(0);
    transition-delay: 0s;
  }

  ul li .title {
    color: #fff;
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    transform: scale(0);
    transition: 0.5s;
    transition-delay: 0s;
    position: absolute;
  }

  ul li:hover .title {
    transform: scale(1);
    transition-delay: 0.25s;
  }
`;

export default ChatButton;
