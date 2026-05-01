import React, { useCallback, useRef } from 'react';
import styled from 'styled-components';
import {
  useFocusable,
  FocusContext,
  FocusableComponentLayout,
  FocusDetails,
} from '@noriginmedia/norigin-spatial-navigation';
import { Asset } from '../../data/content';
import { WatchProgress } from '../../lib/continueWatching';
import ContinueWatchingCard from './ContinueWatchingCard';
import { tvScrollTo } from '../../keymap';

interface ContinueWatchingRowProps {
  items: WatchProgress[];
  assetsMap: Map<string, Asset>;
  onPlayWithProgress: (asset: Asset, progress: WatchProgress) => void;
  onDelete: (slug: string) => void;
  onFocus: (layout: FocusableComponentLayout, props: object, details: FocusDetails) => void;
}

const RowWrapper = styled.div`
  margin-bottom: 32px;
`;

const RowTitle = styled.div`
  color: #e5e5e5;
  font-size: 22px;
  font-weight: 700;
  font-family: 'Segoe UI', sans-serif;
  padding-left: 60px;
  margin-bottom: 16px;
`;

const ScrollingWrapper = styled.div`
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  flex-shrink: 1;
  flex-grow: 1;
  padding-left: 60px;
  padding-top: 4px;
  padding-bottom: 20px;
`;

const ScrollingContent = styled.div`
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-flex-direction: row;
  flex-direction: row;
`;

function ContinueWatchingRow({
  items,
  assetsMap,
  onPlayWithProgress,
  onDelete,
  onFocus,
}: ContinueWatchingRowProps) {
  const { ref, focusKey } = useFocusable<object, HTMLDivElement>({
    accessibilityLabel: 'Continuar Viendo',
    onFocus,
  });

  const scrollingRef = useRef<HTMLDivElement>(null);

  const onCardFocus = useCallback(
    (layout: FocusableComponentLayout) => {
      tvScrollTo(scrollingRef.current, { left: layout.x });
    },
    [scrollingRef]
  );

  // Ocultar la fila completamente cuando no hay items
  if (items.length === 0) {
    return null;
  }

  // Filtrar items cuyo slug no tiene un Asset en assetsMap
  // y ordenar por updated_at descendente
  const validItems = items
    .filter((item) => assetsMap.has(item.slug))
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

  if (validItems.length === 0) {
    return null;
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <RowWrapper ref={ref}>
        <RowTitle>Continuar Viendo</RowTitle>
        <ScrollingWrapper ref={scrollingRef}>
          <ScrollingContent>
            {validItems.map((item) => (
              <ContinueWatchingCard
                key={item.slug}
                asset={assetsMap.get(item.slug)!}
                progress={item}
                onPlay={onPlayWithProgress}
                onDelete={onDelete}
                onFocus={onCardFocus}
              />
            ))}
          </ScrollingContent>
        </ScrollingWrapper>
      </RowWrapper>
    </FocusContext.Provider>
  );
}

export default ContinueWatchingRow;
