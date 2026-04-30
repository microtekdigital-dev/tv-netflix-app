import React from 'react';
import styled from 'styled-components';
import {
  useFocusable,
  FocusableComponentLayout,
  FocusDetails,
  KeyPressDetails,
} from '@noriginmedia/norigin-spatial-navigation';
import { Asset } from '../../data/content';

interface AssetCardProps {
  asset: Asset;
  onEnterPress: (asset: Asset, details: KeyPressDetails) => void;
  onFocus: (layout: FocusableComponentLayout, props: object, details: FocusDetails) => void;
}

const CardWrapper = styled.div<{ focused: boolean }>`
  width: 300px;
  height: 170px;
  border-radius: 4px;
  border: ${({ focused }) => (focused ? '3px solid #fff' : '3px solid transparent')};
  -webkit-transform: ${({ focused }) => (focused ? 'scale(1.08)' : 'scale(1)')};
  transform: ${({ focused }) => (focused ? 'scale(1.08)' : 'scale(1)')};
  -webkit-transition: -webkit-transform 0.15s ease, border-color 0.15s ease;
  transition: transform 0.15s ease, border-color 0.15s ease;
  margin-right: 16px;
  -webkit-flex-shrink: 0;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  cursor: pointer;
`;

const CardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const CardOverlay = styled.div<{ focused: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 10px;
  background: ${({ focused }) =>
    focused
      ? '-webkit-linear-gradient(top, transparent, rgba(0,0,0,0.95))'
      : '-webkit-linear-gradient(top, transparent, rgba(0,0,0,0.7))'};
  background: ${({ focused }) =>
    focused
      ? 'linear-gradient(transparent, rgba(0,0,0,0.95))'
      : 'linear-gradient(transparent, rgba(0,0,0,0.7))'};
`;

const CardTitle = styled.div<{ focused: boolean }>`
  color: ${({ focused }) => (focused ? '#fff' : '#ccc')};
  font-size: 14px;
  font-family: 'Segoe UI', Arial, sans-serif;
  font-weight: ${({ focused }) => (focused ? '600' : '400')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardMeta = styled.div`
  color: #aaa;
  font-size: 11px;
  font-family: 'Segoe UI', Arial, sans-serif;
  margin-top: 2px;
`;

function AssetCard({ asset, onEnterPress, onFocus }: AssetCardProps) {
  const { ref, focused } = useFocusable<{ asset: Asset }, HTMLDivElement>({
    accessibilityLabel: asset.title,
    onEnterPress: (props, details) => onEnterPress(props?.asset ?? asset, details),
    onFocus,
    extraProps: { asset },
  });

  return (
    <CardWrapper
      ref={ref}
      focused={focused}
      onClick={() => onEnterPress(asset, { pressedKeys: {} })}
    >
      <CardImage
        src={asset.thumbnailUrl}
        alt={asset.title}
        onError={(e) => {
          (e.target as HTMLImageElement).style.backgroundColor = '#333';
        }}
      />
      <CardOverlay focused={focused}>
        <CardTitle focused={focused}>{asset.title}</CardTitle>
        {(asset.year || asset.genre) && (
          <CardMeta>
            {[asset.year, asset.genre, asset.duration].filter(Boolean).join(' · ')}
          </CardMeta>
        )}
      </CardOverlay>
    </CardWrapper>
  );
}

export default AssetCard;
