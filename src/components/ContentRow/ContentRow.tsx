import React, { useCallback, useRef } from 'react';
import styled from 'styled-components';
import {
  useFocusable,
  FocusContext,
  FocusableComponentLayout,
  FocusDetails,
  KeyPressDetails,
  setFocus,
} from '@noriginmedia/norigin-spatial-navigation';
import AssetCard from '../AssetCard/AssetCard';
import { Asset } from '../../data/content';
import { tvScrollTo } from '../../keymap';

interface ContentRowProps {
  title: string;
  assets: Asset[];
  focusKey?: string;
  isFirst?: boolean;
  onAssetPress: (asset: Asset, details: KeyPressDetails) => void;
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

function ContentRow({ title, assets, focusKey: focusKeyProp, isFirst, onAssetPress, onFocus }: ContentRowProps) {
  const { ref, focusKey } = useFocusable<object, HTMLDivElement>({
    accessibilityLabel: title,
    onFocus,
    ...(focusKeyProp ? { focusKey: focusKeyProp } : {}),
    onArrowPress: (dir) => {
      if (dir === 'up' && isFirst) {
        setFocus('HERO_PLAY');
        return false;
      }
      return true;
    },
  });

  const scrollingRef = useRef<HTMLDivElement>(null);

  // Scroll so the focused card is centered in the visible area
  const onAssetFocus = useCallback(
    (layout: FocusableComponentLayout) => {
      if (!scrollingRef.current) return;
      const containerWidth = scrollingRef.current.offsetWidth;
      const cardWidth = 320; // matches CardWrapper width
      const centeredLeft = layout.x - containerWidth / 2 + cardWidth / 2;
      tvScrollTo(scrollingRef.current, { left: Math.max(0, centeredLeft) });
    },
    [scrollingRef]
  );

  return (
    <FocusContext.Provider value={focusKey}>
      <RowWrapper ref={ref}>
        <RowTitle>{title}</RowTitle>
        <ScrollingWrapper ref={scrollingRef}>
          <ScrollingContent>
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onEnterPress={onAssetPress}
                onFocus={onAssetFocus}
              />
            ))}
          </ScrollingContent>
        </ScrollingWrapper>
      </RowWrapper>
    </FocusContext.Provider>
  );
}

export default ContentRow;
