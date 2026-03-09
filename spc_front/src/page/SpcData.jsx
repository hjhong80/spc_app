import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, IconButton, Popover, Typography } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import { useNavigate } from 'react-router-dom';

import { navigateBackOrFallback } from '../utils/navigation';
import useDebounce from '../utils/useDebounce';
import { getProjectByKeyword, getProjectList } from '../apis/generated/project-controller/project-controller';
import { getRecentlyProjectList } from '../apis/generated/report-controller/report-controller';
import { upload } from '../apis/generated/excel-controller/excel-controller';
import { usePrincipalStore } from '../store/principalStore';
import SpcDataLayout from '../component/spc-data/SpcDataLayout';
import SpcDataUploadPanel from '../component/spc-data/SpcDataUploadPanel';
import SpcProjectListPanel from '../component/spc-data/SpcProjectListPanel';
import UnifiedHeaderBar from '../component/common/UnifiedHeaderBar';
import { createUploadProgressState, UPLOAD_PROGRESS_PHASE } from './spcDataUploadProgress';
import {
    appendUploadNotification,
    createUploadNotification,
    getHighestUploadNotificationSeverity,
    resolveUploadNotificationSeverity,
    UPLOAD_NOTIFICATION_SEVERITY,
} from './spcDataUploadNotifications';

const LOGIN_REQUIRED_MESSAGE = '로그인 후 이용 가능합니다.';

const getDefaultLotNoFromFileName = (fileName) => {
    const baseName = String(fileName || '')
        .replace(/\.[^/.]+$/, '')
        .trim();
    return baseName || '';
};

const resolveLotNoForFile = (file, fileIndex, totalCount, rawLotNo) => {
    const normalizedLotNo = String(rawLotNo || '').trim();
    const fileLotNo = getDefaultLotNoFromFileName(file?.name);

    if (totalCount <= 1) {
        return normalizedLotNo || fileLotNo || `LOT-${fileIndex + 1}`;
    }

    if (normalizedLotNo) {
        return `${normalizedLotNo}-${String(fileIndex + 1).padStart(2, '0')}`;
    }

    return fileLotNo || `LOT-${fileIndex + 1}`;
};

const SpcData = () => {
    const navigate = useNavigate();

    const isAuthenticated = usePrincipalStore((state) => state.isAuthenticated);
    const isPrincipalLoading = usePrincipalStore((state) => state.isLoading);
    const fetchPrincipal = usePrincipalStore((state) => state.fetchPrincipal);

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [lotNo, setLotNo] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(() => createUploadProgressState());
    const [uploadNotifications, setUploadNotifications] = useState([]);
    const [activeUploadNotification, setActiveUploadNotification] = useState(null);
    const [isUploadNotificationVisible, setIsUploadNotificationVisible] = useState(false);
    const [uploadMessageAnchorEl, setUploadMessageAnchorEl] = useState(null);

    const [projectList, setProjectList] = useState([]);
    const [recentProjects, setRecentProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const debouncedSearchKeyword = useDebounce(searchKeyword, 300);

    const [isLoadingList, setIsLoadingList] = useState(false);
    const [listStatusMessage, setListStatusMessage] = useState('');
    const [listStatusType, setListStatusType] = useState('info');

    const [isLoadingRecent, setIsLoadingRecent] = useState(false);
    const [recentStatusMessage, setRecentStatusMessage] = useState('');
    const [recentStatusType, setRecentStatusType] = useState('info');
    const highestUploadNotificationSeverity = useMemo(
        () => getHighestUploadNotificationSeverity(uploadNotifications),
        [uploadNotifications],
    );
    const uploadMessageIconColor = {
        [UPLOAD_NOTIFICATION_SEVERITY.SUCCESS]: '#66bb6a',
        [UPLOAD_NOTIFICATION_SEVERITY.WARNING]: '#ffb74d',
        [UPLOAD_NOTIFICATION_SEVERITY.ERROR]: '#ff5f6d',
    }[highestUploadNotificationSeverity || UPLOAD_NOTIFICATION_SEVERITY.SUCCESS];

    const handleBack = useCallback(() => {
        navigateBackOrFallback(navigate, '/');
    }, [navigate]);

    const handleHome = useCallback(() => {
        navigate('/');
    }, [navigate]);

    const showListStatus = useCallback((message, type = 'info') => {
        setListStatusMessage(message);
        setListStatusType(type);
    }, []);

    const showRecentStatus = useCallback((message, type = 'info') => {
        setRecentStatusMessage(message);
        setRecentStatusType(type);
    }, []);

    const pushUploadNotification = useCallback((severity, message) => {
        const notification = createUploadNotification({ severity, message });
        setUploadNotifications((prev) => appendUploadNotification(prev, notification));
        setActiveUploadNotification(notification);
        setIsUploadNotificationVisible(true);
    }, []);

    const handleUploadNotificationClose = useCallback((_, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setIsUploadNotificationVisible(false);
    }, []);

    const handleUploadMessageIconClick = useCallback((event) => {
        setUploadMessageAnchorEl(event.currentTarget);
    }, []);

    const handleUploadMessagePopoverClose = useCallback(() => {
        setUploadMessageAnchorEl(null);
    }, []);

    useEffect(() => {
        if (!isUploadNotificationVisible || !activeUploadNotification) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            setIsUploadNotificationVisible(false);
        }, 5000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [activeUploadNotification, isUploadNotificationVisible]);

    const ensureAuthenticated = useCallback(async () => {
        if (isPrincipalLoading) {
            showListStatus('사용자 상태를 확인 중입니다.', 'info');
            return false;
        }

        if (isAuthenticated) {
            return true;
        }

        const refreshedPrincipal = await fetchPrincipal();
        if (!refreshedPrincipal) {
            showListStatus(LOGIN_REQUIRED_MESSAGE, 'error');
            showRecentStatus(LOGIN_REQUIRED_MESSAGE, 'error');
            return false;
        }

        return true;
    }, [fetchPrincipal, isAuthenticated, isPrincipalLoading, showListStatus, showRecentStatus]);

    const loadProjectList = useCallback(
        async (keyword = '') => {
            const canProceed = await ensureAuthenticated();
            if (!canProceed) {
                setProjectList([]);
                return;
            }

            const normalizedKeyword = keyword.trim();

            setIsLoadingList(true);
            try {
                const response = normalizedKeyword
                    ? await getProjectByKeyword({ keyword: normalizedKeyword })
                    : await getProjectList();
                const body = response?.data;
                if (body?.status !== 'success') {
                    throw new Error(body?.message || '프로젝트 목록을 불러오지 못했습니다.');
                }

                const list = Array.isArray(body?.data) ? body.data : [];
                setProjectList(list);

                if (
                    selectedProjectId !== null &&
                    !list.some((project) => project.projId === selectedProjectId)
                ) {
                    setSelectedProjectId(null);
                }

                if (normalizedKeyword && list.length === 0) {
                    showListStatus('검색 결과가 없습니다.', 'info');
                } else {
                    setListStatusMessage('');
                    setListStatusType('info');
                }
            } catch (error) {
                showListStatus(
                    error?.response?.data?.message ||
                        error?.message ||
                        '프로젝트 목록을 불러오는 중 오류가 발생했습니다.',
                    'error',
                );
            } finally {
                setIsLoadingList(false);
            }
        },
        [ensureAuthenticated, selectedProjectId, showListStatus],
    );

    const loadRecentProjects = useCallback(async () => {
        const canProceed = await ensureAuthenticated();
        if (!canProceed) {
            setRecentProjects([]);
            return;
        }

        setIsLoadingRecent(true);
        try {
            const response = await getRecentlyProjectList();
            const body = response?.data;
            if (body?.status !== 'success') {
                throw new Error(body?.message || '최근 사용 프로젝트를 불러오지 못했습니다.');
            }

            const list = Array.isArray(body?.data) ? body.data : [];
            setRecentProjects(
                list
                    .filter((project) => project?.projId !== undefined && project?.projId !== null)
                    .map((project) => ({
                        projId: project.projId,
                        projNum: '',
                        projName: project?.projName || '',
                    })),
            );

            if (list.length === 0) {
                showRecentStatus(body?.message || '최근 사용한 프로젝트가 없습니다.', 'info');
            } else {
                setRecentStatusMessage('');
                setRecentStatusType('info');
            }
        } catch (error) {
            setRecentProjects([]);
            showRecentStatus(
                error?.response?.data?.message ||
                    error?.message ||
                    '최근 사용 프로젝트를 불러오는 중 오류가 발생했습니다.',
                'error',
            );
        } finally {
            setIsLoadingRecent(false);
        }
    }, [ensureAuthenticated, showRecentStatus]);

    useEffect(() => {
        loadProjectList(debouncedSearchKeyword);
    }, [debouncedSearchKeyword, loadProjectList]);

    useEffect(() => {
        loadRecentProjects();
    }, [loadRecentProjects]);

    const handleRefresh = useCallback(async () => {
        await Promise.all([loadProjectList(searchKeyword), loadRecentProjects()]);
    }, [loadProjectList, loadRecentProjects, searchKeyword]);

    const handleUploadFilesSelect = useCallback(
        (files) => {
            const normalizedFiles = Array.isArray(files) ? files.filter(Boolean) : [];
            if (normalizedFiles.length === 0) {
                setSelectedFiles([]);
                setUploadProgress(createUploadProgressState());
                return;
            }

            setSelectedFiles(normalizedFiles);
            setUploadProgress(createUploadProgressState());

            if (!lotNo.trim() && normalizedFiles.length === 1) {
                const baseName = getDefaultLotNoFromFileName(normalizedFiles[0].name);
                setLotNo(baseName);
            }
        },
        [lotNo],
    );

    const handleUpload = useCallback(async () => {
        if (!Array.isArray(selectedFiles) || selectedFiles.length === 0) {
            const message = '업로드할 파일을 먼저 선택해주세요.';
            pushUploadNotification(UPLOAD_NOTIFICATION_SEVERITY.ERROR, message);
            return;
        }

        if (!selectedProjectId) {
            const message = '프로젝트를 먼저 선택해주세요.';
            pushUploadNotification(UPLOAD_NOTIFICATION_SEVERITY.ERROR, message);
            return;
        }

        setIsUploading(true);

        try {
            const uploadResults = [];
            const totalFileCount = selectedFiles.length;

            for (let index = 0; index < selectedFiles.length; index += 1) {
                const file = selectedFiles[index];
                const resolvedLotNo = resolveLotNoForFile(
                    file,
                    index,
                    selectedFiles.length,
                    lotNo,
                );
                const isLastFile = index === totalFileCount - 1;

                setUploadProgress(
                    createUploadProgressState({
                        totalCount: totalFileCount,
                        completedCount: index,
                        phase: isLastFile
                            ? UPLOAD_PROGRESS_PHASE.SAVING_LAST_FILE
                            : UPLOAD_PROGRESS_PHASE.UPLOADING,
                    }),
                );

                try {
                    const response = await upload(
                        { file },
                        { lotNo: resolvedLotNo, projId: selectedProjectId },
                    );
                    const body = response?.data;

                    if (body?.status !== 'success') {
                        throw new Error(body?.message || '성적서 업로드에 실패했습니다.');
                    }
                    const preview = body?.data || {};
                    const skippedDuplicateSerialNo = Boolean(
                        preview?.skippedDuplicateSerialNo,
                    );

                    uploadResults.push({
                        file,
                        success: true,
                        lotNo: resolvedLotNo,
                        body,
                        skippedDuplicateSerialNo,
                    });

                    console.groupCollapsed('[SPC Upload Parse Preview]');
                    console.log('request', {
                        projId: selectedProjectId,
                        requestLotNo: resolvedLotNo,
                        fileName: file?.name,
                    });
                    console.log('responseBody', body);
                    console.log('previewData', body?.data);
                    console.groupEnd();
                } catch (fileError) {
                    uploadResults.push({
                        file,
                        success: false,
                        lotNo: resolvedLotNo,
                        errorMessage:
                            fileError?.response?.data?.message ||
                            fileError?.message ||
                            '성적서 업로드 중 오류가 발생했습니다.',
                    });
                }
            }

            setUploadProgress(
                createUploadProgressState({
                    totalCount: totalFileCount,
                    completedCount: totalFileCount,
                    phase: UPLOAD_PROGRESS_PHASE.COMPLETED,
                }),
            );

            const successResults = uploadResults.filter((result) => result.success);
            const skippedResults = successResults.filter(
                (result) => result.skippedDuplicateSerialNo,
            );
            const insertedResults = successResults.filter(
                (result) => !result.skippedDuplicateSerialNo,
            );
            const failedResults = uploadResults.filter((result) => !result.success);

            if (failedResults.length === 0) {
                if (successResults.length === 1) {
                    const onlyBody = successResults[0].body;
                    const isSkipped = Boolean(successResults[0].skippedDuplicateSerialNo);
                    const parsedCount = onlyBody?.data?.parsedRowCount ?? 0;
                    const parsedSerialNo = onlyBody?.data?.serialNo || '-';
                    const parsedInspDt = onlyBody?.data?.inspDt || '-';

                    if (isSkipped) {
                        const message = `${onlyBody?.message || '이미 등록된 serialNo 이므로 신규 등록을 스킵했습니다.'} serial_no: ${parsedSerialNo}, insp_dt: ${parsedInspDt}`;
                        pushUploadNotification(UPLOAD_NOTIFICATION_SEVERITY.WARNING, message);
                    } else {
                        const message = `${onlyBody?.message || '성적서 업로드가 완료되었습니다.'} 행 수: ${parsedCount}, serial_no: ${parsedSerialNo}, insp_dt: ${parsedInspDt}`;
                        pushUploadNotification(UPLOAD_NOTIFICATION_SEVERITY.SUCCESS, message);
                    }
                } else {
                    const totalParsedCount = insertedResults.reduce((acc, result) => {
                        return acc + (result?.body?.data?.parsedRowCount ?? 0);
                    }, 0);
                    const message = `${successResults.length}개 파일 처리 완료 (저장 ${insertedResults.length}개, 중복 스킵 ${skippedResults.length}개). 총 파싱 행 수: ${totalParsedCount}`;
                    pushUploadNotification(
                        resolveUploadNotificationSeverity({
                            failedCount: 0,
                            skippedCount: skippedResults.length,
                            totalCount: successResults.length,
                        }),
                        message,
                    );
                }
                setSelectedFiles([]);
            } else if (successResults.length === 0) {
                const message = `업로드 실패: ${failedResults.length}개 파일 모두 실패했습니다. ${failedResults
                    .slice(0, 2)
                    .map((result) => `${result.file?.name}: ${result.errorMessage}`)
                    .join(' | ')}`;
                pushUploadNotification(UPLOAD_NOTIFICATION_SEVERITY.ERROR, message);
            } else {
                const totalParsedCount = insertedResults.reduce((acc, result) => {
                    return acc + (result?.body?.data?.parsedRowCount ?? 0);
                }, 0);
                const message = `부분 완료: 성공 ${successResults.length}개(저장 ${insertedResults.length}개, 중복 스킵 ${skippedResults.length}개), 실패 ${failedResults.length}개, 총 파싱 행 수 ${totalParsedCount}. 실패 예시: ${failedResults
                    .slice(0, 2)
                    .map((result) => `${result.file?.name}: ${result.errorMessage}`)
                    .join(' | ')}`;
                pushUploadNotification(UPLOAD_NOTIFICATION_SEVERITY.ERROR, message);
                setSelectedFiles(failedResults.map((result) => result.file).filter(Boolean));
            }

            await Promise.all([loadProjectList(searchKeyword), loadRecentProjects()]);
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                '성적서 업로드 중 오류가 발생했습니다.';
            pushUploadNotification(UPLOAD_NOTIFICATION_SEVERITY.ERROR, message);
        } finally {
            setIsUploading(false);
        }
    }, [
        loadProjectList,
        loadRecentProjects,
        lotNo,
        searchKeyword,
        selectedFiles,
        selectedProjectId,
    ]);

    const handleUploadPanelProjectSelect = useCallback((project) => {
        setSelectedProjectId(project?.projId ?? null);
    }, []);

    const handleProjectListSelect = useCallback(
        (project) => {
            setSelectedProjectId(project?.projId ?? null);
            navigate('/chart', {
                state: {
                    project: project || null,
                },
            });
        },
        [navigate],
    );

    const header = (
        <UnifiedHeaderBar
            title="데이터 입력/조회"
            onBack={handleBack}
            onHome={handleHome}
            showNavigationButtons
            rightSlot={
                uploadNotifications.length > 0 ? (
                    <IconButton
                        size="small"
                        onClick={handleUploadMessageIconClick}
                        sx={{
                            color: uploadMessageIconColor,
                            '&:hover': {
                                bgcolor:
                                    highestUploadNotificationSeverity === UPLOAD_NOTIFICATION_SEVERITY.ERROR
                                        ? 'rgba(255,95,109,0.12)'
                                        : highestUploadNotificationSeverity === UPLOAD_NOTIFICATION_SEVERITY.WARNING
                                          ? 'rgba(255,183,77,0.12)'
                                          : 'rgba(102,187,106,0.12)',
                            },
                        }}
                        title="업로드 메시지 보기"
                    >
                        <MessageIcon fontSize="small" />
                    </IconButton>
                ) : null
            }
        />
    );

    return (
        <SpcDataLayout header={header}>
            <Box
                sx={{
                    display: 'flex',
                    flex: 1,
                    minHeight: 0,
                    minWidth: 0,
                    gap: 2,
                    flexDirection: { xs: 'column', lg: 'row' },
                }}
            >
                <SpcDataUploadPanel
                    files={selectedFiles}
                    lotNo={lotNo}
                    projectList={projectList}
                    recentProjects={recentProjects}
                    isLoadingRecent={isLoadingRecent}
                    recentStatusMessage={recentStatusMessage}
                    recentStatusType={recentStatusType}
                    isUploading={isUploading}
                    uploadProgressPercent={uploadProgress.percent}
                    uploadProgressCompletedCount={uploadProgress.completedCount}
                    uploadProgressTotalCount={uploadProgress.totalCount}
                    uploadProgressPhase={uploadProgress.phase}
                    activeNotification={activeUploadNotification}
                    isNotificationVisible={isUploadNotificationVisible}
                    onNotificationClose={handleUploadNotificationClose}
                    onLotNoChange={setLotNo}
                    onFilesSelect={handleUploadFilesSelect}
                    onSelectProject={handleUploadPanelProjectSelect}
                    onUpload={handleUpload}
                />

                <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', height: '100%' }}>
                    <SpcProjectListPanel
                        projectList={projectList}
                        selectedProjectId={selectedProjectId}
                        searchKeyword={searchKeyword}
                        isLoading={isLoadingList || isPrincipalLoading}
                        statusMessage={listStatusMessage}
                        statusType={listStatusType}
                        onSearchKeywordChange={setSearchKeyword}
                        onRefresh={handleRefresh}
                        onSelectProject={handleProjectListSelect}
                    />
                </Box>
            </Box>

            <Popover
                open={Boolean(uploadMessageAnchorEl)}
                anchorEl={uploadMessageAnchorEl}
                onClose={handleUploadMessagePopoverClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            minWidth: '320px',
                            maxWidth: '420px',
                            backgroundColor: 'transparent',
                            boxShadow: 'none',
                            overflow: 'visible',
                        },
                    },
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {uploadNotifications.map((notification) => (
                        <Alert
                            key={notification.id}
                            severity={notification.severity}
                            sx={{
                                bgcolor:
                                    notification.severity === UPLOAD_NOTIFICATION_SEVERITY.ERROR
                                        ? 'rgba(66, 22, 26, 0.92)'
                                        : notification.severity === UPLOAD_NOTIFICATION_SEVERITY.WARNING
                                          ? 'rgba(59, 42, 20, 0.9)'
                                          : 'rgba(22, 51, 36, 0.86)',
                                color:
                                    notification.severity === UPLOAD_NOTIFICATION_SEVERITY.ERROR
                                        ? '#ffdadd'
                                        : notification.severity === UPLOAD_NOTIFICATION_SEVERITY.WARNING
                                          ? '#ffe8c2'
                                          : '#d4f5de',
                                border:
                                    notification.severity === UPLOAD_NOTIFICATION_SEVERITY.ERROR
                                        ? '1px solid #ff5f6d'
                                        : notification.severity === UPLOAD_NOTIFICATION_SEVERITY.WARNING
                                          ? '1px solid #ffb74d'
                                          : '1px solid #66bb6a',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                                '& .MuiAlert-icon': {
                                    color:
                                        notification.severity === UPLOAD_NOTIFICATION_SEVERITY.ERROR
                                            ? '#ff5f6d'
                                            : notification.severity === UPLOAD_NOTIFICATION_SEVERITY.WARNING
                                              ? '#ffb74d'
                                              : '#66bb6a',
                                },
                            }}
                        >
                            <Typography variant="body2" sx={{ color: 'inherit' }}>
                                {notification.message}
                            </Typography>
                        </Alert>
                    ))}
                </Box>
            </Popover>
        </SpcDataLayout>
    );
};

export default SpcData;
