import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import {
  useFocusable,
  FocusableComponentLayout,
} from '@noriginmedia/norigin-spatial-navigation';
import { Asset } from '../../data/content';
import { WatchProgress } from '../../lib/continueWatching';

interface ContinueWatchingCardProps {
  asset: Asset;
  progress: WatchProgress;
  onPlay: (asset: Asset, progress: WatchProgress) => void;
  onDelete: (slug: string) => void;
  onFocus: (layout: FocusableComponentLayout) => void;
}

// ─── Styled Components ────────────────────────────────────────────────────────

const CardWrapper = styled.div<{ focused: boolean }>`
  width: 320px;
  height: 180px;
  border-radius: 6px;
  border: ${({ focused }) => (focused ? '3px solid #fff' : '3px solid transparent')};
  -webkit-transform: ${({ focused }) => (focused ? 'scale(1.06)' : 'scale(1)')};
  transform: ${({ focused }) => (focused ? 'scale(1.06)' : 'scale(1)')};
  -webkit-transition: -webkit-transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  box-shadow: ${({ focused }) => (focused ? '0 8px 32px rgba(0,0,0,0.8)' : 'none')};
  margin-right: 16px;
  margin-top: 12px;
  margin-bottom: 12px;
  -webkit-flex-shrink: 0;
  flex-shrink: 0;
  position: relative;
  overflow: visible;
  cursor: pointer;
  -webkit-transform-origin: center center;
  transform-origin: center center;
`;

const CardInner = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const CardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
  border-radius: 4px;
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
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-family: 'Segoe UI', Arial, sans-serif;
  font-weight: 600;
  text-align: center;
  line-height: 1.3;
  word-break: break-word;
`;

/** Badge de progreso — esquina superior izquierda, siempre visible */
const ProgressBadge = styled.div<{ isSeries: boolean }>`
  position: absolute;
  top: 8px;
  left: 8px;
  background: ${({ isSeries }) => (isSeries ? '#e50914' : '#555')};
  color: #fff;
  font-size: 11px;
  font-family: 'Segoe UI', Arial, sans-serif;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 3px;
  letter-spacing: 0.3px;
  z-index: 2;
  pointer-events: none;
`;

/** Overlay semitransparente de confirmación de eliminación */
const DeleteOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-flex-direction: column;
  flex-direction: column;
  -webkit-align-items: center;
  align-items: center;
  -webkit-justify-content: center;
  justify-content: center;
  border-radius: 4px;
  z-index: 10;
  gap: 14px;
`;

const DeleteQuestion = styled.div`
  color: #fff;
  font-size: 15px;
  font-family: 'Segoe UI', Arial, sans-serif;
  font-weight: 600;
  text-align: center;
`;

const DeleteButtons = styled.div`
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  gap: 12px;
`;

const DeleteButton = styled.button<{ selected: boolean }>`
  background: ${({ selected }) => (selected ? '#e50914' : 'rgba(255,255,255,0.15)')};
  color: #fff;
  border: ${({ selected }) => (selected ? '2px solid #fff' : '2px solid transparent')};
  border-radius: 4px;
  padding: 6px 18px;
  font-size: 13px;
  font-family: 'Segoe UI', Arial, sans-serif;
  font-weight: ${({ selected }) => (selected ? '700' : '400')};
  cursor: pointer;
  outline: none;
  -webkit-transition: background 0.1s ease, border-color 0.1s ease;
  transition: background 0.1s ease, border-color 0.1s ease;
`;

// ─── Component ────────────────────────────────────────────────────────────────

function ContinueWatchingCard({
  asset,
  progress,
  onPlay,
  onDelete,
  onFocus,
}: ContinueWatchingCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // 0 = "Sí" selected, 1 = "No" selected
  const [deleteSelection, setDeleteSelection] = useState(0);

  const handleEnterPress = useCallback(() => {
    onPlay(asset, progress);
  }, [asset, progress, onPlay]);

  const { ref, focused } = useFocusable<HTMLDivElement>({
    accessibilityLabel: asset.title,
    onEnterPress: handleEnterPress,
    onFocus,
  });

  // Tecla de menú Samsung/LG para abrir el overlay de confirmación
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (showDeleteConfirm) {
        // Navegación dentro del overlay
        if (e.key === 'ArrowLeft' || e.keyCode === 37) {
          setDeleteSelection(0); // "Sí"
        } else if (e.key === 'ArrowRight' || e.keyCode === 39) {
          setDeleteSelection(1); // "No"
        } else if (e.key === 'Enter' || e.keyCode === 13) {
          if (deleteSelection === 0) {
            onDelete(progress.slug);
          } else {
            setShowDeleteConfirm(false);
            setDeleteSelection(0);
          }
        } else if (
          e.key === 'Escape' ||
          e.key === 'Backspace' ||
          e.keyCode === 27 ||
          e.keyCode === 8
        ) {
          setShowDeleteConfirm(false);
          setDeleteSelection(0);
        }
      } else if (focused) {
        // Tecla de menú Samsung (keyCode 18) / LG (keyCode 457) / key 'Info'
        if (e.key === 'Info' || e.keyCode === 457 || e.keyCode === 18) {
          e.preventDefault();
          setShowDeleteConfirm(true);
          setDeleteSelection(0);
        }
      }
    },
    [showDeleteConfirm, focused, deleteSelection, onDelete, progress.slug]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const isSeries = progress.content_type === 'series';
  const badgeText = isSeries
    ? `T${progress.season}:E${progress.episode}`
    : 'En progreso';

  const hasImage = asset.thumbnailUrl && !imgError;

  return (
    <CardWrapper
      ref={ref}
      focused={focused}
      onClick={() => {
        if (!showDeleteConfirm) {
          onPlay(asset, progress);
        }
      }}
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

        {/* Badge de progreso — siempre visible */}
        <ProgressBadge isSeries={isSeries}>{badgeText}</ProgressBadge>

        {/* Overlay de confirmación de eliminación */}
        {showDeleteConfirm && (
          <DeleteOverlay>
            <DeleteQuestion>¿Eliminar?</DeleteQuestion>
            <DeleteButtons>
              <DeleteButton
                selected={deleteSelection === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(progress.slug);
                }}
              >
                Sí
              </DeleteButton>
              <DeleteButton
                selected={deleteSelection === 1}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                  setDeleteSelection(0);
                }}
              >
                No
              </DeleteButton>
            </DeleteButtons>
          </DeleteOverlay>
        )}
      </CardInner>
    </CardWrapper>
  );
}

export default ContinueWatchingCard;
