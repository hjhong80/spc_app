import { Box, Button, IconButton, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

const DEFAULT_CONFIRM_LABEL = '\uCDE8\uC18C';
const DEFAULT_PENDING_LABEL = '\uCC98\uB9AC\uC911';
const DEFAULT_CONFIRM_MESSAGE = '\uC815\uB9D0 \uC9C4\uD589\uD560\uAE4C\uC694?';

const toButtonWidth = (labels, extraPx = 48) => {
    const maxLabelLength = Math.max(
        ...labels.map((label) => String(label ?? '').length),
        1,
    );
    return `calc(${maxLabelLength}ch + ${extraPx}px)`;
};

const ConfirmButton = ({
    label,
    icon,
    isConfirming = false,
    isPending = false,
    canConfirm = true,
    onClick,
    onConfirm,
    confirmLabel = DEFAULT_CONFIRM_LABEL,
    pendingLabel = DEFAULT_PENDING_LABEL,
    confirmMessage = DEFAULT_CONFIRM_MESSAGE,
    widthLabels,
    variant = 'contained',
    color = 'primary',
    wrapperMinWidthSm = '360px',
    hideConfirmMessageOnXs = true,
}) => {
    const normalizedLabels =
        Array.isArray(widthLabels) && widthLabels.length > 0
            ? widthLabels
            : [label, confirmLabel, pendingLabel];
    const buttonWidth = toButtonWidth(normalizedLabels);

    const currentLabel = isPending
        ? pendingLabel
        : canConfirm && isConfirming
          ? confirmLabel
          : label;

    return (
        <Box
            sx={{
                ml: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                minWidth: { xs: buttonWidth, sm: wrapperMinWidthSm },
                gap: 1,
            }}
        >
            {canConfirm && isConfirming && (
                <Box
                    sx={{
                        display: hideConfirmMessageOnXs
                            ? { xs: 'none', sm: 'inline-flex' }
                            : 'inline-flex',
                        alignItems: 'center',
                        px: 1,
                        py: 0.5,
                        borderRadius: '999px',
                        bgcolor: 'rgba(211, 47, 47, 0.16)',
                        border: '1px solid rgba(239, 154, 154, 0.45)',
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: '#ef9a9a',
                            fontWeight: 700,
                            mr: 0.5,
                        }}
                    >
                        {confirmMessage}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={onConfirm}
                        disabled={isPending}
                        sx={{
                            color: '#a5d6a7',
                            '&:hover': {
                                bgcolor: 'rgba(46, 125, 50, 0.22)',
                            },
                        }}
                    >
                        <CheckIcon fontSize="small" />
                    </IconButton>
                </Box>
            )}

            <Button
                onClick={onClick}
                disabled={isPending}
                variant={variant}
                color={color}
                startIcon={icon}
                sx={{
                    width: buttonWidth,
                    minWidth: buttonWidth,
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                    borderRadius: '10px',
                }}
            >
                {currentLabel}
            </Button>
        </Box>
    );
};

export default ConfirmButton;
