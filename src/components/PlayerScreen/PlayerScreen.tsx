import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { supabase } from '../../lib/supabase';

interface Embed {
  url: string;
  lang: string | null;
  server: string | null;
  quality: string | null;
}

interface PlayerScreenProps {
  slug: string;
  title: string;
  onClose: () => void;
}

// ── Animations ────────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; -webkit-transform: translateY(10px); transform: translateY(10px); }
  to   { opacity: 1; -webkit-transform: translateY(0);    transform: translateY(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`;

// ── Styled components ─────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 1920px;
  height: 1080px;
  background-color: #000;
  z-index: 100;
`;

const IframeWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const StyledIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  display: block;
`;

const Controls = styled.div<{ visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: ${({ visible }) => visible ? 'all' : 'none'};
  opacity: ${({ visible }) => visible ? 1 : 0};
  -webkit-animation: ${({ visible }) => visible ? fadeIn : fadeOut} 0.3s ease forwards;
  animation: ${({ visible }) => visible ? fadeIn : fadeOut} 0.3s ease forwards;
  -webkit-transition: opacity 0.3s ease;
  transition: opacity 0.3s ease;
`;

const TopBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-align-items: center;
  align-items: center;
  padding: 24px 40px;
  background: -webkit-linear-gradient(top, rgba(0,0,0,0.9), transparent);
  background: linear-gradient(to bottom, rgba(0,0,0,0.9), transparent);
`;

const BackBtn = styled.button<{ focused: boolean }>`
  background-color: ${({ focused }) => focused ? 'rgba(255,255,255,0.2)' : 'transparent'};
  color: #fff;
  border: ${({ focused }) => focused ? '2px solid #fff' : '2px solid rgba(255,255,255,0.4)'};
  border-radius: 4px;
  padding: 10px 24px;
  font-size: 18px;
  font-family: 'Segoe UI', Arial, sans-serif;
  cursor: pointer;
  margin-right: 24px;
  -webkit-transition: background-color 0.15s ease;
  transition: background-color 0.15s ease;
`;

const MovieTitle = styled.h2`
  color: #fff;
  font-size: 26px;
  font-weight: 700;
  font-family: 'Segoe UI', Arial, sans-serif;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 1400px;
`;

const BottomBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px 40px;
  background: -webkit-linear-gradient(bottom, rgba(0,0,0,0.9), transparent);
  background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
`;

const ServerSection = styled.div`
  margin-bottom: 12px;
`;

const SectionLabel = styled.div`
  color: #888;
  font-size: 13px;
  font-family: 'Segoe UI', Arial, sans-serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
`;

const ButtonRow = styled.div`
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-flex-wrap: wrap;
  flex-wrap: wrap;
  gap: 10px;
`;

const ServerBtn = styled.button<{ focused: boolean; active: boolean }>`
  background-color: ${({ focused, active }) =>
    active ? '#e50914' : focused ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'};
  color: ${({ active }) => active ? '#fff' : '#ccc'};
  border: ${({ focused }) => focused ? '2px solid #fff' : '2px solid transparent'};
  border-radius: 4px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: ${({ active }) => active ? '700' : '400'};
  font-family: 'Segoe UI', Arial, sans-serif;
  cursor: pointer;
  -webkit-transition: background-color 0.15s ease;
  transition: background-color 0.15s ease;
  white-space: nowrap;
`;

const StatusText = styled.div`
  color: #aaa;
  font-size: 22px;
  font-family: 'Segoe UI', Arial, sans-serif;
  position: absolute;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  text-align: center;
`;

const HintText = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  -webkit-transform: translateX(-50%);
  transform: translateX(-50%);
  color: rgba(255,255,255,0.4);
  font-size: 14px;
  font-family: 'Segoe UI', Arial, sans-serif;
  pointer-events: none;
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const HIDE_DELAY = 4000; // ms before controls auto-hide

function extractTmdbId(embeds: Embed[]): string | null {
  for (const e of embeds) {
    const patterns = [/\/movie\/(\d+)/, /\/embed\/(\d+)/, /[?&]tmdb=(\d+)/, /\/(\d{4,8})(?:[/?]|$)/];
    for (const re of patterns) {
      const m = e.url?.match(re);
      if (m) return m[1];
    }
  }
  return null;
}

function buildFallbackEmbeds(tmdbId: string): Embed[] {
  return [
    { url: `https://vidsrc.to/embed/movie/${tmdbId}`,          server: 'VidSrc',     lang: 'Multi', quality: 'HD' },
    { url: `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`,     server: 'VidSrc.me',  lang: 'Multi', quality: 'HD' },
    { url: `https://vidlink.pro/movie/${tmdbId}`,               server: 'VidLink',    lang: 'Multi', quality: 'HD' },
    { url: `https://www.2embed.cc/embed/${tmdbId}`,             server: '2Embed',     lang: 'Multi', quality: 'HD' },
    { url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`, server: 'MultiEmbed', lang: 'Multi', quality: 'HD' },
    { url: `https://embed.su/embed/movie/${tmdbId}`,            server: 'Embed.su',   lang: 'Multi', quality: 'HD' },
  ];
}

function buildSlugFallbackEmbeds(slug: string): Embed[] {
  return [
    { url: `https://vidsrc.to/embed/movie/${slug}`,  server: 'VidSrc',  lang: 'Multi', quality: 'HD' },
    { url: `https://vidlink.pro/movie/${slug}`,       server: 'VidLink', lang: 'Multi', quality: 'HD' },
    { url: `https://www.2embed.cc/embed/${slug}`,     server: '2Embed',  lang: 'Multi', quality: 'HD' },
  ];
}

// ── Focusable sub-components ──────────────────────────────────────────────────

function BackButton({ onPress }: { onPress: () => void }) {
  const { ref, focused } = useFocusable<object, HTMLButtonElement>({
    onEnterPress: onPress,
    focusKey: 'PLAYER_BACK',
  });
  return (
    <BackBtn ref={ref} focused={focused} onClick={onPress}>
      &#8592; Volver
    </BackBtn>
  );
}

function ServerButton({ embed, index, active, onPress, focusKey }: {
  embed: Embed; index: number; active: boolean; onPress: () => void; focusKey: string;
}) {
  const { ref, focused } = useFocusable<object, HTMLButtonElement>({ onEnterPress: onPress, focusKey });
  const label = embed.server || embed.lang || `Servidor ${index + 1}`;
  const langTag = embed.lang && embed.lang !== embed.server ? ` · ${embed.lang}` : '';
  return (
    <ServerBtn ref={ref} focused={focused} active={active} onClick={onPress}>
      {label}{langTag}
    </ServerBtn>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function PlayerScreen({ slug, title, onClose }: PlayerScreenProps) {
  const [dbEmbeds, setDbEmbeds] = useState<Embed[]>([]);
  const [extraEmbeds, setExtraEmbeds] = useState<Embed[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSource, setCurrentSource] = useState<'db' | 'extra'>('db');
  const [loading, setLoading] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { focusKey: containerFocusKey } = useFocusable<object, HTMLDivElement>({
    focusKey: 'PLAYER_CONTAINER',
    trackChildren: true,
    isFocusBoundary: true,
  });

  // ── Auto-hide logic ──────────────────────────────────────────────────────

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, HIDE_DELAY);
  }, []);

  // Start hide timer once loaded
  useEffect(() => {
    if (!loading) {
      showControls();
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [loading, showControls]);

  // Any key press or mouse move shows controls again
  useEffect(() => {
    const handleActivity = (e: KeyboardEvent | MouseEvent) => {
      // Escape/Back closes the player
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 10009) {
          e.preventDefault();
          onClose();
          return;
        }
      }
      showControls();
    };

    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousemove', handleActivity);
    return () => {
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
    };
  }, [onClose, showControls]);

  // ── Load embeds ──────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    supabase
      .from('movies')
      .select('embeds')
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        const embeds: Embed[] = data?.embeds ?? [];
        setDbEmbeds(embeds);
        const tmdbId = extractTmdbId(embeds);
        setExtraEmbeds(tmdbId ? buildFallbackEmbeds(tmdbId) : buildSlugFallbackEmbeds(slug));
        setCurrentSource(embeds.length > 0 ? 'db' : 'extra');
        setCurrentIndex(0);
        setLoading(false);
      });
  }, [slug]);

  const currentEmbed = currentSource === 'db' ? dbEmbeds[currentIndex] : extraEmbeds[currentIndex];
  const allEmpty = !loading && dbEmbeds.length === 0 && extraEmbeds.length === 0;

  return (
    <FocusContext.Provider value={containerFocusKey}>
      <Overlay>
        {loading ? (
          <StatusText>Cargando reproductor...</StatusText>
        ) : allEmpty ? (
          <StatusText>No hay servidores disponibles para esta película</StatusText>
        ) : (
          <IframeWrapper>
            <StyledIframe
              key={`${currentSource}-${currentIndex}`}
              src={currentEmbed?.url}
              allowFullScreen
              allow="autoplay; fullscreen; encrypted-media"
            />
          </IframeWrapper>
        )}

        {/* Controls overlay — auto-hides after 4s, shows on any activity */}
        {!loading && !allEmpty && (
          <Controls visible={controlsVisible}>
            <TopBar>
              <BackButton onPress={onClose} />
              <MovieTitle>{title}</MovieTitle>
            </TopBar>

            <BottomBar>
              {dbEmbeds.length > 0 && (
                <ServerSection>
                  <SectionLabel>Servidores</SectionLabel>
                  <ButtonRow>
                    {dbEmbeds.map((embed, i) => (
                      <ServerButton
                        key={`db-${i}`}
                        embed={embed}
                        index={i}
                        active={currentSource === 'db' && currentIndex === i}
                        focusKey={`DB_SERVER_${i}`}
                        onPress={() => { setCurrentSource('db'); setCurrentIndex(i); }}
                      />
                    ))}
                  </ButtonRow>
                </ServerSection>
              )}

              <ServerSection>
                <SectionLabel>Servidores alternativos</SectionLabel>
                <ButtonRow>
                  {extraEmbeds.map((embed, i) => (
                    <ServerButton
                      key={`extra-${i}`}
                      embed={embed}
                      index={i}
                      active={currentSource === 'extra' && currentIndex === i}
                      focusKey={`EXTRA_SERVER_${i}`}
                      onPress={() => { setCurrentSource('extra'); setCurrentIndex(i); }}
                    />
                  ))}
                </ButtonRow>
              </ServerSection>
            </BottomBar>

            {/* Hint shown while controls are visible */}
            <HintText>Presiona cualquier tecla para mostrar controles</HintText>
          </Controls>
        )}
      </Overlay>
    </FocusContext.Provider>
  );
}

export default PlayerScreen;
