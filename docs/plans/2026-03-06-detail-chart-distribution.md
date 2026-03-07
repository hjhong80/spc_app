# 세부 차트 정규분포 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 세부 월/일 차트에 측정값 기반 KDE 분포 보기와 실측값 점 표시 모드를 추가하고, raw 측정값은 기간 조건 전용 API로 조회하며, 일방공차 노이즈 경고를 제공한다.

**Architecture:** 기존 detail API는 캔들/꺾은선 전용으로 유지하고, 새 distribution API는 기간 제한 raw 측정값과 분포 메타만 반환한다. 프론트는 세부 차트 표시 모드를 분리해 기본 차트와 KDE 기반 분포 차트를 같은 레이아웃 안에서 전환한다. 일방공차 판정과 음수 노이즈 경고는 프론트가 현재 표시 중인 distribution 응답으로 계산한다.

**Tech Stack:** Spring Boot, MyBatis, JUnit 5, React, ApexCharts, MUI

---

### Task 1: 정규분포 전용 백엔드 API 계약 추가

**Files:**
- Create: `spc_back/src/main/java/com/spc/spc_back/dto/spcdata/ChartDistributionRespDto.java`
- Modify: `spc_back/src/main/java/com/spc/spc_back/controller/spcdata/report/ReportController.java`
- Modify: `spc_back/src/main/java/com/spc/spc_back/service/spcdata/ReportService.java`
- Test: `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionTest.java`

**Step 1: Write the failing test**

- `scale=month`, `baseDate=YYYY-MM` 요청이 해당 월 raw 측정값만 반환하는 테스트를 작성한다.
- `scale=day`, `baseDate=YYYY-MM-DD` 요청이 해당 일 raw 측정값만 반환하는 테스트를 작성한다.
- 응답 DTO에 `nominal`, `uTol`, `lTol`, `mean`, `sigma`, `sampleCount`, `measuredValues`가 채워지는 테스트를 작성한다.

**Step 2: Run test to verify it fails**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ReportServiceDistributionTest test`
Expected: FAIL with missing DTO or missing service method

**Step 3: Write minimal implementation**

- `ChartDistributionRespDto`를 추가한다.
- controller에 distribution endpoint를 추가한다.
- service에 `getCharacteristicDistribution(...)` 메서드를 추가한다.

**Step 4: Run test to verify it passes**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ReportServiceDistributionTest test`
Expected: PASS

### Task 2: 기간 제한 raw 조회 mapper 추가

**Files:**
- Modify: `spc_back/src/main/resources/mapper/inspection_data_mapper.xml`
- Modify: `spc_back/src/main/java/com/spc/spc_back/mapper/InspectionDataMapper.java`
- Modify: `spc_back/src/main/java/com/spc/spc_back/repository/InspectionDataRepository.java`
- Test: `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ReportServiceDistributionTest.java`

**Step 1: Write the failing test**

- 월 범위 조회가 타 월 데이터를 포함하지 않는 테스트를 추가한다.
- 일 범위 조회가 타 일 데이터를 포함하지 않는 테스트를 추가한다.

**Step 2: Run test to verify it fails**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ReportServiceDistributionTest test`
Expected: FAIL with incorrect repository results

**Step 3: Write minimal implementation**

- `charId + startDateTime + endDateTime` 조건 raw 조회 mapper를 추가한다.
- SQL에서 `insp_report_tb`와 조인해 기간 범위를 직접 제한한다.
- 전체 조회 후 자르기 로직은 새 distribution 경로에서 사용하지 않는다.

**Step 4: Run test to verify it passes**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml -Dtest=ReportServiceDistributionTest test`
Expected: PASS

### Task 3: 세부 차트 표시 모드 상태와 토글 UI 추가

**Files:**
- Modify: `spc_front/src/page/Chart.jsx`
- Modify: `spc_front/src/component/chart/DetailCharacteristicChart.jsx`
- Modify: `spc_front/src/component/chart/ChartFooterControls.jsx`

**Step 1: Write the failing verification target**

- 토글 상태가 없어서 월/일 모두 기본 차트만 보이는 현재 동작을 확인한다.

**Step 2: Run narrow verification to confirm red state**

- 프론트 빌드 전, 새 상태/props 부재로 구현 코드가 성립하지 않는 상태를 확인한다.

**Step 3: Write minimal implementation**

- 세부 표시 모드 state를 추가한다.
- 월: `candle|distribution`, 일: `line|distribution`
- 곡선 타입은 내부적으로 `single-sided|asymmetric` 두 가지를 지원한다.
- 월 기본은 `candle`, 일 기본은 `distribution`, 정규분포 내부 기본은 `rug`
- 1차 토글 버튼 폭은 두 버튼 모두 같은 길이로 맞춘다.
- 점 표시 모드(`rug`)는 기본값만 유지하고 차트 UI 토글은 숨긴다.
- 곡선 타입(`single-sided|asymmetric`)도 기본값만 유지하고 차트 UI 토글은 숨긴다.

**Step 4: Run verification to verify it passes**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: PASS

### Task 4: 정규분포 프론트 데이터 호출과 KDE 좌표 helper 구현

**Files:**
- Modify: `spc_front/src/page/Chart.jsx`
- Modify: `spc_front/src/apis/generated/model/*distribution*`
- Create: `spc_front/src/apis/generated/model/chartDistributionRespDto.ts` (if codegen not available)

**Step 1: Write the failing verification target**

- distribution API 응답과 좌표 helper가 없어 정규분포 series를 만들 수 없는 상태를 확인한다.

**Step 2: Run narrow verification to confirm red state**

- 새 필드 참조로 빌드가 실패하거나 helper가 비어 있는 상태를 확인한다.

**Step 3: Write minimal implementation**

- distribution API 호출 state를 추가한다.
- nominal 중심 x축 변환 helper를 만든다.
- 6눈금까지 선형, 7~8눈금은 로그 압축하는 x축 매핑 helper를 만든다.
- 실측값 기반 KDE 곡선 series와 실측값 점 series를 생성한다.
- nominal과 mean 보조선 표시 좌표를 생성한다.
- `nominal=0 && lTol=0 && uTol>0` 일방공차 판정 helper를 추가한다.
- 현재 distribution 데이터에 음수값이 있으면 노이즈 경고 메시지를 만든다.
- KDE 외 대안 곡선 상태는 내부 기본값만 유지한다.

**Step 4: Run verification to verify it passes**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: PASS

### Task 5: 세부 정규분포 차트 옵션과 툴팁 구현

**Files:**
- Modify: `spc_front/src/page/Chart.jsx`
- Modify: `spc_front/src/component/chart/DetailCharacteristicChart.jsx`

**Step 1: Write the failing verification target**

- 현재 detailOptions가 캔들/꺾은선만 처리해 정규분포 차트 타입과 툴팁을 지원하지 못하는 상태를 확인한다.

**Step 2: Run narrow verification to confirm red state**

- 정규분포 모드 option 생성이 빠진 상태를 확인한다.

**Step 3: Write minimal implementation**

- 정규분포 모드에서는 KDE line + scatter 조합으로 렌더링한다.
- `curve` 모드면 KDE 곡선 높이에 붙는 scatter, `rug` 모드면 바닥 지터 scatter를 사용한다.
- 툴팁은 측정값, nominal 대비 편차, mean 대비 편차, 표준편차, 샘플 수를 보여준다.
- 일방공차일 때 툴팁에 `0에 가까울수록 양호` 해석을 표시한다.
- 헤더 우측에 붉은색 노이즈 경고 아이콘과 경고 스낵바를 추가한다.
- nominal/mean 얇은 보조선을 추가하고 범례/요약에 실측 KDE 기준을 반영한다.

**Step 4: Run verification to verify it passes**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: PASS

### Task 6: 최종 검증

**Files:**
- Modify: 없음

**Step 1: Run backend verification**

Run: `spc_back\mvnw.cmd -f spc_back\pom.xml clean test`
Expected: PASS

**Step 2: Run frontend verification**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: PASS

**Step 3: Run integrated verification**

Run: `$ErrorActionPreference='Stop'; & spc_back\mvnw.cmd -f spc_back\pom.xml clean test; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; Push-Location spc_front; try { & npm.cmd run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } } finally { Pop-Location }`
Expected: PASS

**Step 4: Summarize results**

- 변경 파일, 새 API, 좌표 규칙, 검증 결과, 잔여 리스크를 정리한다.
- 남은 TODO에 홈 설정 메뉴 복구 시 정규분포 기본 점 모드 사용자 설정 연결 작업을 남긴다.
- 남은 TODO에 홈 설정 메뉴 복구 시 KDE 외 대안 곡선 사용자 설정 연결 여부를 남긴다.
- 남은 TODO에 홈 설정 메뉴 복구 시 비대칭 곡선 선택 UI 복구 여부를 남긴다.

### Task 7: 세부 월/일 기본 차트 Y축을 실측값 기준으로 재구성

**Files:**
- Modify: `spc_front/src/page/Chart.jsx`
- Modify: `spc_front/src/component/chart/DetailCharacteristicChart.jsx`

**Step 1: Write the failing verification target**

- 현재 세부 월/일 기본 차트가 `toTolerancePercent(...)` 기반 `% 축`을 사용하고 있는 상태를 확인한다.
- 현재 축 formatter를 실측값으로만 바꾸면 좌표계 불일치가 생기는 상태를 확인한다.

**Step 2: Run narrow verification to confirm red state**

- 기존 `% 축 계산 코드와 새 실측값 축 helper가 공존하지 않는 상태를 확인한다.

**Step 3: Write minimal implementation**

- `center = (USL + LSL) / 2` 기준 세부 기본 차트 전용 axis helper를 추가한다.
- `display = -100 -> LSL`, `display = 0 -> center`, `display = +100 -> USL` 선형 매핑을 구현한다.
- `|display| > 100` 구간은 기존 로그 압축 규칙을 유지한다.
- 캔들 body/wick, 일 차트 line point, 기준선, Y축 formatter, tooltip 값을 모두 새 helper로 통일한다.
- 사용자에게 보이는 축 라벨과 툴팁은 항상 실측값으로 표시한다.
- 정규분포 차트 axisScale 경로는 유지하고, 이번 변경은 세부 기본 차트 경로에만 적용한다.

**Step 4: Run verification to verify it passes**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: PASS
