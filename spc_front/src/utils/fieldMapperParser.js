/**
 * 엑셀 필드 매핑을 위한 파싱 유틸리티
 */

/**
 * 입력값을 열 인덱스로 파싱 (A -> 0, B -> 1, 1 -> 0, "A열" -> 0)
 * @param {string} input - 열 입력값
 * @returns {number|null} 0-indexed 열 인덱스
 */
export const parseColumnInput = (input) => {
    if (!input || input.trim() === '') return null;

    const trimmed = input.trim().toUpperCase();

    // "A열", "B열" 형식 처리
    const columnMatch = trimmed.match(/^([A-Z]+)열?$/);
    if (columnMatch) {
        const letters = columnMatch[1];
        let index = 0;
        for (let i = 0; i < letters.length; i++) {
            index = index * 26 + (letters.charCodeAt(i) - 64);
        }
        return index - 1;
    }

    // 숫자 형식 처리 (1 -> 0, 2 -> 1)
    const numMatch = trimmed.match(/^(\d+)$/);
    if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        return num > 0 ? num - 1 : null;
    }

    return null;
};

/**
 * 셀 좌표 파싱 (A1 -> { col: 0, row: 0 })
 * @param {string} input - 셀 좌표 입력값 (예: "A1", "B2")
 * @returns {{ col: number, row: number }|null} 0-indexed 좌표 객체
 */
export const parseCellCoordinate = (input) => {
    if (!input || input.trim() === '') return null;
    const match = input.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;

    const letters = match[1];
    let col = 0;
    for (let i = 0; i < letters.length; i++) {
        col = col * 26 + (letters.charCodeAt(i) - 64);
    }
    const row = parseInt(match[2], 10);
    return { col: col - 1, row: row - 1 };
};

/**
 * 셀 좌표 표현식 파싱
 * - 단일: A1
 * - 콤마: B6,B7
 * - 범위: B6~B7, B6-B7, A1~C1, A1-C1
 * - 혼합: B6~B7, D1 또는 B6-B7, D1
 * @param {string} input
 * @returns {Array<{ col: number, row: number }>|null}
 */
export const parseCellCoordinateExpression = (input) => {
    if (!input || input.trim() === '') return null;

    const tokens = input
        .split(',')
        .map((token) => token.trim())
        .filter((token) => token.length > 0);

    if (tokens.length === 0) {
        return null;
    }

    const results = [];
    const uniqueKeySet = new Set();

    const appendCoordinate = (coordinate) => {
        const key = `${coordinate.col}:${coordinate.row}`;
        if (uniqueKeySet.has(key)) {
            return;
        }
        uniqueKeySet.add(key);
        results.push(coordinate);
    };

    for (const token of tokens) {
        const rangeDelimiter = token.includes('~')
            ? '~'
            : token.includes('-')
              ? '-'
              : null;

        if (rangeDelimiter) {
            const parts = token
                .split(rangeDelimiter)
                .map((part) => part.trim())
                .filter((part) => part.length > 0);
            if (parts.length !== 2) {
                return null;
            }

            const start = parseCellCoordinate(parts[0]);
            const end = parseCellCoordinate(parts[1]);
            if (!start || !end) {
                return null;
            }

            if (start.col === end.col) {
                const from = Math.min(start.row, end.row);
                const to = Math.max(start.row, end.row);
                for (let row = from; row <= to; row += 1) {
                    appendCoordinate({ col: start.col, row });
                }
                continue;
            }

            if (start.row === end.row) {
                const from = Math.min(start.col, end.col);
                const to = Math.max(start.col, end.col);
                for (let col = from; col <= to; col += 1) {
                    appendCoordinate({ col, row: start.row });
                }
                continue;
            }

            return null;
        }

        const coordinate = parseCellCoordinate(token);
        if (!coordinate) {
            return null;
        }
        appendCoordinate(coordinate);
    }

    return results.length > 0 ? results : null;
};

/**
 * 열 인덱스를 엑셀 열 문자로 변환 (0 -> A, 1 -> B, ...)
 * @param {number} index - 0-indexed 열 인덱스
 * @returns {string} 엑셀 열 문자
 */
export const getColumnLetter = (index) => {
    let letter = '';
    let temp = index;
    while (temp >= 0) {
        letter = String.fromCharCode((temp % 26) + 65) + letter;
        temp = Math.floor(temp / 26) - 1;
    }
    return letter;
};
