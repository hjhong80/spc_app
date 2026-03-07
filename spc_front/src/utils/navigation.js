export const navigateBackOrFallback = (navigate, fallbackPath = '/') => {
    const historyState = window.history.state;
    const historyIndex = historyState?.idx;

    if (typeof historyIndex === 'number' && historyIndex > 0) {
        navigate(-1);
        return;
    }

    navigate(fallbackPath, { replace: true });
};
