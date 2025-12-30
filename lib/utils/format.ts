import qs from "qs";
import { QueryModel } from "../models/queryModel";

export const getQueryString = (query: QueryModel) => {
  return qs.stringify(query, { arrayFormat: 'comma', encode: false });
};


export function stripBase64Header(base64: string): string {
  if (!base64) return "";

  const commaIndex = base64.indexOf(",");
  if (commaIndex === -1) return base64;

  return base64.substring(commaIndex + 1);
}

/**
 * Convierte una fecha ISO a formato relativo (ej: "2 hours ago", "3 days ago")
 * @param dateString - Fecha en formato ISO (ej: "2025-12-06T04:45:54.705+00:00")
 * @returns String con el tiempo relativo en inglés
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Si la fecha es en el futuro
  if (seconds < 0) {
    return "just now";
  }

  const intervals: { label: string; seconds: number }[] = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return count === 1
        ? `${count} ${interval.label} ago`
        : `${count} ${interval.label}s ago`;
    }
  }

  return "just now";
}

/**
 * Convierte una fecha ISO a formato relativo en español (ej: "hace 2 horas", "hace 3 días")
 * @param dateString - Fecha en formato ISO (ej: "2025-12-06T04:45:54.705+00:00")
 * @returns String con el tiempo relativo en español
 */
export function timeAgoEs(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 0) {
    return "justo ahora";
  }

  const intervals: { singular: string; plural: string; seconds: number }[] = [
    { singular: "año", plural: "años", seconds: 31536000 },
    { singular: "mes", plural: "meses", seconds: 2592000 },
    { singular: "semana", plural: "semanas", seconds: 604800 },
    { singular: "día", plural: "días", seconds: 86400 },
    { singular: "hora", plural: "horas", seconds: 3600 },
    { singular: "minuto", plural: "minutos", seconds: 60 },
    { singular: "segundo", plural: "segundos", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      const label = count === 1 ? interval.singular : interval.plural;
      return `hace ${count} ${label}`;
    }
  }

  return "justo ahora";
}