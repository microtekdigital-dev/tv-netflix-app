import { useEffect } from 'react';
import styled from 'styled-components';

interface PlayerScreenProps {
  url: string;
  title: string;
  onClose: () => void;
}

const Overlay = styled.div`
  position: fixed; top: 0; left: 0;
  width: 1920px; height: 1080px;
  background-color: #000; z-index: 100;
`;

const StyledIframe = styled.iframe`
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  border: none; display: block;
`;

const BackBtn = styled.button`
  position: absolute; top: 20px; left: 40px;
  z-index: 200;
  background: rgba(0,0,0,0.7); color: #fff;
  border: 2px solid rgba(255,255,255,0.6);
  border-radius: 4px; padding: 10px 24px;
  font-size: 18px; font-family: 'Segoe UI', Arial, sans-serif;
  cursor: pointer;
`;

function PlayerScreen({ url, title, onClose }: PlayerScreenProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 10009) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <Overlay>
      <StyledIframe
        key={url}
        src={url}
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media"
        title={title}
      />
      <BackBtn onClick={onClose}>&#8592; Volver</BackBtn>
    </Overlay>
  );
}

export default PlayerScreen;