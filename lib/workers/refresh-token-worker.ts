/**
 * Script del Worker en formato Blob para crear el worker inline
 * Esto evita problemas de CORS y permite usar el worker sin archivos externos
 * 
 * Este worker maneja el timer de verificación del refresh token
 */

const workerScript = `
let checkInterval = null;
let accessTokenExpiresAt = 0;
let refreshTokenExpiresAt = 0;

const REFRESH_THRESHOLD_MS = 30 * 1000; // 30 segundos antes de expirar
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
  const accessTokenExpiresIn = accessTokenExpiresAt - now;
  const refreshTokenExpiresIn = refreshTokenExpiresAt - now;

  // Si el refresh token ya expiró, notificar para hacer logout
  if (refreshTokenExpiresIn <= 0) {
    self.postMessage({ type: 'SESSION_EXPIRED' });
    clearCheckInterval();
    return;
  }

  // Si el access token expira en menos de 30 segundos (y no expiró hace mucho)
  if (accessTokenExpiresIn <= REFRESH_THRESHOLD_MS && accessTokenExpiresIn > -60000) {
    self.postMessage({ type: 'NEEDS_REFRESH' });
    return;
  }

  // Si el access token ya expiró pero el refresh token está vigente
  if (accessTokenExpiresIn <= 0 && refreshTokenExpiresIn > 0) {
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
      startCheckInterval();
      break;

    case 'CLEAR':
      accessTokenExpiresAt = 0;
      refreshTokenExpiresAt = 0;
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

/**
 * Crea una instancia del worker desde el código inline
 */
export const createRefreshTokenWorker = (): Worker => {
  const blob = new Blob([workerScript], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  return new Worker(workerUrl);
};

export default createRefreshTokenWorker;

