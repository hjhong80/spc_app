import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ExcelFileDropzone from '../common/ExcelFileDropzone';
import useDebounce from '../../utils/useDebounce';

const MAX_RECOMMENDED_PROJECT_COUNT = 3;

const normalizeProject = (project) => {
    if (!project) {
        return null;
    }

    if (project.projId === null || project.projId === undefined) {
        return null;
    }

    return {
        projId: project.projId,
        projNum: project.projNum || '',
        projName: project.projName || '',
    };
};

const buildProjectLabel = (project) => `${project?.projNum || '-'} | ${project?.projName || '-'}`;

const getProjectSearchScore = (project, keyword) => {
    const projNum = String(project?.projNum || '').toLowerCase();
    const projName = String(project?.projName || '').toLowerCase();
    let score = 0;

    if (projNum.startsWith(keyword)) {
        score += 4;
    }
    if (projName.startsWith(keyword)) {
        score += 3;
    }
    if (projNum.includes(keyword)) {
        score += 2;
    }
    if (projName.includes(keyword)) {
        score += 2;
    }

    return score;
};

const getKeywordFromFileName = (fileName) => {
    const baseName = String(fileName || '')
        .replace(/\.[^/.]+$/, '')
        .trim();
    if (!baseName) {
        return '';
    }

    return baseName.slice(0, 5);
};

const getDisplayFileName = (file) => {
    const relativePath =
        typeof file?.webkitRelativePath === 'string' ? file.webkitRelativePath : '';
    if (relativePath) {
        return relativePath;
    }
    return String(file?.name || '');
};

const SpcDataUploadPanel = ({
    files = [],
    lotNo,
    projectList = [],
    recentProjects = [],
    isLoadingRecent = false,
    recentStatusMessage = '',
    recentStatusType = 'info',
    isUploading,
    message,
    messageType,
    onLotNoChange,
    onFilesSelect,
    onSelectProject,
    onUpload,
}) => {
    const [projectKeyword, setProjectKeyword] = useState('');
    const [pinnedProject, setPinnedProject] = useState(null);
    const debouncedKeyword = useDebounce(projectKeyword, 300);

    const resolvedPinnedProject = useMemo(() => {
        if (!pinnedProject) {
            return null;
        }

        return (
            projectList.find((project) => project.projId === pinnedProject.projId) || pinnedProject
        );
    }, [pinnedProject, projectList]);

    const resolvedRecentProjects = useMemo(() => {
        return recentProjects
            .map((recentProject) => {
                return (
                    projectList.find((project) => project.projId === recentProject.projId) ||
                    recentProject
                );
            })
            .filter(Boolean)
            .slice(0, 3);
    }, [projectList, recentProjects]);

    const recommendedProjects = useMemo(() => {
        if (pinnedProject) {
            return resolvedPinnedProject ? [resolvedPinnedProject] : [];
        }

        const normalizedKeyword = debouncedKeyword.trim().toLowerCase();
        if (!normalizedKeyword) {
            return [];
        }

        return projectList
            .map((project) => ({
                project,
                score: getProjectSearchScore(project, normalizedKeyword),
            }))
            .filter((item) => item.score > 0)
            .sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }

                const aNum = String(a.project?.projNum || '');
                const bNum = String(b.project?.projNum || '');
                return aNum.localeCompare(bNum);
            })
            .slice(0, MAX_RECOMMENDED_PROJECT_COUNT)
            .map((item) => item.project);
    }, [debouncedKeyword, pinnedProject, projectList, resolvedPinnedProject]);

    const handleTogglePinnedProject = useCallback(
        (project) => {
            const normalizedProject = normalizeProject(project);
            if (!normalizedProject) {
                return;
            }

            const isPinnedNow = pinnedProject?.projId === normalizedProject.projId;
            if (isPinnedNow) {
                setPinnedProject(null);
                setProjectKeyword('');
                return;
            }

            const nextPinnedProject =
                projectList.find((listProject) => listProject.projId === normalizedProject.projId) ||
                normalizedProject;

            setPinnedProject(normalizedProject);
            setProjectKeyword(buildProjectLabel(nextPinnedProject));
            onSelectProject?.(nextPinnedProject);
        },
        [onSelectProject, pinnedProject, projectList],
    );

    const handleKeywordChange = useCallback((event) => {
        setProjectKeyword(event.target.value);
    }, []);

    const selectedFiles = useMemo(
        () => (Array.isArray(files) ? files.filter(Boolean) : []),
        [files],
    );

    const fileHelperText = useMemo(() => {
        if (selectedFiles.length === 0) {
            return '등록할 엑셀 파일 또는 폴더를 선택하세요.';
        }

        if (selectedFiles.length === 1) {
            return `선택 파일: ${getDisplayFileName(selectedFiles[0])}`;
        }

        const previewNames = selectedFiles
            .slice(0, 3)
            .map((selectedFile) => getDisplayFileName(selectedFile));
        const hiddenCount = selectedFiles.length - previewNames.length;
        if (hiddenCount > 0) {
            return `선택 파일 ${selectedFiles.length}개: ${previewNames.join(', ')} 외 ${hiddenCount}개`;
        }
        return `선택 파일 ${selectedFiles.length}개: ${previewNames.join(', ')}`;
    }, [selectedFiles]);

    const handleFilesSelect = useCallback(
        (nextFiles) => {
            const normalizedFiles = Array.isArray(nextFiles) ? nextFiles.filter(Boolean) : [];
            onFilesSelect?.(normalizedFiles);

            if (normalizedFiles.length === 0 || pinnedProject) {
                return;
            }

            const keywordFromFile = getKeywordFromFileName(normalizedFiles[0].name);
            if (keywordFromFile) {
                setProjectKeyword(keywordFromFile);
            }
        },
        [onFilesSelect, pinnedProject],
    );

    const isKeywordLocked = Boolean(pinnedProject);
    const hasKeyword = debouncedKeyword.trim().length > 0;

    return (
        <Box
            sx={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'auto',
                gap: 1.5,
                p: 2,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: 'neutral.700',
                bgcolor: 'background.paper',
            }}
        >
            <Typography variant="h6" sx={{ color: 'neutral.200', fontWeight: 700 }}>
                성적서 등록
            </Typography>
            <Typography variant="body2" sx={{ color: 'neutral.500' }}>
                엑셀 성적서를 업로드해 측정 데이터를 저장합니다.
            </Typography>
            <TextField
                size="small"
                label="프로젝트 키워드 검색"
                placeholder="프로젝트 번호 또는 이름"
                value={projectKeyword}
                onChange={handleKeywordChange}
                disabled={isUploading || isKeywordLocked}
                fullWidth
            />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                <Typography variant="caption" sx={{ color: 'neutral.500' }}>
                    최근 사용 프로젝트
                </Typography>
                {isLoadingRecent ? (
                    <Typography variant="caption" sx={{ color: 'neutral.600' }}>
                        최근 사용 프로젝트를 불러오는 중...
                    </Typography>
                ) : resolvedRecentProjects.length > 0 ? (
                    <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', rowGap: 0.8 }}>
                        {resolvedRecentProjects.map((project) => {
                            const isPinned = pinnedProject?.projId === project.projId;
                            return (
                                <Chip
                                    key={project.projId}
                                    label={buildProjectLabel(project)}
                                    size="small"
                                    clickable
                                    color={isPinned ? 'primary' : 'default'}
                                    variant={isPinned ? 'filled' : 'outlined'}
                                    onClick={() => handleTogglePinnedProject(project)}
                                />
                            );
                        })}
                    </Stack>
                ) : (
                    <Typography
                        variant="caption"
                        sx={{
                            color: recentStatusMessage
                                ? recentStatusType === 'error'
                                    ? '#ef5350'
                                    : 'neutral.500'
                                : 'neutral.600',
                        }}
                    >
                        {recentStatusMessage || '최근 사용한 프로젝트가 없습니다.'}
                    </Typography>
                )}
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.8,
                    p: 1,
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: 'neutral.700',
                    bgcolor: 'background.default',
                }}
            >
                <Typography variant="caption" sx={{ color: 'neutral.500' }}>
                    추천 프로젝트
                </Typography>
                {recommendedProjects.length > 0 ? (
                    <Stack spacing={0.6}>
                        {recommendedProjects.map((project) => {
                            const isPinned = pinnedProject?.projId === project.projId;
                            return (
                                <Button
                                    key={project.projId}
                                    variant={isPinned ? 'contained' : 'outlined'}
                                    color={isPinned ? 'primary' : 'inherit'}
                                    onClick={() => handleTogglePinnedProject(project)}
                                    sx={{
                                        justifyContent: 'flex-start',
                                        textTransform: 'none',
                                        borderColor: 'neutral.600',
                                        color: isPinned ? 'white' : 'neutral.300',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                        },
                                    }}
                                >
                                    {isPinned
                                        ? `${buildProjectLabel(project)} (고정됨 - 다시 클릭 시 해제)`
                                        : buildProjectLabel(project)}
                                </Button>
                            );
                        })}
                    </Stack>
                ) : (
                    <Typography variant="caption" sx={{ color: 'neutral.600' }}>
                        {isKeywordLocked
                            ? '고정된 프로젝트를 다시 클릭하면 해제됩니다.'
                            : hasKeyword
                              ? '추천 결과가 없습니다.'
                              : '키워드를 입력하면 추천 프로젝트 3개가 표시됩니다.'}
                    </Typography>
                )}
            </Box>

            <ExcelFileDropzone
                onFilesSelect={handleFilesSelect}
                multiple
                enableFolderSelect
                folderButtonText="폴더 선택"
                minHeight="260px"
                title="엑셀 파일/폴더를 드래그하거나"
                description="클릭해서 파일 선택, 또는 폴더 선택 버튼 사용"
                helperText={fileHelperText}
                disabled={isUploading}
            />

            <TextField
                size="small"
                label="LOT 번호 (여러 파일 업로드 시 접두사)"
                value={lotNo}
                onChange={(event) => onLotNoChange(event.target.value)}
                placeholder="예: LOT-2026-001 (미입력 시 파일명 사용)"
                disabled={isUploading}
                fullWidth
            />

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Button
                    variant="contained"
                    startIcon={<CloudUploadIcon fontSize="small" />}
                    onClick={onUpload}
                    disabled={isUploading || selectedFiles.length === 0}
                    sx={{ minWidth: 140 }}
                >
                    {isUploading ? '업로드 중...' : '업로드'}
                </Button>
                <Typography variant="caption" sx={{ color: 'neutral.500' }}>
                    {selectedFiles.length > 0
                        ? `파일 ${selectedFiles.length}개 준비 완료`
                        : '파일 미선택'}
                </Typography>
            </Stack>

            {message && (
                <Typography
                    variant="body2"
                    sx={{
                        color:
                            messageType === 'error'
                                ? '#ef5350'
                                : messageType === 'success'
                                  ? '#66bb6a'
                                  : 'neutral.400',
                    }}
                >
                    {message}
                </Typography>
            )}
        </Box>
    );
};

export default SpcDataUploadPanel;
