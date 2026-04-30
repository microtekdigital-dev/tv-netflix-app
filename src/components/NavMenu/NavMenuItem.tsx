import React from 'react';
import styled from 'styled-components';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';

interface NavMenuItemProps {
  itemId: string;
  label: string;
  icon: string;
  onSelect: (itemId: string) => void;
}

const ItemWrapper = styled.div<{ focused: boolean }>`
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-align-items: center;
  align-items: center;
  padding: 14px 24px;
  margin-bottom: 8px;
  border-radius: 4px;
  cursor: pointer;
  background-color: ${({ focused }) => focused ? 'rgba(255,255,255,0.15)' : 'transparent'};
  border-left: ${({ focused }) => focused ? '3px solid #e50914' : '3px solid transparent'};
  -webkit-transition: background-color 0.15s ease, border-color 0.15s ease;
  transition: background-color 0.15s ease, border-color 0.15s ease;
`;

const ItemIcon = styled.span`
  font-size: 20px;
  margin-right: 14px;
  min-width: 28px;
  text-align: center;
  color: #ccc;
`;

const ItemLabel = styled.span<{ focused: boolean }>`
  color: ${({ focused }) => focused ? '#fff' : '#aaa'};
  font-size: 18px;
  font-family: 'Segoe UI', Arial, sans-serif;
  font-weight: ${({ focused }) => focused ? '600' : '400'};
  -webkit-transition: color 0.15s ease;
  transition: color 0.15s ease;
`;

function NavMenuItem({ itemId, label, icon, onSelect }: NavMenuItemProps) {
  const { ref, focused } = useFocusable<{ itemId: string }, HTMLDivElement>({
    onEnterPress: () => onSelect(itemId),
    extraProps: { itemId },
    accessibilityLabel: label,
  });

  return (
    <ItemWrapper ref={ref} focused={focused} onClick={() => onSelect(itemId)}>
      {/* dangerouslySetInnerHTML renders HTML entities correctly on all TV browsers */}
      <ItemIcon dangerouslySetInnerHTML={{ __html: icon }} />
      <ItemLabel focused={focused}>{label}</ItemLabel>
    </ItemWrapper>
  );
}

export default NavMenuItem;
