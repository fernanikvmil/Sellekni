import styled from 'styled-components';

const StyledWrapper = styled.div`
  button {
    color: rgba(255, 255, 255, 0.65);
    padding: 5px 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.05);
    overflow: hidden;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 8px;
    margin: 0;
    transition: 0.2s;
    border: 1px solid transparent;
    cursor: pointer;
    flex-shrink: 0;
  }

  button:hover {
    border-color: rgba(139, 92, 246, 0.5);
    background: linear-gradient(
      to bottom,
      rgba(139, 92, 246, 0.08),
      rgba(139, 92, 246, 0.14),
      rgba(139, 92, 246, 0.22)
    );
    box-shadow: 0 4px rgba(139, 92, 246, 0.4);
    transform: translateY(-4px);
    color: rgba(196, 181, 253, 0.9);
  }

  button:active {
    transform: translateY(2px);
    box-shadow: none;
  }

  button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export default function MediaUploadButton({ onClick, disabled }) {
  return (
    <StyledWrapper>
      <button type="button" onClick={onClick} disabled={disabled} title="Joindre une photo / vidéo">
        <svg viewBox="0 0 256 256" height={20} width={22} xmlns="http://www.w3.org/2000/svg">
          <path d="M74.34 85.66a8 8 0 0 1 11.32-11.32L120 108.69V24a8 8 0 0 1 16 0v84.69l34.34-34.35a8 8 0 0 1 11.32 11.32l-48 48a8 8 0 0 1-11.32 0ZM240 136v64a16 16 0 0 1-16 16H32a16 16 0 0 1-16-16v-64a16 16 0 0 1 16-16h52.4a4 4 0 0 1 2.83 1.17L111 145a24 24 0 0 0 34 0l23.8-23.8a4 4 0 0 1 2.8-1.2H224a16 16 0 0 1 16 16m-40 32a12 12 0 1 0-12 12a12 12 0 0 0 12-12" fill="currentColor" />
        </svg>
      </button>
    </StyledWrapper>
  );
}
