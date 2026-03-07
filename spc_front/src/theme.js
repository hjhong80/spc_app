import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark', // Enable dark mode by default
        background: {
            default: '#1a1c20', // Main background
            paper: '#212429', // Card/Paper background
        },
        neutral: {
            main: '#a3a3a3', // neutral-400
            light: '#e5e5e5', // neutral-200
            dark: '#404040', // neutral-700
            contrastText: '#1a1c20',
            500: '#737373', // neutral-500
            700: '#404040', // neutral-700
            300: '#d4d4d4', // neutral-300
            400: '#a3a3a3', // neutral-400
            200: '#e5e5e5', // neutral-200
        },
        // We can add more custom colors here
    },
    components: {
        MuiButtonBase: {
            defaultProps: {
                disableRipple: false, // Optional: keep/remove ripples
            },
        },
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarColor: "#6b6b6b #2b2b2b",
                    "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
                        backgroundColor: "#2b2b2b",
                    },
                    "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
                        borderRadius: 8,
                        backgroundColor: "#6b6b6b",
                        minHeight: 24,
                        border: "3px solid #2b2b2b",
                    },
                    "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
                        backgroundColor: "#959595",
                    },
                    "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
                        backgroundColor: "#959595",
                    },
                    "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
                        backgroundColor: "#959595",
                    },
                    "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
                        backgroundColor: "#2b2b2b",
                    },
                },
            },
        },
    },
    typography: {
        fontFamily: [
            '"Inter"',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(','),
    },
});

export default theme;
