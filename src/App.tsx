import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { FocusableComponentLayout, FocusDetails, KeyPressDetails } from '@noriginmedia/norigin-spatial-navigation';
import NavMenu from './components/NavMenu/NavMenu';
import HeroBanner from './components/HeroBanner/HeroBanner';
import ContentRow from './components/ContentRow/ContentRow';
import SearchScreen from './components/SearchScreen/SearchScreen';
import PlayerScreen from './components/PlayerScreen/PlayerScreen';
import EpisodeList from './components/EpisodeList/EpisodeList';
import ServerSelectScreen from './components/ServerSelectScreen/ServerSelectScreen';
import { Asset, CATEGORIES, ContentCategory } from './data/content';
import { tvScrollTo } from './keymap';
import { fetchHomeCategories, fetchSeriesCategories } from './lib/movies';

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
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [activeMenuItemId, setActiveMenuItemId] = useState<string>('home');
  const [categories, setCategories] = useState<ContentCategory[]>(CATEGORIES);
  const [seriesCategories, setSeriesCategories] = useState<ContentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [playingTitle, setPlayingTitle] = useState('');
  const [serverSelectAsset, setServerSelectAsset] = useState<Asset | null>(null);
  const [serverSelectSeason, setServerSelectSeason] = useState(1);
  const [serverSelectEpisode, setServerSelectEpisode] = useState(1);
  const [episodeListAsset, setEpisodeListAsset] = useState<Asset | null>(null);
  const rowsRef = useRef<HTMLDivElement>(null);

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
  const activeCategories = isSeriesActive ? seriesCategories : categories;
  const activeLoading = isSeriesActive ? seriesLoading : loading;

  return (
    <AppContainer>
      <GlobalStyle />
      {playingUrl && (
        <PlayerScreen
          url={playingUrl}
          title={playingTitle}
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
          onSelectServer={onSelectServer}
          onClose={() => setServerSelectAsset(null)}
        />
      )}
      {episodeListAsset && episodeListAsset.tmdbId && (
        <EpisodeList
          tmdbId={episodeListAsset.tmdbId}
          totalSeasons={episodeListAsset.totalSeasons ?? 1}
          seriesTitle={episodeListAsset.title}
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
            <HeroBanner asset={selectedAsset} featuredMovies={featuredMovies} onPlayPress={onPlayPress} onEpisodesPress={onEpisodesPress} />
            <ScrollingRows ref={rowsRef}>
              {activeCategories.map((category) => (
                <ContentRow
                  key={category.id}
                  title={category.title}
                  assets={category.assets}
                  onAssetPress={onAssetPress}
                  onFocus={onRowFocus}
                />
              ))}
            </ScrollingRows>
          </>
        )}
      </MainContent>
    </AppContainer>
  );
}

export default App;
