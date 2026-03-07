const ISO_MONTH_PATTERN = /^\d{4}-\d{2}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export const toDateObject = (value) => {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'string') {
        const text = value.trim();

        if (ISO_DATE_PATTERN.test(text)) {
            const [year, month, day] = text.split('-').map(Number);
            return new Date(year, month - 1, day);
        }

        if (ISO_MONTH_PATTERN.test(text)) {
            const [year, month] = text.split('-').map(Number);
            return new Date(year, month - 1, 1);
        }

        if (ISO_DATE_TIME_PATTERN.test(text)) {
            const [dateText, timeText] = text.slice(0, 16).split('T');
            const [year, month, day] = dateText.split('-').map(Number);
            const [hour, minute] = timeText.split(':').map(Number);
            return new Date(year, month - 1, day, hour, minute);
        }
    }

    const next = new Date(value);
    return Number.isNaN(next.getTime()) ? null : next;
};

export const toInputDateValue = (value) => {
    if (typeof value === 'string') {
        const text = value.trim();
        if (ISO_DATE_PATTERN.test(text)) {
            return text;
        }
        if (ISO_DATE_TIME_PATTERN.test(text)) {
            return text.slice(0, 10);
        }
    }

    const next = toDateObject(value);
    if (!next) {
        return '';
    }

    const year = next.getFullYear();
    const month = String(next.getMonth() + 1).padStart(2, '0');
    const day = String(next.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const toInputMonthValue = (value) => {
    if (typeof value === 'string') {
        const text = value.trim();
        if (ISO_MONTH_PATTERN.test(text)) {
            return text;
        }
        if (ISO_DATE_PATTERN.test(text) || ISO_DATE_TIME_PATTERN.test(text)) {
            return text.slice(0, 7);
        }
    }

    const next = toDateObject(value);
    if (!next) {
        return '';
    }

    const year = next.getFullYear();
    const month = String(next.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

export const formatDateTimeLabel = (value) => {
    if (typeof value === 'string') {
        const text = value.trim();
        if (ISO_DATE_TIME_PATTERN.test(text)) {
            const normalized = text.replace('T', ' ');
            if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
                return normalized;
            }
            return `${normalized.slice(0, 16)}:00`;
        }
        if (ISO_DATE_PATTERN.test(text)) {
            return `${text} 00:00:00`;
        }
    }

    const next = toDateObject(value);
    if (!next) {
        return '';
    }

    const hour = String(next.getHours()).padStart(2, '0');
    const minute = String(next.getMinutes()).padStart(2, '0');
    const second = String(next.getSeconds()).padStart(2, '0');
    return `${toInputDateValue(next)} ${hour}:${minute}:${second}`;
};

export const formatCompactDateLabel = (value) => {
    if (typeof value === 'string') {
        const text = value.trim();
        if (ISO_DATE_PATTERN.test(text) || ISO_DATE_TIME_PATTERN.test(text)) {
            return text.slice(5, 10);
        }
    }

    const next = toDateObject(value);
    if (!next) {
        return '';
    }

    const month = String(next.getMonth() + 1).padStart(2, '0');
    const day = String(next.getDate()).padStart(2, '0');
    return `${month}-${day}`;
};

export const formatCompactDateTimeLabel = (value) => {
    if (typeof value === 'string') {
        const text = value.trim();
        if (ISO_DATE_TIME_PATTERN.test(text)) {
            return `${text.slice(5, 10)} ${text.slice(11, 16)}`;
        }
        if (ISO_DATE_PATTERN.test(text)) {
            return `${text.slice(5, 10)} 00:00`;
        }
    }

    const next = toDateObject(value);
    if (!next) {
        return '';
    }

    const hour = String(next.getHours()).padStart(2, '0');
    const minute = String(next.getMinutes()).padStart(2, '0');
    return `${formatCompactDateLabel(next)} ${hour}:${minute}`;
};

export const formatCompactTimeLabel = (value) => {
    if (typeof value === 'string') {
        const text = value.trim();
        if (ISO_DATE_TIME_PATTERN.test(text)) {
            return text.slice(11, 16);
        }
    }

    const next = toDateObject(value);
    if (!next) {
        return '';
    }

    const hour = String(next.getHours()).padStart(2, '0');
    const minute = String(next.getMinutes()).padStart(2, '0');
    return `${hour}:${minute}`;
};
