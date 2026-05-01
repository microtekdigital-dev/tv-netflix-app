import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import NavMenuItem from './NavMenuItem';
import { supabase } from '../../lib/supabase';

interface NavMenuProps {
  focusKey: string;
  onItemSelect: (itemId: string) => void;
}

const MENU_ITEMS = [
  { id: 'home',   label: 'Inicio',    icon: '&#8962;' },
  { id: 'series', label: 'Series',    icon: '&#9641;' },
  { id: 'movies', label: 'Peliculas', icon: '&#9654;' },
  { id: 'mylist', label: 'Mi Lista',  icon: '&#9829;' },
  { id: 'search', label: 'Buscar',    icon: '&#9906;' },
];

const MenuWrapper = styled.div<{ hasFocusedChild: boolean }>`
  width: 240px;
  min-width: 240px;
  height: 100%;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-flex-direction: column;
  flex-direction: column;
  background-color: ${({ hasFocusedChild }) => hasFocusedChild ? '#1a1a2e' : '#111'};
  padding-top: 60px;
  padding-bottom: 40px;
  -webkit-transition: background-color 0.2s ease;
  transition: background-color 0.2s ease;
  border-right: 1px solid rgba(255,255,255,0.08);
`;

const NetflixLogo = styled.div`
  color: #e50914;
  font-size: 32px;
  font-weight: 900;
  font-family: 'Segoe UI', Arial, sans-serif;
  letter-spacing: -1px;
  padding: 0 24px 40px 24px;
`;

const UserSection = styled.div`
  margin-top: auto;
  padding: 24px;
  border-top: 1px solid rgba(255,255,255,0.08);
`;

const UserEmail = styled.div`
  color: #aaa; font-size: 13px;
  font-family: 'Segoe UI', Arial, sans-serif;
  margin-bottom: 12px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const LogoutBtn = styled.button<{ focused: boolean }>`
  background: ${({ focused }) => focused ? 'rgba(229,9,20,0.3)' : 'rgba(255,255,255,0.06)'};
  border: ${({ focused }) => focused ? '2px solid #e50914' : '2px solid rgba(255,255,255,0.15)'};
  border-radius: 6px; color: #fff; width: 100%;
  padding: 10px; font-size: 15px; font-weight: 600;
  font-family: 'Segoe UI', Arial, sans-serif; cursor: pointer;
`;

function NavMenu({ focusKey: focusKeyParam, onItemSelect }: NavMenuProps) {
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? '');
    });
  }, []);

  const { ref: logoutRef, focused: logoutFocused } = useFocusable<object, HTMLButtonElement>({
    onEnterPress: () => supabase.auth.signOut(),
    focusKey: 'LOGOUT',
  });

  const { ref, focusSelf, hasFocusedChild, focusKey } = useFocusable<object, HTMLDivElement>({
    focusable: true,
    trackChildren: true,
    saveLastFocusedChild: true,
    autoRestoreFocus: true,
    focusKey: focusKeyParam,
  });

  useEffect(() => {
    focusSelf();
  }, [focusSelf]);

  return (
    <FocusContext.Provider value={focusKey}>
      <MenuWrapper ref={ref} hasFocusedChild={hasFocusedChild}>
        <NetflixLogo>CINEMANIA</NetflixLogo>
        {MENU_ITEMS.map((item) => (
          <NavMenuItem
            key={item.id}
            itemId={item.id}
            label={item.label}
            icon={item.icon}
            onSelect={onItemSelect}
          />
        ))}
        <UserSection>
          <UserEmail>{userEmail}</UserEmail>
          <LogoutBtn ref={logoutRef} focused={logoutFocused} onClick={() => supabase.auth.signOut()}>
            &#x2192; Cerrar sesión
          </LogoutBtn>
        </UserSection>
      </MenuWrapper>
    </FocusContext.Provider>
  );
}

export default NavMenu;
