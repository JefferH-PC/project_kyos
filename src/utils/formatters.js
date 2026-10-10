const numberFormatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

export const formatMoney = (value) => numberFormatter.format(Number(value) || 0);
export const formatDecimal = (value) => numberFormatter.format(Number(value) || 0);

/**
 * Formats a YYYY-MM-DD date key according to locale.
 * - Portuguese (pt): DD/MM/YYYY (e.g. 25/12/2026)
 * - English (en): MM/DD/YYYY (e.g. 12/25/2026)
 *
 * @param {string} dateKey Format YYYY-MM-DD
 * @param {string} [locale='en'] 'pt' or 'en'
 * @returns {string} Formatted date string
 */
export const formatDateKey = (dateKey, locale = 'en') => {
    if (!dateKey || typeof dateKey !== 'string') return '';
    const parts = dateKey.slice(0, 10).split('-');
    if (parts.length !== 3) return dateKey;
    const [year, month, day] = parts;
    if (!year || !month || !day) return dateKey;

    if (locale === 'pt') {
        return `${day}/${month}/${year}`;
    }
    return `${month}/${day}/${year}`;
};

/**
 * Formats a Date object according to locale.
 * - Portuguese (pt): DD/MM/YYYY
 * - English (en): MM/DD/YYYY
 *
 * @param {Date|string|number} date Date or timestamp
 * @param {string} [locale='en'] 'pt' or 'en'
 * @returns {string}
 */
export const formatDate = (date, locale = 'en') => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());

    if (locale === 'pt') {
        return `${day}/${month}/${year}`;
    }
    return `${month}/${day}/${year}`;
};

/**
 * Formats a date with long month name according to locale.
 *
 * @param {Date|string|number} date
 * @param {string} [locale='en']
 * @returns {string}
 */
export const formatDateLong = (date, locale = 'en') => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';

    return new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(d);
};
