# 세부 정규분포 성능 최적화 설계

## 작업 목적
- 세부 차트에서 정규분포 보기 선택 시 체감 버벅임을 줄인다.
- 같은 특성치와 기간 조합을 다시 열 때 3초 이내로 전환되도록 만든다.
- 이후 문서와 `.gitignore` 정리까지 연결 가능한 상태로 마무리한다.

## 현재 문제
- [`Chart.jsx`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_front/src/page/Chart.jsx)에서 정규분포 선택 시 매번 distribution API를 다시 호출한다.
- 같은 `charId + scale + baseDate` 조합이어도 응답을 재사용하지 않는다.
- `buildDistributionAxisScale`, `buildDistributionCurveData`, `buildDistributionPointData`가 캐시 없이 다시 계산된다.
- 정규분포 토글 전환이 즉시 동기 상태 변경으로 처리되어 UI 멈춤이 체감될 수 있다.

## 목표
- 같은 정규분포 조합 재진입 시 재요청 없이 즉시 표시한다.
- 같은 응답 조합에 대한 KDE 곡선/점 계산은 한 번만 수행한다.
- 정규분포 토글 전환은 `startTransition`으로 넘겨 메인 UI 반응성을 유지한다.

## 변경 설계

### 1. 응답 캐시
- `detailDistributionResponseCacheRef`를 `Map`으로 유지한다.
- 키 형식:
  - `charId`
  - `detailScale`
  - `baseDate`
- 동일 키로 다시 진입하면 API 호출 없이 캐시된 응답을 사용한다.

### 2. 계산 캐시
- `detailDistributionComputedCacheRef`를 `Map`으로 유지한다.
- 응답 키를 기반으로 아래 계산 결과를 저장한다.
  - `detailDistributionAxisScale`
  - `isDetailOneSidedUpperTolerance`
  - `detailDistributionCurveData`
  - `detailDistributionPointData`
- 점 표시 모드와 곡선 모드에 따라 세부 키를 분리한다.

### 3. 전환 방식
- 정규분포 토글 선택은 `startTransition`으로 처리한다.
- 메인/세부 전체 뷰 전환과 동일하게 무거운 계산이 즉시 렌더 블로킹을 만들지 않도록 한다.

### 4. 테스트 전략
- 순수 helper로 캐시 키 생성 규칙을 분리한다.
- `Vitest`로 키 생성과 모드 조합 분기 로직을 테스트한다.
- 기존 unit/e2e/build 검증 흐름은 그대로 유지한다.

## 문서 및 정리 후속 작업
- 루트 `README.md`에 테스트 실행 방법과 현재 프론트 성능/테스트 상태를 반영한다.
- 루트 `.gitignore`에 루트 업로드 기준으로 필요한 생성물 무시 규칙을 보강한다.
- `spc_front/.gitignore`는 이미 테스트 산출물이 추가되어 있으므로 빠진 항목만 재점검한다.

## 주요 변경 사항
- 정규분포 API 응답 캐시 추가
- 정규분포 계산 결과 캐시 추가
- 정규분포 토글 transition 처리
- 테스트/문서/.gitignore 정리

## 검증 결과
- 설계 단계이므로 아직 미검증

## 남은 TODO
- 캐시 키 helper 구현
- Chart.jsx 캐시 연결
- README/.gitignore 반영
- 최종 검증
