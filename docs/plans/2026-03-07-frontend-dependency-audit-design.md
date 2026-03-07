# 프론트엔드 의존성 취약점 정리 설계

## 작업 목적
- 프론트엔드 `npm audit` 결과를 0에 가깝게 줄인다.
- 직접 의존성과 핵심 빌드 도구는 명시적으로 상향한다.
- 남는 전이 의존성 취약점은 `overrides`로 통제한다.

## 현재 상태
- [`spc_front/package.json`](../../spc_front/package.json)에 테스트 도구가 추가된 상태다.
- `npm audit` 결과는 총 5건이다.
  - `axios`: high, 직접 의존성
  - `rollup`: high, 전이 의존성
  - `ajv`: moderate, 전이 의존성
  - `markdown-it`: moderate, 전이 의존성
  - `minimatch`: high, 전이 의존성

## 설계 원칙
- 직접 의존성은 `package.json` 버전을 명시적으로 올린다.
- 빌드 체인 핵심 도구는 상위 버전으로 정리해 전이 취약점을 줄인다.
- 그래도 남는 전이 취약점은 `overrides`로 고정한다.
- `npm audit fix --force`는 사용하지 않는다.

## 변경 전략

### 1. 직접 의존성 상향
- `axios`는 취약 버전 범위를 벗어나도록 최신 패치 이상으로 올린다.
- `vite`는 `rollup` 취약점 해소 범위를 포함하는 버전으로 올린다.
- 필요 시 `orval` 관련 체인도 재해결되도록 lockfile을 갱신한다.

### 2. 전이 의존성 통제
- `overrides`를 사용해 아래 패키지를 안전 버전 이상으로 고정한다.
  - `ajv`
  - `minimatch`
  - `markdown-it`
- `rollup`은 우선 상위 도구 업데이트로 해결하고, 필요 시 추가 override를 검토한다.

### 3. lockfile 갱신
- `package-lock.json`은 새 버전 해상 결과를 반영한다.
- lockfile만 변경되고 실제 설치 결과가 일치하지 않는 상태를 남기지 않는다.

## 검증 계획
- 마지막에 한 번만 아래 순서로 실행한다.
- `npm audit`
- `npm run test:unit`
- `npm run test:e2e`
- `npm run build`

## 위험 요소
- `overrides`는 상위 라이브러리의 요구 범위를 넘길 수 있어 런타임 호환성 확인이 필요하다.
- `vite` 상향은 `rollup`과 개발 서버 동작에 영향을 줄 수 있다.
- `orval` 또는 문서 생성 관련 패키지에서 `markdown-it`, `ajv` 체인이 다시 유입될 수 있다.

## 주요 변경 사항
- 직접 의존성 상향
- `overrides` 추가
- lockfile 갱신
- audit 결과 재검증

## 검증 결과
- 설계 단계이므로 아직 미검증

## 남은 TODO
- 각 취약 패키지의 실제 해소 버전 확인
- `overrides` 최소 범위 확정
- 최종 audit 결과 확인
