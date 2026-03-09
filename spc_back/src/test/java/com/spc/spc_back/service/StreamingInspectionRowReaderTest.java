package com.spc.spc_back.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import com.spc.spc_back.dto.spcdata.ExcelParsePreviewRespDto;
import com.spc.spc_back.service.excel.StreamingInspectionRowReader;

class StreamingInspectionRowReaderTest {

    @Test
    void reader는시작행이후데이터만스트리밍으로파싱한다() throws IOException {
        byte[] excelBytes = createExcelBytes();
        StreamingInspectionRowReader reader = new StreamingInspectionRowReader();
        List<ExcelParsePreviewRespDto.ParsedRow> parsedRows = new ArrayList<>();

        reader.read(
                new ByteArrayInputStream(excelBytes),
                2,
                0,
                1,
                2,
                3,
                4,
                5,
                parsedRows::add);

        assertThat(parsedRows).hasSize(2);
        assertThat(parsedRows.get(0).getExcelRowNo()).isEqualTo(2);
        assertThat(parsedRows.get(0).getCharNo()).isEqualTo("C-01");
        assertThat(parsedRows.get(0).getMeasuredValue()).isEqualTo(10.4);
        assertThat(parsedRows.get(1).getExcelRowNo()).isEqualTo(3);
        assertThat(parsedRows.get(1).getCharNo()).isEqualTo("C-02");
        assertThat(parsedRows.get(1).getMeasuredValue()).isEqualTo(19.9);
    }

    private byte[] createExcelBytes() throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("Sheet1");
            sheet.createRow(0).createCell(7).setCellValue("meta");

            var firstDataRow = sheet.createRow(1);
            firstDataRow.createCell(0).setCellValue("C-01");
            firstDataRow.createCell(1).setCellValue("X");
            firstDataRow.createCell(2).setCellValue(10.0);
            firstDataRow.createCell(3).setCellValue(0.5);
            firstDataRow.createCell(4).setCellValue(-0.5);
            firstDataRow.createCell(5).setCellValue(10.4);

            var secondDataRow = sheet.createRow(2);
            secondDataRow.createCell(0).setCellValue("C-02");
            secondDataRow.createCell(1).setCellValue("Y");
            secondDataRow.createCell(2).setCellValue(20.0);
            secondDataRow.createCell(3).setCellValue(1.0);
            secondDataRow.createCell(4).setCellValue(-1.0);
            secondDataRow.createCell(5).setCellValue(19.9);

            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }
}
