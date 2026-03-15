export function formatDateDDMMYYYY(date?: string | number | Date | null): string {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());

  return `${day}/${month}/${year}`;
}

export function parseDateDDMMYYYY(value: string): string {
  if (!value) return '';
  const parts = value.split('/').map((p) => p.trim());
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  if (!/^[0-9]{2}$/.test(day) || !/^[0-9]{2}$/.test(month) || !/^[0-9]{4}$/.test(year)) return '';
  const iso = `${year}-${month}-${day}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return iso;
}

export function formatDateTimeDDMMYYYYHHMM(date?: string | number | Date | null): string {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function parseDateTimeDDMMYYYYHHMM(value: string): string {
  if (!value) return '';
  const [datePart, timePart] = value.split(' ').map((p) => p.trim());
  if (!datePart || !timePart) return '';

  const dateIso = parseDateDDMMYYYY(datePart);
  if (!dateIso) return '';

  const timeParts = timePart.split(':').map((p) => p.trim());
  if (timeParts.length !== 2) return '';
  const [hours, minutes] = timeParts;
  if (!/^[0-9]{2}$/.test(hours) || !/^[0-9]{2}$/.test(minutes)) return '';

  const iso = `${dateIso}T${hours}:${minutes}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return iso;
}
