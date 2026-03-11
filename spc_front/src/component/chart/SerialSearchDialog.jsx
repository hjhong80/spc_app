import React from 'react';
import {
    Alert,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { formatDateTimeLabel } from '../../utils/chartDate';

const SerialSearchDialog = ({
    open,
    value,
    candidates = [],
    isLoading = false,
    statusMessage,
    statusSeverity = 'info',
    onChange,
    onSelectCandidate,
    onSubmit,
    onClose,
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>시리얼 검색</DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    autoFocus
                    fullWidth
                    label="serialNo"
                    value={value}
                    onChange={(event) => onChange?.(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key !== 'Enter') {
                            return;
                        }
                        event.preventDefault();
                        onSubmit?.();
                    }}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="시리얼 검색 실행"
                                        edge="end"
                                        onClick={() => onSubmit?.()}
                                    >
                                        <SearchIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                {isLoading ? (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        시리얼 후보를 불러오는 중입니다.
                    </Typography>
                ) : null}
                {statusMessage ? <Alert severity={statusSeverity}>{statusMessage}</Alert> : null}
                {candidates.length > 0 ? (
                    <Paper variant="outlined">
                        <List dense disablePadding>
                            {candidates.map((candidate) => (
                                <ListItemButton
                                    key={`${candidate.serialNo}-${candidate.inspDt || 'no-date'}`}
                                    onClick={() => onSelectCandidate?.(candidate)}
                                >
                                    <ListItemText
                                        primary={candidate.serialNo}
                                        secondary={
                                            candidate.inspDt
                                                ? formatDateTimeLabel(candidate.inspDt)
                                                : '-'
                                        }
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    </Paper>
                ) : null}
            </DialogContent>
        </Dialog>
    );
};

export default SerialSearchDialog;
