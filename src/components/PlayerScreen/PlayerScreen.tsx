import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabase';

interface Embed {
  url: string;
  lang: string | null;
  server: string | null;
  quality: string | null;
}

interface PlayerScreenProps {
  slug: string;
  title: string;
  isSeries?: boolean;
  onClose: () => void;
}
