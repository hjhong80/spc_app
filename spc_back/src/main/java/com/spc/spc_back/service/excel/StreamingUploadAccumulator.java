package com.spc.spc_back.service.excel;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.spc.spc_back.dto.spcdata.ExcelParsePreviewRespDto;

public class StreamingUploadAccumulator {
    private final int previewLimit;
    private final List<ExcelParsePreviewRespDto.ParsedRow> previewRows = new ArrayList<>();
    private int parsedRowCount;
    private int insertedRowCount;
    private int skippedRowCount;

    public StreamingUploadAccumulator(int previewLimit) {
        this.previewLimit = Math.max(previewLimit, 0);
    }

    public void recordParsedRow(ExcelParsePreviewRespDto.ParsedRow row) {
        parsedRowCount += 1;
        if (row != null && previewRows.size() < previewLimit) {
            previewRows.add(row);
        }
    }

    public void recordInsertedRows(int count) {
        insertedRowCount += Math.max(count, 0);
    }

    public void recordSkippedRow() {
        skippedRowCount += 1;
    }

    public void recordSkippedRows(int count) {
        skippedRowCount += Math.max(count, 0);
    }

    public int getParsedRowCount() {
        return parsedRowCount;
    }

    public int getInsertedRowCount() {
        return insertedRowCount;
    }

    public int getSkippedRowCount() {
        return skippedRowCount;
    }

    public List<ExcelParsePreviewRespDto.ParsedRow> getPreviewRows() {
        return Collections.unmodifiableList(previewRows);
    }
}
