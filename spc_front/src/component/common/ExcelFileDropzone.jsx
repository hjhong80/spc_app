import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const EXCEL_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
];

const EXCEL_EXTENSIONS = ['.xlsx', '.xls'];

const getFileDisplayPath = (file) => {
    const relativePath = typeof file?.webkitRelativePath === 'string' ? file.webkitRelativePath : '';
    if (relativePath) {
        return relativePath;
    }
    return String(file?.name || '');
};

const dedupeFiles = (files) => {
    const uniqueMap = new Map();

    files.forEach((file) => {
        const key = [
            getFileDisplayPath(file),
            file?.name || '',
            file?.size || 0,
            file?.lastModified || 0,
        ].join('::');

        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, file);
        }
    });

    return Array.from(uniqueMap.values()).sort((a, b) =>
        getFileDisplayPath(a).localeCompare(getFileDisplayPath(b)),
    );
};

const readDirectoryEntries = (reader) =>
    new Promise((resolve, reject) => {
        reader.readEntries(resolve, reject);
    });

const readAllDirectoryEntries = async (directoryEntry) => {
    const reader = directoryEntry.createReader();
    const entries = [];

    while (true) {
        const chunk = await readDirectoryEntries(reader);
        if (!Array.isArray(chunk) || chunk.length === 0) {
            break;
        }
        entries.push(...chunk);
    }

    return entries;
};

const getFileFromEntry = (fileEntry) =>
    new Promise((resolve, reject) => {
        fileEntry.file(resolve, reject);
    });

const collectFilesFromEntry = async (entry) => {
    if (!entry) {
        return [];
    }

    if (entry.isFile) {
        try {
            const file = await getFileFromEntry(entry);
            return file ? [file] : [];
        } catch {
            return [];
        }
    }

    if (!entry.isDirectory) {
        return [];
    }

    const childEntries = await readAllDirectoryEntries(entry);
    if (childEntries.length === 0) {
        return [];
    }

    const nestedFiles = await Promise.all(childEntries.map((childEntry) => collectFilesFromEntry(childEntry)));
    return nestedFiles.flat();
};

const extractFilesFromDropEvent = async (event) => {
    const transfer = event?.dataTransfer;
    if (!transfer) {
        return [];
    }

    const transferItems = Array.from(transfer.items || []);
    const droppedEntries = transferItems
        .filter((item) => item?.kind === 'file')
        .map((item) => item.webkitGetAsEntry?.())
        .filter(Boolean);

    if (droppedEntries.length > 0) {
        const nestedFiles = await Promise.all(droppedEntries.map((entry) => collectFilesFromEntry(entry)));
        const flattened = nestedFiles.flat();
        if (flattened.length > 0) {
            return flattened;
        }
    }

    return Array.from(transfer.files || []);
};

const isExcelFile = (file) => {
    if (!file || typeof file.name !== 'string') {
        return false;
    }

    const extension = file.name
        .toLowerCase()
        .slice(file.name.lastIndexOf('.'));
    return EXCEL_MIME_TYPES.includes(file.type) || EXCEL_EXTENSIONS.includes(extension);
};

const ExcelFileDropzone = ({
    onFileSelect,
    onFilesSelect,
    disabled = false,
    multiple = false,
    enableFolderSelect = false,
    folderButtonText = '폴더 선택',
    minHeight = '340px',
    title = '엑셀 파일을 드래그하거나',
    description = '클릭해서 파일 선택',
    helperText = '',
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isCollectingFiles, setIsCollectingFiles] = useState(false);
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);

    const borderColor = useMemo(() => {
        if (disabled) {
            return 'neutral.700';
        }
        return isDragging ? 'primary.main' : 'neutral.500';
    }, [disabled, isDragging]);

    const backgroundColor = useMemo(() => {
        if (disabled) {
            return 'rgba(255,255,255,0.02)';
        }
        return isDragging ? 'rgba(25, 118, 210, 0.08)' : 'background.paper';
    }, [disabled, isDragging]);

    const selectFiles = useCallback(
        (rawFiles) => {
            if (disabled || !rawFiles) {
                return;
            }

            const files = dedupeFiles(Array.from(rawFiles)).filter((file) => isExcelFile(file));
            if (files.length === 0) {
                return;
            }

            if (multiple) {
                onFilesSelect?.(files);
                onFileSelect?.(files[0]);
                return;
            }

            const firstFile = files[0];
            onFileSelect?.(firstFile);
            onFilesSelect?.([firstFile]);
        },
        [disabled, multiple, onFileSelect, onFilesSelect],
    );

    const handleClick = useCallback(() => {
        if (disabled) {
            return;
        }
        if (isCollectingFiles) {
            return;
        }
        fileInputRef.current?.click();
    }, [disabled, isCollectingFiles]);

    const handleDragEnter = useCallback(
        (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!disabled) {
                setIsDragging(true);
            }
        },
        [disabled],
    );

    const handleDragLeave = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        async (event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(false);

            if (disabled) {
                return;
            }

            setIsCollectingFiles(true);
            try {
                const droppedFiles = await extractFilesFromDropEvent(event);
                selectFiles(droppedFiles);
            } finally {
                setIsCollectingFiles(false);
            }
        },
        [disabled, selectFiles],
    );

    const handleFileChange = useCallback(
        (event) => {
            const selectedFiles = event.target.files;
            selectFiles(selectedFiles);
            event.target.value = '';
        },
        [selectFiles],
    );

    const handleFolderSelectClick = useCallback(
        (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (disabled || isCollectingFiles) {
                return;
            }

            folderInputRef.current?.click();
        },
        [disabled, isCollectingFiles],
    );

    const handleFolderChange = useCallback(
        (event) => {
            const selectedFiles = event.target.files;
            selectFiles(selectedFiles);
            event.target.value = '';
        },
        [selectFiles],
    );

    return (
        <Box
            onClick={handleClick}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                minHeight,
                border: '2px dashed',
                borderColor,
                borderRadius: '12px',
                bgcolor: backgroundColor,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.7 : 1,
                transition: 'all 0.2s ease-in-out',
                '&:hover': disabled
                    ? {}
                    : {
                          borderColor: 'primary.main',
                          bgcolor: 'rgba(25, 118, 210, 0.04)',
                      },
            }}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                multiple={multiple}
                style={{ display: 'none' }}
                disabled={disabled}
            />
            {enableFolderSelect && (
                <input
                    ref={folderInputRef}
                    type="file"
                    onChange={handleFolderChange}
                    multiple
                    webkitdirectory=""
                    directory=""
                    style={{ display: 'none' }}
                    disabled={disabled}
                />
            )}
            <UploadFileIcon
                sx={{
                    fontSize: 48,
                    color:
                        disabled || isCollectingFiles
                            ? '#5c5c5c'
                            : isDragging
                              ? '#1976d2'
                              : '#737373',
                    mb: 2,
                }}
            />
            <Typography variant="h6" sx={{ color: 'neutral.300', mb: 1 }}>
                {title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'neutral.500', mb: helperText ? 1 : 0 }}>
                {description}
            </Typography>
            {Boolean(helperText) && (
                <Typography variant="caption" sx={{ color: 'neutral.500' }}>
                    {helperText}
                </Typography>
            )}
            {enableFolderSelect && (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={handleFolderSelectClick}
                    disabled={disabled || isCollectingFiles}
                    sx={{ mt: 1.2 }}
                >
                    {folderButtonText}
                </Button>
            )}
        </Box>
    );
};

export default ExcelFileDropzone;
