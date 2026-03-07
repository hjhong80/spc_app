import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    List,
    ListItemButton,
    ListItemText,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { getProjectList } from '../../apis/generated/project-controller/project-controller';
import { usePrincipalStore } from '../../store/principalStore';
import ExcelFileDropzone from '../common/ExcelFileDropzone';

const LOGIN_REQUIRED_MESSAGE = '로그인 후 이용 가능합니다.';

const toProjectFormValue = (project) => ({
    projNum: project?.projNum || '',
    projName: project?.projName || '',
    dataStartRow: project?.dataStartRow || 1,
    charNoCol: project?.charNoCol || '',
    axisCol: project?.axisCol || project?.axiscol || '',
    nominalCol: project?.nominalCol || '',
    uTolCol: project?.uTolCol || project?.utolCol || '',
    lTolCol: project?.lTolCol || project?.ltolCol || '',
    measuredValueCol:
        project?.measuredValueCol || project?.measuredvaluecol || '',
    serialNumberSourceJson:
        project?.serialNumberSourceJson || project?.serialnumbersourcejson || '',
    measurementTimeSourceJson:
        project?.measurementTimeSourceJson ||
        project?.measurementtimesourcejson ||
        '',
});

const ExcelUploader = ({ onFileSelect, onProjectFormChange, onProjectSelect }) => {
    const [projectList, setProjectList] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState('info');

    const principal = usePrincipalStore((state) => state.principal);
    const isAuthenticated = usePrincipalStore((state) => state.isAuthenticated);
    const isPrincipalLoading = usePrincipalStore((state) => state.isLoading);
    const fetchPrincipal = usePrincipalStore((state) => state.fetchPrincipal);

    const showStatus = useCallback((message, type = 'info') => {
        setStatusMessage(message);
        setStatusType(type);
    }, []);

    const ensureAuthenticated = useCallback(async () => {
        if (isPrincipalLoading) {
            showStatus('사용자 상태를 확인 중입니다.', 'info');
            return false;
        }

        if (isAuthenticated) {
            return true;
        }

        const refreshedPrincipal = await fetchPrincipal();
        if (!refreshedPrincipal) {
            showStatus(LOGIN_REQUIRED_MESSAGE, 'error');
            return false;
        }

        return true;
    }, [fetchPrincipal, isAuthenticated, isPrincipalLoading, showStatus]);

    const handleExcelFileSelect = useCallback(
        (file) => {
            onFileSelect?.(file);
        },
        [onFileSelect],
    );

    const applyProjectToForm = useCallback(
        (project) => {
            if (!project) {
                setSelectedProjectId(null);
                if (onProjectSelect) {
                    onProjectSelect(null);
                    return;
                }
                onProjectFormChange?.(toProjectFormValue(null));
                return;
            }

            if (selectedProjectId === project.projId) {
                setSelectedProjectId(null);
                if (onProjectSelect) {
                    onProjectSelect(null);
                    return;
                }
                onProjectFormChange?.(toProjectFormValue(null));
                return;
            }

            setSelectedProjectId(project.projId);
            if (onProjectSelect) {
                onProjectSelect({
                    ...project,
                    ...toProjectFormValue(project),
                });
                return;
            }
            onProjectFormChange?.(toProjectFormValue(project));
        },
        [onProjectFormChange, onProjectSelect, selectedProjectId],
    );

    const loadProjectList = useCallback(async () => {
        const canProceed = await ensureAuthenticated();
        if (!canProceed) {
            setProjectList([]);
            return;
        }

        setIsLoadingList(true);
        try {
            const response = await getProjectList();
            const body = response?.data;
            if (body?.status !== 'success') {
                throw new Error(body?.message || '프로젝트 목록을 불러오지 못했습니다.');
            }

            setProjectList(Array.isArray(body?.data) ? body.data : []);
            if (statusType === 'error' && statusMessage !== LOGIN_REQUIRED_MESSAGE) {
                setStatusMessage('');
                setStatusType('info');
            }
        } catch (error) {
            showStatus(
                error?.message || '프로젝트 목록을 불러오는 중 오류가 발생했습니다.',
                'error',
            );
        } finally {
            setIsLoadingList(false);
        }
    }, [ensureAuthenticated, showStatus, statusMessage, statusType]);

    useEffect(() => {
        loadProjectList();
    }, [loadProjectList]);

    const filteredProjectList = useMemo(() => {
        const keyword = searchKeyword.trim().toLowerCase();
        if (!keyword) {
            return projectList;
        }
        return projectList.filter((project) => {
            const number = String(project?.projNum || '').toLowerCase();
            const name = String(project?.projName || '').toLowerCase();
            return number.includes(keyword) || name.includes(keyword);
        });
    }, [projectList, searchKeyword]);

    const selectedProject = useMemo(
        () => projectList.find((project) => project.projId === selectedProjectId),
        [projectList, selectedProjectId],
    );

    const isLoginRequiredStatus = statusMessage === LOGIN_REQUIRED_MESSAGE;
    const hasPanelInfo =
        Boolean(principal?.username) ||
        Boolean(selectedProject) ||
        Boolean(statusMessage && !isLoginRequiredStatus);
    const dropzoneTitle = selectedProject
        ? '수정할 견본 엑셀 파일을 드래그하거나'
        : '등록할 견본 엑셀 파일을 드래그하거나';
    const dropzoneHelperText = selectedProject
        ? '프로젝트 수정은 견본 엑셀 파일 선택 후 다음 단계에서 진행됩니다.'
        : '신규 등록은 견본 엑셀 파일 선택 후 다음 단계에서 진행됩니다.';

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                width: '100%',
                gap: 1,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 2.5,
                    width: '100%',
                    flex: 1,
                    minHeight: 0,
                }}
            >
                <Box
                    sx={{
                        flex: { xs: '1 1 100%', md: '1.08 1 0' },
                        minWidth: 0,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        p: 2,
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: 'neutral.700',
                        bgcolor: 'background.paper',
                    }}
                >
                    <ExcelFileDropzone
                        onFileSelect={handleExcelFileSelect}
                        minHeight="100%"
                        title={dropzoneTitle}
                        helperText={dropzoneHelperText}
                    />
                </Box>

                <Box
                    sx={{
                        flex: { xs: '1 1 100%', md: '0.92 1 0' },
                        minWidth: 0,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        p: 2,
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: 'neutral.700',
                        bgcolor: 'background.paper',
                    }}
                >
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.5}
                        sx={{ mb: 1.5, alignItems: 'stretch' }}
                    >
                        <TextField
                            size="small"
                            label="프로젝트 검색"
                            placeholder="번호 또는 이름"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            fullWidth
                            sx={{
                                flex: { sm: '0 1 78%' },
                                minWidth: 0,
                            }}
                        />
                        <Button
                            variant="outlined"
                            onClick={loadProjectList}
                            disabled={isLoadingList || isPrincipalLoading}
                            sx={{
                                flex: { sm: '0 0 140px' },
                                minWidth: { sm: 140 },
                                width: { xs: '100%', sm: 140 },
                                whiteSpace: 'nowrap',
                                px: 2.5,
                            }}
                        >
                            새로고침
                        </Button>
                    </Stack>

                    <Typography
                        variant="subtitle1"
                        sx={{ color: 'neutral.200', fontWeight: 600, mb: 1 }}
                    >
                        프로젝트 리스트
                    </Typography>

                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            overflow: 'auto',
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: 'neutral.700',
                            bgcolor: 'background.default',
                        }}
                    >
                        {isLoadingList ? (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: 'neutral.500',
                                    p: 2,
                                }}
                            >
                                프로젝트 목록을 불러오는 중...
                            </Box>
                        ) : filteredProjectList.length === 0 ? (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: 'neutral.500',
                                    p: 2,
                                }}
                            >
                                표시할 프로젝트가 없습니다.
                            </Box>
                        ) : (
                            <List disablePadding>
                                {filteredProjectList.map((project) => {
                                    const isSelected =
                                        selectedProjectId === project.projId;
                                    return (
                                        <ListItemButton
                                            key={project.projId}
                                            selected={isSelected}
                                            onClick={() => applyProjectToForm(project)}
                                            sx={{
                                                borderBottom: '1px solid',
                                                borderColor: 'neutral.700',
                                                alignItems: 'flex-start',
                                                '&.Mui-selected': {
                                                    bgcolor: 'rgba(25, 118, 210, 0.16)',
                                                },
                                                '&.Mui-selected:hover': {
                                                    bgcolor: 'rgba(25, 118, 210, 0.22)',
                                                },
                                            }}
                                        >
                                            <ListItemText
                                                primary={`${project.projNum || '-'} | ${project.projName || '-'}`}
                                                secondary={
                                                    <Stack
                                                        direction="row"
                                                        spacing={0.6}
                                                        sx={{ mt: 0.5, flexWrap: 'wrap' }}
                                                    >
                                                        <Chip
                                                            size="small"
                                                            label={`Start: ${project.dataStartRow || 1}`}
                                                        />
                                                        <Chip
                                                            size="small"
                                                            label={`Char: ${project.charNoCol || '-'}`}
                                                        />
                                                        <Chip
                                                            size="small"
                                                            label={`Axis: ${project.axisCol || project.axiscol || '-'}`}
                                                        />
                                                        <Chip
                                                            size="small"
                                                            label={`Nom: ${project.nominalCol || '-'}`}
                                                        />
                                                        <Chip
                                                            size="small"
                                                            label={`Act: ${project.measuredValueCol || project.measuredvaluecol || '-'}`}
                                                        />
                                                        <Chip
                                                            size="small"
                                                            label={`UTol: ${project.uTolCol || project.utolCol || '-'}`}
                                                        />
                                                        <Chip
                                                            size="small"
                                                            label={`LTol: ${project.lTolCol || project.ltolCol || '-'}`}
                                                        />
                                                    </Stack>
                                                }
                                                primaryTypographyProps={{
                                                    color: 'neutral.200',
                                                    fontWeight: isSelected ? 700 : 500,
                                                }}
                                                secondaryTypographyProps={{
                                                    component: 'div',
                                                }}
                                            />
                                        </ListItemButton>
                                    );
                                })}
                            </List>
                        )}
                    </Box>

                    {hasPanelInfo && (
                        <Box sx={{ mt: 1.5 }}>
                            {principal?.username && (
                                <Typography
                                    variant="body2"
                                    sx={{ color: 'neutral.400', mb: 0.5 }}
                                >
                                    사용자: {principal.username}
                                </Typography>
                            )}
                            {selectedProject && (
                                <Typography
                                    variant="body2"
                                    sx={{ color: 'neutral.400', mb: 0.5 }}
                                >
                                    선택됨: {selectedProject.projNum} ({selectedProject.projName})
                                </Typography>
                            )}
                            {statusMessage && !isLoginRequiredStatus && (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color:
                                            statusType === 'error'
                                                ? '#ef5350'
                                                : statusType === 'success'
                                                  ? '#66bb6a'
                                                  : 'neutral.400',
                                    }}
                                >
                                    {statusMessage}
                                </Typography>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>

            <Box
                sx={{
                    minHeight: '28px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                {isLoginRequiredStatus && (
                    <Typography variant="body1" sx={{ color: '#ef5350' }}>
                        {statusMessage}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default ExcelUploader;
