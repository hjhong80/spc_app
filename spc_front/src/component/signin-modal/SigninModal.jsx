import {
    Alert,
    Box,
    Button,
    ClickAwayListener,
    Grow,
    Paper,
    Popper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';

const SigninModal = ({
    open,
    anchorEl,
    title,
    usernameLabel,
    passwordLabel,
    cancelLabel,
    submitLabel,
    submitPendingLabel,
    loginForm,
    loginErrorMessage,
    isSigningIn,
    onClose,
    onSubmit,
    onUsernameChange,
    onPasswordChange,
}) => {
    const handleClickAway = (event) => {
        if (anchorEl && anchorEl.contains(event.target)) {
            return;
        }
        onClose();
    };

    return (
        <Popper
            open={open}
            anchorEl={anchorEl}
            placement="bottom-end"
            transition
            sx={{ zIndex: (theme) => theme.zIndex.modal }}
            modifiers={[
                {
                    name: 'offset',
                    options: {
                        offset: [0, 10],
                    },
                },
            ]}
        >
            {({ TransitionProps }) => (
                <Grow {...TransitionProps} style={{ transformOrigin: 'top right' }}>
                    <Paper
                        elevation={10}
                        sx={{
                            width: 360,
                            maxWidth: 'calc(100vw - 24px)',
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: 'neutral.700',
                            bgcolor: 'background.paper',
                            overflow: 'hidden',
                        }}
                    >
                        <ClickAwayListener onClickAway={handleClickAway}>
                            <Box component="form" onSubmit={onSubmit}>
                                <Box
                                    sx={{
                                        px: 2.25,
                                        py: 1.5,
                                        borderBottom: '1px solid',
                                        borderColor: 'neutral.700',
                                        bgcolor: 'rgba(255,255,255,0.02)',
                                    }}
                                >
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                        {title}
                                    </Typography>
                                </Box>

                                <Stack spacing={1.5} sx={{ px: 2.25, py: 1.75 }}>
                                    <TextField
                                        autoFocus
                                        required
                                        fullWidth
                                        label={usernameLabel}
                                        value={loginForm.username}
                                        onChange={onUsernameChange}
                                        autoComplete="username"
                                        disabled={isSigningIn}
                                    />
                                    <TextField
                                        required
                                        fullWidth
                                        type="password"
                                        label={passwordLabel}
                                        value={loginForm.password}
                                        onChange={onPasswordChange}
                                        autoComplete="current-password"
                                        disabled={isSigningIn}
                                    />
                                    {loginErrorMessage && (
                                        <Alert severity="error">{loginErrorMessage}</Alert>
                                    )}
                                </Stack>

                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{
                                        justifyContent: 'flex-end',
                                        px: 2.25,
                                        pb: 1.75,
                                    }}
                                >
                                    <Button onClick={onClose} disabled={isSigningIn}>
                                        {cancelLabel}
                                    </Button>
                                    <Button type="submit" variant="contained" disabled={isSigningIn}>
                                        {isSigningIn ? submitPendingLabel : submitLabel}
                                    </Button>
                                </Stack>
                            </Box>
                        </ClickAwayListener>
                    </Paper>
                </Grow>
            )}
        </Popper>
    );
};

export default SigninModal;
