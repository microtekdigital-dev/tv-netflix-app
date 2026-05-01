import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { FocusableComponentLayout, FocusDetails, KeyPressDetails, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import NavMenu from './components/NavMenu/NavMenu';
import HeroBanner from './components/HeroBanner/HeroBanner';
import ContentRow from './components/ContentRow/ContentRow';
import SearchScreen from './components/SearchScreen/SearchScreen';
import PlayerScreen from './components/PlayerScreen/PlayerScreen';
import EpisodeList from './components/EpisodeList/EpisodeList';
import ServerSelectScreen from './components/ServerSelectScreen/ServerSelectScreen';
import LoginScreen from './components/LoginScreen/LoginScreen';
import { supabase } from './lib/supabase';
import { Asset, CATEGORIES, ContentCategory } from './data/content';
import { tvScrollTo } from './keymap';
import { fetchHomeCategories, fetchSeriesCategories, fetchMyList, addToMyList, removeFromMyList } from './lib/movies';
import { WatchProgress, loadProgress, saveProgress, deleteProgress, readLocalCache } from './lib/continueWatching';
import ContinueWatchingRow from './components/ContinueWatchingRow/ContinueWatchingRow';

const GlobalStyle = createGlobalStyle`
  ::-webkit-scrollbar { display: none; }
  * {
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  body {
    margin: 0;
    padding: 0;
    background-color: #141414;
    font-family: 'Segoe UI', Arial, sans-serif;
  }
`;

const AppContainer = styled.div`
  background-color: #141414;
  width: 1920px;
  height: 1080px;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-flex-direction: row;
  flex-direction: row;
  overflow: hidden;
  position: relative;
`;

const MainContent = styled.div`
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-flex-direction: column;
  flex-direction: column;
`;

const ScrollingRows = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  flex: 1;
  padding-top: 24px;
  padding-bottom: 40px;
`;

const LoadingScreen = styled.div`
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  flex: 1;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-align-items: center;
  align-items: center;
  -webkit-justify-content: center;
  justify-content: center;
  color: #aaa;
  font-size: 24px;
  font-family: 'Segoe UI', Arial, sans-serif;
`;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = checking
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [activeMenuItemId, setActiveMenuItemId] = useState<string>('home');
  const [categories, setCategories] = useState<ContentCategory[]>(CATEGORIES);
  const [seriesCategories, setSeriesCategories] = useState<ContentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [playingTitle, setPlayingTitle] = useState('');
  const [playingAsset, setPlayingAsset] = useState<Asset | null>(null);
  const [serverSelectAsset, setServerSelectAsset] = useState<Asset | null>(null);
  const [serverSelectSeason, setServerSelectSeason] = useState(1);
  const [serverSelectEpisode, setServerSelectEpisode] = useState(1);
  const [episodeListAsset, setEpisodeListAsset] = useState<Asset | null>(null);
  const [myListSlugs, setMyListSlugs] = useState<Set<string>>(new Set());
  const [myListAssets, setMyListAssets] = useState<Asset[]>([]);
  const [watchProgressMap, setWatchProgressMap] = useState<Map<string, WatchProgress>>(new Map());
  const rowsRef = useRef<HTMLDivElement>(null);

  // Check session on mount — Supabase persists session in localStorage
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load My List when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchMyList().then(assets => {
      setMyListAssets(assets);
      setMyListSlugs(new Set(assets.map(a => a.id)));
    });
    // Load watch progress
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      // Show local cache immediately
      const cached = readLocalCache(user.id);
      if (cached.length > 0) {
        const map = new Map<string, WatchProgress>();
        cached.forEach(p => map.set(p.slug, p));
        setWatchProgressMap(map);
      }
      // Then sync with Supabase
      loadProgress(user.id).then(records => {
        const map = new Map<string, WatchProgress>();
        records.forEach(p => map.set(p.slug, p));
        setWatchProgressMap(map);
      });
    });
  }, [isLoggedIn]);

  const onMyListToggle = useCallback(async (asset: Asset) => {
    const inList = myListSlugs.has(asset.id);
    if (inList) {
      await removeFromMyList(asset.id);
      setMyListSlugs(prev => { const s = new Set(prev); s.delete(asset.id); return s; });
      setMyListAssets(prev => prev.filter(a => a.id !== asset.id));
    } else {
      await addToMyList(asset.id);
      setMyListSlugs(prev => new Set([...prev, asset.id]));
      setMyListAssets(prev => [...prev, asset]);
    }
  }, [myListSlugs]);

  // Load real data from Supabase on mount
  useEffect(() => {
    fetchHomeCategories()
      .then((cats) => {
        if (cats.length > 0) setCategories(cats);
      })
      .catch(() => {
        // Keep static fallback data on error
      })
      .finally(() => setLoading(false));
  }, []);

  const onAssetPress = useCallback((asset: Asset, _details: KeyPressDetails) => {
    setSelectedAsset(asset);
    setActiveMenuItemId('home');
    // Move focus to the Play button in the hero
    setTimeout(() => setFocus('HERO_PLAY'), 50);
  }, []);

  // Load series when user navigates to series section
  const handleMenuSelect = useCallback((itemId: string) => {
    setActiveMenuItemId(itemId);
    if (itemId === 'series' && seriesCategories.length === 0) {
      setSeriesLoading(true);
      fetchSeriesCategories()
        .then(cats => { if (cats.length > 0) setSeriesCategories(cats); })
        .catch(() => {})
        .finally(() => setSeriesLoading(false));
    }
  }, [seriesCategories.length]);

  const onPlayPress = useCallback((asset: Asset) => {
    setServerSelectSeason(1);
    setServerSelectEpisode(1);
    setServerSelectAsset(asset);
  }, []);
  const onClosePlayer = useCallback(() => {
    setPlayingUrl(null);
    setPlayingAsset(null);
  }, []);
  const onEpisodesPress = useCallback((asset: Asset) => {
    setEpisodeListAsset(asset);
  }, []);
  const onSelectEpisode = useCallback((asset: Asset, season: number, episode: number) => {
    setEpisodeListAsset(null);
    setServerSelectSeason(season);
    setServerSelectEpisode(episode);
    setServerSelectAsset(asset);
  }, []);
  const onSelectServer = useCallback((url: string, serverName: string) => {
    setServerSelectAsset(null);
    setPlayingTitle(serverName);
    setPlayingUrl(url);
    setPlayingAsset(serverSelectAsset);
    // Save watch progress when playback starts
    if (serverSelectAsset) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        const progress = {
          user_id: user.id,
          slug: serverSelectAsset.id,
          content_type: (serverSelectAsset.isSeries ? 'series' : 'movie') as 'movie' | 'series',
          season: serverSelectAsset.isSeries ? serverSelectSeason : undefined,
          episode: serverSelectAsset.isSeries ? serverSelectEpisode : undefined,
          completed: false,
        };
        saveProgress(progress).then(() => {
          setWatchProgressMap(prev => new Map(prev).set(serverSelectAsset.id, {
            ...progress,
            updated_at: new Date().toISOString(),
          }));
        });
      });
    }
  }, [serverSelectAsset, serverSelectSeason, serverSelectEpisode]);
  const onDeleteProgress = useCallback(async (slug: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await deleteProgress(user.id, slug);
    setWatchProgressMap(prev => {
      const next = new Map(prev);
      next.delete(slug);
      return next;
    });
  }, []);

  const onRowFocus = useCallback(
    (layout: FocusableComponentLayout, _props: object, _details: FocusDetails) => {
      tvScrollTo(rowsRef.current, { top: layout.y });
    },
    [rowsRef]
  );

  // Featured movies for the banner carousel — top rated with backdrop
  const featuredMovies = categories.length > 0
    ? categories[0].assets.filter(a => a.imageUrl).slice(0, 8)
    : [];

  const isSearchActive = activeMenuItemId === 'search';
  const isSeriesActive = activeMenuItemId === 'series';
  const isMyListActive = activeMenuItemId === 'mylist';
  const activeCategories = isSeriesActive ? seriesCategories : isMyListActive ? (myListAssets.length > 0 ? [{ id: 'mylist', title: 'Mi Lista', assets: myListAssets }] : []) : categories;
  const activeLoading = isSeriesActive ? seriesLoading : loading;

  // Build assetsMap from all categories for ContinueWatchingRow
  const assetsMap = React.useMemo(() => {
    const map = new Map<string, Asset>();
    [...categories, ...seriesCategories, ...myListAssets.map(a => ({ id: 'mylist', title: '', assets: [a] }))].forEach(cat => {
      if ('assets' in cat) {
        cat.assets.forEach((a: Asset) => map.set(a.id, a));
      }
    });
    return map;
  }, [categories, seriesCategories, myListAssets]);

  // Play with progress: for series, use saved season/episode
  const onPlayWithProgress = useCallback((asset: Asset, progress: WatchProgress) => {
    if (asset.isSeries) {
      setServerSelectSeason(progress.season ?? 1);
      setServerSelectEpisode(progress.episode ?? 1);
    } else {
      setServerSelectSeason(1);
      setServerSelectEpisode(1);
    }
    setServerSelectAsset(asset);
  }, []);

  // Modified onPlayPress: use saved progress for series
  const onPlayPressWithProgress = useCallback((asset: Asset) => {
    const progress = watchProgressMap.get(asset.id);
    if (asset.isSeries && progress) {
      setServerSelectSeason(progress.season ?? 1);
      setServerSelectEpisode(progress.episode ?? 1);
    } else {
      setServerSelectSeason(1);
      setServerSelectEpisode(1);
    }
    setServerSelectAsset(asset);
  }, [watchProgressMap]);

  return (
    <AppContainer>
      <GlobalStyle />
      {isLoggedIn === null && (
        <LoadingScreen>Verificando sesión...</LoadingScreen>
      )}
      {isLoggedIn === false && (
        <LoginScreen onLogin={() => setIsLoggedIn(true)} />
      )}
      {isLoggedIn === true && (
        <>
      {playingUrl && (
        <PlayerScreen
          url={playingUrl}
          title={playingTitle}
          backdropUrl={playingAsset?.imageUrl}
          overview={playingAsset?.overview}
          year={playingAsset?.year}
          genre={playingAsset?.genre}
          rating={playingAsset?.rating}
          onClose={onClosePlayer}
        />
      )}
      {serverSelectAsset && (
        <ServerSelectScreen
          slug={serverSelectAsset.id}
          title={serverSelectAsset.title}
          isSeries={!!serverSelectAsset.isSeries}
          season={serverSelectSeason}
          episode={serverSelectEpisode}
          backdropUrl={serverSelectAsset.imageUrl}
          trailerUrl={serverSelectAsset.trailerUrl}
          overview={serverSelectAsset.overview}
          year={serverSelectAsset.year}
          genre={serverSelectAsset.genre}
          rating={serverSelectAsset.rating}
          onSelectServer={onSelectServer}
          onClose={() => setServerSelectAsset(null)}
        />
      )}
      {episodeListAsset && (
        <EpisodeList
          slug={episodeListAsset.id}
          tmdbId={episodeListAsset.tmdbId}
          totalSeasons={episodeListAsset.totalSeasons ?? 1}
          seriesTitle={episodeListAsset.title}
          backdropUrl={episodeListAsset.imageUrl}
          onSelectEpisode={(s, e) => onSelectEpisode(episodeListAsset, s, e)}
          onClose={() => setEpisodeListAsset(null)}
        />
      )}
      <NavMenu focusKey="MENU" onItemSelect={handleMenuSelect} />
      <MainContent>
        {activeLoading ? (
          <LoadingScreen>Cargando contenido...</LoadingScreen>
        ) : isSearchActive ? (
          <SearchScreen
            categories={activeCategories}
            onAssetPress={onAssetPress}
          />
        ) : (
          <>
            <HeroBanner asset={selectedAsset} featuredMovies={featuredMovies} onPlayPress={onPlayPressWithProgress} onEpisodesPress={onEpisodesPress} onMyListToggle={onMyListToggle} myListSlugs={myListSlugs} watchProgressMap={watchProgressMap} firstRowFocusKey={Array.from(watchProgressMap.values()).filter(p => assetsMap.has(p.slug)).length > 0 ? 'ROW_CONTINUE_WATCHING' : (activeCategories.length > 0 ? `ROW_${activeCategories[0].id}` : undefined)} />
            <ScrollingRows ref={rowsRef}>
              {activeMenuItemId === 'home' && (
                <ContinueWatchingRow
                  items={Array.from(watchProgressMap.values())}
                  assetsMap={assetsMap}
                  onPlayWithProgress={onPlayWithProgress}
                  onDelete={onDeleteProgress}
                  onFocus={onRowFocus}
                  focusKey="ROW_CONTINUE_WATCHING"
                  isFirst
                />
              )}
              {activeCategories.map((category, idx) => {
                // First row is "first" only when ContinueWatchingRow is not shown
                const hasContinueWatching = activeMenuItemId === 'home' &&
                  Array.from(watchProgressMap.values()).filter(p => assetsMap.has(p.slug)).length > 0;
                const isFirstRow = idx === 0 && !hasContinueWatching;
                return (
                  <ContentRow
                    key={category.id}
                    title={category.title}
                    assets={category.assets}
                    onAssetPress={onAssetPress}
                    onFocus={onRowFocus}
                    focusKey={`ROW_${category.id}`}
                    isFirst={isFirstRow}
                  />
                );
              })}
            </ScrollingRows>
          </>
        )}
      </MainContent>
        </>
      )}
    </AppContainer>
  );
}

export default App;
