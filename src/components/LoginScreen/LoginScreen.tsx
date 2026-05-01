import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { supabase } from '../../lib/supabase';

interface LoginScreenProps {
  onLogin: () => void;
}

// ── Keyboard layout ───────────────────────────────────────────────────────────

const ROWS = [
  ['1','2','3','4','5','6','7','8','9','0'],
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l','@'],
  ['z','x','c','v','b','n','m','.','_','-'],
  ['SPACE','BORRAR','LIMPIAR'],
];

// ── Styled ────────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed; top: 0; left: 0;
  width: 1920px; height: 1080px;
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #0f0f0f 100%);
  z-index: 300;
  display: flex; align-items: center; justify-content: center;
`;

const Card = styled.div`
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 60px 80px;
  width: 1100px;
  display: flex; flex-direction: column; align-items: center;
`;

const Logo = styled.div`
  color: #e50914; font-size: 48px; font-weight: 900;
  font-family: 'Segoe UI', Arial, sans-serif;
  letter-spacing: -1px; margin-bottom: 8px;
`;

const Subtitle = styled.div`
  color: #aaa; font-size: 20px;
  font-family: 'Segoe UI', Arial, sans-serif;
  margin-bottom: 40px;
`;

const TabRow = styled.div`
  display: flex; gap: 0; margin-bottom: 40px;
  border: 2px solid rgba(255,255,255,0.2); border-radius: 8px; overflow: hidden;
`;

const Tab = styled.button<{ active: boolean; focused: boolean }>`
  background: ${({ active }) => active ? '#e50914' : 'transparent'};
  color: #fff; border: none; padding: 14px 48px; font-size: 18px; font-weight: 700;
  font-family: 'Segoe UI', Arial, sans-serif; cursor: pointer;
  outline: ${({ focused }) => focused ? '3px solid #fff' : 'none'};
  outline-offset: -3px;
`;

const FieldRow = styled.div`
  display: flex; flex-direction: column; gap: 16px; width: 100%; margin-bottom: 24px;
`;

const FieldLabel = styled.div`
  color: #888; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;
  font-family: 'Segoe UI', Arial, sans-serif;
`;

const FieldBox = styled.div<{ active: boolean }>`
  background: rgba(255,255,255,0.08);
  border: 2px solid ${({ active }) => active ? '#e50914' : 'rgba(255,255,255,0.2)'};
  border-radius: 8px; padding: 16px 24px;
  color: #fff; font-size: 24px; font-family: 'Segoe UI', Arial, sans-serif;
  min-height: 64px; display: flex; align-items: center;
  cursor: pointer;
`;

const KeyboardGrid = styled.div`
  display: flex; flex-direction: column; gap: 10px; width: 100%; margin-bottom: 24px;
`;

const KeyRow = styled.div`
  display: flex; gap: 10px; justify-content: center;
`;

const Key = styled.button<{ focused: boolean; wide?: boolean }>`
  background: ${({ focused }) => focused ? '#e50914' : 'rgba(255,255,255,0.1)'};
  border: ${({ focused }) => focused ? '2px solid #fff' : '2px solid transparent'};
  border-radius: 8px;
  color: #fff; font-size: 20px; font-weight: 600;
  font-family: 'Segoe UI', Arial, sans-serif;
  cursor: pointer;
  min-width: ${({ wide }) => wide ? '160px' : '80px'};
  height: 64px;
  transition: background 0.1s ease;
`;

const ErrorMsg = styled.div`
  color: #e50914; font-size: 16px;
  font-family: 'Segoe UI', Arial, sans-serif;
  margin-bottom: 16px; text-align: center;
`;

const SubmitBtn = styled.button<{ focused: boolean }>`
  background: ${({ focused }) => focused ? '#fff' : '#e50914'};
  color: ${({ focused }) => focused ? '#141414' : '#fff'};
  border: none; border-radius: 8px;
  padding: 18px 80px; font-size: 22px; font-weight: 700;
  font-family: 'Segoe UI', Arial, sans-serif; cursor: pointer;
  width: 100%; margin-top: 8px;
  outline: ${({ focused }) => focused ? '3px solid #e50914' : 'none'};
  outline-offset: 3px;
`;

// ── Key component ─────────────────────────────────────────────────────────────

function KeyBtn({ label, onPress }: { label: string; onPress: (k: string) => void }) {
  const isWide = label === 'SPACE' || label === 'BORRAR' || label === 'LIMPIAR';
  const display = label === 'SPACE' ? '␣ Espacio' : label === 'BORRAR' ? '⌫' : label === 'LIMPIAR' ? '✕' : label;
  const { ref, focused } = useFocusable<object, HTMLButtonElement>({
    onEnterPress: () => onPress(label),
    focusKey: `KEY-${label}`,
  });
  return (
    <Key ref={ref} focused={focused} wide={isWide} onClick={() => onPress(label)}>
      {display}
    </Key>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────

function TabBtn({ label, active, focusKey: fk, onPress }: { label: string; active: boolean; focusKey: string; onPress: () => void }) {
  const { ref, focused } = useFocusable<object, HTMLButtonElement>({
    onEnterPress: onPress, focusKey: fk,
  });
  return <Tab ref={ref} active={active} focused={focused} onClick={onPress}>{label}</Tab>;
}

// ── Field selector ────────────────────────────────────────────────────────────

function FieldSelector({ label, value, active, focusKey: fk, onFocus }: {
  label: string; value: string; active: boolean; focusKey: string; onFocus: () => void;
}) {
  const { ref, focused } = useFocusable<object, HTMLDivElement>({
    onEnterPress: onFocus, focusKey: fk,
  });
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <FieldBox ref={ref} active={active || focused} onClick={onFocus}>
        {label === 'Contraseña' ? '•'.repeat(value.length) || <span style={{ color: '#555' }}>Ingresa tu contraseña</span> : value || <span style={{ color: '#555' }}>Ingresa tu {label.toLowerCase()}</span>}
      </FieldBox>
    </div>
  );
}

// ── Submit button ─────────────────────────────────────────────────────────────

function SubmitButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { ref, focused } = useFocusable<object, HTMLButtonElement>({
    onEnterPress: onPress, focusKey: 'SUBMIT',
  });
  return <SubmitBtn ref={ref} focused={focused} onClick={onPress}>{label}</SubmitBtn>;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeField, setActiveField] = useState<'email' | 'password'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKey = useCallback((k: string) => {
    const setter = activeField === 'email' ? setEmail : setPassword;
    if (k === 'BORRAR') { setter(v => v.slice(0, -1)); return; }
    if (k === 'LIMPIAR') { setter(''); return; }
    if (k === 'SPACE') { setter(v => v + ' '); return; }
    setter(v => v + k);
  }, [activeField]);

  const handleSubmit = useCallback(async () => {
    if (!email || !password) { setError('Completa todos los campos'); return; }
    setLoading(true); setError('');
    try {
      if (mode === 'login') {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) { setError(e.message); } else { onLogin(); }
      } else {
        const { error: e } = await supabase.auth.signUp({ email, password });
        if (e) { setError(e.message); } else { onLogin(); }
      }
    } catch { setError('Error de conexión'); }
    setLoading(false);
  }, [email, password, mode, onLogin]);

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && e.keyCode === 10009) return; // TV back — ignore
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);

  const { focusKey, ref: containerRef } = useFocusable<object, HTMLDivElement>({
    focusKey: 'LOGIN', trackChildren: true, autoRestoreFocus: true,
  });

  return (
    <FocusContext.Provider value={focusKey}>
      <Overlay ref={containerRef}>
        <Card>
          <Logo>CINEMANIA</Logo>
          <Subtitle>Tu plataforma de streaming para TV</Subtitle>

          <TabRow>
            <TabBtn label="Iniciar sesión" active={mode === 'login'} focusKey="TAB_LOGIN" onPress={() => setMode('login')} />
            <TabBtn label="Registrarse" active={mode === 'register'} focusKey="TAB_REGISTER" onPress={() => setMode('register')} />
          </TabRow>

          <FieldRow>
            <FieldSelector label="Email" value={email} active={activeField === 'email'} focusKey="FIELD_EMAIL" onFocus={() => setActiveField('email')} />
            <FieldSelector label="Contraseña" value={password} active={activeField === 'password'} focusKey="FIELD_PASS" onFocus={() => setActiveField('password')} />
          </FieldRow>

          <KeyboardGrid>
            {ROWS.map((row, ri) => (
              <KeyRow key={ri}>
                {row.map(k => <KeyBtn key={k} label={k} onPress={handleKey} />)}
              </KeyRow>
            ))}
          </KeyboardGrid>

          {error && <ErrorMsg>{error}</ErrorMsg>}
          <SubmitButton label={loading ? 'Cargando...' : mode === 'login' ? '▶ Iniciar sesión' : '✓ Crear cuenta'} onPress={handleSubmit} />
        </Card>
      </Overlay>
    </FocusContext.Provider>
  );
}

export default LoginScreen;
