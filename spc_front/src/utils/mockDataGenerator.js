/**
 * Generates mock data for SPC (Statistical Process Control) charts.
 * The X-axis represents Characteristic IDs.
 * The Y-axis represents measurement values/variation.
 */
export const generateSPCMockData = (count = 50) => {
    const data = [];

    for (let i = 1; i <= count; i++) {
        // Characteristic ID (C-01, C-02, ...)
        const x = `C-${i.toString().padStart(2, '0')}`;

        // Mocking measurement ranges (SPC context)
        const open = Math.floor(Math.random() * 300) - 150;
        const close = Math.floor(Math.random() * 300) - 150;
        const high = Math.max(open, close) + Math.floor(Math.random() * 50);
        const low = Math.min(open, close) - Math.floor(Math.random() * 50);

        const clamp = (val) => Math.max(-200, Math.min(200, val));

        data.push({
            x: x,
            y: [clamp(open), clamp(high), clamp(low), clamp(close)],
        });
    }

    return [{ data }];
};
