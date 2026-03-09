import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SpcDataUploadPanel from './SpcDataUploadPanel';

vi.mock('../common/ExcelFileDropzone', () => ({
    default: () => <div data-testid="excel-dropzone">dropzone</div>,
}));

const createProps = () => ({
    files: [new File(['a'], 'sample.xlsx')],
    lotNo: '',
    projectList: [],
    recentProjects: [],
    isLoadingRecent: false,
    recentStatusMessage: '',
    recentStatusType: 'info',
    isUploading: false,
    uploadProgressPercent: 0,
    uploadProgressCompletedCount: 0,
    uploadProgressTotalCount: 0,
    uploadProgressPhase: 'idle',
    activeNotification: null,
    isNotificationVisible: false,
    onNotificationClose: vi.fn(),
    onLotNoChange: vi.fn(),
    onFilesSelect: vi.fn(),
    onSelectProject: vi.fn(),
    onUpload: vi.fn(),
});

describe('SpcDataUploadPanel', () => {
    it('renders the widened progress button with stepped upload progress', () => {
        render(
            <SpcDataUploadPanel
                {...createProps()}
                isUploading
                uploadProgressPercent={30}
                uploadProgressCompletedCount={3}
                uploadProgressTotalCount={10}
                uploadProgressPhase="uploading"
            />,
        );

        expect(screen.getByRole('heading', { name: '성적서 등록' })).toBeInTheDocument();
        const uploadButton = screen.getByRole('button', { name: /업로드 중 30%/ });
        expect(uploadButton).toBeDisabled();
        expect(screen.queryByText('3 / 10 완료')).not.toBeInTheDocument();
        expect(screen.getByTestId('upload-progress-fill')).toHaveStyle({ width: '30%' });
    });

    it('shows the last-file saving message while holding the stepped percent', () => {
        render(
            <SpcDataUploadPanel
                {...createProps()}
                isUploading
                uploadProgressPercent={90}
                uploadProgressCompletedCount={9}
                uploadProgressTotalCount={10}
                uploadProgressPhase="saving_last_file"
            />,
        );

        expect(screen.getByRole('button', { name: /업로드 중 90%/ })).toBeDisabled();
        expect(screen.queryByText('마지막 파일 저장 중')).not.toBeInTheDocument();
    });

    it('renders an inline translucent alert below the upload button', () => {
        render(
            <SpcDataUploadPanel
                {...createProps()}
                activeNotification={{
                    id: 'n-1',
                    severity: 'success',
                    message: '923개 파일 처리 완료',
                }}
                isNotificationVisible
            />,
        );

        const panel = screen.getByTestId('spc-data-upload-panel');
        expect(panel).toBeInTheDocument();
        expect(screen.getByTestId('upload-notification-popper')).toBeInTheDocument();
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('923개 파일 처리 완료');
        expect(alert).toHaveAttribute('data-severity', 'success');
        expect(panel).not.toContainElement(alert);
    });

    it('uses a growing dropzone section and keeps lot number and upload controls in a bottom group', () => {
        render(<SpcDataUploadPanel {...createProps()} />);

        expect(screen.getByTestId('upload-dropzone-section')).toHaveStyle({
            flex: '1 1 0%',
        });
        expect(screen.getByTestId('upload-bottom-controls')).toBeInTheDocument();
    });
});
