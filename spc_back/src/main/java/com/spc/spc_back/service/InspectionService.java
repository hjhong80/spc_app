package com.spc.spc_back.service;

import java.io.IOException;
import java.util.List;

import com.spc.spc_back.dto.spcdata.InspectionBatchSaveReqDto;
import com.spc.spc_back.dto.spcdata.ExcelInputReqDto;
import com.spc.spc_back.dto.spcdata.ExcelParsePreviewRespDto;
import org.springframework.web.multipart.MultipartFile;

public interface InspectionService {
    void saveBatch(List<ExcelInputReqDto> rows, String lotNo);

    void saveBatch(InspectionBatchSaveReqDto request);

    ExcelParsePreviewRespDto parseAndPreview(MultipartFile file, String lotNo, Long projId) throws IOException;
}
