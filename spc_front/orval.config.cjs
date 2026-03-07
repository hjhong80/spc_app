const fs = require('fs');
const path = require('path');

const ENV_FILES = ['.env.codegen', '.env.local', '.env.production'];

const applyEnvFile = (fileName) => {
    const filePath = path.resolve(__dirname, fileName);
    if (!fs.existsSync(filePath)) {
        return;
    }

    const contents = fs.readFileSync(filePath, 'utf8');
    contents.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            return;
        }

        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex === -1) {
            return;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();
        if (!key || process.env[key]) {
            return;
        }

        process.env[key] = value;
    });
};

ENV_FILES.forEach(applyEnvFile);

const openApiTarget = process.env.SPC_ORVAL_INPUT_TARGET;

if (!openApiTarget) {
    throw new Error(
        'SPC_ORVAL_INPUT_TARGET is required. Add it to spc_front/.env.codegen or your shell environment.',
    );
}

module.exports = {
    spc: {
        input: {
            target: openApiTarget,
        },
        output: {
            mode: 'tags-split',
            target: './src/apis/generated',
            schemas: './src/apis/generated/model',
            client: 'react-query',
            clean: true,
            prettier: true,
            override: {
                mutator: {
                    path: './src/apis/custom-instance.ts',
                    name: 'customInstance',
                },
            },
        },
    },
};
