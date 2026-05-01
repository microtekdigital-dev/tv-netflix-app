import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useFocusable, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { Asset } from '../../data/content';
import { WatchProgress } from '../../lib/continueWatching';

interface HeroBannerProps {
  asset: Asset | null;
  featuredMovies?: Asset[];
  onPlayPress?: (asset: Asset) => void;
  onEpisodesPress?: (asset: Asset) => void;
  onMyListToggle?: (asset: Asset) => void;
  myListSlugs?: Set<string>;
  watchProgressMap?: Map<string, WatchProgress>;
  firstRowFocusKey?: string;
}

const CAROUSEL_INTERVAL = 6000; // ms between auto-advances

// ── Animations ────────────────────────────────────────────────────────────────

const fadeSlide = keyframes`
  from { opacity: 0; -webkit-transform: translateX(30px); transform: translateX(30px); }
  to   { opacity: 1; -webkit-transform: translateX(0);    transform: translateX(0); }
`;

// ── Styled components ─────────────────────────────────────────────────────────

const BannerWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 460px;
  overflow: hidden;
  -webkit-flex-shrink: 0;
  flex-shrink: 0;
`;

const BannerImage = styled.div<{ imageUrl: string; visible: boolean }>`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-image: url(${({ imageUrl }) => imageUrl});
  background-size: cover;
  background-position: center top;
  opacity: ${({ visible }) => visible ? 1 : 0};
  -webkit-transition: opacity 0.8s ease;
  transition: opacity 0.8s ease;
`;

const BannerGradient = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: -webkit-linear-gradient(
    top,
    rgba(20,20,20,0.05) 0%,
    rgba(20,20,20,0.3)  40%,
    rgba(20,20,20,0.92) 100%
  );
  background: linear-gradient(
    to bottom,
    rgba(20,20,20,0.05) 0%,
    rgba(20,20,20,0.3)  40%,
    rgba(20,20,20,0.92) 100%
  );
`;

const BannerContent = styled.div<{ key: string }>`
  position: absolute;
  bottom: 48px;
  left: 60px;
  right: 60px;
  -webkit-animation: ${fadeSlide} 0.5s ease;
  animation: ${fadeSlide} 0.5s ease;
`;

const BannerTitle = styled.h1`
  color: #fff;
  font-size: 48px;
  font-weight: 900;
  font-family: 'Segoe UI', Arial, sans-serif;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
  max-width: 700px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BannerDescription = styled.p`
  color: #e5e5e5;
  font-size: 18px;
  font-family: 'Segoe UI', Arial, sans-serif;
  margin: 0 0 20px 0;
  max-width: 580px;
  line-height: 1.4;
  text-shadow: 1px 1px 4px rgba(0,0,0,0.8);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-height: 52px;
`;

const BannerMeta = styled.div`
  color: #aaa;
  font-size: 15px;
  font-family: 'Segoe UI', Arial, sans-serif;
  margin-bottom: 18px;
`;

const BannerActions = styled.div`
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-align-items: center;
  align-items: center;
  gap: 16px;
`;

const PlayButton = styled.button<{ focused: boolean }>`
  background-color: ${({ focused }) => focused ? '#fff' : 'rgba(255,255,255,0.9)'};
  color: #141414;
  border: none;
  border-radius: 4px;
  padding: 12px 32px;
  font-size: 18px;
  font-weight: 700;
  font-family: 'Segoe UI', Arial, sans-serif;
  cursor: pointer;
  outline: ${({ focused }) => focused ? '3px solid #e50914' : 'none'};
  outline-offset: 3px;
  -webkit-transform: ${({ focused }) => focused ? 'scale(1.05)' : 'scale(1)'};
  transform: ${({ focused }) => focused ? 'scale(1.05)' : 'scale(1)'};
  -webkit-transition: -webkit-transform 0.15s ease;
  transition: transform 0.15s ease;
`;

const EpisodesButton = styled.button<{ focused: boolean }>`
  background-color: ${({ focused }) => focused ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)'};
  color: #fff;
  border: 2px solid ${({ focused }) => focused ? '#fff' : 'rgba(255,255,255,0.5)'};
  border-radius: 4px;
  padding: 12px 32px;
  font-size: 18px;
  font-weight: 700;
  font-family: 'Segoe UI', Arial, sans-serif;
  cursor: pointer;
  outline: none;
  -webkit-transform: ${({ focused }) => focused ? 'scale(1.05)' : 'scale(1)'};
  transform: ${({ focused }) => focused ? 'scale(1.05)' : 'scale(1)'};
  -webkit-transition: -webkit-transform 0.15s ease;
  transition: transform 0.15s ease;
`;
const MyListButton = styled.button<{ focused: boolean; inList: boolean }>`
  background-color: ${({ inList, focused }) => inList ? (focused ? '#fff' : 'rgba(255,255,255,0.8)') : (focused ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)')};
  color: ${({ inList }) => inList ? '#141414' : '#fff'};
  border: 2px solid ${({ focused }) => focused ? '#fff' : 'rgba(255,255,255,0.5)'};
  border-radius: 4px; padding: 12px 28px; font-size: 18px; font-weight: 700;
  font-family: 'Segoe UI', Arial, sans-serif; cursor: pointer; outline: none;
  transition: transform 0.15s ease;
  transform: ${({ focused }) => focused ? 'scale(1.05)' : 'scale(1)'};
`;

const DotsRow = styled.div`
  position: absolute;
  bottom: 16px;
  right: 60px;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  gap: 8px;
`;

const Dot = styled.div<{ active: boolean }>`
  width: ${({ active }) => active ? '24px' : '8px'};
  height: 8px;
  border-radius: 4px;
  background-color: ${({ active }) => active ? '#e50914' : 'rgba(255,255,255,0.4)'};
  -webkit-transition: width 0.3s ease, background-color 0.3s ease;
  transition: width 0.3s ease, background-color 0.3s ease;
`;

// ── Component ─────────────────────────────────────────────────────────────────

function HeroBanner({ asset, featuredMovies = [], onPlayPress, onEpisodesPress, onMyListToggle, myListSlugs, watchProgressMap, firstRowFocusKey }: HeroBannerProps) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // If user manually selected an asset, show it; otherwise use carousel
  const displayAsset = asset ?? (featuredMovies.length > 0 ? featuredMovies[carouselIndex] : null);

  // Auto-advance carousel only when no asset is manually selected
  useEffect(() => {
    if (asset || featuredMovies.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCarouselIndex(i => (i + 1) % featuredMovies.length);
    }, CAROUSEL_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [asset, featuredMovies.length]);

  const { ref: myListRef, focused: myListFocused } = useFocusable<object, HTMLButtonElement>({
    onEnterPress: () => { if (displayAsset && onMyListToggle) onMyListToggle(displayAsset); },
    focusKey: 'HERO_MYLIST',
    onArrowPress: (dir) => { if (dir === 'down' && firstRowFocusKey) { setFocus(firstRowFocusKey); return false; } return true; },
  });

  const { ref: epRef, focused: epFocused } = useFocusable<object, HTMLButtonElement>({
    onEnterPress: () => { if (displayAsset && onEpisodesPress) onEpisodesPress(displayAsset); },
    focusKey: 'HERO_EPISODES',
    onArrowPress: (dir) => { if (dir === 'down' && firstRowFocusKey) { setFocus(firstRowFocusKey); return false; } return true; },
  });

  const { ref, focused } = useFocusable<object, HTMLButtonElement>({
    onEnterPress: () => {
      if (displayAsset && onPlayPress) onPlayPress(displayAsset);
    },
    accessibilityLabel: displayAsset ? `Reproducir ${displayAsset.title}` : 'Reproducir',
    focusKey: 'HERO_PLAY',
    onArrowPress: (dir) => { if (dir === 'down' && firstRowFocusKey) { setFocus(firstRowFocusKey); return false; } return true; },
  });

  if (!displayAsset) {
    return (
      <BannerWrapper>
        <BannerImage imageUrl="https://picsum.photos/seed/default/1920/1080" visible />
        <BannerGradient />
        <BannerContent key="default">
          <BannerTitle>Bienvenido</BannerTitle>
          <BannerDescription>Cargando contenido...</BannerDescription>
        </BannerContent>
      </BannerWrapper>
    );
  }

  const showDots = !asset && featuredMovies.length > 1;

  return (
    <BannerWrapper>
      {/* Render two images for crossfade */}
      {featuredMovies.map((m, i) => (
        <BannerImage
          key={m.id}
          imageUrl={m.imageUrl}
          visible={displayAsset.id === m.id}
        />
      ))}
      {/* Fallback for manually selected asset not in carousel */}
      {asset && (
        <BannerImage imageUrl={asset.imageUrl} visible />
      )}

      <BannerGradient />

      <BannerContent key={displayAsset.id}>
        <BannerTitle>{displayAsset.title}</BannerTitle>
        {displayAsset.description && (
          <BannerDescription>{displayAsset.description}</BannerDescription>
        )}
        {(displayAsset.year || displayAsset.genre || displayAsset.rating) && (
          <BannerMeta>
            {[displayAsset.year, displayAsset.genre, displayAsset.rating && `★ ${displayAsset.rating}`]
              .filter(Boolean).join(' · ')}
          </BannerMeta>
        )}
        <BannerActions>
          <PlayButton
            ref={ref}
            focused={focused}
            onClick={() => { if (displayAsset && onPlayPress) onPlayPress(displayAsset); }}
          >
            {(() => {
              const progress = watchProgressMap?.get(displayAsset.id);
              if (progress) {
                return displayAsset.isSeries
                  ? `▶ Continuar T${progress.season}:E${progress.episode}`
                  : '▶ Continuar';
              }
              return displayAsset.isSeries ? '▶ Ver T1:E1' : '▶ Reproducir';
            })()}
          </PlayButton>
          {displayAsset.isSeries && onEpisodesPress && (
            <EpisodesButton
              ref={epRef}
              focused={epFocused}
              onClick={() => onEpisodesPress(displayAsset)}
            >
              &#9776; Más episodios
            </EpisodesButton>
          )}
          {onMyListToggle && (
            <MyListButton
              ref={myListRef}
              focused={myListFocused}
              inList={!!myListSlugs?.has(displayAsset.id)}
              onClick={() => onMyListToggle(displayAsset)}
            >
              {myListSlugs?.has(displayAsset.id) ? '✓ En Mi Lista' : '+ Mi Lista'}
            </MyListButton>
          )}
        </BannerActions>
      </BannerContent>

      {showDots && (
        <DotsRow>
          {featuredMovies.map((_, i) => (
            <Dot key={i} active={i === carouselIndex} />
          ))}
        </DotsRow>
      )}
    </BannerWrapper>
  );
}

export default HeroBanner;
