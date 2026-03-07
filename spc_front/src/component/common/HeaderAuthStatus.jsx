import { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { signin } from '../../apis/generated/auth-controller/auth-controller';
import { clearAccessToken } from '../../apis/custom-instance';
import SigninModal from '../signin-modal/SigninModal';
import { usePrincipalStore } from '../../store/principalStore';

const AUTH_LABEL_LOGIN = '\uB85C\uADF8\uC778';
const AUTH_LABEL_LOGOUT = '\uB85C\uADF8\uC544\uC6C3';
const AUTH_LABEL_CANCEL = '\uCDE8\uC18C';
const AUTH_LABEL_CONFIRM = '\uD655\uC778';
const AUTH_LABEL_PENDING = '\uCC98\uB9AC\uC911...';
const AUTH_CONFIRM_TEXT = '\uB85C\uADF8\uC544\uC6C3\uD560\uAE4C\uC694?';
const AUTH_BUTTON_WIDTH_PX = 120;
const AUTH_CONFIRM_SLOT_WIDTH_PX = 560;
const LOGIN_MODAL_TITLE = '\uB85C\uADF8\uC778';
const LOGIN_USERNAME_LABEL = '\uC544\uC774\uB514';
const LOGIN_PASSWORD_LABEL = '\uBE44\uBC00\uBC88\uD638';
const LOGIN_ACTION_SUBMIT = '\uB85C\uADF8\uC778';
const LOGIN_ACTION_SUBMIT_PENDING = '\uB85C\uADF8\uC778 \uC911...';
const LOGIN_ERROR_REQUIRED =
    '\uC544\uC774\uB514\uC640 \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.';
const LOGIN_ERROR_FAILED =
    '\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.';
const LOGIN_ERROR_PRINCIPAL =
    '\uB85C\uADF8\uC778 \uD6C4 \uC0AC\uC6A9\uC790 \uC815\uBCF4 \uD655\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.';

const HeaderAuthStatus = ({ sx }) => {
    const navigate = useNavigate();
    const loginButtonRef = useRef(null);
    const [isLogoutConfirming, setIsLogoutConfirming] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [loginForm, setLoginForm] = useState({
        username: '',
        password: '',
    });
    const [loginErrorMessage, setLoginErrorMessage] = useState('');

    const principal = usePrincipalStore((state) => state.principal);
    const isAuthenticated = usePrincipalStore((state) => state.isAuthenticated);
    const isPrincipalLoading = usePrincipalStore((state) => state.isLoading);
    const clearPrincipal = usePrincipalStore((state) => state.clearPrincipal);
    const fetchPrincipal = usePrincipalStore((state) => state.fetchPrincipal);

    useEffect(() => {
        if (!isAuthenticated && !isPrincipalLoading) {
            fetchPrincipal();
        }
    }, [fetchPrincipal, isAuthenticated, isPrincipalLoading]);

    const handleAuthButtonClick = () => {
        if (isSigningOut) {
            return;
        }

        if (!isAuthenticated) {
            if (isLoginModalOpen) {
                handleLoginModalClose();
                return;
            }
            setLoginErrorMessage('');
            setLoginForm({ username: '', password: '' });
            setIsLoginModalOpen(true);
            return;
        }

        setIsLogoutConfirming((prev) => !prev);
    };

    const handleLogoutCancel = () => {
        if (isSigningOut) {
            return;
        }
        setIsLogoutConfirming(false);
    };

    const handleLoginModalClose = () => {
        if (isSigningIn) {
            return;
        }
        setIsLoginModalOpen(false);
    };

    const handleLoginInputChange = (key) => (event) => {
        const nextValue = event.target.value;
        setLoginForm((prev) => ({
            ...prev,
            [key]: nextValue,
        }));
        if (loginErrorMessage) {
            setLoginErrorMessage('');
        }
    };

    const handleLoginSubmit = async (event) => {
        event.preventDefault();
        if (isSigningIn) {
            return;
        }

        const username = loginForm.username.trim();
        const password = loginForm.password;

        if (!username || !password) {
            setLoginErrorMessage(LOGIN_ERROR_REQUIRED);
            return;
        }

        setIsSigningIn(true);
        setLoginErrorMessage('');

        try {
            const response = await signin({ username, password });
            const payload = response?.data;
            const nextToken = payload?.data;

            if (payload?.status !== 'success' || !nextToken) {
                setLoginErrorMessage(payload?.message || LOGIN_ERROR_FAILED);
                return;
            }

            clearAccessToken();
            window.localStorage.setItem('accessToken', nextToken);

            const principalInfo = await fetchPrincipal();
            if (!principalInfo) {
                clearAccessToken();
                setLoginErrorMessage(LOGIN_ERROR_PRINCIPAL);
                return;
            }

            setIsLoginModalOpen(false);
            setLoginForm({ username: '', password: '' });
        } catch (error) {
            setLoginErrorMessage(
                error?.response?.data?.message ||
                    error?.message ||
                    LOGIN_ERROR_FAILED,
            );
        } finally {
            setIsSigningIn(false);
        }
    };

    const handleLogoutConfirm = () => {
        if (isSigningOut) {
            return;
        }

        setIsSigningOut(true);
        clearAccessToken();
        clearPrincipal();
        setIsLogoutConfirming(false);
        setIsSigningOut(false);
        navigate('/');
    };

    useEffect(() => {
        if (!isAuthenticated && isLogoutConfirming) {
            setIsLogoutConfirming(false);
        }
    }, [isAuthenticated, isLogoutConfirming]);

    useEffect(() => {
        if (isAuthenticated && isLoginModalOpen) {
            setIsLoginModalOpen(false);
        }
    }, [isAuthenticated, isLoginModalOpen]);

    return (
        <Box
            sx={{
                ml: 'auto',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                minHeight: '44px',
                ...sx,
            }}
        >
            {isAuthenticated ? (
                <>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                            opacity: isLogoutConfirming ? 0.18 : 1,
                            transition: 'opacity 200ms ease',
                            pointerEvents: isLogoutConfirming ? 'none' : 'auto',
                        }}
                    >
                        {principal?.username && (
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'neutral.300',
                                    px: 1.5,
                                    py: 0.72,
                                    borderRadius: '999px',
                                    border: '1px solid',
                                    borderColor: 'neutral.700',
                                    bgcolor: 'rgba(255,255,255,0.04)',
                                    maxWidth: '280px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontWeight: 700,
                                    fontSize: '1.03rem',
                                }}
                                title={principal.username}
                            >
                                {principal.username}
                            </Typography>
                        )}

                        <Button
                            onClick={handleAuthButtonClick}
                            disabled={isSigningOut}
                            variant="contained"
                            color="primary"
                            startIcon={<LogoutIcon fontSize="small" />}
                            sx={{
                                width: `${AUTH_BUTTON_WIDTH_PX}px`,
                                minWidth: `${AUTH_BUTTON_WIDTH_PX}px`,
                                borderRadius: '10px',
                                fontWeight: 600,
                            }}
                        >
                            {AUTH_LABEL_LOGOUT}
                        </Button>
                    </Box>

                    <Box
                        sx={{
                            position: 'absolute',
                            right: 0,
                            top: '50%',
                            transform: isLogoutConfirming
                                ? 'translateY(-50%) scaleX(1)'
                                : 'translateY(-50%) scaleX(0.25)',
                            transformOrigin: 'right center',
                            opacity: isLogoutConfirming ? 1 : 0,
                            pointerEvents: isLogoutConfirming ? 'auto' : 'none',
                            transition: 'transform 240ms ease, opacity 200ms ease',
                            width: `${AUTH_CONFIRM_SLOT_WIDTH_PX}px`,
                            maxWidth: 'calc(100vw - 48px)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            borderRadius: '999px',
                            border: '1px solid',
                            borderColor: 'neutral.600',
                            bgcolor: 'rgba(24, 27, 33, 0.96)',
                            boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
                            px: 1,
                            py: 0.65,
                            overflow: 'hidden',
                            zIndex: 5,
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                color: 'neutral.200',
                                fontWeight: 700,
                                pl: 1,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {AUTH_CONFIRM_TEXT}
                        </Typography>

                        <Button
                            onClick={handleLogoutConfirm}
                            disabled={isSigningOut}
                            variant="contained"
                            color="error"
                            startIcon={<CheckIcon fontSize="small" />}
                            sx={{
                                width: `${AUTH_BUTTON_WIDTH_PX}px`,
                                minWidth: `${AUTH_BUTTON_WIDTH_PX}px`,
                                borderRadius: '999px',
                                fontWeight: 600,
                            }}
                        >
                            {isSigningOut ? AUTH_LABEL_PENDING : AUTH_LABEL_CONFIRM}
                        </Button>

                        <Button
                            onClick={handleLogoutCancel}
                            disabled={isSigningOut}
                            variant="contained"
                            color="primary"
                            startIcon={<CloseIcon fontSize="small" />}
                            sx={{
                                width: `${AUTH_BUTTON_WIDTH_PX}px`,
                                minWidth: `${AUTH_BUTTON_WIDTH_PX}px`,
                                borderRadius: '999px',
                                fontWeight: 600,
                            }}
                        >
                            {AUTH_LABEL_CANCEL}
                        </Button>
                    </Box>
                </>
            ) : (
                <Button
                    ref={loginButtonRef}
                    onClick={handleAuthButtonClick}
                    variant="contained"
                    color="primary"
                    startIcon={<LoginIcon fontSize="small" />}
                    sx={{
                        width: `${AUTH_BUTTON_WIDTH_PX}px`,
                        minWidth: `${AUTH_BUTTON_WIDTH_PX}px`,
                        borderRadius: '10px',
                        fontWeight: 600,
                    }}
                >
                    {AUTH_LABEL_LOGIN}
                </Button>
            )}

            <SigninModal
                open={isLoginModalOpen}
                anchorEl={loginButtonRef.current}
                title={LOGIN_MODAL_TITLE}
                usernameLabel={LOGIN_USERNAME_LABEL}
                passwordLabel={LOGIN_PASSWORD_LABEL}
                cancelLabel={AUTH_LABEL_CANCEL}
                submitLabel={LOGIN_ACTION_SUBMIT}
                submitPendingLabel={LOGIN_ACTION_SUBMIT_PENDING}
                loginForm={loginForm}
                loginErrorMessage={loginErrorMessage}
                isSigningIn={isSigningIn}
                onClose={handleLoginModalClose}
                onSubmit={handleLoginSubmit}
                onUsernameChange={handleLoginInputChange('username')}
                onPasswordChange={handleLoginInputChange('password')}
            />
        </Box>
    );
};

export default HeaderAuthStatus;
