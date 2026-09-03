import { next } from '@vercel/functions';

// Middleware d'authentification Basic (login/mot de passe) pour tout le site.
// Gratuit — alternative a la "Password Protection" payante de Vercel (150$/mois).
// Identifiants stockes en variables d'environnement Vercel (jamais dans le repo git).
export const config = {
  runtime: 'edge',
};

function unauthorized() {
  return new Response('Authentification requise.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Glossaire de Drissa", charset="UTF-8"',
    },
  });
}

export default function middleware(request: Request) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;

  // Si les variables ne sont pas configurees sur Vercel, on bloque tout
  // par securite plutot que de laisser le site grand ouvert.
  if (!user || !pass) {
    return unauthorized();
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return unauthorized();
  }

  const [scheme, encoded] = authHeader.split(' ');
  if (scheme !== 'Basic' || !encoded) {
    return unauthorized();
  }

  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorized();
  }

  const separatorIndex = decoded.indexOf(':');
  const providedUser = decoded.substring(0, separatorIndex);
  const providedPass = decoded.substring(separatorIndex + 1);

  if (providedUser === user && providedPass === pass) {
    return next();
  }

  return unauthorized();
}
