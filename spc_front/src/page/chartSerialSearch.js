const DEFAULT_LOCAL_CANDIDATE_LIMIT = 8;

export const normalizeSerialSearchKeyword = (value) => {
    return String(value ?? '').trim();
};

const normalizeComparableSerial = (value) => {
    return normalizeSerialSearchKeyword(value).toLowerCase();
};

const resolveCandidateInspDt = (item) => {
    return item?.meta?.bucketDateTime ?? item?.meta?.bucketDate ?? null;
};

export const collectSerialSearchCandidates = (
    items,
    keyword,
    limit = DEFAULT_LOCAL_CANDIDATE_LIMIT,
) => {
    const normalizedKeyword = normalizeComparableSerial(keyword);
    if (!normalizedKeyword || !Array.isArray(items)) {
        return [];
    }

    const uniqueCandidates = new Map();
    for (const item of items) {
        const serialNo = normalizeSerialSearchKeyword(
            item?.meta?.serialNo ?? item?.meta?.serial_no,
        );
        if (!serialNo) {
            continue;
        }

        if (!normalizeComparableSerial(serialNo).startsWith(normalizedKeyword)) {
            continue;
        }

        if (!uniqueCandidates.has(serialNo)) {
            uniqueCandidates.set(serialNo, {
                serialNo,
                inspDt: resolveCandidateInspDt(item),
                source: 'local',
            });
        }

        if (uniqueCandidates.size >= limit) {
            break;
        }
    }

    return Array.from(uniqueCandidates.values()).sort((left, right) =>
        left.serialNo.localeCompare(right.serialNo),
    );
};

export const findExactSerialSearchCandidate = (candidates, serialNo) => {
    const normalizedSerialNo = normalizeComparableSerial(serialNo);
    if (!normalizedSerialNo || !Array.isArray(candidates)) {
        return null;
    }

    return (
        candidates.find(
            (candidate) =>
                normalizeComparableSerial(candidate?.serialNo) ===
                normalizedSerialNo,
        ) ?? null
    );
};
