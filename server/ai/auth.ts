import { createClient } from '@supabase/supabase-js';
import { AiHttpError } from './errors';

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export type AccessTokenVerifier = (accessToken: string) => Promise<AuthenticatedUser | null>;

function serverSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new AiHttpError(500, 'AUTH_NOT_CONFIGURED', 'La autenticacion del servidor no esta configurada.');
  }
  return { url, publishableKey };
}

export const verifySupabaseAccessToken: AccessTokenVerifier = async (accessToken) => {
  const { url, publishableKey } = serverSupabaseConfig();
  const supabase = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email };
};

export async function authenticateBearer(
  authorization: string | string[] | undefined,
  verifyAccessToken: AccessTokenVerifier = verifySupabaseAccessToken,
) {
  if (!authorization) {
    throw new AiHttpError(401, 'MISSING_BEARER', 'Debes iniciar sesion para usar esta funcion.');
  }
  const header = Array.isArray(authorization) ? authorization[0] : authorization;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  if (!match) {
    throw new AiHttpError(401, 'INVALID_BEARER', 'La sesion enviada no es valida.');
  }

  let user: AuthenticatedUser | null;
  try {
    user = await verifyAccessToken(match[1]);
  } catch (error) {
    console.error('Supabase bearer validation failed:', error);
    if (error instanceof AiHttpError && error.status >= 500) throw error;
    throw new AiHttpError(401, 'INVALID_BEARER', 'La sesion enviada no es valida.', { cause: error });
  }
  if (!user) {
    throw new AiHttpError(401, 'INVALID_BEARER', 'La sesion enviada no es valida.');
  }
  return user;
}
