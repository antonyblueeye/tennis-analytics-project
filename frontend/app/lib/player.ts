/** Parses ATP dob format: 19320918 or 19320918.0 → Date */
export function parseDob(dob: string | number | null | undefined): Date | null {
  if (dob == null || dob === '') return null;

  const digits = String(dob).replace(/[^\d]/g, '');
  if (digits.length < 8) return null;

  const y = parseInt(digits.slice(0, 4), 10);
  const m = parseInt(digits.slice(4, 6), 10) - 1;
  const d = parseInt(digits.slice(6, 8), 10);
  const date = new Date(y, m, d);

  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function calcAge(birthDate: Date, onDate = new Date()): number {
  let age = onDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = onDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && onDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/** e.g. "15 September 1936 (89)" */
export function formatDobWithAge(dob: string | number | null | undefined): string {
  const date = parseDob(dob);
  if (!date) return '—';

  const formatted = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const age = calcAge(date);
  return `${formatted} (${age})`;
}
