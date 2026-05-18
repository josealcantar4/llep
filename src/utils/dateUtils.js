// src/utils/dateUtils.js
/**
 * Obtiene la fecha actual en formato YYYY-MM-DD ajustada a la zona horaria local.
 * Evita el bug de UTC que desplaza la fecha en horarios nocturnos.
 */
export function getLocalDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
