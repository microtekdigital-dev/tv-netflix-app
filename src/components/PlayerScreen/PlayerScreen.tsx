import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
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
  isSeries?: boolean;
  onClose: () => void;
}

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
  background: -webkit-linear-gradient(top, rgba(0,0,0,0.95), transparent);
  background: linear-gradient(to bottom, rgba(0,0,0,0.95), transparent);
`;

const BackBtn = styled.button<{ active: boolean }>`
  background-color: ${({ active }) => active ? 'rgba(255,255,255,0.25)' : 'transparent'};
  color: #fff;
  border: ${({ active }) => active ? '2px solid #fff' : '2px solid rgba(255,255,255,0.5)'};
  border-radius: 4px;
  padding: 10px 24px;
  font-size: 18px;
  font-family: 'Segoe UI', Arial, sans-serif;
  cursor: pointer;
  margin-right: 24px;
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
  background: -webkit-linear-gradient(bottom, rgba(0,0,0,0.95), transparent);
  background: linear-gradient(to top, rgba(0,0,0,0.95), transparent);
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

const ServerBtn = styled.button<{ active: boolean; highlighted: boolean }>`
  background-color: ${({ active, highlighted }) =>
    active ? '#e50914' : highlighted ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'};
  color: #fff;
  border: ${({ highlighted }) => highlighted ? '2px solid #fff' : '2px solid transparent'};
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 15px;
  font-weight: ${({ active }) => active ? '700' : '400'};
  font-family: 'Segoe UI', Arial, sans-serif;
  cursor: pointer;
  white-space: nowrap;
  -webkit-transition: background-color 0.15s ease;
  transition: background-color 0.15s ease;
`;

const HintText = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  -webkit-transform: translateX(-50%);
  transform: translateX(-50%);
  color: rgba(255,255,255,0.35);
  font-size: 14px;
  font-family: 'Segoe UI', Arial, sans-serif;
  pointer-events: none;
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const HIDE_DELAY = 4000;
const SERIES_HIDE_DELAY = 8000; // longer delay for series to allow season/episode selection

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
    { url: `https://vidsrc.to/embed/movie/${tmdbId}?sub_lang=es`,           server: 'VidSrc ES',     lang: 'Espanol',  quality: 'HD' },
    { url: `https://vidsrc.to/embed/movie/${tmdbId}?sub_lang=es-419`,       server: 'VidSrc Latino', lang: 'Latino',   quality: 'HD' },
    { url: `https://vidsrc.me/embed/movie?tmdb=${tmdbId}&sub_lang=es`,      server: 'VidSrc.me ES',  lang: 'Espanol',  quality: 'HD' },
    { url: `https://www.2embed.cc/embed/${tmdbId}`,                          server: '2Embed',        lang: 'Multi',    quality: 'HD' },
    { url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&lang=es`,     server: 'MultiEmbed ES', lang: 'Espanol',  quality: 'HD' },
    { url: `https://embed.su/embed/movie/${tmdbId}`,                         server: 'Embed.su',      lang: 'Multi',    quality: 'HD' },
  ];
}

function buildSlugFallbackEmbeds(slug: string): Embed[] {
  return [
    { url: `https://vidsrc.to/embed/movie/${slug}`,  server: 'VidSrc',  lang: 'Multi', quality: 'HD' },
    { url: `https://www.2embed.cc/embed/${slug}`,     server: '2Embed',  lang: 'Multi', quality: 'HD' },
  ];
}

function buildSeriesFallbackEmbeds(tmdbId: string, season: number, episode: number): Embed[] {
  return [
    { url: `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}?sub_lang=es`,          server: 'VidSrc ES',     lang: 'Espanol', quality: 'HD' },
    { url: `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}?sub_lang=es-419`,      server: 'VidSrc Latino', lang: 'Latino',  quality: 'HD' },
    { url: `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`,  server: 'VidSrc.me',     lang: 'Multi',   quality: 'HD' },
    { url: `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`,               server: '2Embed TV',     lang: 'Multi',   quality: 'HD' },
    { url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,     server: 'MultiEmbed',    lang: 'Multi',   quality: 'HD' },
  ];
}

// ── Main component ────────────────────────────────────────────────────────────

function PlayerScreen({ slug, title, isSeries = false, onClose }: PlayerScreenProps) {
  const [dbEmbeds, setDbEmbeds] = useState<Embed[]>([]);
  const [extraEmbeds, setExtraEmbeds] = useState<Embed[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSource, setCurrentSource] = useState<'db' | 'extra'>('db');
  const [loading, setLoading] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  // Which button is highlighted by keyboard navigation
  const [focusedBtn, setFocusedBtn] = useState<{ source: 'back' | 'db' | 'extra'; index: number }>({ source: 'back', index: 0 });
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [totalSeasons, setTotalSeasons] = useState(1);
  const [seriesTmdbId, setSeriesTmdbId] = useState<string | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allEmbeds = [
    ...dbEmbeds.map((e, i) => ({ ...e, source: 'db' as const, index: i })),
    ...extraEmbeds.map((e, i) => ({ ...e, source: 'extra' as const, index: i })),
  ];

  // ── Auto-hide ──────────────────────────────────────────────────────────────

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isSeries) return; // series: controles siempre visibles
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), HIDE_DELAY);
  }, []);

  useEffect(() => {
    if (!loading) showControls();
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [loading, showControls]);

  // ── Keyboard navigation ────────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key || e.keyCode;

      // Back / Escape — close player
      if (key === 'Escape' || key === 'Backspace' || e.keyCode === 10009) {
        e.preventDefault();
        onClose();
        return;
      }

      // If controls are hidden, any key shows them
      if (!controlsVisible) {
        e.preventDefault();
        showControls();
        setFocusedBtn({ source: 'back', index: 0 });
        return;
      }

      // Reset hide timer on any activity
      showControls();

      // Navigation within controls
      if (key === 'ArrowRight' || e.keyCode === 39) {
        e.preventDefault();
        navigateButtons('right');
      } else if (key === 'ArrowLeft' || e.keyCode === 37) {
        e.preventDefault();
        navigateButtons('left');
      } else if (key === 'ArrowDown' || e.keyCode === 40) {
        e.preventDefault();
        navigateButtons('down');
      } else if (key === 'ArrowUp' || e.keyCode === 38) {
        e.preventDefault();
        navigateButtons('up');
      } else if (key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        activateFocusedBtn();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [controlsVisible, focusedBtn, dbEmbeds, extraEmbeds, onClose, showControls]);

  const navigateButtons = useCallback((dir: 'left' | 'right' | 'up' | 'down') => {
    const sections = [
      { source: 'back' as const, count: 1 },
      ...(dbEmbeds.length > 0 ? [{ source: 'db' as const, count: dbEmbeds.length }] : []),
      { source: 'extra' as const, count: extraEmbeds.length },
    ];

    const sectionIdx = sections.findIndex(s => s.source === focusedBtn.source);

    if (dir === 'right') {
      const section = sections[sectionIdx];
      if (focusedBtn.index < section.count - 1) {
        setFocusedBtn(prev => ({ ...prev, index: prev.index + 1 }));
      } else if (sectionIdx < sections.length - 1) {
        setFocusedBtn({ source: sections[sectionIdx + 1].source, index: 0 });
      }
    } else if (dir === 'left') {
      if (focusedBtn.index > 0) {
        setFocusedBtn(prev => ({ ...prev, index: prev.index - 1 }));
      } else if (sectionIdx > 0) {
        const prev = sections[sectionIdx - 1];
        setFocusedBtn({ source: prev.source, index: prev.count - 1 });
      }
    } else if (dir === 'down') {
      if (sectionIdx < sections.length - 1) {
        setFocusedBtn({ source: sections[sectionIdx + 1].source, index: 0 });
      }
    } else if (dir === 'up') {
      if (sectionIdx > 0) {
        setFocusedBtn({ source: sections[sectionIdx - 1].source, index: 0 });
      }
    }
  }, [focusedBtn, dbEmbeds.length, extraEmbeds.length]);

  const activateFocusedBtn = useCallback(() => {
    if (focusedBtn.source === 'back') {
      onClose();
    } else {
      setCurrentSource(focusedBtn.source);
      setCurrentIndex(focusedBtn.index);
    }
  }, [focusedBtn, onClose]);

  // ── Recalculate series embeds when season/episode changes ──────────────────
  useEffect(() => {
    if (!isSeries || !seriesTmdbId) return;
    // Always recalculate series fallbacks with new season/episode
    const newFallbacks = buildSeriesFallbackEmbeds(seriesTmdbId, season, episode);
    setExtraEmbeds(newFallbacks);
    setCurrentSource(dbEmbeds.length > 0 ? 'db' : 'extra');
    setCurrentIndex(0);
  }, [season, episode, seriesTmdbId, isSeries]);

  // ── Load embeds ────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    const table = isSeries ? 'series' : 'movies';
    const fields = isSeries ? 'embeds,tmdb_id,seasons' : 'embeds';
    supabase.from(table).select(fields).eq('slug', slug).single()
      .then(({ data }) => {
        const embeds: Embed[] = data?.embeds ?? [];
        const tid = isSeries && data?.tmdb_id ? String(data.tmdb_id) : extractTmdbId(embeds);
        if (isSeries && data?.seasons) setTotalSeasons(data.seasons);
        if (tid) setSeriesTmdbId(tid);
        setDbEmbeds(embeds);
        // For series: always show fallback servers with season/episode params
        // For movies: only show fallbacks when no DB embeds
        if (isSeries && tid) {
          setExtraEmbeds(buildSeriesFallbackEmbeds(tid, season, episode));
        } else if (embeds.length === 0) {
          const allFallbacks = tid ? buildFallbackEmbeds(tid) : buildSlugFallbackEmbeds(slug);
          setExtraEmbeds(allFallbacks);
        } else {
          setExtraEmbeds([]);
        }
        setCurrentSource(embeds.length > 0 ? 'db' : 'extra');
        setCurrentIndex(0);
        setFocusedBtn({ source: 'back', index: 0 });
        setLoading(false);
      });
  }, [slug]);

  const currentEmbed = currentSource === 'db' ? dbEmbeds[currentIndex] : extraEmbeds[currentIndex];
  const allEmpty = !loading && dbEmbeds.length === 0 && extraEmbeds.length === 0;

  return (
    <Overlay onMouseMove={showControls}>
      {loading ? (
        <StatusText>Cargando reproductor...</StatusText>
      ) : allEmpty ? (
        <StatusText>No hay servidores disponibles</StatusText>
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

      {/* Overlay mousemove handles show controls - no blocking div needed */}

      <div style={{position:"absolute",top:"20px",left:"40px",zIndex:10}} onClick={onClose}><button style={{backgroundColor:"rgba(0,0,0,0.7)",color:"#fff",border:"2px solid rgba(255,255,255,0.6)",borderRadius:"4px",padding:"10px 24px",fontSize:"18px",fontFamily:"Segoe UI,Arial,sans-serif",cursor:"pointer"}}>&#8592; Volver</button></div>
      {!loading && !allEmpty && (
        <Controls visible={controlsVisible}>
          <TopBar>
            <BackBtn
              active={focusedBtn.source === 'back'}
              onClick={onClose}
            >
              &#8592; Volver
            </BackBtn>
            <MovieTitle>{title}</MovieTitle>
          </TopBar>

          <BottomBar>
            {isSeries && (
              <ServerSection>
                <SectionLabel>Temporada / Episodio</SectionLabel>
                <ButtonRow>
                  {Array.from({length: totalSeasons}, (_, i) => i + 1).map(s => (
                    <ServerBtn key={`s${s}`} active={season === s} highlighted={false}
                      onClick={() => { setSeason(s); setEpisode(1); }}>
                      T{s}
                    </ServerBtn>
                  ))}
                </ButtonRow>
                <ButtonRow style={{marginTop: '8px'}}>
                  {Array.from({length: 20}, (_, i) => i + 1).map(ep => (
                    <ServerBtn key={`ep${ep}`} active={episode === ep} highlighted={false}
                      onClick={() => setEpisode(ep)}>
                      E{ep}
                    </ServerBtn>
                  ))}
                </ButtonRow>
              </ServerSection>
            )}
            {dbEmbeds.length > 0 && (
              <ServerSection>
                <SectionLabel>Servidores</SectionLabel>
                <ButtonRow>
                  {dbEmbeds.map((embed, i) => (
                    <ServerBtn
                      key={`db-${i}`}
                      active={currentSource === 'db' && currentIndex === i}
                      highlighted={focusedBtn.source === 'db' && focusedBtn.index === i}
                      onClick={() => { setCurrentSource('db'); setCurrentIndex(i); }}
                    >
                      {embed.server || embed.lang || `Servidor ${i + 1}`}
                    </ServerBtn>
                  ))}
                </ButtonRow>
              </ServerSection>
            )}

            <ServerSection>
              <SectionLabel>Servidores alternativos</SectionLabel>
              <ButtonRow>
                {extraEmbeds.map((embed, i) => (
                  <ServerBtn
                    key={`extra-${i}`}
                    active={currentSource === 'extra' && currentIndex === i}
                    highlighted={focusedBtn.source === 'extra' && focusedBtn.index === i}
                    onClick={() => { setCurrentSource('extra'); setCurrentIndex(i); }}
                  >
                    {embed.server || embed.lang || `Servidor ${i + 1}`}
                  </ServerBtn>
                ))}
              </ButtonRow>
            </ServerSection>
          </BottomBar>

          <HintText>
            {controlsVisible
              ? '← → navegar servidores · Enter seleccionar · Atrás cerrar'
              : 'Presiona cualquier tecla para mostrar controles'}
          </HintText>
        </Controls>
      )}
    </Overlay>
  );
}

export default PlayerScreen;





