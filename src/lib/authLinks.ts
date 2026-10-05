import { supabase } from './supabase';

// One PKCE code may arrive through both the OS listener and the browser result.
let pending: { code: string; task: Promise<boolean> } | undefined;
export function handleAuthLink(rawUrl: string): Promise<boolean> {
  let url: URL;
  try { url = new URL(rawUrl); } catch { return Promise.resolve(false); }
  if (url.protocol !== 'subly:' || !['auth', 'reset-password'].includes(url.hostname)) return Promise.resolve(false);
  const code = url.searchParams.get('code');
  const recovery = url.hostname === 'reset-password';
  const message = url.searchParams.get('error_description');
  if (message) return Promise.reject(new Error(message));
  if (!code) return Promise.resolve(false);
  if (pending?.code === code) return pending.task;
  const task = supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
    if (error) throw error;
    return recovery;
  });
  pending = { code, task };
  return task;
}
