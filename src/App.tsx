import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { FocusableComponentLayout, FocusDetails, KeyPressDetails } from '@noriginmedia/norigin-spatial-navigation';
import NavMenu from './components/NavMenu/NavMenu';
import HeroBanner from './components/HeroBanner/HeroBanner';
import ContentRow from './components/ContentRow/ContentRow';
import SearchScreen from './components/SearchScreen/SearchScreen';
import PlayerScreen from './components/PlayerScreen/PlayerScreen';
import { Asset, CATEGORIES, ContentCategory } from './data/content';
import { tvScrollTo } from './keymap';
import { fetchHomeCategories } from './lib/movies';

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
  const [loading, setLoading] = useState(true);
  const [playingAsset, setPlayingAsset] = useState<Asset | null>(null);
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
    // Switch to home view to show the hero banner with selected content
    setActiveMenuItemId('home');
  }, []);

  const onPlayPress = useCallback((asset: Asset) => {
    setPlayingAsset(asset);
  }, []);

  const onClosePlayer = useCallback(() => {
    setPlayingAsset(null);
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

  return (
    <AppContainer>
      <GlobalStyle />
      {playingAsset && (
        <PlayerScreen
          slug={playingAsset.id}
          title={playingAsset.title}
          onClose={onClosePlayer}
        />
      )}
      <NavMenu focusKey="MENU" onItemSelect={setActiveMenuItemId} />
      <MainContent>
        {loading ? (
          <LoadingScreen>Cargando contenido...</LoadingScreen>
        ) : isSearchActive ? (
          <SearchScreen
            categories={categories}
            onAssetPress={onAssetPress}
          />
        ) : (
          <>
            <HeroBanner asset={selectedAsset} featuredMovies={featuredMovies} onPlayPress={onPlayPress} />
            <ScrollingRows ref={rowsRef}>
              {categories.map((category) => (
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
