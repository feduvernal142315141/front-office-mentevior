import { JSEncrypt } from 'jsencrypt';
import { serviceGetPublicKey } from "@/lib/services/login/login"

// Cache para almacenar la clave pública
let cachedPublicKey: string | null = null;

/**
 * Obtiene la clave pública RSA desde el backend
 * La primera vez la solicita al servidor, luego usa la versión cacheada
 */
export const getPublicKey = async (): Promise<string> => {
  if (cachedPublicKey) {
    return cachedPublicKey;
  }

  try {
    const response = await serviceGetPublicKey();
    cachedPublicKey = response.data.publicKey;
    return cachedPublicKey;
  } catch (error) {
    console.error('Error al obtener la clave pública:', error);
    throw new Error('No se pudo obtener la clave pública para cifrado');
  }
};

/**
 * Limpia el cache de la clave pública
 * Útil para forzar una nueva obtención desde el servidor
 */
export const clearPublicKeyCache = (): void => {
  cachedPublicKey = null;
};

/**
 * Cifra datos usando RSA con la clave pública obtenida del backend
 * @param data Datos a cifrar
 * @returns Datos cifrados en formato string, o string vacío si falla
 */
export const encryptRsa = async (data: string): Promise<string> => {
  try {
    const publicKey = await getPublicKey();

    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);

    const value = encrypt.encrypt(data);
    if (value) {
      return value;
    }

    console.error('El cifrado RSA retornó un valor falsy');
    return '';
  } catch (error) {
    console.error('Error en encryptRsa:', error);
    return '';
  }
};
