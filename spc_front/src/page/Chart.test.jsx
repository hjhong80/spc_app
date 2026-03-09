import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Chart from './Chart';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => vi.fn(),
        useLocation: () => ({
            state: {
                project: {
                    projId: null,
                    projNum: '333-333-333-0/0',
                    projName: 'SAMPLE_PARTS',
                },
            },
        }),
    };
});

vi.mock('../component/chart/DetailCharacteristicChart', () => ({
    default: () => <div data-testid="detail-characteristic-chart" />,
}));

vi.mock('../component/chart/MainCharacteristicChart', () => ({
    default: () => <div data-testid="main-characteristic-chart" />,
}));

describe('Chart', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn(() => null),
                setItem: vi.fn(),
                removeItem: vi.fn(),
            },
            writable: true,
        });
    });

    it('renders without touching chart notification context before initialization', () => {
        render(<Chart />);

        expect(screen.getByRole('heading', { name: '메인 차트' })).toBeInTheDocument();
        expect(screen.getByTestId('main-characteristic-chart')).toBeInTheDocument();
    });
});
