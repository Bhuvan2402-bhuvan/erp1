export const ACADEMIC_YEARS = [
  '2026-2027',
  '2025-2026',
  '2024-2025',
  '2023-2024',
  '2022-2023'
];

export const DEFAULT_ACADEMIC_YEAR = '2025-2026';

/**
 * Determine the academic year string (e.g. '2025-2026') for any given Date.
 * In Indian academic calendars, the academic year starts in June (month 5, 0-indexed)
 * and ends in May of the subsequent year.
 */
export function getAcademicYear(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return DEFAULT_ACADEMIC_YEAR;

  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed: Jan=0, May=4, Jun=5, Dec=11

  // If June (5) or later, the academic year starts in current year (e.g., Jun 2025 -> '2025-2026')
  // If Jan-May (0-4), the academic year started in previous year (e.g., Feb 2026 -> '2025-2026')
  if (month >= 5) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Get the Date range (start and end) for a given academic year string.
 * e.g., '2025-2026' -> { startDate: 2025-06-01T00:00:00.000Z, endDate: 2026-05-31T23:59:59.999Z }
 */
export function getAcademicYearDateRange(academicYear) {
  if (!academicYear || academicYear === 'ALL') {
    return null;
  }

  const parts = academicYear.split('-');
  const startYear = parseInt(parts[0], 10);
  const endYear = parseInt(parts[1], 10) || startYear + 1;

  if (isNaN(startYear)) return null;

  return {
    startDate: new Date(Date.UTC(startYear, 5, 1, 0, 0, 0, 0)), // June 1st
    endDate: new Date(Date.UTC(endYear, 4, 31, 23, 59, 59, 999))  // May 31st
  };
}
