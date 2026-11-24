// pt-BR date formatting in the device's local time. Built by hand instead of `Intl` because
// Hermes on Android ships without full locale data, so `toLocaleDateString('pt-BR')` is unreliable.

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** `DD/MM/AAAA` */
export function formatDate(date: Date): string {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** `HH:MM` (24 h) */
export function formatTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** "Disponível offline · atualizado em DD/MM às HH:MM" (§1.5, `lastSyncAt`). */
export function formatLastSync(date: Date): string {
  return `Disponível offline · atualizado em ${pad2(date.getDate())}/${pad2(date.getMonth() + 1)} às ${formatTime(date)}`;
}
