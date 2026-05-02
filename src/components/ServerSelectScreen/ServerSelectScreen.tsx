import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useFocusable, FocusContext, resume, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { supabase } from '../../lib/supabase';

interface Embed { url: string; lang: string | null; server: string | null; quality: string | null; type?: string; srt?: string | null; }

interface ServerSelectScreenProps {
  slug: string;
  title: string;
  isSeries?: boolean;
  season?: number;
  episode?: number;
  backdropUrl?: string;
  trailerUrl?: string;
  overview?: string;
  year?: number;
  genre?: string;
  rating?: string;
  onSelectServer: (url: string, serverName: string, type?: string, srt?: string) => void;
  onClose: () => void;
}

function buildServersForMovie(tmdbId: string): Embed[] {
  return [
    { url: `https://vidsrc.to/embed/movie/${tmdbId}?sub_lang=es`,       server: 'VidSrc ES',     lang: 'Espanol', quality: 'HD' },
    { url: `https://vidsrc.to/embed/movie/${tmdbId}?sub_lang=es-419`,   server: 'VidSrc Latino', lang: 'Latino',  quality: 'HD' },
    { url: `https://vidsrc.me/embed/movie?tmdb=${tmdbId}&sub_lang=es`,  server: 'VidSrc.me',     lang: 'Espanol', quality: 'HD' },
    { url: `https://www.2embed.cc/embed/${tmdbId}`,                      server: '2Embed',        lang: 'Multi',   quality: 'HD' },
    { url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&lang=es`, server: 'MultiEmbed',    lang: 'Espanol', quality: 'HD' },
    { url: `https://embed.su/embed/movie/${tmdbId}`,                     server: 'Embed.su',      lang: 'Multi',   quality: 'HD' },
  ];
}

function buildServersForSeries(tmdbId: string, season: number, episode: number): Embed[] {
  return [
    { url: `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?sub_label=Spanish&player=jw&autoplay=true`, server: 'VidLink',       lang: 'Multi',   quality: 'HD' },
    { url: `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}?sub_lang=es`,                           server: 'VidSrc ES',     lang: 'Espanol', quality: 'HD' },
    { url: `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}?sub_lang=es-419`,                       server: 'VidSrc Latino', lang: 'Latino',  quality: 'HD' },
    { url: `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`,                   server: 'VidSrc.me',     lang: 'Multi',   quality: 'HD' },
    { url: `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`,                                server: '2Embed TV',     lang: 'Multi',   quality: 'HD' },
    { url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,                      server: 'MultiEmbed',    lang: 'Multi',   quality: 'HD' },
    { url: `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`,                                        server: 'Embed.su',      lang: 'Multi',   quality: 'HD' },
  ];
}

function extractTmdbId(embeds: Embed[]): string | null {
  for (const e of embeds) {
    const patterns = [/\/movie\/(\d+)/, /\/tv\/(\d+)/, /[?&]tmdb=(\d+)/, /\/(\d{4,8})(?:[/?]|$)/];
    for (const re of patterns) { const m = e.url?.match(re); if (m) return m[1]; }
  }
  return null;
}

function getYoutubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ── Styled ────────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed; top: 0; left: 0;
  width: 1920px; height: 1080px;
  z-index: 200; overflow: hidden;
  background: #000;
`;

const TrailerBg = styled.iframe`
  position: absolute; top: -10%; left: -10%;
  width: 120%; height: 120%;
  border: none; pointer-events: none;
  opacity: 0.35;
`;

const ImageBg = styled.div<{ src: string }>`
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background-image: url(${({ src }) => src});
  background-size: cover; background-position: center;
  opacity: 0.4;
`;

const DarkOverlay = styled.div`
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to right, rgba(0,0,0,0.95) 45%, rgba(0,0,0,0.3) 100%);
`;

const Content = styled.div`
  position: relative; z-index: 1;
  display: flex; flex-direction: column;
  height: 100%; padding: 60px 80px;
`;

const BackBtn = styled.button<{ focused: boolean }>`
  background: ${({ focused }) => focused ? 'rgba(255,255,255,0.2)' : 'transparent'};
  color: #fff; border: 2px solid rgba(255,255,255,0.5);
  border-radius: 4px; padding: 10px 24px; font-size: 16px;
  font-family: 'Segoe UI', Arial, sans-serif; cursor: pointer;
  align-self: flex-start; margin-bottom: 32px;
`;

const BigTitle = styled.h1`
  color: #fff; font-size: 72px; font-weight: 900;
  font-family: 'Segoe UI', Arial, sans-serif; margin: 0 0 16px 0;
  text-shadow: 2px 2px 12px rgba(0,0,0,0.8);
  max-width: 800px;
`;

const Meta = styled.div`
  color: #ccc; font-size: 18px;
  font-family: 'Segoe UI', Arial, sans-serif; margin-bottom: 16px;
`;

const Overview = styled.p`
  color: #ddd; font-size: 18px; line-height: 1.5;
  font-family: 'Segoe UI', Arial, sans-serif;
  max-width: 700px; margin: 0 0 40px 0;
  display: -webkit-box; -webkit-line-clamp: 3;
  -webkit-box-orient: vertical; overflow: hidden;
`;

const EpInfo = styled.div`
  color: #e50914; font-size: 20px; font-weight: 700;
  font-family: 'Segoe UI', Arial, sans-serif; margin-bottom: 24px;
`;

const SectionLabel = styled.div`
  color: #888; font-size: 13px; text-transform: uppercase;
  letter-spacing: 2px; font-family: 'Segoe UI', Arial, sans-serif;
  margin-bottom: 16px;
`;

const ServerGrid = styled.div`
  display: flex; flex-wrap: wrap; gap: 16px;
`;

const ServerCard = styled.button<{ focused: boolean }>`
  background: ${({ focused }) => focused ? 'rgba(229,9,20,0.4)' : 'rgba(255,255,255,0.08)'};
  border: ${({ focused }) => focused ? '2px solid #e50914' : '2px solid rgba(255,255,255,0.2)'};
  border-radius: 10px; padding: 20px 36px;
  cursor: pointer; min-width: 180px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  transition: all 0.15s ease;
`;

const ServerName = styled.div`
  color: #fff; font-size: 20px; font-weight: 700;
  font-family: 'Segoe UI', Arial, sans-serif;
`;

const ServerLang = styled.div`
  color: #aaa; font-size: 13px;
  font-family: 'Segoe UI', Arial, sans-serif;
`;

// ── Server card ───────────────────────────────────────────────────────────────

function ServerCardItem({ embed, index, onSelect, isFirst }: { embed: Embed; index: number; onSelect: (url: string, name: string, type?: string, srt?: string) => void; isFirst?: boolean }) {
  const name = embed.server || embed.lang || `Servidor ${index + 1}`;
  const { ref, focused, focusSelf } = useFocusable<object, HTMLButtonElement>({
    onEnterPress: () => onSelect(embed.url, name, embed.type, embed.srt ?? undefined),
    focusKey: `SERVER-${index}`,
    onArrowPress: (dir) => {
      if (dir === 'up') { setFocus('SS_BACK'); return false; }
      return true;
    },
  });
  useEffect(() => { if (isFirst) focusSelf(); }, [isFirst]);
  return (
    <ServerCard ref={ref} focused={focused} onClick={() => onSelect(embed.url, name, embed.type, embed.srt ?? undefined)}>
      <ServerName>{name}</ServerName>
      {embed.lang && <ServerLang>{embed.lang}{embed.type === 'drive' ? ' ▶ Drive' : ''}</ServerLang>}
    </ServerCard>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

function ServerSelectScreen({
  slug, title, isSeries, season = 1, episode = 1,
  backdropUrl, trailerUrl, overview, year, genre, rating,
  onSelectServer, onClose,
}: ServerSelectScreenProps) {
  const [dbEmbeds, setDbEmbeds] = useState<Embed[]>([]);
  const [fallbackEmbeds, setFallbackEmbeds] = useState<Embed[]>([]);
  const [loading, setLoading] = useState(true);

  // Container must be declared first so children register inside its context
  const { focusKey, ref: containerRef } = useFocusable<object, HTMLDivElement>({
    focusKey: 'SERVER_SELECT',
    trackChildren: true,
    autoRestoreFocus: true,
    isFocusBoundary: true,  // prevent focus from escaping this overlay
  });

  const allEmbeds = [...dbEmbeds, ...fallbackEmbeds];

  const { ref: backRef, focused: backFocused, focusSelf: focusBack } = useFocusable<object, HTMLButtonElement>({
    onEnterPress: onClose,
    focusKey: 'SS_BACK',
    onArrowPress: (dir) => {
      if (dir === 'down' && allEmbeds.length > 0) {
        setFocus('SERVER-0');
        return false;
      }
      // If no servers loaded yet or other direction, stay put
      return false;
    },
  });

  // Focus back button on mount
  useEffect(() => { focusBack(); }, [focusBack]);

  // Guarantee Norigin is always resumed when this overlay closes
  useEffect(() => {
    return () => {
      resume();
      setTimeout(() => setFocus('HERO_PLAY'), 50);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = isSeries
      ? (supabase.from('series') as any).select('embeds,tmdb_id').eq('slug', slug).single()
      : (supabase.from('movies') as any).select('embeds').eq('slug', slug).single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query.then(({ data }: { data: any }) => {
      const embeds: Embed[] = data?.embeds ?? [];
      const seenUrls = new Set<string>();
      const uniqueEmbeds = embeds.filter(e => {
        if (!e.url || seenUrls.has(e.url)) return false;
        seenUrls.add(e.url);
        return true;
      });
      const tid = data?.tmdb_id ? String(data.tmdb_id) : extractTmdbId(uniqueEmbeds);
      setDbEmbeds(uniqueEmbeds);
      if (uniqueEmbeds.length === 0) {
        if (isSeries && tid) {
          setFallbackEmbeds(buildServersForSeries(tid, season, episode));
        } else if (tid) {
          setFallbackEmbeds(buildServersForMovie(tid));
        }
      } else {
        setFallbackEmbeds([]);
      }
      setLoading(false);
    });
  }, [slug, isSeries, season, episode]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 10009 || e.keyCode === 461) { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const ytId = getYoutubeId(trailerUrl);
  const metaParts = [year, genre, rating].filter(Boolean).join(' · ');

  return (
    <FocusContext.Provider value={focusKey}>
      <Overlay ref={containerRef}>
        {ytId ? (
          <TrailerBg
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0`}
            allow="autoplay"
          />
        ) : backdropUrl ? (
          <ImageBg src={backdropUrl} />
        ) : null}
        <DarkOverlay />
        <Content>
          <BackBtn ref={backRef} focused={backFocused} onClick={onClose}>&#8592; Volver</BackBtn>
          <BigTitle>{title}</BigTitle>
          {metaParts && <Meta>{metaParts}</Meta>}
          {overview && <Overview>{overview}</Overview>}
          {isSeries && <EpInfo>Temporada {season} · Episodio {episode}</EpInfo>}

          {loading ? (
            <div style={{ color: '#aaa', fontSize: 20 }}>Cargando servidores...</div>
          ) : (
            <>
              {dbEmbeds.length > 0 && (
                <>
                  <SectionLabel>Servidores</SectionLabel>
                  <ServerGrid style={{ marginBottom: 32 }}>
                    {dbEmbeds.map((e, i) => (
                      <ServerCardItem key={`db-${i}`} embed={e} index={i} onSelect={onSelectServer} isFirst={i === 0} />
                    ))}
                  </ServerGrid>
                </>
              )}
              {fallbackEmbeds.length > 0 && (
                <>
                  <SectionLabel>{dbEmbeds.length > 0 ? 'Servidores alternativos' : 'Servidores'}</SectionLabel>
                  <ServerGrid>
                    {fallbackEmbeds.map((e, i) => (
                      <ServerCardItem key={`fb-${i}`} embed={e} index={i + dbEmbeds.length} onSelect={onSelectServer} isFirst={dbEmbeds.length === 0 && i === 0} />
                    ))}
                  </ServerGrid>
                </>
              )}
            </>
          )}
        </Content>
      </Overlay>
    </FocusContext.Provider>
  );
}

export default ServerSelectScreen;
