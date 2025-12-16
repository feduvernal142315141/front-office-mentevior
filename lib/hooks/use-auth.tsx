"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { encryptRsa } from "../utils/encrypt";
import { serviceLoginManagerUserAuth, serviceRefreshToken } from "../services/login/login";
import useRefreshTokenWorker from "./use-refresh-token-worker";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  expiresAt: string;
}

interface TokenState {
  accessToken: string | null;
  accessTokenExpiresAt: number;
  refreshToken: string | null;
  refreshTokenExpiresAt: number;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Parsea la cadena de expiración (ej: "1h", "30m", "7d") y retorna la fecha de expiración en timestamp
 */
function parseExpiresIn(expiresIn: string, fromTimestamp?: number): number {
  const now = fromTimestamp || Date.now();
  const value = parseInt(expiresIn.slice(0, -1), 10);
  const unit = expiresIn.slice(-1).toLowerCase();

  let milliseconds = 0;

  switch (unit) {
    case "s": // segundos
      milliseconds = value * 1000;
      break;
    case "m": // minutos
      milliseconds = value * 60 * 1000;
      break;
    case "h": // horas
      milliseconds = value * 60 * 60 * 1000;
      break;
    case "d": // días
      milliseconds = value * 24 * 60 * 60 * 1000;
      break;
    default:
      // Si no tiene unidad, asumimos que ya es en segundos
      milliseconds = parseInt(expiresIn, 10) * 1000;
  }

  return now + milliseconds;
}

/**
 * Extrae la fecha de expiración del token JWT
 */
function getTokenExpiration(token: string): number {
  try {
    const decoded: any = jwtDecode(token);
    return decoded.exp * 1000; // Convertir a milisegundos
  } catch {
    return 0;
  }
}

/**
 * Decodifica el JWT y extrae la información del usuario
 */
function decodeUserFromToken(accessToken: string): AuthUser {
  const decoded: any = jwtDecode(accessToken);

  return {
    id: decoded.Id,
    email: decoded.username,
    name: decoded.fullName,
    role: decoded.role,
    permissions: decoded.permissions,
    expiresAt: new Date(decoded.exp * 1000).toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokenState, setTokenState] = useState<TokenState>({
    accessToken: null,
    accessTokenExpiresAt: 0,
    refreshToken: null,
    refreshTokenExpiresAt: 0,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Ref para evitar múltiples refresh simultáneos
  const isRefreshingRef = useRef(false);
  // Ref para acceder al tokenState actualizado en callbacks
  const tokenStateRef = useRef(tokenState);

  // Mantener la ref actualizada
  useEffect(() => {
    tokenStateRef.current = tokenState;
  }, [tokenState]);

  /**
   * Actualiza la cookie del servidor
   */
  const updateServerCookie = async (accessToken: string) => {
    try {
      await fetch("/set-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: accessToken }),
      });
    } catch (error) {
      console.error("Error updating server cookie:", error);
    }
  };

  /**
   * Guarda el estado de autenticación en localStorage
   */
  const saveAuthToStorage = useCallback(
    (userObj: AuthUser, tokens: TokenState) => {
      localStorage.setItem(
        "mv-auth",
        JSON.stringify({
          user: userObj,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          accessTokenExpiresAt: tokens.accessTokenExpiresAt,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
        })
      );
    },
    []
  );

  /**
   * Realiza el logout
   */
  const logout = useCallback(() => {
    localStorage.removeItem("mv-auth");
    setUser(null);
    setTokenState({
      accessToken: null,
      accessTokenExpiresAt: 0,
      refreshToken: null,
      refreshTokenExpiresAt: 0,
    });
    setIsAuthenticated(false);

    // Limpiar cookie del servidor
    fetch("/api/auth/logout", { method: "POST" }).catch(console.error);
  }, []);

  /**
   * Callback cuando la sesión expira (notificado por el Worker)
   */
  const handleSessionExpired = useCallback(() => {
    logout();
    window.location.href = "/login";
  }, [logout]);

  // Ref para la función de refresh (evita problemas de dependencias circulares)
  const performTokenRefreshRef = useRef<(() => Promise<void>) | null>(null);

  /**
   * Callback estable para cuando el worker detecta que necesita refresh
   * Evita que el worker se recree en cada render
   */
  const handleNeedsRefresh = useCallback(() => {
    performTokenRefreshRef.current?.();
  }, []);

  // Hook del Web Worker - usa callbacks estables para evitar recrear el worker
  const { setTokenExpiration, clearWorker, stopWorker } = useRefreshTokenWorker({
    onNeedsRefresh: handleNeedsRefresh,
    onSessionExpired: handleSessionExpired,
    enabled: hydrated && isAuthenticated,
  });

  /**
   * Ejecuta el refresh del token usando el servicio normal
   */
  const performTokenRefresh = useCallback(async () => {
    const currentTokenState = tokenStateRef.current;

    if (isRefreshingRef.current || !currentTokenState.refreshToken) {
      return;
    }

    isRefreshingRef.current = true;
    
    // Detener el worker mientras hacemos refresh para evitar múltiples llamadas
    stopWorker();

    try {

      const response = await serviceRefreshToken({
        refreshToken: currentTokenState.refreshToken,
      });


      if (response?.status !== 200) {
        console.error("[AuthProvider] Refresh failed:", response?.status, response?.data);
        // Solo hacer logout si es un error de autenticación (401, 403)
        // if (response?.status === 401 || response?.status === 403) {
          handleSessionExpired();
        // }
        return;
      }

      const {
        accessToken,
        accessExpiresIn,
        refreshToken,
        refreshExpiresIn,
      } = response.data;

      const userObj = decodeUserFromToken(accessToken);

      const newTokenState: TokenState = {
        accessToken,
        accessTokenExpiresAt: getTokenExpiration(accessToken),  // Obtener exp del JWT
        refreshToken,
        refreshTokenExpiresAt: parseExpiresIn(refreshExpiresIn),
      };

      // Actualizar estado
      setUser(userObj);
      setTokenState(newTokenState);
      setIsAuthenticated(true);

      // Guardar en localStorage
      saveAuthToStorage(userObj, newTokenState);

      // Actualizar cookie del servidor
      await updateServerCookie(accessToken);

      // Enviar nuevos tiempos de expiración al Worker
      setTokenExpiration({
        accessTokenExpiresAt: newTokenState.accessTokenExpiresAt,
        refreshTokenExpiresAt: newTokenState.refreshTokenExpiresAt,
      });
    } catch (error) {
      console.error("[AuthProvider] Refresh error:", error);
      // Solo hacer logout en errores críticos
      handleSessionExpired();
    } finally {
      isRefreshingRef.current = false;
    }
  }, [saveAuthToStorage, handleSessionExpired, setTokenExpiration, stopWorker]);

  // Mantener la ref actualizada con la función de refresh
  useEffect(() => {
    performTokenRefreshRef.current = performTokenRefresh;
  }, [performTokenRefresh]);

  /**
   * Login del usuario
   */
  const login = async (email: string, password: string) => {
    try {
      const encrypted = await encryptRsa(password);

      const response = await serviceLoginManagerUserAuth({
        email,
        password: encrypted,
      });

      if (response?.status !== 200) return false;

      const {
        accessToken,
        accessTokenExpiresIn,
        refreshToken,
        refreshTokenExpiresIn,
      } = response.data;

      const userObj = decodeUserFromToken(accessToken);

      const tokens: TokenState = {
        accessToken,
        accessTokenExpiresAt: getTokenExpiration(accessToken),
        refreshToken,
        refreshTokenExpiresAt: parseExpiresIn(refreshTokenExpiresIn),
      };

      setUser(userObj);
      setTokenState(tokens);
      setIsAuthenticated(true);

      // Guardar en localStorage
      saveAuthToStorage(userObj, tokens);

      // Actualizar cookie del servidor
      await updateServerCookie(accessToken);

      return true;
    } catch (err) {
      console.error("Login error:", err);
      return false;
    }
  };

  /**
   * Efecto para cargar el estado inicial desde localStorage
   */
  useEffect(() => {
    const stored = localStorage.getItem("mv-auth");

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const now = Date.now();

        // Verificar si los tokens expirados están guardados
        const accessTokenExpiresAt =
          parsed.accessTokenExpiresAt || getTokenExpiration(parsed.token);
        const refreshTokenExpiresAt =
          parsed.refreshTokenExpiresAt || now + 7 * 24 * 60 * 60 * 1000; // Default: 7 días

        // Si el refresh token ya expiró, no restaurar la sesión
        if (refreshTokenExpiresAt <= now) {
          console.warn("Stored refresh token expired, clearing session...");
          localStorage.removeItem("mv-auth");
          setHydrated(true);
          return;
        }

        const tokens: TokenState = {
          accessToken: parsed.token,
          accessTokenExpiresAt,
          refreshToken: parsed.refreshToken,
          refreshTokenExpiresAt,
        };

        setUser(parsed.user);
        setTokenState(tokens);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error parsing stored auth:", error);
        localStorage.removeItem("mv-auth");
      }
    }

    setHydrated(true);
  }, []);

  /**
   * Efecto para enviar los tiempos de expiración al Worker cuando cambia el token
   */
  useEffect(() => {
    if (hydrated && isAuthenticated && tokenState.accessTokenExpiresAt) {
      setTokenExpiration({
        accessTokenExpiresAt: tokenState.accessTokenExpiresAt,
        refreshTokenExpiresAt: tokenState.refreshTokenExpiresAt,
      });
    }
  }, [hydrated, isAuthenticated, tokenState.accessTokenExpiresAt, tokenState.refreshTokenExpiresAt, setTokenExpiration]);

  /**
   * Efecto para limpiar el Worker cuando se hace logout
   */
  useEffect(() => {
    if (!isAuthenticated && hydrated) {
      clearWorker();
    }
  }, [isAuthenticated, hydrated, clearWorker]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token: tokenState.accessToken,
        refreshToken: tokenState.refreshToken,
        isAuthenticated,
        hydrated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
