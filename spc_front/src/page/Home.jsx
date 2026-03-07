import React from 'react';
import { Box, Typography, ButtonBase } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import UnifiedFooterBar from '../component/common/UnifiedFooterBar';
import { buildPublicAssetPath } from '../config/runtimeConfig';

const Home = () => {
    const navigate = useNavigate();
    const projectImageSrc = buildPublicAssetPath('/project.webp');
    const dataImageSrc = buildPublicAssetPath('/data.webp');

    const menuItems = [
        {
            iconType: 'image',
            iconSrc: projectImageSrc,
            iconAlt: '프로젝트',
            label: '프로젝트',
            action: () => navigate('/project-mapper'),
            gridArea: 'project',
            aspectRatio: '1 / 1',
            backgroundImage: `url(${projectImageSrc})`,
        },
        {
            iconType: 'image',
            iconSrc: dataImageSrc,
            iconAlt: '데이터',
            label: '데이터',
            action: () => navigate('/spc-data'),
            gridArea: 'data',
            aspectRatio: '1 / 1',
            backgroundImage: `url(${dataImageSrc})`,
        },
        {
            iconType: 'component',
            icon: <SettingsIcon sx={{ fontSize: 60 }} />,
            label: 'Settings',
            action: () => {},
            gridArea: 'settings',
            minHeight: { xs: 64, md: 80 },
            hidden: true,
        },
    ];

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                width: '100%',
                bgcolor: 'background.default',
                color: 'neutral.300',
                p: 3,
                gap: 2,
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flex: 1,
                    minHeight: 0,
                    width: '100%',
                    alignItems: 'stretch',
                    pt: 1,
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        width: '100%',
                        minHeight: 0,
                        gap: { xs: 2, md: 3 },
                        justifyContent: 'center',
                        gridTemplateColumns: {
                            xs: 'minmax(0, 1fr)',
                            md: 'repeat(2, minmax(390px, 590px))',
                        },
                        gridTemplateAreas: {
                            xs: `
                                "project"
                                "data"
                                "settings"
                            `,
                            md: `
                                "project data"
                                "settings settings"
                            `,
                        },
                        gridAutoRows: 'minmax(0, auto)',
                        alignContent: 'center',
                    }}
                >
                    {menuItems.map((item, index) => (
                        <ButtonBase
                            key={index}
                            onClick={item.action}
                            sx={{
                                position: 'relative',
                                display: 'flex',
                                gridArea: item.gridArea,
                                width: '100%',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '15px',
                                border: '1px solid',
                                borderColor: 'neutral.700',
                                background:
                                    'linear-gradient(to bottom right, #2a2d33, #212429)',
                                p: { xs: 1.8, md: 2.5 },
                                boxShadow:
                                    'inset 0 1px 0 0 rgba(255,255,255,0.08)',
                                transition: 'all 0.3s',
                                aspectRatio: item.aspectRatio,
                                minHeight: item.minHeight,
                                overflow: 'hidden',
                                visibility: item.hidden ? 'hidden' : 'visible',
                                pointerEvents: item.hidden ? 'none' : 'auto',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    borderColor: 'neutral.500',
                                    boxShadow:
                                        '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                    '& .icon-container': {
                                        bgcolor: '#202328',
                                    },
                                    '& .icon': {
                                        color: 'neutral.200',
                                    },
                                    '& .label': {
                                        color: 'neutral.200',
                                    },
                                    '& .menu-image': {
                                        transform: 'scale(1.03)',
                                    },
                                },
                                '&:active': {
                                    transform: 'translateY(0) scale(0.95)',
                                },
                            }}
                        >
                            {item.iconType === 'image' ? (
                                <>
                                    <Box
                                        className="menu-image"
                                        component="img"
                                        src={item.iconSrc}
                                        alt={item.iconAlt}
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.35s ease',
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            background:
                                                'linear-gradient(180deg, rgba(17,20,25,0.08) 0%, rgba(17,20,25,0.18) 100%)',
                                        }}
                                    />
                                </>
                            ) : (
                                <Box
                                    sx={{
                                        position: 'relative',
                                        zIndex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 1.5,
                                        color: 'neutral.300',
                                    }}
                                >
                                    <Box
                                        className="icon"
                                        sx={{
                                            color: 'neutral.400',
                                            transition: 'color 0.3s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {item.icon}
                                    </Box>
                                    <Typography
                                        className="label"
                                        sx={{
                                            fontSize: {
                                                xs: '1.05rem',
                                                md: '1.15rem',
                                            },
                                            fontWeight: 600,
                                            letterSpacing: '0.02em',
                                            color: 'neutral.400',
                                            transition: 'color 0.3s',
                                        }}
                                    >
                                        {item.label}
                                    </Typography>
                                </Box>
                            )}
                        </ButtonBase>
                    ))}
                </Box>
            </Box>
            <UnifiedFooterBar />
        </Box>
    );
};

export default Home;
