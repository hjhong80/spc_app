import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SpcDataChartPanel from './SpcDataChartPanel';

vi.mock('react-apexcharts', async () => {
    await new Promise((resolve) => {
        setTimeout(resolve, 0);
    });

    return {
        default: ({ type }) => <div data-testid="mock-apex-chart">{type}</div>,
    };
});

describe('SpcDataChartPanel', () => {
    it('shows a loading fallback before the chart module resolves', async () => {
        render(
            <SpcDataChartPanel
                chartKey="test-chart"
                options={{ chart: { type: 'bar' } }}
                series={[]}
                isSplit={false}
            />,
        );

        expect(screen.getByText('차트 렌더러 로딩 중...')).toBeInTheDocument();
        expect(await screen.findByTestId('mock-apex-chart')).toHaveTextContent('bar');
    });
});
