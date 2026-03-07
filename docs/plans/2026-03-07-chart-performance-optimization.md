# 차트 페이지 성능 최적화 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 차트 페이지 전환 후 첫 메인 차트 렌더를 3초 이내로 줄이고, 1만 개 수준 데이터에서도 초기 렌더 비용을 제어한다.

**Architecture:** `Chart.jsx`는 페이지 상태와 데이터 요청만 담당하고, 메인/세부 차트 데이터 계산은 별도 helper 또는 hook으로 분리한다. 메인 차트는 다운샘플링된 요약 시리즈를 먼저 렌더하고, 상세 차트 계산은 선택 시점에 지연한다. `react-apexcharts`는 lazy load로 분리해 페이지 전환 시 라이브러리 마운트 비용을 늦춘다.

**Tech Stack:** React 19, React Router, MUI, ApexCharts, Vite

---

### Task 1: 현재 차트 페이지 계산 경계를 분리할 준비를 한다

**Files:**
- Create: `spc_front/src/features/chart/chartDownsampling.js`
- Create: `spc_front/src/features/chart/chartSeriesBuilder.js`
- Modify: `spc_front/src/page/Chart.jsx`

**Step 1: Write the failing verification target**

- `Chart.jsx` 안에 남아 있는 메인 차트 데이터 계산 블록과 상세 차트 계산 블록을 식별한다.
- 새 helper 호출 코드만 먼저 배치해, helper 미구현 상태에서 import 오류가 나는 지점을 만든다.

**Step 2: Run test to verify it fails**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: FAIL with missing chart helper modules or unresolved exports

**Step 3: Write minimal implementation**

- 메인 차트용 다운샘플링 helper 파일을 만든다.
- 메인/세부 시리즈 빌더 helper 파일을 만든다.
- `Chart.jsx`에서 직접 계산하던 일부 로직을 새 helper 호출로 치환한다.

**Step 4: Run test to verify it passes**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: PASS

### Task 2: 메인 차트 초기 렌더용 다운샘플링을 도입한다

**Files:**
- Modify: `spc_front/src/features/chart/chartDownsampling.js`
- Modify: `spc_front/src/features/chart/chartSeriesBuilder.js`
- Modify: `spc_front/src/page/Chart.jsx`

**Step 1: Write the failing verification target**

- 1만 개 원본 데이터를 그대로 메인 차트에 넘기지 않도록, 초기 메인 시리즈가 요약 슬롯 기준을 요구하게 만든다.
- 새 요약 결과 구조를 참조하도록 바꿔 기존 데이터 구조와 맞지 않아 빌드가 깨지는 상태를 만든다.

**Step 2: Run test to verify it fails**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: FAIL with property access errors or missing summary shape

**Step 3: Write minimal implementation**

- 기본 가시 개수 기준 슬롯 수를 계산한다.
- 슬롯별 대표 포인트와 라벨을 만든다.
- 메인 차트 series/options가 요약 데이터만 사용하도록 바꾼다.
- 세부 차트 진입에 필요한 원본 메타 참조는 유지한다.

**Step 4: Run test to verify it passes**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: PASS

### Task 3: 상세 차트 계산을 선택 시점으로 지연한다

**Files:**
- Modify: `spc_front/src/features/chart/chartSeriesBuilder.js`
- Modify: `spc_front/src/page/Chart.jsx`

**Step 1: Write the failing verification target**

- 상세 차트용 옵션과 시리즈가 페이지 초기 렌더에서 바로 계산되지 않도록 분기 구조를 추가한다.
- 선택 전에는 상세 결과가 없다는 가정을 넣어 기존 상세 참조 코드가 깨지는 상태를 만든다.

**Step 2: Run test to verify it fails**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: FAIL with null or undefined detail data usage

**Step 3: Write minimal implementation**

- 선택된 특성치가 있을 때만 상세 시리즈와 옵션을 생성한다.
- 특성치 키 기준 상세 계산 캐시를 추가한다.
- 메인 보기 상태에서는 상세 차트 관련 무거운 계산을 건너뛴다.

**Step 4: Run test to verify it passes**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: PASS

### Task 4: ApexCharts 로딩을 지연한다

**Files:**
- Modify: `spc_front/src/component/spc-data/SpcDataChartPanel.jsx`
- Modify: `spc_front/src/component/chart/MainCharacteristicChart.jsx`
- Modify: `spc_front/src/component/chart/DetailCharacteristicChart.jsx`

**Step 1: Write the failing verification target**

- `SpcDataChartPanel.jsx`에서 직접 import 중인 `react-apexcharts`를 제거해 lazy 모듈 전환 전 빌드 오류를 만든다.

**Step 2: Run test to verify it fails**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: FAIL with missing `ReactApexChart` import or unresolved component

**Step 3: Write minimal implementation**

- `React.lazy`로 차트 모듈을 분리한다.
- 차트 준비 전 고정 높이 fallback UI를 추가한다.
- 메인/세부 차트 컨테이너가 fallback 높이를 유지해 레이아웃 흔들림을 줄이도록 맞춘다.

**Step 4: Run test to verify it passes**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: PASS

### Task 5: 차트 강제 재마운트와 오버레이 비용을 줄인다

**Files:**
- Modify: `spc_front/src/component/chart/MainCharacteristicChart.jsx`
- Modify: `spc_front/src/component/chart/DetailCharacteristicChart.jsx`
- Modify: `spc_front/src/page/Chart.jsx`

**Step 1: Write the failing verification target**

- `chartKey`가 데이터 길이 변화만으로 과도하게 바뀌지 않도록 키 정책을 축소한다.
- Y축 툴팁 오버레이가 필요 없는 갱신에도 다시 동작하지 않도록 의존성을 조정할 지점을 만든다.

**Step 2: Run test to verify it fails**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: FAIL with stale key assumptions or hotspot sync references

**Step 3: Write minimal implementation**

- 메인/세부 차트 `chartKey`를 최소 입력만 반영하도록 조정한다.
- Y축 핫스팟 동기화 의존성을 줄이고, 툴팁 resolver가 있을 때만 DOM 관찰을 수행한다.
- 옵션 객체와 라벨 맵을 안정화해 불필요한 차트 재생성을 줄인다.

**Step 4: Run test to verify it passes**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: PASS

### Task 6: 최종 검증

**Files:**
- Modify: 없음

**Step 1: Run frontend verification**

Run: `Push-Location spc_front; npm.cmd run build; Pop-Location`
Expected: PASS

**Step 2: Summarize results**

- 변경 파일, 초기 렌더 최적화 포인트, 남은 리스크를 정리한다.
