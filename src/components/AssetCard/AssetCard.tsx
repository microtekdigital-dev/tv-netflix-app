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
  width: 320px;
  height: 180px;
  border-radius: 6px;
  border: ${({ focused }) => (focused ? '3px solid #fff' : '3px solid transparent')};
  -webkit-transform: ${({ focused }) => (focused ? 'scale(1.08)' : 'scale(1)')};
  transform: ${({ focused }) => (focused ? 'scale(1.08)' : 'scale(1)')};
  -webkit-transition: -webkit-transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: ${({ focused }) => focused ? '0 12px 40px rgba(0,0,0,0.9), 0 0 0 2px rgba(255,255,255,0.3)' : 'none'};
  margin-right: 16px;
  margin-top: 20px;
  margin-bottom: 20px;
  -webkit-flex-shrink: 0;
  flex-shrink: 0;
  position: relative;
  overflow: visible;
  cursor: pointer;
  -webkit-transform-origin: center center;
  transform-origin: center center;
`;

const CardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
  border-radius: 4px;
`;

const CardInner = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const CardPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: -webkit-linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-align-items: center;
  align-items: center;
  -webkit-justify-content: center;
  justify-content: center;
  padding: 12px;
`;

const PlaceholderText = styled.div`
  color: rgba(255,255,255,0.7);
  font-size: 13px;
  font-family: 'Segoe UI', Arial, sans-serif;
  font-weight: 600;
  text-align: center;
  line-height: 1.3;
  word-break: break-word;
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
  const [imgError, setImgError] = React.useState(false);

  const { ref, focused, focusSelf } = useFocusable<{ asset: Asset }, HTMLDivElement>({
    accessibilityLabel: asset.title,
    onEnterPress: (props, details) => onEnterPress(props?.asset ?? asset, details),
    onFocus,
    extraProps: { asset },
  });

  const hasImage = asset.thumbnailUrl && !imgError;

  return (
    <CardWrapper
      ref={ref}
      focused={focused}
      onClick={() => { focusSelf(); onEnterPress(asset, { pressedKeys: {} }); }}
    >
      <CardInner>
        {hasImage ? (
          <CardImage
            src={asset.thumbnailUrl}
            alt={asset.title}
            onError={() => setImgError(true)}
          />
        ) : (
          <CardPlaceholder>
            <PlaceholderText>{asset.title}</PlaceholderText>
          </CardPlaceholder>
        )}
        <CardOverlay focused={focused}>
          <CardTitle focused={focused}>{asset.title}</CardTitle>
          {(asset.year || asset.genre) && (
            <CardMeta>
              {[asset.year, asset.genre, asset.duration].filter(Boolean).join(' · ')}
            </CardMeta>
          )}
        </CardOverlay>
      </CardInner>
    </CardWrapper>
  );
}

export default AssetCard;
