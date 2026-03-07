# SPC App

엑셀 성적서를 업로드하고, SPC 통계와 차트를 프로젝트 단위로 시각화하는 모노레포입니다.

배포 목표 경로:
- 프론트: `https://zustand.store/spc`
- 백엔드: `https://zustand.store/spc/api`

## 프로젝트 개요
- 성적서 Excel 업로드와 필드 매핑
- 프로젝트/특성치 관리
- 메인 SPC 차트와 세부 차트
- 정규분포 기반 상세 분석
- 프론트/백엔드 테스트와 성능 계측 기반 안정화

## 핵심 기능

### 1. Excel 업로드와 저장
- 프론트에서 성적서 샘플을 기준으로 열 매핑을 설정합니다.
- 백엔드는 EasyExcel 기반 파싱 후 `insp_report_tb`, `insp_data_tb`에 저장합니다.
- duplicate serial number, axis 기반 characteristic 매칭, 날짜/시간 셀 분리 같은 실제 운영 케이스를 처리합니다.

### 2. SPC 차트 시각화
- 메인 차트는 특성치 단위 SPC 상태를 요약합니다.
- 세부 월/일 차트로 drill-down 할 수 있습니다.
- 정규분포 보기와 세부 분포 분석을 지원합니다.

### 3. 성능 최적화
- 프론트 메인 차트는 대용량 데이터에서 다운샘플링과 lazy load를 적용했습니다.
- 세부 정규분포 차트는 응답/계산 캐시를 사용합니다.
- 백엔드는 `distribution`, `detail month` 조회에 EXPLAIN/성능 테스트와 인덱스 최적화를 반영했습니다.

### 4. 테스트 체계
- 프론트: `Vitest + Testing Library + Playwright`
- 백엔드: `JUnit + MockMvc + Testcontainers(MySQL)`
- 성능 테스트: 메인/세부 차트, `distribution/detail` API 베이스라인 포함

## 기술 스택

### Frontend
- React 19
- Vite
- MUI
- ApexCharts
- TanStack Query
- Playwright / Vitest

### Backend
- Spring Boot
- Spring Security
- MyBatis
- EasyExcel
- MySQL
- Redis
- Testcontainers

## 아키텍처

```text
Excel 업로드
  -> 프론트 필드 매핑
  -> 백엔드 파싱 / 검증
  -> MySQL 저장
  -> 통계 조회 API
  -> 프론트 SPC 차트 렌더링
```

주요 저장소 구조:
- [`spc_front`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_front): React/Vite 프론트엔드
- [`spc_back`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back): Spring Boot/MyBatis 백엔드
- [`docs`](/C:/Users/USER/Documents/MyProjects/spc_project/docs): 설계, 작업 히스토리, DB 문서

## 신뢰성 포인트
- 프론트 단위 테스트와 브라우저 E2E 테스트를 모두 구성했습니다.
- 백엔드 `ReportService`, 업로드 저장 경로, 컨트롤러 계층을 통합 테스트로 검증합니다.
- `distribution/detail` 조회는 EXPLAIN과 1만 샘플 성능 테스트로 병목을 추적합니다.
- 프론트 의존성 `npm audit`는 0건 상태로 정리했습니다.

## 로컬 실행

### Backend
1. [`spc_back`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back)로 이동
2. `spc.env` 또는 `deploy/spc.env` 준비
3. `mvnw.cmd spring-boot:run`
4. 로컬 문서 주소
   - Swagger UI: `http://localhost:8080/spc/api/swagger-ui/index.html`
   - OpenAPI: `http://localhost:8080/spc/api/v3/api-docs`

### Frontend
1. [`spc_front`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_front)로 이동
2. `.env.local`을 `.env.example` 기준으로 생성
3. `npm install`
4. `npm run dev`
5. 로컬 주소: `http://localhost:5173`

## 테스트 / 검증

### Frontend
- `npm run test:unit`
- `npm run test:e2e`
- `npm run build`

### Backend
- `mvnw.cmd test`

참고:
- 백엔드 통합/성능 테스트는 Docker Desktop 또는 호환 Docker 엔진이 필요합니다.
- 프론트 codegen은 `SPC_ORVAL_INPUT_TARGET` 또는 `spc_front/.env.codegen`이 필요합니다.

## 환경설정 전략
- 실제 비밀 파일은 GitHub에 올리지 않습니다.
- 저장소에는 예시 파일만 남깁니다.
  - [`spc_back/application-example.properties`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_back/application-example.properties)
  - [`spc_front/.env.example`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_front/.env.example)
  - [`spc_front/.env.codegen.example`](/C:/Users/USER/Documents/MyProjects/spc_project/spc_front/.env.codegen.example)
  - [`deploy/spc.env.example`](/C:/Users/USER/Documents/MyProjects/spc_project/deploy/spc.env.example)
- 백엔드 변수는 `SPC_*`, 프론트 변수는 `VITE_SPC_*` 네임스페이스를 사용합니다.
- 배포 시 서버의 `spc.env`와 GitHub Actions secrets/variables를 함께 사용하는 구조를 전제로 합니다.

## 문서
- 문서 인덱스: [docs/README.md](/C:/Users/USER/Documents/MyProjects/spc_project/docs/README.md)
- 작업 히스토리: [docs/history](/C:/Users/USER/Documents/MyProjects/spc_project/docs/history)
- DB 문서: [docs/database/schema.md](/C:/Users/USER/Documents/MyProjects/spc_project/docs/database/schema.md)
- 설계/구현 계획: [docs/plans](/C:/Users/USER/Documents/MyProjects/spc_project/docs/plans)

## 다음 단계
- GitHub Actions 기반 CI/CD
- `/spc`, `/spc/api` reverse proxy 반영
- 서버 `spc.env` 주입 및 SSH 배포 자동화
