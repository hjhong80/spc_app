const normalizeCacheSegment = (value, fallback = '-') => {
    if (value === null || value === undefined) {
        return fallback;
    }

    const normalized = String(value).trim();
    return normalized || fallback;
};

export const buildDetailDistributionCacheKey = ({ charId, scale, baseDate }) => {
    return [
        normalizeCacheSegment(charId),
        normalizeCacheSegment(scale),
        normalizeCacheSegment(baseDate),
    ].join('::');
};

export const buildDetailDistributionComputationCacheKey = ({
    responseKey,
    curveMode,
    pointMode,
}) => {
    return [
        normalizeCacheSegment(responseKey),
        normalizeCacheSegment(curveMode),
        normalizeCacheSegment(pointMode),
    ].join('::');
};

export const upsertBoundedCacheEntry = (cache, key, value, maxSize) => {
    if (!(cache instanceof Map) || key === null || key === undefined) {
        return cache;
    }

    if (cache.has(key)) {
        cache.delete(key);
    }

    cache.set(key, value);

    const normalizedMaxSize = Number(maxSize);
    if (!Number.isFinite(normalizedMaxSize) || normalizedMaxSize <= 0) {
        return cache;
    }

    while (cache.size > normalizedMaxSize) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey === undefined) {
            break;
        }
        cache.delete(oldestKey);
    }

    return cache;
};
