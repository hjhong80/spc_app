package com.spc.spc_back.service.excel;

import java.io.InputStream;
import java.util.Map;
import java.util.function.Consumer;

import com.alibaba.excel.EasyExcelFactory;
import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.event.AnalysisEventListener;
import com.spc.spc_back.dto.spcdata.ExcelParsePreviewRespDto;

public class StreamingInspectionRowReader {

    public void read(
            InputStream inputStream,
            int dataStartRow,
            int charNoCol,
            int axisCol,
            int nominalCol,
            int uTolCol,
            int lTolCol,
            int measuredValueCol,
            Consumer<ExcelParsePreviewRespDto.ParsedRow> rowConsumer) {
        EasyExcelFactory.read(inputStream, new AnalysisEventListener<Map<Integer, String>>() {
            @Override
            public void invoke(Map<Integer, String> data, AnalysisContext context) {
                int excelRowNo = context.getCurrentRowNum() + 1;
                if (excelRowNo < dataStartRow) {
                    return;
                }

                ExcelParsePreviewRespDto.ParsedRow parsedRow = ExcelParsePreviewRespDto.ParsedRow.builder()
                        .excelRowNo(excelRowNo)
                        .charNo(readString(data, charNoCol))
                        .axis(readString(data, axisCol))
                        .nominal(readDouble(data, nominalCol))
                        .uTol(readDouble(data, uTolCol))
                        .lTol(readDouble(data, lTolCol))
                        .measuredValue(readDouble(data, measuredValueCol))
                        .build();

                if (isBlank(parsedRow.getCharNo())
                        && isBlank(parsedRow.getAxis())
                        && parsedRow.getNominal() == null
                        && parsedRow.getUTol() == null
                        && parsedRow.getLTol() == null
                        && parsedRow.getMeasuredValue() == null) {
                    return;
                }

                rowConsumer.accept(parsedRow);
            }

            @Override
            public void doAfterAllAnalysed(AnalysisContext context) {
            }
        }).headRowNumber(0).sheet(0).doRead();
    }

    private String readString(Map<Integer, String> row, int colIndex) {
        if (row == null || colIndex < 0) {
            return "";
        }
        String value = row.get(colIndex);
        return value == null ? "" : value.trim();
    }

    private Double readDouble(Map<Integer, String> row, int colIndex) {
        if (row == null || colIndex < 0) {
            return null;
        }
        String value = row.get(colIndex);
        if (isBlank(value)) {
            return null;
        }
        try {
            return Double.parseDouble(value.replace(",", "").trim());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
