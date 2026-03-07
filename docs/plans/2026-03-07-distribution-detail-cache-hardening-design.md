# Distribution, Detail Fallback, Cache Hardening Design

## 배경

업로드 전 마지막 점검에서 세 가지 런타임 리스크가 확인됐다.

1. `distribution` API가 `projId`를 실제 조회 조건에 사용하지 않아 다른 프로젝트 특성 데이터가 섞일 수 있다.
2. `detail month` 조회에서 `baseDate`가 비어 있고 선택 특성에 데이터가 없으면 "데이터 없음"이 아니라 형식 오류 메시지로 응답한다.
3. 프론트 정규분포 응답/계산 캐시가 무제한 `Map`으로 누적되어 장시간 세션에서 메모리 사용량이 계속 증가할 수 있다.

사용자 요청에 따라 `뒤로가기 시 reload` 경로는 유지하고, 나머지 세 항목만 수정한다.

## 목표

- `distribution` API가 `projId + charId + 기간` 조합으로만 데이터를 반환하도록 보장한다.
- `detail month` fallback 에서 데이터가 없을 때 빈 성공 응답으로 정리한다.
- 프론트 정규분포 캐시에 상한을 두어 메모리 증가를 제한한다.
- 기존 성능 최적화와 테스트 체계는 유지한다.

## 설계

### 1. `distribution` 데이터 격리 강화

현재 `ReportService.getCharacteristicDistribution(...)`는 `projId` 존재만 확인하고, 메타와 측정값 조회는 `charId`와 기간만 사용한다.

수정 방향:

- repository/mapper 메서드 시그니처에 `projId`를 추가한다.
- 메타 조회는 `char_tb`에서 `char_id + proj_id`로 1건만 조회한다.
- 측정값 조회는 `insp_report_tb.proj_id + 기간 + char_id`를 함께 조건으로 사용한다.
- 메타가 없으면 `"선택한 특성의 분포 데이터가 없습니다."`에 가까운 성공 빈 응답으로 정리하거나, 현재 계약에 맞춰 sourceRows 기준으로 빈 응답을 반환한다.

효과:

- 다른 프로젝트의 `charId`를 임의로 넘겨도 데이터가 섞이지 않는다.

### 2. `detail month` fallback 빈 데이터 처리

현재 `resolveTargetMonthByQuery(...)`는 `baseDate`가 비어 있을 때 최신 월을 찾으려고 하다가 source row가 비면 형식 오류를 던진다.

수정 방향:

- `resolveTargetMonthByQuery(...)`가 `YearMonth` 대신 nullable 결과를 허용하거나, 전용 sentinel 흐름으로 "데이터 없음"을 표현한다.
- `buildMonthlyDetailRowsByQuery(...)`는 fallback month를 찾지 못하면 `Collections.emptyList()`를 반환한다.
- 잘못된 `baseDate` 형식에서만 기존 오류 메시지를 유지한다.

효과:

- 차트 초기 진입에서 해당 특성 데이터가 비어 있어도 의미 있는 빈 결과를 받는다.

### 3. 프론트 정규분포 캐시 상한

현재 `detailDistributionResponseCacheRef`와 `detailDistributionComputationCacheRef`는 `Map#set`만 있고 eviction 경로가 없다.

수정 방향:

- `detailDistributionCache.js`에 작은 LRU 스타일 helper를 추가한다.
- 정책:
  - 응답 캐시 상한: 예) 12
  - 계산 캐시 상한: 예) 24
- 새 키를 넣을 때:
  - 기존 키면 refresh
  - 상한 초과 시 가장 오래된 key 제거
- `Chart.jsx`는 직접 `Map#set` 대신 helper를 사용한다.

효과:

- 자주 보는 최근 분포는 유지하면서 세션 장기화 시 캐시가 무한정 커지지 않는다.

## 테스트 전략

### 백엔드

- `ReportServiceDistributionIntegrationTest`
  - 다른 프로젝트 `projId/charId` 조합이 섞이지 않는지
  - 잘못된 프로젝트-특성 조합에서 빈 성공 응답 또는 의도한 응답을 반환하는지
- `ReportServiceDetailIntegrationTest`
  - `baseDate == null`이고 데이터 없는 특성일 때 `success + empty list`

### 프론트

- `detailDistributionCache.test.js`
  - cache key helper 기존 테스트 유지
  - bounded insert helper가 상한 초과 시 oldest entry 를 제거하는지 추가

### 최종 검증

- `.\spc_back\mvnw.cmd -f spc_back/pom.xml test`
- `cd spc_front && npm run test:unit`
- 필요 시 `npm run build`

## 영향 범위

- `spc_back/src/main/java/com/spc/spc_back/service/spcdata/ReportService.java`
- `spc_back/src/main/java/com/spc/spc_back/repository/InspectionDataRepository.java`
- `spc_back/src/main/java/com/spc/spc_back/mapper/InspectionDataMapper.java`
- `spc_back/src/main/resources/mapper/inspection_data_mapper.xml`
- `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionIntegrationTest.java`
- `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDetailIntegrationTest.java`
- `spc_front/src/features/chart/detailDistributionCache.js`
- `spc_front/src/features/chart/detailDistributionCache.test.js`
- `spc_front/src/page/Chart.jsx`

## 비목표

- 뒤로가기 `reload` 제거
- 정규분포 계산 로직 재설계
- day detail 쿼리 구조 변경
