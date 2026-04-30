import React, { useCallback, useRef } from 'react';
import styled from 'styled-components';
import {
  useFocusable,
  FocusContext,
  FocusableComponentLayout,
  FocusDetails,
  KeyPressDetails,
} from '@noriginmedia/norigin-spatial-navigation';
import AssetCard from '../AssetCard/AssetCard';
import { Asset } from '../../data/content';
import { tvScrollTo } from '../../keymap';

interface ContentRowProps {
  title: string;
  assets: Asset[];
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
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  flex-shrink: 1;
  flex-grow: 1;
  padding-left: 60px;
  padding-bottom: 8px;
`;

const ScrollingContent = styled.div`
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-flex-direction: row;
  flex-direction: row;
`;

function ContentRow({ title, assets, onAssetPress, onFocus }: ContentRowProps) {
  const { ref, focusKey } = useFocusable<object, HTMLDivElement>({
    accessibilityLabel: title,
    onFocus,
  });

  const scrollingRef = useRef<HTMLDivElement>(null);

  // useFocusable's onFocus passes (layout, props, details) — layout.x is the card's left position
  const onAssetFocus = useCallback(
    (layout: FocusableComponentLayout) => {
      tvScrollTo(scrollingRef.current, { left: layout.x });
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
