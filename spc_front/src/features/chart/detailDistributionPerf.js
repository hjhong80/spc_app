const roundDuration = (durationMs) => Math.max(0, Math.round(Number(durationMs) || 0));

export const formatDetailDistributionPerfSummary = ({
    durationMs,
    responseCacheStatus,
    computationCacheStatus,
}) => {
    return `정규분포 ${roundDuration(durationMs)}ms · resp ${responseCacheStatus} · compute ${computationCacheStatus}`;
};

export const buildDetailDistributionPerfPayload = ({
    durationMs,
    responseCacheStatus,
    computationCacheStatus,
    charId,
    scale,
    baseDate,
}) => {
    return {
        durationMs: roundDuration(durationMs),
        responseCacheStatus,
        computationCacheStatus,
        charId,
        scale,
        baseDate,
    };
};
