import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const boxStyles = {
    flex: 1,
    borderRadius: '15px',
    border: '1px solid',
    borderColor: 'neutral.700',
    background: '#212429',
    p: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const SpcDataDetailPanel = ({ isOpen, onClose }) => {
    return (
        <>
            {isOpen && (
                <Box
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        bgcolor: 'rgba(0,0,0,0.3)',
                        zIndex: 40,
                        cursor: 'pointer',
                    }}
                />
            )}

            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    height: '100%',
                    width: '78%',
                    bgcolor: '#1a1c20',
                    zIndex: 50,
                    transform: isOpen ? 'translateX(0)' : 'translateX(110%)',
                    transition: 'transform 0.3s ease-in-out',
                    boxShadow: isOpen ? '-10px 0 30px rgba(0,0,0,0.5)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    p: 3,
                    gap: 2,
                }}
            >
                <Box
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translate(-100%, -50%)',
                        width: '24px',
                        height: '64px',
                        bgcolor: '#2a2d33',
                        borderTopLeftRadius: '8px',
                        borderBottomLeftRadius: '8px',
                        border: '1px solid',
                        borderRight: 'none',
                        borderColor: 'neutral.700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '-4px 0 10px rgba(0,0,0,0.2)',
                        '&:hover': { bgcolor: '#353940' },
                    }}
                >
                    <Box
                        sx={{
                            width: '4px',
                            height: '24px',
                            borderRadius: '2px',
                            bgcolor: 'neutral.500',
                        }}
                    />
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'neutral.200' }}>
                        상세 보기
                    </Typography>
                    <IconButton onClick={onClose} sx={{ color: 'neutral.400' }}>
                        <CloseIcon sx={{ fontSize: 24 }} />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flex: 1, gap: 2, minHeight: 0 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 2, gap: 2 }}>
                        <Box sx={boxStyles}>
                            <Typography color="neutral.500">상세 컴포넌트 영역 1</Typography>
                        </Box>
                        <Box sx={boxStyles}>
                            <Typography color="neutral.500">상세 컴포넌트 영역 2</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <Box sx={boxStyles}>
                            <Typography color="neutral.500">상세 컴포넌트 영역 3</Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default SpcDataDetailPanel;
