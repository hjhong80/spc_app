import { describe, expect, it } from 'vitest';
import {
    createUploadProgressState,
    UPLOAD_PROGRESS_PHASE,
} from './spcDataUploadProgress';

describe('spcDataUploadProgress', () => {
    it('starts at zero percent for the first file upload', () => {
        expect(
            createUploadProgressState({
                totalCount: 10,
                completedCount: 0,
                phase: UPLOAD_PROGRESS_PHASE.UPLOADING,
            }),
        ).toEqual({
            percent: 0,
            completedCount: 0,
            totalCount: 10,
            phase: UPLOAD_PROGRESS_PHASE.UPLOADING,
        });
    });

    it('uses completed file count to advance progress in steps', () => {
        expect(
            createUploadProgressState({
                totalCount: 10,
                completedCount: 1,
                phase: UPLOAD_PROGRESS_PHASE.UPLOADING,
            }).percent,
        ).toBe(10);

        expect(
            createUploadProgressState({
                totalCount: 10,
                completedCount: 9,
                phase: UPLOAD_PROGRESS_PHASE.SAVING_LAST_FILE,
            }).percent,
        ).toBe(90);
    });

    it('finishes at one hundred percent only after the last response completes', () => {
        expect(
            createUploadProgressState({
                totalCount: 10,
                completedCount: 10,
                phase: UPLOAD_PROGRESS_PHASE.COMPLETED,
            }),
        ).toEqual({
            percent: 100,
            completedCount: 10,
            totalCount: 10,
            phase: UPLOAD_PROGRESS_PHASE.COMPLETED,
        });
    });
});
