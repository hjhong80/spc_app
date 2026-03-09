export const UPLOAD_PROGRESS_PHASE = {
    IDLE: 'idle',
    UPLOADING: 'uploading',
    SAVING_LAST_FILE: 'saving_last_file',
    COMPLETED: 'completed',
};

const clampCompletedCount = (completedCount, totalCount) => {
    const normalizedCompletedCount = Number.isFinite(completedCount)
        ? Math.max(0, completedCount)
        : 0;

    if (totalCount <= 0) {
        return 0;
    }

    return Math.min(normalizedCompletedCount, totalCount);
};

export const createUploadProgressState = ({
    totalCount = 0,
    completedCount = 0,
    phase = UPLOAD_PROGRESS_PHASE.IDLE,
} = {}) => {
    const normalizedTotalCount = Number.isFinite(totalCount) ? Math.max(0, totalCount) : 0;
    const normalizedCompletedCount = clampCompletedCount(completedCount, normalizedTotalCount);

    if (normalizedTotalCount === 0 || phase === UPLOAD_PROGRESS_PHASE.IDLE) {
        return {
            percent: 0,
            completedCount: 0,
            totalCount: normalizedTotalCount,
            phase: UPLOAD_PROGRESS_PHASE.IDLE,
        };
    }

    if (phase === UPLOAD_PROGRESS_PHASE.COMPLETED) {
        return {
            percent: 100,
            completedCount: normalizedTotalCount,
            totalCount: normalizedTotalCount,
            phase,
        };
    }

    return {
        percent: Math.min(
            95,
            Math.floor((normalizedCompletedCount / normalizedTotalCount) * 100),
        ),
        completedCount: normalizedCompletedCount,
        totalCount: normalizedTotalCount,
        phase,
    };
};
