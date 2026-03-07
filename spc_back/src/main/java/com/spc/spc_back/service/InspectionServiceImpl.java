package com.spc.spc_back.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.spc.spc_back.dto.spcdata.ExcelInputReqDto;
import com.spc.spc_back.dto.spcdata.InspectionBatchRowReqDto;
import com.spc.spc_back.dto.spcdata.InspectionBatchSaveReqDto;
import com.spc.spc_back.dto.spcdata.ExcelParsePreviewRespDto;
import com.spc.spc_back.entity.spcdata.Characteristic;
import com.spc.spc_back.entity.spcdata.InspectionData;
import com.spc.spc_back.entity.spcdata.InspectionReport;
import com.spc.spc_back.entity.spcdata.Project;
import com.spc.spc_back.repository.CharacteristicRepository;
import com.spc.spc_back.repository.InspectionDataRepository;
import com.spc.spc_back.repository.InspectionReportRepository;
import com.spc.spc_back.repository.ProjectRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class InspectionServiceImpl implements InspectionService {
    private static final int LOG_PREVIEW_ROW_LIMIT = 20;
    private static final DateTimeFormatter DATETIME_OUTPUT_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter DATE_OUTPUT_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_OUTPUT_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");
    private static final List<DateTimeFormatter> DATETIME_PATTERNS = List.of(
            format("yyyy-MM-dd HH:mm:ss"),
            format("yyyy-MM-dd HH:mm"),
            format("yyyy/MM/dd HH:mm:ss"),
            format("yyyy/MM/dd HH:mm"),
            format("yyyy.MM.dd HH:mm:ss"),
            format("yyyy.MM.dd HH:mm"),
            format("yyyy-M-d H:m:s"),
            format("yyyy-M-d H:m"),
            format("yyyyMMddHHmmss"),
            format("yyyyMMdd HHmmss"),
            format("yyyy-MM-dd'T'HH:mm:ss"),
            format("yyyy-MM-dd'T'HH:mm"),
            format("yyyy/MM/dd'T'HH:mm:ss"),
            format("yyyy/MM/dd'T'HH:mm"),
            format("M/d/yyyy h:m:s a"),
            format("M/d/yyyy h:m a"),
            format("MM/dd/yyyy hh:mm:ss a"),
            format("MM/dd/yyyy hh:mm a"));
    private static final List<DateTimeFormatter> DATE_PATTERNS = List.of(
            format("yyyy-MM-dd"),
            format("yyyy/MM/dd"),
            format("yyyy.MM.dd"),
            format("yyyy-M-d"),
            format("yyyyMMdd"),
            format("M/d/yyyy"),
            format("MM/dd/yyyy"));
    private static final List<DateTimeFormatter> TIME_PATTERNS = List.of(
            format("HH:mm:ss"),
            format("HH:mm"),
            format("H:m:s"),
            format("H:m"),
            format("h:m:s a"),
            format("h:m a"),
            format("hh:mm:ss a"),
            format("hh:mm a"));
    private static final double DOUBLE_COMPARISON_EPSILON = 1e-9;
    private static final int MAX_CELL_COORDINATE_EXPANSION = 4096;

    private final ProjectRepository projectRepository;
    private final CharacteristicRepository characteristicRepository;
    private final InspectionReportRepository inspectionReportRepository;
    private final InspectionDataRepository inspectionDataRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void saveBatch(List<ExcelInputReqDto> rows, String lotNo) {
        int rowCount = rows == null ? 0 : rows.size();
        log.warn("Inspection rows received through legacy saveBatch path. lotNo={}, rowCount={}", lotNo, rowCount);
        throw new UnsupportedOperationException(
                "legacy saveBatch requires additional metadata: projId, serialNo, inspDt, measuredValue");
    }

    @Override
    @Transactional
    public void saveBatch(InspectionBatchSaveReqDto request) {
        if (request == null) {
            throw new IllegalArgumentException("저장 요청(request)이 비어 있습니다.");
        }
        if (request.getProjId() == null || request.getProjId() <= 0L) {
            throw new IllegalArgumentException("유효한 프로젝트 ID(projId)가 필요합니다.");
        }
        validateSerialNo(request.getSerialNo());
        if (request.getInspDt() == null) {
            throw new IllegalArgumentException("inspection datetime(inspDt)가 필요합니다.");
        }
        if (request.getRows() == null || request.getRows().isEmpty()) {
            throw new IllegalArgumentException("저장할 측정 데이터(rows)가 없습니다.");
        }
        if (isSerialNoDuplicated(request.getSerialNo())) {
            throw new IllegalArgumentException("이미 등록된 serialNo 입니다: " + request.getSerialNo());
        }

        persistBatch(request);
    }

    @Override
    @Transactional
    public ExcelParsePreviewRespDto parseAndPreview(MultipartFile file, String lotNo, Long projId) throws IOException {
        if (projId == null || projId <= 0L) {
            throw new IllegalArgumentException("유효한 프로젝트 ID(projId)가 필요합니다.");
        }

        Project project = projectRepository.selectProjectByProjId(projId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다. projId=" + projId));

        String fileName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        int dataStartRow = project.getDataStartRow() == null ? 1 : Math.max(project.getDataStartRow(), 1);
        int charNoCol = parseColumnToIndex(project.getCharNoCol(), "charNoCol");
        int axisCol = parseOptionalColumnToIndex(project.getAxisCol());
        int nominalCol = parseColumnToIndex(project.getNominalCol(), "nominalCol");
        int uTolCol = parseColumnToIndex(project.getUTolCol(), "uTolCol");
        int lTolCol = parseColumnToIndex(project.getLTolCol(), "lTolCol");
        int measuredValueCol = parseColumnToIndex(project.getMeasuredValueCol(), "measuredValueCol");

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();

            String serialNo = resolveSerialNo(project.getSerialNumberSourceJson(), fileName, sheet, formatter, lotNo);
            LocalDateTime inspDt = resolveInspDt(project.getMeasurementTimeSourceJson(), fileName, sheet, formatter);

            validateSerialNo(serialNo);
            if (isSerialNoDuplicated(serialNo)) {
                String skipReason = "이미 등록된 serialNo 입니다: " + serialNo;
                log.info("[ExcelParseSave] duplicate serialNo skip. projId={}, serialNo={}, fileName={}",
                        project.getProjId(),
                        serialNo,
                        fileName);

                return ExcelParsePreviewRespDto.builder()
                        .projId(project.getProjId())
                        .projNum(project.getProjNum())
                        .projName(project.getProjName())
                        .fileName(fileName)
                        .dataStartRow(dataStartRow)
                        .charNoCol(project.getCharNoCol())
                        .axisCol(project.getAxisCol())
                        .nominalCol(project.getNominalCol())
                        .uTolCol(project.getUTolCol())
                        .lTolCol(project.getLTolCol())
                        .measuredValueCol(project.getMeasuredValueCol())
                        .serialNo(serialNo)
                        .inspDt(formatDateTime(inspDt))
                        .skippedDuplicateSerialNo(true)
                        .skipReason(skipReason)
                        .parsedRowCount(0)
                        .parsedRows(Collections.emptyList())
                        .build();
            }

            List<ExcelParsePreviewRespDto.ParsedRow> parsedRows = parseRows(
                    sheet,
                    formatter,
                    dataStartRow,
                    charNoCol,
                    axisCol,
                    nominalCol,
                    uTolCol,
                    lTolCol,
                    measuredValueCol);
            if (parsedRows.isEmpty()) {
                throw new IllegalArgumentException("파싱된 측정 데이터가 없습니다. 프로젝트 컬럼 매핑을 확인하세요.");
            }

            saveBatch(InspectionBatchSaveReqDto.builder()
                    .projId(project.getProjId())
                    .serialNo(serialNo)
                    .inspDt(inspDt)
                    .rows(parsedRows.stream()
                            .map(this::toBatchRow)
                            .collect(Collectors.toList()))
                    .build());

            log.info(
                    "[ExcelParseSave] projId={}, projNum={}, reqLotNo={}, fileName={}, parsedRows={}",
                    project.getProjId(),
                    project.getProjNum(),
                    lotNo,
                    fileName,
                    parsedRows.size());
            log.info(
                    "[ExcelParseSave] config dataStartRow={}, charNoCol={}, axisCol={}, nominalCol={}, uTolCol={}, lTolCol={}, measuredValueCol={}, serialNo={}, inspDt={}",
                    dataStartRow,
                    project.getCharNoCol(),
                    project.getAxisCol(),
                    project.getNominalCol(),
                    project.getUTolCol(),
                    project.getLTolCol(),
                    project.getMeasuredValueCol(),
                    serialNo,
                    formatDateTime(inspDt));

            int logLimit = Math.min(parsedRows.size(), LOG_PREVIEW_ROW_LIMIT);
            for (int i = 0; i < logLimit; i += 1) {
                ExcelParsePreviewRespDto.ParsedRow row = parsedRows.get(i);
                log.info(
                        "[ExcelParseSaveRow] index={}, excelRowNo={}, charNo={}, axis={}, nominal={}, uTol={}, lTol={}, measuredValue={}",
                        i + 1,
                        row.getExcelRowNo(),
                        row.getCharNo(),
                        row.getAxis(),
                        row.getNominal(),
                        row.getUTol(),
                        row.getLTol(),
                        row.getMeasuredValue());
            }

            return ExcelParsePreviewRespDto.builder()
                    .projId(project.getProjId())
                    .projNum(project.getProjNum())
                    .projName(project.getProjName())
                    .fileName(fileName)
                    .dataStartRow(dataStartRow)
                    .charNoCol(project.getCharNoCol())
                    .axisCol(project.getAxisCol())
                    .nominalCol(project.getNominalCol())
                    .uTolCol(project.getUTolCol())
                    .lTolCol(project.getLTolCol())
                    .measuredValueCol(project.getMeasuredValueCol())
                    .serialNo(serialNo)
                    .inspDt(formatDateTime(inspDt))
                    .skippedDuplicateSerialNo(false)
                    .skipReason("")
                    .parsedRowCount(parsedRows.size())
                    .parsedRows(parsedRows)
                    .build();
        }
    }

    private InspectionBatchSaveResult persistBatch(InspectionBatchSaveReqDto request) {
        List<Characteristic> characteristicList = characteristicRepository
                .selectCharacteristicListByProjId(request.getProjId())
                .orElseThrow(() -> new IllegalArgumentException("프로젝트 특성치 정보가 없습니다. projId=" + request.getProjId()));

        if (characteristicList.isEmpty()) {
            throw new IllegalArgumentException("프로젝트 특성치 정보가 없습니다. projId=" + request.getProjId());
        }

        CharacteristicLookup lookup = buildCharacteristicLookup(characteristicList);

        List<ParsedSaveTarget> saveTargets = new ArrayList<>();
        int skippedRowCount = 0;
        for (InspectionBatchRowReqDto parsedRow : request.getRows()) {
            ParsedSaveTarget saveTarget = resolveSaveTarget(parsedRow, lookup);
            if (saveTarget == null) {
                skippedRowCount += 1;
                continue;
            }
            saveTargets.add(saveTarget);
        }

        if (saveTargets.isEmpty()) {
            throw new IllegalArgumentException("저장 가능한 측정 데이터가 없습니다. char_no+axis+nominal/measured_value 매핑을 확인하세요.");
        }

        InspectionReport inspectionReport = new InspectionReport();
        inspectionReport.setProjId(request.getProjId());
        inspectionReport.setSerialNo(request.getSerialNo());
        inspectionReport.setInspDt(request.getInspDt());

        int insertedReportCount = inspectionReportRepository.insertInspectionReport(inspectionReport);
        if (insertedReportCount == 0 || inspectionReport.getInspReportId() == null) {
            throw new RuntimeException("검사 리포트 저장에 실패했습니다.");
        }

        int insertedDataCount = 0;
        for (ParsedSaveTarget saveTarget : saveTargets) {
            InspectionData inspectionData = new InspectionData();
            inspectionData.setInspReportId(inspectionReport.getInspReportId());
            inspectionData.setCharId(saveTarget.getCharId());
            inspectionData.setMeasuredValue(saveTarget.getMeasuredValue());

            int insertedData = inspectionDataRepository.insertInspectionData(inspectionData);
            if (insertedData == 0) {
                throw new RuntimeException("측정 데이터 저장에 실패했습니다. excelRowNo=" + saveTarget.getExcelRowNo());
            }
            insertedDataCount += insertedData;
        }

        log.info(
                "[ExcelParseSave] persisted reportId={}, projId={}, serialNo={}, inspDt={}, insertedDataCount={}, skippedRowCount={}",
                inspectionReport.getInspReportId(),
                request.getProjId(),
                request.getSerialNo(),
                formatDateTime(request.getInspDt()),
                insertedDataCount,
                skippedRowCount);

        return new InspectionBatchSaveResult(
                inspectionReport.getInspReportId(),
                insertedDataCount,
                skippedRowCount);
    }

    private List<ExcelParsePreviewRespDto.ParsedRow> parseRows(
            Sheet sheet,
            DataFormatter formatter,
            int dataStartRow,
            int charNoCol,
            int axisCol,
            int nominalCol,
            int uTolCol,
            int lTolCol,
            int measuredValueCol) {
        if (sheet == null) {
            return Collections.emptyList();
        }

        List<ExcelParsePreviewRespDto.ParsedRow> parsedRows = new ArrayList<>();

        for (int rowIndex = Math.max(dataStartRow - 1, 0); rowIndex <= sheet.getLastRowNum(); rowIndex += 1) {
            Row row = sheet.getRow(rowIndex);

            String charNo = readCellAsString(row, charNoCol, formatter);
            String axis = readCellAsString(row, axisCol, formatter);
            Double nominal = readCellAsDouble(row, nominalCol, formatter);
            Double uTol = readCellAsDouble(row, uTolCol, formatter);
            Double lTol = readCellAsDouble(row, lTolCol, formatter);
            Double measuredValue = readCellAsDouble(row, measuredValueCol, formatter);

            if (isBlank(charNo) && isBlank(axis) && nominal == null && uTol == null && lTol == null && measuredValue == null) {
                continue;
            }

            parsedRows.add(ExcelParsePreviewRespDto.ParsedRow.builder()
                    .excelRowNo(rowIndex + 1)
                    .charNo(charNo)
                    .axis(axis)
                    .nominal(nominal)
                    .uTol(uTol)
                    .lTol(lTol)
                    .measuredValue(measuredValue)
                    .build());
        }

        return parsedRows;
    }

    private String resolveSerialNo(String sourceJson, String fileName, Sheet sheet, DataFormatter formatter, String lotNo) {
        List<String> values = resolveSourceValues(sourceJson, fileName, sheet, formatter);
        String resolved = values.stream().collect(Collectors.joining()).trim();
        if (!isBlank(resolved)) {
            return resolved;
        }
        return lotNo == null ? "" : lotNo.trim();
    }

    private LocalDateTime resolveInspDt(String sourceJson, String fileName, Sheet sheet, DataFormatter formatter) {
        List<String> values = resolveSourceValues(sourceJson, fileName, sheet, formatter);
        if (values.isEmpty()) {
            throw new IllegalArgumentException("inspection datetime source 값이 비어 있습니다.");
        }

        String joinedWithSpace = values.stream()
                .filter(value -> !isBlank(value))
                .collect(Collectors.joining(" "))
                .trim();
        String joinedWithoutSpace = values.stream()
                .filter(value -> !isBlank(value))
                .collect(Collectors.joining(""))
                .trim();

        LocalDateTime parsed = tryParseDateTime(joinedWithSpace);
        if (parsed == null && !joinedWithoutSpace.equals(joinedWithSpace)) {
            parsed = tryParseDateTime(joinedWithoutSpace);
        }

        if (parsed == null && values.size() >= 2) {
            LocalDate date = tryParseDate(values.get(0));
            if (date == null) {
                LocalDateTime dateTime = tryParseDateTime(values.get(0));
                if (dateTime != null) {
                    date = dateTime.toLocalDate();
                }
            }

            LocalTime time = tryParseTime(values.get(1));
            if (time == null) {
                LocalDateTime dateTime = tryParseDateTime(values.get(1));
                if (dateTime != null) {
                    time = dateTime.toLocalTime();
                }
            }

            if (date != null && time != null) {
                parsed = LocalDateTime.of(date, time);
            }
        }

        if (parsed == null) {
            parsed = tryParseDateTime(values.get(0));
        }

        if (parsed == null) {
            log.warn("[ExcelParseSave] inspDt parsing failed. raw={}", joinedWithSpace);
            throw new IllegalArgumentException("inspection datetime 파싱에 실패했습니다. raw=" + joinedWithSpace);
        }

        return parsed;
    }

    private List<String> resolveSourceValues(String sourceJson, String fileName, Sheet sheet, DataFormatter formatter) {
        if (isBlank(sourceJson)) {
            return Collections.emptyList();
        }

        try {
            Map<String, Object> source = objectMapper.readValue(
                    sourceJson,
                    new TypeReference<Map<String, Object>>() {
                    });
            String type = String.valueOf(source.getOrDefault("type", ""));
            Map<String, Object> value = source.get("value") instanceof Map<?, ?> map
                    ? (Map<String, Object>) map
                    : Collections.emptyMap();

            if ("filenameRange".equals(type)) {
                Integer start = parsePositiveInt(value.get("start"));
                Integer end = parsePositiveInt(value.get("end"));
                if (start == null || end == null || start > end || isBlank(fileName)) {
                    return Collections.emptyList();
                }

                int fromIndex = Math.max(start - 1, 0);
                int toIndex = Math.min(end, fileName.length());
                if (fromIndex >= toIndex) {
                    return Collections.emptyList();
                }
                return List.of(fileName.substring(fromIndex, toIndex).trim());
            }

            if ("filenameOffset".equals(type)) {
                Integer offset = parsePositiveInt(value.get("offset"));
                Integer length = parsePositiveInt(value.get("length"));
                if (offset == null || length == null || isBlank(fileName)) {
                    return Collections.emptyList();
                }

                int extIndex = fileName.lastIndexOf('.');
                if (extIndex <= 0) {
                    return Collections.emptyList();
                }
                int fromIndex = extIndex - offset;
                int toIndex = fromIndex + length;
                if (fromIndex < 0 || toIndex > extIndex || fromIndex >= toIndex) {
                    return Collections.emptyList();
                }
                return List.of(fileName.substring(fromIndex, toIndex).trim());
            }

            if ("cellCoordinate".equals(type)) {
                String rawCells = String.valueOf(value.getOrDefault("cell", "")).trim();
                List<int[]> coordinates = parseCellCoordinates(rawCells);
                if (coordinates.isEmpty()) {
                    throw new IllegalArgumentException("셀 좌표 표현식이 비어 있습니다.");
                }

                List<String> resolvedValues = new ArrayList<>();
                for (int[] coordinate : coordinates) {
                    Row row = sheet.getRow(coordinate[0]);
                    String resolved = readCellAsStringForSource(row, coordinate[1], formatter);
                    if (!isBlank(resolved)) {
                        resolvedValues.add(resolved.trim());
                    }
                }
                return resolvedValues;
            }
        } catch (IllegalArgumentException exception) {
            throw exception;
        } catch (Exception exception) {
            log.warn("[ExcelParseSave] source json parse failed. raw={}", sourceJson);
        }

        return Collections.emptyList();
    }

    private List<int[]> parseCellCoordinates(String rawCellCoordinates) {
        if (isBlank(rawCellCoordinates)) {
            return Collections.emptyList();
        }

        String[] tokens = rawCellCoordinates.split(",");
        List<int[]> coordinates = new ArrayList<>();
        Set<String> uniqueKeys = new LinkedHashSet<>();

        for (String token : tokens) {
            String trimmedToken = token == null ? "" : token.trim();
            if (isBlank(trimmedToken)) {
                throw new IllegalArgumentException("셀 좌표 표현식에 빈 항목이 있습니다: " + rawCellCoordinates);
            }

            String rangeDelimiter = resolveRangeDelimiter(trimmedToken);
            if (rangeDelimiter != null) {
                expandCellCoordinateRange(trimmedToken, rangeDelimiter, coordinates, uniqueKeys);
                continue;
            }

            int[] coordinate = parseCellCoordinate(trimmedToken);
            if (coordinate == null) {
                throw new IllegalArgumentException("잘못된 셀 좌표입니다: " + trimmedToken);
            }
            appendUniqueCoordinate(coordinates, uniqueKeys, coordinate[0], coordinate[1]);
        }

        return coordinates;
    }

    private void expandCellCoordinateRange(
            String rangeToken,
            String delimiter,
            List<int[]> coordinates,
            Set<String> uniqueKeys) {
        String[] parts = rangeToken.split(java.util.regex.Pattern.quote(delimiter), -1);
        if (parts.length != 2 || isBlank(parts[0]) || isBlank(parts[1])) {
            throw new IllegalArgumentException("잘못된 셀 범위 표현식입니다: " + rangeToken);
        }

        int[] start = parseCellCoordinate(parts[0].trim());
        int[] end = parseCellCoordinate(parts[1].trim());
        if (start == null || end == null) {
            throw new IllegalArgumentException("잘못된 셀 범위 좌표입니다: " + rangeToken);
        }

        int expectedCount;
        if (start[1] == end[1]) {
            int fromRow = Math.min(start[0], end[0]);
            int toRow = Math.max(start[0], end[0]);
            expectedCount = toRow - fromRow + 1;
            validateCoordinateExpansionCount(expectedCount, rangeToken);
            for (int row = fromRow; row <= toRow; row += 1) {
                appendUniqueCoordinate(coordinates, uniqueKeys, row, start[1]);
            }
            return;
        }

        if (start[0] == end[0]) {
            int fromCol = Math.min(start[1], end[1]);
            int toCol = Math.max(start[1], end[1]);
            expectedCount = toCol - fromCol + 1;
            validateCoordinateExpansionCount(expectedCount, rangeToken);
            for (int col = fromCol; col <= toCol; col += 1) {
                appendUniqueCoordinate(coordinates, uniqueKeys, start[0], col);
            }
            return;
        }

        throw new IllegalArgumentException("셀 범위는 같은 행 또는 같은 열만 허용합니다: " + rangeToken);
    }

    private String resolveRangeDelimiter(String token) {
        boolean hasTilde = token.contains("~");
        boolean hasHyphen = token.contains("-");

        if (hasTilde && hasHyphen) {
            throw new IllegalArgumentException("셀 범위 구분자는 '~' 또는 '-' 중 하나만 사용하세요: " + token);
        }
        if (hasTilde) {
            return "~";
        }
        if (hasHyphen) {
            return "-";
        }
        return null;
    }

    private void validateCoordinateExpansionCount(int count, String token) {
        if (count > MAX_CELL_COORDINATE_EXPANSION) {
            throw new IllegalArgumentException("셀 범위가 너무 큽니다: " + token);
        }
    }

    private void appendUniqueCoordinate(
            List<int[]> coordinates,
            Set<String> uniqueKeys,
            int row,
            int col) {
        String key = row + ":" + col;
        if (uniqueKeys.contains(key)) {
            return;
        }
        uniqueKeys.add(key);
        coordinates.add(new int[] { row, col });
    }

    private int[] parseCellCoordinate(String coordinate) {
        if (isBlank(coordinate)) {
            return null;
        }

        String normalized = coordinate.trim().toUpperCase();
        int splitIndex = 0;
        while (splitIndex < normalized.length() && Character.isLetter(normalized.charAt(splitIndex))) {
            splitIndex += 1;
        }

        if (splitIndex == 0 || splitIndex >= normalized.length()) {
            return null;
        }

        String colPart = normalized.substring(0, splitIndex);
        String rowPart = normalized.substring(splitIndex);

        int col = parseColumnToIndex(colPart, "cellCoordinate");
        Integer row = parsePositiveInt(rowPart);
        if (row == null) {
            return null;
        }

        return new int[] { row - 1, col };
    }

    private int parseColumnToIndex(String rawColumn, String fieldName) {
        if (isBlank(rawColumn)) {
            throw new IllegalArgumentException(fieldName + " 값이 비어 있습니다.");
        }

        String normalized = rawColumn.trim().toUpperCase();
        if (normalized.matches("\\d+")) {
            int parsed = Integer.parseInt(normalized);
            if (parsed < 1) {
                throw new IllegalArgumentException(fieldName + " 값이 올바르지 않습니다: " + rawColumn);
            }
            return parsed - 1;
        }

        int result = 0;
        for (int i = 0; i < normalized.length(); i += 1) {
            char current = normalized.charAt(i);
            if (current < 'A' || current > 'Z') {
                throw new IllegalArgumentException(fieldName + " 값이 올바르지 않습니다: " + rawColumn);
            }
            result = result * 26 + (current - 'A' + 1);
        }

        return result - 1;
    }

    private int parseOptionalColumnToIndex(String rawColumn) {
        if (isBlank(rawColumn)) {
            return -1;
        }
        return parseColumnToIndex(rawColumn, "optionalColumn");
    }

    private String readCellAsString(Row row, int colIndex, DataFormatter formatter) {
        if (row == null || colIndex < 0) {
            return "";
        }
        Cell cell = row.getCell(colIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) {
            return "";
        }
        return formatter.formatCellValue(cell).trim();
    }

    private String readCellAsStringForSource(Row row, int colIndex, DataFormatter formatter) {
        if (row == null || colIndex < 0) {
            return "";
        }
        Cell cell = row.getCell(colIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) {
            return "";
        }

        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            double numericValue = cell.getNumericCellValue();
            LocalDateTime localDateTime = DateUtil.getLocalDateTime(cell.getNumericCellValue());
            String excelRendered = formatter.formatCellValue(cell);

            if (numericValue >= 0 && numericValue < 1) {
                return localDateTime.toLocalTime().format(TIME_OUTPUT_FORMATTER);
            }

            if (!isBlank(excelRendered) && excelRendered.contains(":")) {
                return localDateTime.format(DATETIME_OUTPUT_FORMATTER);
            }
            return localDateTime.toLocalDate().format(DATE_OUTPUT_FORMATTER);
        }

        return formatter.formatCellValue(cell).trim();
    }

    private Double readCellAsDouble(Row row, int colIndex, DataFormatter formatter) {
        if (row == null || colIndex < 0) {
            return null;
        }
        Cell cell = row.getCell(colIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) {
            return null;
        }

        if (cell.getCellType() == CellType.NUMERIC) {
            return cell.getNumericCellValue();
        }

        String raw = formatter.formatCellValue(cell);
        if (isBlank(raw)) {
            return null;
        }

        String normalized = raw.replace(",", "").trim();
        try {
            return Double.parseDouble(normalized);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private Integer parsePositiveInt(Object value) {
        if (value == null) {
            return null;
        }

        String raw = String.valueOf(value).trim();
        if (raw.isEmpty()) {
            return null;
        }

        try {
            int parsed = Integer.parseInt(raw);
            return parsed > 0 ? parsed : null;
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private LocalDateTime tryParseDateTime(String raw) {
        if (isBlank(raw)) {
            return null;
        }

        String normalized = raw.trim().replace("T", " ").replace("  ", " ");

        for (DateTimeFormatter formatter : DATETIME_PATTERNS) {
            try {
                return LocalDateTime.parse(normalized, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }

        LocalDate date = tryParseDate(normalized);
        if (date != null) {
            return date.atStartOfDay();
        }

        if (normalized.matches("^\\d+(\\.\\d+)?$")) {
            try {
                double excelDate = Double.parseDouble(normalized);
                if (excelDate > 1) {
                    return DateUtil.getLocalDateTime(excelDate);
                }
            } catch (NumberFormatException ignored) {
            }
        }

        return null;
    }

    private LocalDate tryParseDate(String raw) {
        if (isBlank(raw)) {
            return null;
        }
        String normalized = raw.trim().replace("T", " ");

        for (DateTimeFormatter formatter : DATE_PATTERNS) {
            try {
                return LocalDate.parse(normalized, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        return null;
    }

    private LocalTime tryParseTime(String raw) {
        if (isBlank(raw)) {
            return null;
        }
        String normalized = raw.trim();

        for (DateTimeFormatter formatter : TIME_PATTERNS) {
            try {
                return LocalTime.parse(normalized, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        return null;
    }

    private void validateSerialNo(String serialNo) {
        if (isBlank(serialNo)) {
            throw new IllegalArgumentException("serialNo 값이 비어 있습니다. 소스 매핑 또는 lotNo를 확인하세요.");
        }

        if (serialNo.length() > 25) {
            throw new IllegalArgumentException("serialNo 길이는 25자를 초과할 수 없습니다.");
        }
    }

    private boolean isSerialNoDuplicated(String serialNo) {
        Optional<InspectionReport> duplicatedReport = inspectionReportRepository.selectInspectionReportBySerialNo(serialNo);
        return duplicatedReport.isPresent();
    }

    private InspectionBatchRowReqDto toBatchRow(ExcelParsePreviewRespDto.ParsedRow parsedRow) {
        return InspectionBatchRowReqDto.builder()
                .excelRowNo(parsedRow.getExcelRowNo())
                .charNo(parsedRow.getCharNo())
                .axis(parsedRow.getAxis())
                .nominal(parsedRow.getNominal())
                .uTol(parsedRow.getUTol())
                .lTol(parsedRow.getLTol())
                .measuredValue(parsedRow.getMeasuredValue())
                .build();
    }

    private ParsedSaveTarget resolveSaveTarget(
            InspectionBatchRowReqDto parsedRow,
            CharacteristicLookup lookup) {
        if (parsedRow == null) {
            return null;
        }

        Integer excelRowNo = parsedRow.getExcelRowNo();
        String normalizedCharNo = normalizeCharNo(parsedRow.getCharNo());
        Double nominal = parsedRow.getNominal();
        Double measuredValue = parsedRow.getMeasuredValue();

        if (isBlank(normalizedCharNo)) {
            log.warn("[ExcelParseSave] skip row: charNo is blank. excelRowNo={}", excelRowNo);
            return null;
        }

        if (nominal == null) {
            log.warn("[ExcelParseSave] skip row: nominal is null. excelRowNo={}, charNo={}", excelRowNo, normalizedCharNo);
            return null;
        }

        if (measuredValue == null) {
            log.warn("[ExcelParseSave] skip row: measuredValue is null. excelRowNo={}, charNo={}", excelRowNo, normalizedCharNo);
            return null;
        }

        String characteristicNominalKey = buildCharacteristicNominalKey(parsedRow.getCharNo(), nominal);
        String normalizedAxis = normalizeAxis(parsedRow.getAxis());

        Long charId = null;
        if (!isBlank(normalizedAxis)) {
            String characteristicAxisNominalKey = buildCharacteristicAxisNominalKey(parsedRow.getCharNo(), parsedRow.getAxis(), nominal);
            charId = lookup.getAxisNominalKeyMap().get(characteristicAxisNominalKey);
            if (charId == null) {
                Long fallbackCharId = lookup.getNominalKeyMap().get(characteristicNominalKey);
                if (fallbackCharId != null) {
                    charId = fallbackCharId;
                    log.warn(
                            "[ExcelParseSave] fallback matching by char_no+nominal. excelRowNo={}, charNo={}, axis={}, nominal={}",
                            excelRowNo,
                            parsedRow.getCharNo(),
                            parsedRow.getAxis(),
                            parsedRow.getNominal());
                }
            }
        } else if (lookup.getDuplicatedNominalKeys().contains(characteristicNominalKey)) {
            log.warn(
                    "[ExcelParseSave] skip row: axis is required because char_no+nominal duplicated. excelRowNo={}, charNo={}, nominal={}",
                    excelRowNo,
                    parsedRow.getCharNo(),
                    parsedRow.getNominal());
            return null;
        } else {
            charId = lookup.getNominalKeyMap().get(characteristicNominalKey);
        }

        if (charId == null) {
            log.warn(
                    "[ExcelParseSave] skip row: characteristic not found. excelRowNo={}, charNo={}, axis={}, nominal={}",
                    excelRowNo,
                    parsedRow.getCharNo(),
                    parsedRow.getAxis(),
                    parsedRow.getNominal());
            return null;
        }

        return new ParsedSaveTarget(excelRowNo, charId, measuredValue);
    }

    private CharacteristicLookup buildCharacteristicLookup(List<Characteristic> characteristicList) {
        Map<String, List<Characteristic>> axisNominalGrouped = characteristicList.stream()
                .collect(Collectors.groupingBy(characteristic -> buildCharacteristicAxisNominalKey(
                        characteristic.getCharNo(),
                        characteristic.getAxis(),
                        characteristic.getNominal())));

        for (Map.Entry<String, List<Characteristic>> entry : axisNominalGrouped.entrySet()) {
            if (entry.getValue().size() > 1) {
                throw new IllegalArgumentException("프로젝트 특성치에 char_no+axis+nominal 중복 키가 존재합니다. key=" + entry.getKey());
            }
        }

        Map<String, Long> axisNominalKeyMap = axisNominalGrouped.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue().get(0).getCharId()));

        Map<String, List<Characteristic>> nominalGrouped = characteristicList.stream()
                .collect(Collectors.groupingBy(characteristic -> buildCharacteristicNominalKey(
                        characteristic.getCharNo(),
                        characteristic.getNominal())));

        Map<String, Long> nominalKeyMap = nominalGrouped.entrySet().stream()
                .filter(entry -> entry.getValue().size() == 1)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue().get(0).getCharId()));

        Set<String> duplicatedNominalKeys = nominalGrouped.entrySet().stream()
                .filter(entry -> entry.getValue().size() > 1)
                .map(Map.Entry::getKey)
                .collect(Collectors.toCollection(HashSet::new));

        return new CharacteristicLookup(axisNominalKeyMap, nominalKeyMap, duplicatedNominalKeys);
    }

    private String buildCharacteristicAxisNominalKey(String charNo, String axis, Double nominal) {
        String normalizedCharNo = normalizeCharNo(charNo);
        String normalizedAxis = normalizeAxis(axis);
        return normalizedCharNo + "|" + normalizedAxis + "|" + normalizeDouble(nominal);
    }

    private String buildCharacteristicNominalKey(String charNo, Double nominal) {
        String normalizedCharNo = normalizeCharNo(charNo);
        return normalizedCharNo + "|" + normalizeDouble(nominal);
    }

    private String normalizeCharNo(String charNo) {
        return charNo == null ? "" : charNo.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeAxis(String axis) {
        return axis == null ? "" : axis.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeDouble(Double value) {
        if (value == null) {
            return "null";
        }

        double normalized = Math.abs(value) < DOUBLE_COMPARISON_EPSILON ? 0.0d : value;
        return BigDecimal.valueOf(normalized).stripTrailingZeros().toPlainString();
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime == null ? "" : dateTime.format(DATETIME_OUTPUT_FORMATTER);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static DateTimeFormatter format(String pattern) {
        return DateTimeFormatter.ofPattern(pattern, Locale.ENGLISH);
    }

    private static class ParsedSaveTarget {
        private final Integer excelRowNo;
        private final Long charId;
        private final Double measuredValue;

        private ParsedSaveTarget(Integer excelRowNo, Long charId, Double measuredValue) {
            this.excelRowNo = excelRowNo;
            this.charId = charId;
            this.measuredValue = measuredValue;
        }

        private Integer getExcelRowNo() {
            return excelRowNo;
        }

        private Long getCharId() {
            return charId;
        }

        private Double getMeasuredValue() {
            return measuredValue;
        }
    }

    private static class InspectionBatchSaveResult {
        private final Long inspReportId;
        private final int insertedDataCount;
        private final int skippedRowCount;

        private InspectionBatchSaveResult(Long inspReportId, int insertedDataCount, int skippedRowCount) {
            this.inspReportId = inspReportId;
            this.insertedDataCount = insertedDataCount;
            this.skippedRowCount = skippedRowCount;
        }

        private Long getInspReportId() {
            return inspReportId;
        }

        private int getInsertedDataCount() {
            return insertedDataCount;
        }

        private int getSkippedRowCount() {
            return skippedRowCount;
        }
    }

    private static class CharacteristicLookup {
        private final Map<String, Long> axisNominalKeyMap;
        private final Map<String, Long> nominalKeyMap;
        private final Set<String> duplicatedNominalKeys;

        private CharacteristicLookup(
                Map<String, Long> axisNominalKeyMap,
                Map<String, Long> nominalKeyMap,
                Set<String> duplicatedNominalKeys) {
            this.axisNominalKeyMap = axisNominalKeyMap;
            this.nominalKeyMap = nominalKeyMap;
            this.duplicatedNominalKeys = duplicatedNominalKeys;
        }

        private Map<String, Long> getAxisNominalKeyMap() {
            return axisNominalKeyMap;
        }

        private Map<String, Long> getNominalKeyMap() {
            return nominalKeyMap;
        }

        private Set<String> getDuplicatedNominalKeys() {
            return duplicatedNominalKeys;
        }
    }
}
