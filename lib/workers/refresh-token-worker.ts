/**
 * Script del Worker en formato Blob para crear el worker inline
 * Esto evita problemas de CORS y permite usar el worker sin archivos externos
 *
 * Este worker maneja el timer de verificación del refresh token
 *
 * IMPORTANTE: el backend sólo acepta refrescar mientras el access token siga
 * VIGENTE. Por eso no se espera al último momento: el hilo principal calcula
 * `refreshAt` (bastante antes del vencimiento) y aquí sólo se compara el reloj.
 */

const workerScript = `
let checkInterval = null;
let accessTokenExpiresAt = 0;
let refreshTokenExpiresAt = 0;
let refreshAt = 0;

const FALLBACK_THRESHOLD_MS = 5 * 60 * 1000; // 5 min antes de expirar si no nos dan refreshAt
const CHECK_INTERVAL_MS = 5000; // Verificar cada 5 segundos

/**
 * Limpia el intervalo de verificación
 */
const clearCheckInterval = () => {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
};

/**
 * Verifica si el token necesita ser refrescado
 */
const checkTokenExpiration = () => {
  const now = Date.now();
  // refreshTokenExpiresAt = 0 significa "no lo sabemos" (el backend no lo mandó),
  // NO "ya expiró": tratarlo como expirado cerraba la sesión sin motivo.
  const refreshExpiryKnown = refreshTokenExpiresAt > 0;

  // Sólo cerramos sesión si SABEMOS que el refresh token expiró
  if (refreshExpiryKnown && refreshTokenExpiresAt - now <= 0) {
    self.postMessage({ type: 'SESSION_EXPIRED' });
    clearCheckInterval();
    return;
  }

  const renewAt = refreshAt > 0 ? refreshAt : accessTokenExpiresAt - FALLBACK_THRESHOLD_MS;

  // Renovar en cuanto entramos en la ventana (o si el access token ya venció:
  // el hilo principal intentará igual y decidirá si la sesión terminó)
  if (now >= renewAt) {
    self.postMessage({ type: 'NEEDS_REFRESH' });
    return;
  }
};

/**
 * Inicia el intervalo de verificación
 */
const startCheckInterval = () => {
  clearCheckInterval();

  // Solo iniciar si hay datos de expiración
  if (!accessTokenExpiresAt) {
    return;
  }


  // Ejecutar verificación inicial
  checkTokenExpiration();

  // Iniciar el intervalo
  checkInterval = setInterval(() => {
    checkTokenExpiration();
  }, CHECK_INTERVAL_MS);
};

/**
 * Maneja los mensajes del hilo principal
 */
self.onmessage = function(event) {
  const { type, payload } = event.data;

  switch (type) {
    case 'SET_TOKEN_EXPIRATION':
      accessTokenExpiresAt = payload.accessTokenExpiresAt || 0;
      refreshTokenExpiresAt = payload.refreshTokenExpiresAt || 0;
      refreshAt = payload.refreshAt || 0;
      startCheckInterval();
      break;

    case 'CLEAR':
      accessTokenExpiresAt = 0;
      refreshTokenExpiresAt = 0;
      refreshAt = 0;
      clearCheckInterval();
      break;

    case 'STOP':
      clearCheckInterval();
      break;

    case 'START':
      startCheckInterval();
      break;

    default:
      console.error('[RefreshWorker] Unknown message type:', type);
  }
};
`;

export type RefreshTokenWorker = Worker & { __objectUrl?: string }

/**
 * Crea una instancia del worker desde el código inline.
 *
 * La object URL NO se revoca acá: hacerlo justo después de `new Worker()` es una
 * carrera y en algunos navegadores el worker no alcanza a cargar (y entonces la
 * sesión se queda sin nadie que la renueve). Se revoca al terminarlo.
 */
export const createRefreshTokenWorker = (): RefreshTokenWorker => {
  const blob = new Blob([workerScript], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  const worker = new Worker(workerUrl) as RefreshTokenWorker;
  worker.__objectUrl = workerUrl;
  return worker;
};

export default createRefreshTokenWorker;

