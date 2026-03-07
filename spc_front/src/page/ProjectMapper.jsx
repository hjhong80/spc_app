import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FieldMapperContainer from '../component/project/ProjectFieldMapperContainer';
import {
    postAddProject,
    postModifyProject,
} from '../apis/generated/project-controller/project-controller';
import { navigateBackOrFallback } from '../utils/navigation';

const SUCCESS_REDIRECT_DELAY_MS = 5000;

const REQUIRED_DTO_KEYS = [
    'projNum',
    'projName',
    'dataStartRow',
    'charNoCol',
    'nominalCol',
    'uTolCol',
    'lTolCol',
    'measuredValueCol',
    'serialNumberSourceJson',
    'measurementTimeSourceJson',
];

const toNonEmptyString = (value) => {
    if (typeof value !== 'string') {
        return '';
    }
    return value.trim();
};

const toPositiveNumber = (value, fallback = 1) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
        return fallback;
    }
    return parsed;
};

const buildProjectAddReqDto = (mapperResult = {}) => {
    const serialNumberSourceJson =
        toNonEmptyString(mapperResult.serialNumberSourceJson) ||
        JSON.stringify(mapperResult.serialNumberSource || {});

    const measurementTimeSourceJson =
        toNonEmptyString(mapperResult.measurementTimeSourceJson) ||
        JSON.stringify(mapperResult.measurementTimeSource || {});

    return {
        projNum: toNonEmptyString(mapperResult.projNum),
        projName: toNonEmptyString(mapperResult.projName),
        fileName: toNonEmptyString(mapperResult.fileName),
        dataStartRow: toPositiveNumber(mapperResult.dataStartRow, 1),
        charNoCol: toNonEmptyString(mapperResult.charNoCol),
        axisCol: toNonEmptyString(mapperResult.axisCol) || null,
        nominalCol: toNonEmptyString(mapperResult.nominalCol),
        uTolCol: toNonEmptyString(mapperResult.uTolCol),
        lTolCol: toNonEmptyString(mapperResult.lTolCol),
        measuredValueCol: toNonEmptyString(mapperResult.measuredValueCol),
        serialNumberSourceJson,
        measurementTimeSourceJson,
        characteristicList: Array.isArray(mapperResult.characteristicList)
            ? mapperResult.characteristicList.map((characteristic) => ({
                  ...characteristic,
                  axis: toNonEmptyString(characteristic?.axis) || null,
              }))
            : [],
    };
};

const ProjectMapper = () => {
    const navigate = useNavigate();
    const redirectTimerRef = useRef(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRedirectPending, setIsRedirectPending] = useState(false);
    const [isSuccessSnackbarOpen, setIsSuccessSnackbarOpen] = useState(false);
    const [mapperMode, setMapperMode] = useState({
        isModifyMode: false,
        selectedProject: null,
        hasModifyChanges: true,
    });

    useEffect(() => {
        return () => {
            if (redirectTimerRef.current) {
                clearTimeout(redirectTimerRef.current);
            }
        };
    }, []);

    const handleMapperApply = useCallback(async (result) => {
        if (isSubmitting || isRedirectPending) {
            return;
        }

        const dto = buildProjectAddReqDto(result);
        const isModifyMode = Boolean(result?.isModifyMode);
        const selectedProjectId = result?.selectedProject?.projId;
        const missingRequired = REQUIRED_DTO_KEYS.filter((key) => {
            const value = dto[key];
            if (typeof value === 'number') {
                return !Number.isFinite(value);
            }
            return typeof value !== 'string' || value.length === 0;
        });

        console.groupCollapsed('[ProjectMapper] ProjectAddReqDto Preview');
        console.log('dto:', dto);
        if (missingRequired.length > 0) {
            console.warn('필수값 누락:', missingRequired);
        }
        console.groupEnd();

        if (missingRequired.length > 0) {
            return;
        }

        setIsSubmitting(true);
        try {
            const response = isModifyMode && selectedProjectId
                ? await postModifyProject(selectedProjectId, dto)
                : await postAddProject(dto);
            const body = response?.data;

            console.groupCollapsed(
                isModifyMode
                    ? '[ProjectMapper] postModifyProject Response'
                    : '[ProjectMapper] postAddProject Response',
            );
            console.log('httpStatus:', response?.status);
            console.log('body:', body);
            console.groupEnd();

            if (body?.status !== 'success') {
                console.warn(
                    isModifyMode
                        ? '프로젝트 수정 실패:'
                        : '프로젝트 저장 실패:',
                    body?.message || body,
                );
                return;
            }

            console.info(
                isModifyMode ? '프로젝트 수정 성공:' : '프로젝트 저장 성공:',
                body?.data,
            );
            setIsSuccessSnackbarOpen(true);
            setIsRedirectPending(true);
            redirectTimerRef.current = setTimeout(() => {
                navigateBackOrFallback(navigate, '/');
            }, SUCCESS_REDIRECT_DELAY_MS);
        } catch (error) {
            console.error(
                isModifyMode
                    ? '프로젝트 수정 요청 실패:'
                    : '프로젝트 저장 요청 실패:',
                error,
            );
        } finally {
            setIsSubmitting(false);
        }
    }, [isRedirectPending, isSubmitting, navigate]);

    return (
        <>
            <FieldMapperContainer
                onApply={handleMapperApply}
                onModeChange={setMapperMode}
                isApplyDisabled={isSubmitting || isRedirectPending}
                applyButtonText={
                    isRedirectPending
                        ? mapperMode.isModifyMode
                            ? '수정 완료'
                            : '등록 완료'
                        : isSubmitting
                          ? mapperMode.isModifyMode
                              ? '수정 중...'
                              : '등록 중...'
                          : mapperMode.isModifyMode
                            ? '수정'
                            : '등록'
                }
                successNoticeOpen={isSuccessSnackbarOpen}
                successNoticeMessage={
                    mapperMode.isModifyMode
                        ? '프로젝트 수정이 성공되었습니다. 5초 후 이전 페이지로 이동합니다.'
                        : '프로젝트 등록이 성공되었습니다. 5초 후 이전 페이지로 이동합니다.'
                }
            />
        </>
    );
};

export default ProjectMapper;
