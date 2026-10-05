import { createClient } from 'npm:@supabase/supabase-js@2.116.0';

const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json' };
const reply = (status: number, payload: object) => new Response(JSON.stringify(payload), { status, headers });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' });
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return reply(401, { error: 'Authentication required' });
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return reply(503, { error: 'Service unavailable' });
  // The client cannot choose the target user. Validate the token with Supabase Auth.
  const caller = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await caller.auth.getUser(authorization.slice(7));
  if (authError || !user) return reply(401, { error: 'Invalid session' });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  // 001_initial_schema.sql uses ON DELETE CASCADE throughout the user-owned tables.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return reply(500, { error: 'Deletion failed' });
  return reply(200, { deleted: true });
});
