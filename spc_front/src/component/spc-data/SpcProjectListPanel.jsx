import React from 'react';
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

const SpcProjectListPanel = ({
    projectList,
    selectedProjectId,
    searchKeyword,
    isLoading,
    statusMessage,
    statusType,
    onSearchKeywordChange,
    onRefresh,
    onSelectProject,
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                height: '100%',
                minHeight: 0,
                p: 2,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: 'neutral.700',
                bgcolor: 'background.paper',
            }}
        >
            <Typography
                variant="h6"
                sx={{ color: 'neutral.200', fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.4, mb: 0.5 }}
            >
                데이터 조회
            </Typography>

            <Typography variant="subtitle1" sx={{ color: 'neutral.200', fontWeight: 600, mb: 1 }}>
                프로젝트 리스트
            </Typography>
            <Typography variant="caption" sx={{ color: 'neutral.500', mb: 1 }}>
                프로젝트를 클릭하면 차트 보기 화면으로 이동합니다.
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
                {isLoading ? (
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
                ) : projectList.length === 0 ? (
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
                        {projectList.map((project) => {
                            const isSelected = selectedProjectId === project.projId;
                            return (
                                <ListItemButton
                                    key={project.projId}
                                    selected={isSelected}
                                    onClick={() => onSelectProject(project)}
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
                                            <Stack direction="row" spacing={0.6} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                                                <Chip size="small" label={`Start: ${project.dataStartRow || 1}`} />
                                                <Chip size="small" label={`Char: ${project.charNoCol || '-'}`} />
                                                <Chip
                                                    size="small"
                                                    label={`Axis: ${project.axisCol || project.axiscol || '-'}`}
                                                />
                                                <Chip size="small" label={`Nom: ${project.nominalCol || '-'}`} />
                                                <Chip
                                                    size="small"
                                                    label={`U: ${project.uTolCol || project.utolCol || '-'}`}
                                                />
                                                <Chip
                                                    size="small"
                                                    label={`L: ${project.lTolCol || project.ltolCol || '-'}`}
                                                />
                                                <Chip
                                                    size="small"
                                                    label={`M: ${project.measuredValueCol || project.measuredvaluecol || '-'}`}
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

            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ mt: 1.5, alignItems: 'stretch' }}
            >
                <TextField
                    size="small"
                    label="프로젝트 검색"
                    placeholder="번호 또는 이름"
                    value={searchKeyword}
                    onChange={(event) => onSearchKeywordChange(event.target.value)}
                    fullWidth
                    sx={{
                        flex: { sm: '0 1 78%' },
                        minWidth: 0,
                    }}
                />
                <Button
                    variant="outlined"
                    onClick={onRefresh}
                    disabled={isLoading}
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

            {statusMessage && (
                <Typography
                    variant="body2"
                    sx={{
                        mt: 1,
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
    );
};

export default SpcProjectListPanel;
