import { useEffect } from 'react';
import styled from 'styled-components';
import { useFocusable, setFocus } from '@noriginmedia/norigin-spatial-navigation';

interface PlayerScreenProps {
  url: string;
  title: string;
  backdropUrl?: string;
  overview?: string;
  year?: number;
  genre?: string;
  rating?: string;
  type?: string;
  srt?: string;
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

const StyledVideo = styled.video`
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  background: #000;
`;

const BackBtn = styled.button`
  position: absolute; top: 20px; left: 40px;
  z-index: 200;
  background-color: #e50914;
  color: #fff;
  border: 3px solid #fff;
  border-radius: 4px; padding: 10px 24px;
  font-size: 18px; font-family: 'Segoe UI', Arial, sans-serif;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(229,9,20,0.7);
`;

function PlayerScreen({ url, title, type, srt, onClose }: PlayerScreenProps) {
  const { ref: backRef } = useFocusable<object, HTMLButtonElement>({
    focusKey: 'PLAYER_BACK',
    onEnterPress: onClose,
  });

  useEffect(() => {
    const t = setTimeout(() => setFocus('PLAYER_BACK'), 100);
    return () => {
      clearTimeout(t);
      setFocus('HERO_PLAY');
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 10009 || e.keyCode === 461) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const isDrive = type === 'drive';

  return (
    <Overlay>
      {isDrive ? (
        <StyledVideo
          src={url}
          autoPlay
          controls
          crossOrigin="anonymous"
        >
          {srt && (
            <track
              kind="subtitles"
              src={srt}
              srcLang="es"
              label="Español"
              default
            />
          )}
        </StyledVideo>
      ) : (
        <StyledIframe
          key={url}
          src={url}
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media"
          title={title}
        />
      )}
      <BackBtn ref={backRef} onClick={onClose}>
        &#8592; Volver
      </BackBtn>
    </Overlay>
  );
}

export default PlayerScreen;
