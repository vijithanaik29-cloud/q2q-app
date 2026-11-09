import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function getSessionId() {
  try {
    let id = sessionStorage.getItem('q2q_sid');
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('q2q_sid', id);
    }
    return id;
  } catch {
    return null;
  }
}

export function usePageTracking() {
  const location = useLocation();
  const lastTracked = useRef('');

  useEffect(() => {
    const path = location.pathname;
    // Skip superadmin and admin paths — don't track your own visits
    if (path.startsWith('/superadmin') || path.startsWith('/admin')) return;
    // Deduplicate: don't track same path twice in a row
    if (path === lastTracked.current) return;
    lastTracked.current = path;

    const referrer = document.referrer
      ? new URL(document.referrer).hostname
      : null;

    supabase.from('page_views').insert({
      path,
      referrer,
      session_id: getSessionId(),
    }).then(({ error }) => {
      if (error) console.warn('tracking error', error.message);
    });
  }, [location.pathname]);
}
