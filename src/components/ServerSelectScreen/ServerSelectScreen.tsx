import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { supabase } from '../../lib/supabase';

interface Embed {
  url: string;
  lang: string | null;
  server: string | null;
  quality: string | null;
}

interface ServerSelectScreenProps {
  slug: string;
  title: string;
  isSeries?: boolean;
  season?: number;
  episode?: number;
  backdropUrl?: string;
  onSelectServer: (url: string, serverName: string) => void;
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
    for (const re of patterns) {
      const m = e.url?.match(re);
      if (m) return m[1];
    }
  }
  return null;
}

// ── Styled ────────────────────────────────────────────────────────────────────

const Overlay = styled.div<{ bg?: string }>`
  position: fixed; top: 0; left: 0;
  width: 1920px; height: 1080px;
  z-index: 200;
  display: flex; flex-direction: column;
  padding: 60px 100px;
  ${({ bg }) => bg ? `
    background-image: url(${bg});
    background-size: cover;
    background-position: center;
  ` : 'background: rgba(0,0,0,0.95);'}
  &::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.78);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
`;

const Content = styled.div`
  position: relative; z-index: 1;
  display: flex; flex-direction: column; height: 100%;
`;

const Header = styled.div`
  display: flex; align-items: center; gap: 32px; margin-bottom: 16px;
`;

const BackBtn = styled.button<{ focused: boolean }>`
  background: ${({ focused }) => focused ? 'rgba(255,255,255,0.2)' : 'transparent'};
  color: #fff; border: 2px solid rgba(255,255,255,0.5);
  border-radius: 4px; padding: 12px 28px; font-size: 18px;
  font-family: 'Segoe UI', Arial, sans-serif; cursor: pointer;
`;

const Title = styled.h1`
  color: #fff; font-size: 38px; font-weight: 700;
  font-family: 'Segoe UI', Arial, sans-serif; margin: 0;
`;

const Subtitle = styled.div`
  color: #aaa; font-size: 20px;
  font-family: 'Segoe UI', Arial, sans-serif; margin-bottom: 48px;
`;

const SectionLabel = styled.div`
  color: #888; font-size: 14px; text-transform: uppercase;
  letter-spacing: 2px; font-family: 'Segoe UI', Arial, sans-serif;
  margin-bottom: 20px;
`;

const ServerGrid = styled.div`
  display: flex; flex-wrap: wrap; gap: 20px;
`;

const ServerCard = styled.button<{ focused: boolean }>`
  background: ${({ focused }) => focused ? 'rgba(229,9,20,0.3)' : 'rgba(255,255,255,0.06)'};
  border: ${({ focused }) => focused ? '2px solid #e50914' : '2px solid rgba(255,255,255,0.15)'};
  border-radius: 12px; padding: 24px 40px;
  cursor: pointer; min-width: 200px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  transition: all 0.15s ease;
`;

const ServerName = styled.div`
  color: #fff; font-size: 22px; font-weight: 700;
  font-family: 'Segoe UI', Arial, sans-serif;
`;

const ServerLang = styled.div`
  color: #aaa; font-size: 14px;
  font-family: 'Segoe UI', Arial, sans-serif;
`;

const LoadingText = styled.div`
  color: #aaa; font-size: 22px;
  font-family: 'Segoe UI', Arial, sans-serif;
`;

// ── Focusable server card ─────────────────────────────────────────────────────

function ServerCardItem({ embed, index, onSelect }: {
  embed: Embed; index: number; onSelect: (url: string, name: string) => void;
}) {
  const name = embed.server || embed.lang || `Servidor ${index + 1}`;
  const { ref, focused } = useFocusable<object, HTMLButtonElement>({
    onEnterPress: () => onSelect(embed.url, name),
    focusKey: `SERVER-${index}`,
  });
  return (
    <ServerCard ref={ref} focused={focused} onClick={() => onSelect(embed.url, name)}>
      <ServerName>{name}</ServerName>
      {embed.lang && <ServerLang>{embed.lang}</ServerLang>}
    </ServerCard>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

function ServerSelectScreen({ slug, title, isSeries, season = 1, episode = 1, backdropUrl, onSelectServer, onClose }: ServerSelectScreenProps) {
  const [dbEmbeds, setDbEmbeds] = useState<Embed[]>([]);
  const [fallbackEmbeds, setFallbackEmbeds] = useState<Embed[]>([]);
  const [loading, setLoading] = useState(true);

  const { ref: backRef, focused: backFocused, focusSelf } = useFocusable<object, HTMLButtonElement>({
    onEnterPress: onClose, focusKey: 'SS_BACK',
  });

  useEffect(() => { focusSelf(); }, [focusSelf]);

  useEffect(() => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = isSeries
      ? (supabase.from('series') as any).select('embeds,tmdb_id').eq('slug', slug).single()
      : (supabase.from('movies') as any).select('embeds').eq('slug', slug).single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query.then(({ data }: { data: any }) => {
      const embeds: Embed[] = data?.embeds ?? [];
      const tid = data?.tmdb_id ? String(data.tmdb_id) : extractTmdbId(embeds);
      setDbEmbeds(embeds);
      if (isSeries && tid) {
        setFallbackEmbeds(buildServersForSeries(tid, season, episode));
      } else if (tid) {
        setFallbackEmbeds(buildServersForMovie(tid));
      }
      setLoading(false);
    });
  }, [slug, isSeries, season, episode]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 10009) {
        e.preventDefault(); onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const { focusKey, ref: containerRef } = useFocusable<object, HTMLDivElement>({
    focusKey: 'SERVER_SELECT', trackChildren: true,
  });

  const subtitleText = isSeries ? `Temporada ${season} · Episodio ${episode}` : '';

  return (
    <FocusContext.Provider value={focusKey}>
      <Overlay ref={containerRef} bg={backdropUrl}>
        <Content>
          <Header>
            <BackBtn ref={backRef} focused={backFocused} onClick={onClose}>&#8592; Volver</BackBtn>
            <Title>{title}</Title>
          </Header>
          {subtitleText && <Subtitle>{subtitleText}</Subtitle>}

          {loading ? (
            <LoadingText>Cargando servidores...</LoadingText>
          ) : (
            <>
              {dbEmbeds.length > 0 && (
                <>
                  <SectionLabel>Servidores</SectionLabel>
                  <ServerGrid style={{ marginBottom: '40px' }}>
                    {dbEmbeds.map((e, i) => (
                      <ServerCardItem key={`db-${i}`} embed={e} index={i} onSelect={onSelectServer} />
                    ))}
                  </ServerGrid>
                </>
              )}
              <SectionLabel>Servidores alternativos</SectionLabel>
              <ServerGrid>
                {fallbackEmbeds.map((e, i) => (
                  <ServerCardItem key={`fb-${i}`} embed={e} index={i + dbEmbeds.length} onSelect={onSelectServer} />
                ))}
              </ServerGrid>
            </>
          )}
        </Content>
      </Overlay>
    </FocusContext.Provider>
  );
}

export default ServerSelectScreen;
