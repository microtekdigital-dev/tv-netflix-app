import React from 'react';
import styled from 'styled-components';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { Asset } from '../../data/content';

interface HeroBannerProps {
  asset: Asset | null;
  onPlayPress?: (asset: Asset) => void;
}

const BannerWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 500px;
  overflow: hidden;
  -webkit-flex-shrink: 0;
  flex-shrink: 0;
`;

/* inset: 0 replaced with explicit top/right/bottom/left for webOS/Tizen compat */
const BannerImage = styled.div<{ imageUrl: string }>`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-image: url(${({ imageUrl }) => imageUrl});
  background-size: cover;
  background-position: center top;
`;

const BannerGradient = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: -webkit-linear-gradient(
    top,
    rgba(20, 20, 20, 0.1) 0%,
    rgba(20, 20, 20, 0.4) 50%,
    rgba(20, 20, 20, 0.95) 100%
  );
  background: linear-gradient(
    to bottom,
    rgba(20, 20, 20, 0.1) 0%,
    rgba(20, 20, 20, 0.4) 50%,
    rgba(20, 20, 20, 0.95) 100%
  );
`;

const BannerContent = styled.div`
  position: absolute;
  bottom: 60px;
  left: 60px;
  right: 60px;
`;

const BannerTitle = styled.h1`
  color: #fff;
  font-size: 52px;
  font-weight: 900;
  font-family: 'Segoe UI', Arial, sans-serif;
  margin: 0 0 12px 0;
  text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
  max-width: 700px;
`;

const BannerDescription = styled.p`
  color: #e5e5e5;
  font-size: 20px;
  font-family: 'Segoe UI', Arial, sans-serif;
  margin: 0 0 24px 0;
  max-width: 600px;
  line-height: 1.4;
  text-shadow: 1px 1px 4px rgba(0,0,0,0.8);
  /* line-clamp with webkit prefix for TV browsers */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  /* fallback: max-height for browsers that don't support -webkit-line-clamp */
  max-height: 84px;
`;

const BannerMeta = styled.div`
  color: #aaa;
  font-size: 16px;
  font-family: 'Segoe UI', Arial, sans-serif;
  margin-bottom: 20px;
`;

const PlayButton = styled.button<{ focused: boolean }>`
  background-color: ${({ focused }) => focused ? '#fff' : 'rgba(255,255,255,0.85)'};
  color: #141414;
  border: none;
  border-radius: 4px;
  padding: 14px 36px;
  font-size: 20px;
  font-weight: 700;
  font-family: 'Segoe UI', Arial, sans-serif;
  cursor: pointer;
  outline: ${({ focused }) => focused ? '3px solid #e50914' : 'none'};
  outline-offset: 3px;
  -webkit-transform: ${({ focused }) => focused ? 'scale(1.05)' : 'scale(1)'};
  transform: ${({ focused }) => focused ? 'scale(1.05)' : 'scale(1)'};
  -webkit-transition: -webkit-transform 0.15s ease, outline 0.15s ease;
  transition: transform 0.15s ease, outline 0.15s ease;
`;

function HeroBanner({ asset, onPlayPress }: HeroBannerProps) {
  const { ref, focused } = useFocusable<object, HTMLButtonElement>({
    onEnterPress: () => {
      if (asset && onPlayPress) onPlayPress(asset);
    },
    accessibilityLabel: asset ? `Reproducir ${asset.title}` : 'Reproducir',
  });

  if (!asset) {
    return (
      <BannerWrapper>
        <BannerImage imageUrl="https://picsum.photos/seed/default/1920/1080" />
        <BannerGradient />
        <BannerContent>
          <BannerTitle>Bienvenido</BannerTitle>
          <BannerDescription>Selecciona un contenido para comenzar</BannerDescription>
        </BannerContent>
      </BannerWrapper>
    );
  }

  return (
    <BannerWrapper>
      <BannerImage imageUrl={asset.imageUrl} />
      <BannerGradient />
      <BannerContent>
        <BannerTitle>{asset.title}</BannerTitle>
        <BannerDescription>{asset.description}</BannerDescription>
        {(asset.year || asset.genre || asset.duration) && (
          <BannerMeta>
            {[asset.year, asset.genre, asset.duration, asset.rating]
              .filter(Boolean)
              .join(' · ')}
          </BannerMeta>
        )}
        <PlayButton
          ref={ref}
          focused={focused}
          onClick={() => { if (asset && onPlayPress) onPlayPress(asset); }}
        >
          &#9654; Reproducir
        </PlayButton>
      </BannerContent>
    </BannerWrapper>
  );
}

export default HeroBanner;
