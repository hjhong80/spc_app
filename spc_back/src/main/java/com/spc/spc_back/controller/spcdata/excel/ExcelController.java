package com.spc.spc_back.controller.spcdata.excel;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.spc.spc_back.dto.ApiRespDto;
import com.spc.spc_back.dto.spcdata.ExcelParsePreviewRespDto;
import com.spc.spc_back.service.InspectionService;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(value = "/excel", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class ExcelController {
    private final InspectionService inspectionService;

    @Operation(summary = "Upload inspection excel", security = {})
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiRespDto<ExcelParsePreviewRespDto>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("lotNo") String lotNo,
            @RequestParam("projId") Long projId) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiRespDto<>("failed", "Excel file is empty.", null));
        }

        try {
            ExcelParsePreviewRespDto preview = inspectionService.parseAndPreview(file, lotNo, projId);
            String responseMessage = Boolean.TRUE.equals(preview.getSkippedDuplicateSerialNo())
                    ? (preview.getSkipReason() == null || preview.getSkipReason().isBlank()
                            ? "이미 등록된 serialNo 이므로 신규 등록을 스킵했습니다."
                            : preview.getSkipReason())
                    : "Excel upload/parse 및 DB 저장이 완료되었습니다.";

            return ResponseEntity.ok(new ApiRespDto<>("success", responseMessage, preview));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(new ApiRespDto<>("failed", exception.getMessage(), null));
        }

    }
}
