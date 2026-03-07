# 메인 차트 불량률 막대 그래프 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 메인 SPC 차트를 Cpk 기반 불량률 막대 그래프로 전환하고 계산 책임을 백엔드로 이동한다.

**Architecture:** 백엔드는 기존 `chart-stats` 집계 결과에 SPC 파생 지표를 추가하고, 프론트는 그 응답을 그대로 사용해 메인 차트를 렌더링한다. 세부 차트는 기존 캔들/라인 구조를 유지해 변경 범위를 메인 차트에 집중한다.

**Tech Stack:** Spring Boot, MyBatis, JUnit 5, React, ApexCharts, Orval

---

### Task 1: 백엔드 SPC 계산 로직 도입

**Files:**
- Create: `spc_back/src/test/java/com/spc/spc_back/service/spcdata/ChartStatMetricsCalculatorTest.java`
- Modify: `spc_back/src/main/java/com/spc/spc_back/service/spcdata/ReportService.java`
- Modify: `spc_back/src/main/java/com/spc/spc_back/dto/spcdata/ChartStatRespDto.java`

**Step 1: Write the failing test**

- `Cpk=1.33` 근처 입력에서 `sigmaLevel`이 약 `3.99`, `defectRatePercent`가 낮은 양수로 계산되는 테스트를 작성한다.
- `Cpk<=0` 입력에서 불량률이 `100%`로 클램프되는 테스트를 작성한다.
- `Cpk>=2.0` 입력에서 불량률이 `0%`로 수렴하고 축 매핑용 값이 상단으로 클램프 가능한 범위를 유지하는 테스트를 작성한다.

**Step 2: Run test to verify it fails**

- 대상 테스트만 실행해 helper 부재 또는 기대값 불일치로 실패하는지 확인한다.

**Step 3: Write minimal implementation**

- `ReportService` 내부 또는 같은 패키지 helper로 SPC 계산 메서드를 추가한다.
- `ChartStatRespDto`에 `usl`, `lsl`, `cpk`, `sigmaLevel`, `goodRatePercent`, `defectRatePercent` 필드를 추가한다.
- `getProjectChartStats`에서 repository 결과를 후처리해 새 필드를 채운다.

**Step 4: Run test to verify it passes**

- Task 1 테스트를 다시 실행해 통과를 확인한다.

### Task 2: 프론트 API 모델과 메인 차트 데이터 구조 전환

**Files:**
- Modify: `spc_front/src/apis/generated/model/chartStatRespDto.ts`
- Modify: `spc_front/src/page/Chart.jsx`
- Modify: `spc_front/src/component/chart/MainCharacteristicChart.jsx`

**Step 1: Write the failing test or verification target**

- 프론트 자동 테스트 인프라가 없으므로, 빌드가 깨지는 상태를 허용하는 최소 코드 변경 전제로 작업한다.
- 타입/빌드 에러가 새 DTO 필드 부재 때문에 발생하도록 먼저 모델을 갱신하거나 코드젠을 실행한다.

**Step 2: Run narrow verification to confirm red state**

- 프론트 코드젠 또는 빌드 전 상태에서 새 필드 참조가 실패하는지 확인한다.

**Step 3: Write minimal implementation**

- 메인 차트용 데이터 변환을 캔들 포인트에서 막대 포인트로 바꾼다.
- 메인 Apex 차트 타입을 `bar`로 변경한다.
- 세부 차트로 이동하는 클릭 동작은 유지한다.
- 메인 툴팁을 `Cpk`, `시그마 수준`, `불량률`, `양품율` 중심으로 갱신한다.

**Step 4: Run verification to verify it passes**

- 프론트 빌드가 통과하는지 확인한다.

### Task 3: 메인 Y축 8눈금 규칙 적용

**Files:**
- Modify: `spc_front/src/page/Chart.jsx`

**Step 1: Write the failing test or verification target**

- 메인 차트 축 매핑 helper를 분리하고, 기존 퍼센트 기반 축과 병존할 경우 메인 차트가 요구 눈금을 만들지 못하는 상태를 확인한다.

**Step 2: Run narrow verification to confirm red state**

- helper 부재 상태에서 메인 차트 옵션이 새 포맷을 만들지 못하는지 확인한다.

**Step 3: Write minimal implementation**

- 고정 시그마 레벨 기준값과 해당 불량률 기준을 정의한다.
- 실제 불량률을 연속 축 좌표로 매핑하는 helper를 작성한다.
- Y축 라벨을 `0%`, `6σ`, `5σ`, `4σ`, `3σ`, `2σ`, `1σ`, `100%`로 노출한다.
- 하단 여백용 마이너스 눈금 한 칸을 포함한다.

**Step 4: Run verification to verify it passes**

- 메인 차트 렌더링 옵션이 새 축 범위와 라벨 formatter를 정상 구성하는지 빌드로 확인한다.

### Task 4: 최종 검증

**Files:**
- Modify: 없음

**Step 1: Run backend verification**

- 관리자 권한으로 백엔드 테스트를 한 번 실행한다.

**Step 2: Run frontend verification**

- 관리자 권한으로 프론트 빌드를 한 번 실행한다.

**Step 3: Run integrated verification**

- 승인된 통합 명령이 있으면 백엔드 테스트와 프론트 빌드를 한 번에 실행한다.

**Step 4: Summarize results**

- 변경 파일, 계산 기준, 검증 결과, 남은 리스크를 정리한다.
