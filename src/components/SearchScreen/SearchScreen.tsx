import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { FocusableComponentLayout, FocusDetails, KeyPressDetails } from '@noriginmedia/norigin-spatial-navigation';
import ContentRow from '../ContentRow/ContentRow';
import { Asset, ContentCategory } from '../../data/content';
import { tvScrollTo } from '../../keymap';
import { searchMovies, searchSeries } from '../../lib/movies';

interface SearchScreenProps {
  categories: ContentCategory[];
  onAssetPress: (asset: Asset, details: KeyPressDetails) => void;
}

const Wrapper = styled.div`
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-flex-direction: column;
  flex-direction: column;
  padding: 40px 0 0 0;
`;

const Header = styled.div`
  padding: 0 60px 24px 60px;
`;

const Title = styled.h2`
  color: #fff;
  font-size: 32px;
  font-weight: 700;
  font-family: 'Segoe UI', Arial, sans-serif;
  margin: 0 0 16px 0;
`;

const SearchInputWrapper = styled.div`
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-align-items: center;
  align-items: center;
  background-color: rgba(255,255,255,0.1);
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 4px;
  padding: 12px 20px;
  max-width: 600px;
`;

const SearchInput = styled.input`
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 22px;
  font-family: 'Segoe UI', Arial, sans-serif;
  width: 100%;
  caret-color: #e50914;

  &::placeholder {
    color: #666;
  }
`;

const SearchIcon = styled.span`
  color: #aaa;
  font-size: 20px;
  margin-right: 12px;
`;

const Subtitle = styled.p`
  color: #aaa;
  font-size: 16px;
  font-family: 'Segoe UI', Arial, sans-serif;
  margin: 12px 0 0 0;
`;

const RowsWrapper = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  flex: 1;
  padding-bottom: 40px;
`;

function SearchScreen({ categories, onAssetPress }: SearchScreenProps) {
  const rowsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContentCategory[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus the input when the search screen mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const [movieResults, serieResults] = await Promise.all([
        searchMovies(val),
        searchSeries(val),
      ]);
      setSearchResults([...movieResults, ...serieResults]);
      setSearching(false);
    }, 400);
  }, []);

  const onRowFocus = useCallback(
    (layout: FocusableComponentLayout, _props: object, _details: FocusDetails) => {
      tvScrollTo(rowsRef.current, { top: layout.y });
    },
    [rowsRef]
  );

  const displayCategories = query.trim() ? searchResults : categories;
  const subtitle = query.trim()
    ? searching
      ? 'Buscando...'
      : searchResults[0]
        ? `${searchResults[0].assets.length} resultado(s) encontrado(s)`
        : 'Sin resultados'
    : 'Explora todo el contenido disponible';

  return (
    <Wrapper>
      <Header>
        <Title>Buscar</Title>
        <SearchInputWrapper>
          <SearchIcon>&#9906;</SearchIcon>
          <SearchInput
            ref={inputRef}
            type="text"
            placeholder="Buscar películas..."
            value={query}
            onChange={handleQueryChange}
          />
        </SearchInputWrapper>
        <Subtitle>{subtitle}</Subtitle>
      </Header>
      <RowsWrapper ref={rowsRef}>
        {displayCategories.map((category) => (
          <ContentRow
            key={category.id}
            title={category.title}
            assets={category.assets}
            onAssetPress={onAssetPress}
            onFocus={onRowFocus}
          />
        ))}
      </RowsWrapper>
    </Wrapper>
  );
}

export default SearchScreen;
