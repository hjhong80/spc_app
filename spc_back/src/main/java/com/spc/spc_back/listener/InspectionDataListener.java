package com.spc.spc_back.listener;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.read.listener.ReadListener;
import com.alibaba.excel.util.ListUtils;

import com.spc.spc_back.dto.spcdata.InspectionBatchRowReqDto;
import com.spc.spc_back.dto.spcdata.InspectionBatchSaveReqDto;
import com.spc.spc_back.dto.spcdata.InspectionExcelRowReqDto;
import com.spc.spc_back.service.InspectionService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class InspectionDataListener implements ReadListener<InspectionExcelRowReqDto> {
    private static final int BATCH_COUNT = 1000;
    private List<InspectionExcelRowReqDto> cachedDataList = ListUtils.newArrayListWithExpectedSize(BATCH_COUNT);

    private final InspectionService inspectionService;
    private final Long projId;
    private final String serialNo;
    private final LocalDateTime inspDt;

    public InspectionDataListener(
            InspectionService inspectionService,
            Long projId,
            String serialNo,
            LocalDateTime inspDt) {
        this.inspectionService = inspectionService;
        this.projId = projId;
        this.serialNo = serialNo;
        this.inspDt = inspDt;
    }

    @Override
    public void invoke(InspectionExcelRowReqDto data, AnalysisContext context) {
        cachedDataList.add(data);

        if (cachedDataList.size() >= BATCH_COUNT) {
            saveData();
        }
    }

    @Override
    public void doAfterAllAnalysed(AnalysisContext context) {
        saveData();
        log.info("모든 데이터 파싱 완료!");
    }

    private void saveData() {
        if (cachedDataList.isEmpty()) {
            return;
        }

        log.info("{}개의 데이터를 저장합니다.", cachedDataList.size());
        inspectionService.saveBatch(InspectionBatchSaveReqDto.builder()
                .projId(projId)
                .serialNo(serialNo)
                .inspDt(inspDt)
                .rows(cachedDataList.stream()
                        .map(this::toBatchRow)
                        .collect(Collectors.toList()))
                .build());

        cachedDataList = ListUtils.newArrayListWithExpectedSize(BATCH_COUNT);
    }

    private InspectionBatchRowReqDto toBatchRow(InspectionExcelRowReqDto row) {
        return InspectionBatchRowReqDto.builder()
                .charNo(row.getCharNo())
                .axis(row.getAxis())
                .nominal(row.getNominal())
                .uTol(row.getUTol())
                .lTol(row.getLTol())
                .measuredValue(row.getMeasuredValue())
                .build();
    }
}
