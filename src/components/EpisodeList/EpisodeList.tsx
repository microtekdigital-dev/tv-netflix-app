import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { supabase } from '../../lib/supabase';

interface Episode {
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  runtime: number | null;
}

interface EpisodeListProps {
  slug?: string;
  tmdbId?: number;
  totalSeasons: number;
  seriesTitle: string;
  onSelectEpisode: (season: number, episode: number) => void;
  onClose: () => void;
}

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY as string;
const TMDB_IMG = 'https://image.tmdb.org/t/p/w300';

// ── Styled ────────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed; top: 0; left: 0;
  width: 1920px; height: 1080px;
  background-color: rgba(0,0,0,0.92);
  z-index: 200;
  display: flex; flex-direction: column;
  padding: 48px 80px;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex; align-items: center; gap: 32px;
  margin-bottom: 32px;
`;

const BackBtn = styled.button<{ focused: boolean }>`
  background: ${({ focused }) => focused ? 'rgba(255,255,255,0.2)' : 'transparent'};
  color: #fff; border: 2px solid rgba(255,255,255,0.5);
  border-radius: 4px; padding: 10px 24px; font-size: 18px;
  font-family: 'Segoe UI', Arial, sans-serif; cursor: pointer;
`;

const Title = styled.h1`
  color: #fff; font-size: 36px; font-weight: 700;
  font-family: 'Segoe UI', Arial, sans-serif; margin: 0;
`;

const SeasonTabs = styled.div`
  display: flex; gap: 12px; margin-bottom: 28px;
`;

const SeasonTab = styled.button<{ active: boolean; focused: boolean }>`
  background: ${({ active, focused }) => active ? '#e50914' : focused ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'};
  color: #fff; border: ${({ focused }) => focused ? '2px solid #fff' : '2px solid transparent'};
  border-radius: 4px; padding: 10px 24px; font-size: 16px; font-weight: 700;
  font-family: 'Segoe UI', Arial, sans-serif; cursor: pointer;
`;

const EpisodeScroll = styled.div`
  overflow-y: auto; flex: 1;
  display: flex; flex-direction: column; gap: 16px;
`;

const EpisodeCard = styled.div<{ focused: boolean }>`
  display: flex; gap: 24px; align-items: flex-start;
  background: ${({ focused }) => focused ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'};
  border: ${({ focused }) => focused ? '2px solid #fff' : '2px solid transparent'};
  border-radius: 8px; padding: 16px; cursor: pointer;
  transition: background 0.15s ease;
`;

const EpThumb = styled.div<{ src: string }>`
  width: 240px; height: 135px; flex-shrink: 0;
  background-image: url(${({ src }) => src});
  background-size: cover; background-position: center;
  border-radius: 4px; background-color: #333;
  display: flex; align-items: center; justify-content: center;
`;

const EpThumbLabel = styled.div`
  color: rgba(255,255,255,0.6); font-size: 14px;
  font-family: 'Segoe UI', Arial, sans-serif;
`;

const EpInfo = styled.div`flex: 1;`;

const EpTitle = styled.div`
  color: #fff; font-size: 20px; font-weight: 700;
  font-family: 'Segoe UI', Arial, sans-serif; margin-bottom: 8px;
`;

const EpMeta = styled.div`
  color: #aaa; font-size: 14px;
  font-family: 'Segoe UI', Arial, sans-serif; margin-bottom: 8px;
`;

const EpDesc = styled.div`
  color: #ccc; font-size: 15px; line-height: 1.4;
  font-family: 'Segoe UI', Arial, sans-serif;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
`;

const LoadingText = styled.div`
  color: #aaa; font-size: 22px; font-family: 'Segoe UI', Arial, sans-serif;
  text-align: center; margin-top: 80px;
`;

// ── Focusable episode card ────────────────────────────────────────────────────

function EpCard({ ep, season, onSelect }: { ep: Episode; season: number; onSelect: (s: number, e: number) => void }) {
  const { ref, focused } = useFocusable<object, HTMLDivElement>({
    onEnterPress: () => onSelect(season, ep.episode_number),
    focusKey: `EP-${season}-${ep.episode_number}`,
  });

  const thumb = ep.still_path ? `${TMDB_IMG}${ep.still_path}` : '';

  return (
    <EpisodeCard ref={ref} focused={focused} onClick={() => onSelect(season, ep.episode_number)}>
      <EpThumb src={thumb}>
        {!thumb && <EpThumbLabel>T{season}:E{ep.episode_number}</EpThumbLabel>}
      </EpThumb>
      <EpInfo>
        <EpTitle>Episodio {ep.episode_number}: {ep.name}</EpTitle>
        {ep.runtime && <EpMeta>{ep.runtime} min</EpMeta>}
        {ep.overview && <EpDesc>{ep.overview}</EpDesc>}
      </EpInfo>
    </EpisodeCard>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function EpisodeList({ slug, tmdbId: tmdbIdProp, totalSeasons, seriesTitle, onSelectEpisode, onClose }: EpisodeListProps) {
  const [season, setSeason] = useState(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedTmdbId, setResolvedTmdbId] = useState<number | null>(tmdbIdProp ?? null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { ref: backRef, focused: backFocused, focusSelf } = useFocusable<object, HTMLButtonElement>({
    onEnterPress: onClose,
    focusKey: 'EP_BACK',
  });

  useEffect(() => { focusSelf(); }, [focusSelf]);

  // Resolve tmdb_id from Supabase if not provided
  useEffect(() => {
    if (tmdbIdProp) { setResolvedTmdbId(tmdbIdProp); return; }
    if (!slug) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('series') as any).select('tmdb_id').eq('slug', slug).single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any }) => {
        if (data?.tmdb_id) setResolvedTmdbId(data.tmdb_id);
      });
  }, [slug, tmdbIdProp]);

  useEffect(() => {
    if (!resolvedTmdbId) return;
    setLoading(true);
    setEpisodes([]);
    fetch(`https://api.themoviedb.org/3/tv/${resolvedTmdbId}/season/${season}?api_key=${TMDB_KEY}&language=es-ES`)
      .then(r => r.json())
      .then(d => setEpisodes(d.episodes ?? []))
      .catch(() => setEpisodes([]))
      .finally(() => setLoading(false));
  }, [resolvedTmdbId, season]);

  const handleSelect = useCallback((s: number, e: number) => {
    onSelectEpisode(s, e);
  }, [onSelectEpisode]);

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

  const { focusKey, ref: containerRef } = useFocusable<object, HTMLDivElement>({
    focusKey: 'EPISODE_LIST',
    trackChildren: true,
  });

  return (
    <FocusContext.Provider value={focusKey}>
      <Overlay ref={containerRef}>
        <Header>
          <BackBtn ref={backRef} focused={backFocused} onClick={onClose}>
            &#8592; Volver
          </BackBtn>
          <Title>{seriesTitle} — Episodios</Title>
        </Header>

        <SeasonTabs>
          {Array.from({ length: totalSeasons }, (_, i) => i + 1).map(s => (
            <SeasonTab key={s} active={season === s} focused={false}
              onClick={() => setSeason(s)}>
              Temporada {s}
            </SeasonTab>
          ))}
        </SeasonTabs>

        <EpisodeScroll ref={scrollRef}>
          {loading ? (
            <LoadingText>Cargando episodios...</LoadingText>
          ) : episodes.length === 0 ? (
            <LoadingText>No hay episodios disponibles</LoadingText>
          ) : (
            episodes.map(ep => (
              <EpCard key={ep.episode_number} ep={ep} season={season} onSelect={handleSelect} />
            ))
          )}
        </EpisodeScroll>
      </Overlay>
    </FocusContext.Provider>
  );
}

export default EpisodeList;
