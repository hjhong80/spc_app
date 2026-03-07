import React, { useCallback, useEffect, useState } from 'react';
import { Box } from '@mui/material';
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
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadStatus, setUploadStatus] = useState('info');

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
                return;
            }

            setSelectedFiles(normalizedFiles);
            setUploadMessage('');
            setUploadStatus('info');

            if (!lotNo.trim() && normalizedFiles.length === 1) {
                const baseName = getDefaultLotNoFromFileName(normalizedFiles[0].name);
                setLotNo(baseName);
            }
        },
        [lotNo],
    );

    const handleUpload = useCallback(async () => {
        if (!Array.isArray(selectedFiles) || selectedFiles.length === 0) {
            setUploadMessage('업로드할 파일을 먼저 선택해주세요.');
            setUploadStatus('error');
            return;
        }

        if (!selectedProjectId) {
            setUploadMessage('프로젝트를 먼저 선택해주세요.');
            setUploadStatus('error');
            return;
        }

        setIsUploading(true);
        setUploadMessage('');
        setUploadStatus('info');

        try {
            const uploadResults = [];

            for (let index = 0; index < selectedFiles.length; index += 1) {
                const file = selectedFiles[index];
                const resolvedLotNo = resolveLotNoForFile(
                    file,
                    index,
                    selectedFiles.length,
                    lotNo,
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
                        setUploadMessage(
                            `${onlyBody?.message || '이미 등록된 serialNo 이므로 신규 등록을 스킵했습니다.'} serial_no: ${parsedSerialNo}, insp_dt: ${parsedInspDt}`,
                        );
                        setUploadStatus('info');
                    } else {
                        setUploadMessage(
                            `${onlyBody?.message || '성적서 업로드가 완료되었습니다.'} 행 수: ${parsedCount}, serial_no: ${parsedSerialNo}, insp_dt: ${parsedInspDt}`,
                        );
                        setUploadStatus('success');
                    }
                } else {
                    const totalParsedCount = insertedResults.reduce((acc, result) => {
                        return acc + (result?.body?.data?.parsedRowCount ?? 0);
                    }, 0);
                    setUploadMessage(
                        `${successResults.length}개 파일 처리 완료 (저장 ${insertedResults.length}개, 중복 스킵 ${skippedResults.length}개). 총 파싱 행 수: ${totalParsedCount}`,
                    );
                    setUploadStatus(
                        skippedResults.length > 0 ? 'info' : 'success',
                    );
                }
                setSelectedFiles([]);
            } else if (successResults.length === 0) {
                setUploadMessage(
                    `업로드 실패: ${failedResults.length}개 파일 모두 실패했습니다. ${failedResults
                        .slice(0, 2)
                        .map((result) => `${result.file?.name}: ${result.errorMessage}`)
                        .join(' | ')}`,
                );
                setUploadStatus('error');
            } else {
                const totalParsedCount = insertedResults.reduce((acc, result) => {
                    return acc + (result?.body?.data?.parsedRowCount ?? 0);
                }, 0);
                setUploadMessage(
                    `부분 완료: 성공 ${successResults.length}개(저장 ${insertedResults.length}개, 중복 스킵 ${skippedResults.length}개), 실패 ${failedResults.length}개, 총 파싱 행 수 ${totalParsedCount}. 실패 예시: ${failedResults
                        .slice(0, 2)
                        .map((result) => `${result.file?.name}: ${result.errorMessage}`)
                        .join(' | ')}`,
                );
                setUploadStatus('info');
                setSelectedFiles(failedResults.map((result) => result.file).filter(Boolean));
            }

            await Promise.all([loadProjectList(searchKeyword), loadRecentProjects()]);
        } catch (error) {
            setUploadMessage(
                error?.response?.data?.message ||
                    error?.message ||
                    '성적서 업로드 중 오류가 발생했습니다.',
            );
            setUploadStatus('error');
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
                    message={uploadMessage}
                    messageType={uploadStatus}
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
        </SpcDataLayout>
    );
};

export default SpcData;
