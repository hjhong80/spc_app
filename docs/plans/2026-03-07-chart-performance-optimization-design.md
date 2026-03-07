# 차트 페이지 성능 최적화 설계

## 작업 목적
- 차트 페이지 전환 후 첫 화면 렌더를 3초 이내로 줄인다.
- 약 1만 개 데이터 포인트가 들어와도 초기 진입 시 브라우저 정지감이 크지 않도록 만든다.
- 깃허브 업로드 전 구조를 정리해 이후 유지보수와 추가 최적화가 쉬운 상태로 만든다.

## 현재 문제
- [`Chart.jsx`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_front/src/page/Chart.jsx)가 데이터 정규화, 계산, 차트 옵션 생성, 뷰 상태 관리를 한 파일에서 모두 처리한다.
- 메인 차트와 세부 차트가 모두 ApexCharts에 의존하고, 차트 라이브러리가 페이지 전환 시 바로 마운트된다.
- 메인 차트 초기 진입 시 전체 원본 데이터를 기반으로 큰 옵션 객체와 시리즈를 동시에 생성해 렌더 비용이 크다.
- [`MainCharacteristicChart.jsx`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_front/src/component/chart/MainCharacteristicChart.jsx)는 Y축 툴팁 오버레이를 위해 DOM 관찰을 수행해 차트 갱신 시 추가 비용이 발생한다.

## 목표 성능 기준
- 차트 페이지 진입 후 첫 메인 차트 표시를 3초 이내로 맞춘다.
- 초기 렌더에서는 전체 1만 포인트를 그대로 시각화하지 않고, 화면에 필요한 밀도로 줄인 요약 데이터만 사용한다.
- 상세 차트 계산은 사용자가 항목을 선택한 뒤에만 수행한다.

## 아키텍처 설계

### 1. 페이지 오케스트레이션 분리
- [`Chart.jsx`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_front/src/page/Chart.jsx)는 아래 역할만 담당한다.
- 라우트 상태 복원
- 서버 데이터 요청 및 로딩/오류 상태 관리
- 메인/세부 보기 전환
- 선택된 특성치와 기간 상태 관리

### 2. 계산 계층 분리
- 차트용 대규모 계산은 별도 유틸 또는 훅으로 분리한다.
- 후보 파일:
  - `spc_front/src/features/chart/useChartPerformanceData.js`
  - `spc_front/src/features/chart/chartSeriesBuilder.js`
  - `spc_front/src/features/chart/chartDownsampling.js`
- 메인 차트용 데이터는 “초기 렌더용 요약 데이터”와 “세부 진입 후 사용하는 원본 참조”를 분리한다.

### 3. 렌더 계층 단순화
- [`MainCharacteristicChart.jsx`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_front/src/component/chart/MainCharacteristicChart.jsx)와 [`DetailCharacteristicChart.jsx`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_front/src/component/chart/DetailCharacteristicChart.jsx)는 계산된 `options`, `series`, `interaction callbacks`만 받도록 유지한다.
- [`SpcDataChartPanel.jsx`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_front/src/component/spc-data/SpcDataChartPanel.jsx)는 lazy load 가능한 차트 패널로 바꾼다.

## 데이터 흐름 설계

### 1. 초기 진입
- 서버 응답 또는 fallback 데이터에서 차트 원본 배열을 확보한다.
- 원본 배열 전체는 메모리에서 유지하되, 초기 렌더는 다운샘플링된 메인 차트 요약 결과만 사용한다.

### 2. 메인 차트 요약
- 화면 폭과 기본 가시 개수 기준으로 대표 슬롯 수를 계산한다.
- 1만 포인트 전체를 그대로 그리지 않고, 슬롯별 대표값 또는 집계값으로 메인 차트 시리즈를 만든다.
- 기본 목표는 현재 상수 `DEFAULT_VISIBLE_CANDLE_COUNT`를 활용하되, 실제 데이터 크기에 따라 동적으로 상한을 조절한다.

### 3. 상세 차트 계산 지연
- 사용자가 메인 차트에서 항목을 선택하기 전에는 상세 차트용 무거운 계산을 수행하지 않는다.
- 선택 시점에 해당 특성치 기준 상세 옵션과 시리즈를 만든다.
- 이미 계산한 상세 결과는 키 기반 캐시에 보관해 동일 항목 재선택 시 재사용한다.

### 4. 차트 라이브러리 지연 로딩
- `react-apexcharts`는 컴포넌트 lazy import로 분리한다.
- 차트 컨테이너는 우선 스켈레톤 또는 고정 높이 박스를 렌더하고, 차트 모듈이 준비되면 실제 차트를 마운트한다.

## 세부 구현 원칙
- 옵션 객체와 시리즈 객체는 `useMemo`와 순수 helper로 안정화한다.
- 상태 변경 때문에 `chartKey`가 자주 바뀌어 강제 재마운트되는 부분은 최소화한다.
- Y축 툴팁 오버레이는 꼭 필요한 경우만 다시 동기화하도록 의존성을 줄인다.
- 페이지 전환 직후 즉시 필요 없는 정보성 UI 계산은 뒤로 미룬다.

## 오류 처리
- 데이터가 비어 있거나 API가 실패하면 현재 fallback 동작은 유지한다.
- 차트 lazy load 실패 시에도 페이지 전체가 깨지지 않도록 차트 영역에 안내 문구를 표시한다.
- 다운샘플링 과정에서 숫자 변환 실패 값은 기존 helper처럼 `null`로 정리해 예외를 막는다.

## 검증 계획
- 마지막에 한 번만 프론트 빌드를 실행해 컴파일 상태를 검증한다.
- 빌드 전에는 파일 구조와 의존성 정합성을 우선 맞춘다.
- 성능 체감은 개발 서버 기준으로 차트 페이지 첫 진입 시 렌더 구조가 즉시 보이는지 확인한다.

## 주요 변경 사항
- 차트 페이지의 계산/렌더 책임 분리
- 메인 차트 초기 요약 데이터 도입
- 상세 차트 계산 지연 및 캐시 도입
- ApexCharts lazy load 적용
- 불필요한 재마운트와 옵션 재생성 축소

## 검증 결과
- 설계 단계이므로 아직 미검증

## 남은 TODO
- 메인 차트 다운샘플링 규칙 확정
- 상세 차트 캐시 키 설계
- lazy load fallback UI 구체화
- 최종 빌드 검증
