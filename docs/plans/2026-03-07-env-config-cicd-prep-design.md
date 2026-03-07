# 환경설정/배포 경로 정리 설계

## 작업 목적
- GitHub 업로드 전 실제 비밀 설정 파일을 저장소에서 분리한다.
- 프론트와 백엔드의 `localhost` 하드코딩을 제거하고 배포용 경로 기반 설정으로 전환한다.
- 이후 GitHub Actions + SSH 배포에서 재사용 가능한 환경변수 구조를 만든다.

## 배포 목표 경로
- 프론트: `https://zustand.store/spc`
- 백엔드: `https://zustand.store/spc/api`

## 문제 배경
- 현재 백엔드는 `application.properties`에 DB/JWT 값과 `localhost` DB URL이 직접 들어 있다.
- 프론트는 API base URL과 Orval OpenAPI target에 `http://localhost:8080`이 하드코딩돼 있다.
- 향후 CI/CD와 SSH 배포를 고려하면 실제 비밀 파일은 GitHub에 올리지 않고, 서버 환경파일과 GitHub Secrets로 주입해야 한다.
- 기존 포트폴리오 프로젝트용 `.env`와 키 이름이 겹칠 수 있어 앱별 네임스페이스가 필요하다.

## 접근안

### 1. 통파일 Base64 Secret 방식
- `application.properties`와 `.env` 전체를 Base64로 GitHub Secret에 넣고 배포 시 decode한다.
- 장점: 기존 파일 구조를 많이 안 바꿔도 된다.
- 단점: 어떤 키가 필요한지 관리가 어렵고 수정 추적이 불편하다.

### 2. 권장안
- 저장소에는 예시 파일만 남기고 실제 값 파일은 ignore한다.
- 백엔드는 Spring 환경변수 참조로 바꾸고, 프론트는 `VITE_*` 환경변수로 통일한다.
- 서버에는 별도 `spc.env` 파일을 두고 SSH 배포 시 그 파일을 참조한다.
- 장점: 가장 단순하고, 로컬/CI/서버 운영이 명확하다.

### 3. 전부 키 단위 Secret 방식
- 파일 없이 GitHub Secrets/Variables만으로 구성한다.
- 장점: 보안 경계는 선명하다.
- 단점: 로컬 개발과 서버 운영이 번거롭고 설정 목록이 코드 바깥으로 숨는다.

## 최종 설계

### 설정 파일 전략
- 저장소에 남길 파일
  - `spc_back/application-example.properties`
  - `spc_front/.env.example`
  - 필요 시 서버 예시 파일 `deploy/spc.env.example`
- 저장소에서 제외할 파일
  - `application.properties`
  - `application-*.properties`
  - `.env`
  - `.env.*`

### 변수명 전략
- 기존 포트폴리오용 `.env`와 충돌을 피하기 위해 `SPC_` 접두어를 사용한다.
- 백엔드 후보
  - `SPC_DB_URL`
  - `SPC_DB_USERNAME`
  - `SPC_DB_PASSWORD`
  - `SPC_JWT_SECRET`
  - `SPC_FRONTEND_URL`
  - `SPC_SWAGGER_URL`
  - `SPC_REDIS_HOST`
  - `SPC_REDIS_PORT`
- 프론트 후보
  - `VITE_SPC_API_BASE_URL`
  - `VITE_SPC_KAKAO_MAP_KEY`
  - `VITE_SPC_API_KEY`
  - `VITE_SPC_AUTH_DOMAIN`
  - `VITE_SPC_PROJECT_ID`
  - `VITE_SPC_STORAGE_BUCKET`
  - `VITE_SPC_MESSAGING_SENDER_ID`
  - `VITE_SPC_APP_ID`

### 코드 변경 전략
- 프론트
  - API base URL은 `VITE_SPC_API_BASE_URL` 참조
  - Orval OpenAPI target도 환경변수 참조
  - 필요 시 Vite `base`와 React Router `basename`을 `/spc/` 기준으로 정리
- 백엔드
  - DB/JWT/Redis/OpenAPI URL은 환경변수 placeholder로 변경
  - `server.servlet.context-path=/spc/api` 적용 여부를 함께 검토
  - Swagger/OpenAPI 서버 주소도 `SPC_SWAGGER_URL` 기준으로 맞춤

### 운영 전략
- 로컬 개발
  - 기존 `.env`를 건드리지 않도록 `spc.env` 또는 앱 전용 파일을 사용
- GitHub Actions
  - Secrets/Variables로 `.env.production` 또는 `spc.env`를 생성
- 서버
  - SSH 배포 대상 서버에 `spc.env` 유지
  - Spring Boot는 해당 파일을 source 하거나 systemd 환경파일로 참조

## 검증 계획
- `.gitignore`에 실제 값 파일 패턴이 들어 있는지 확인한다.
- 저장소에 `example` 파일만 남는지 확인한다.
- 프론트/백엔드에서 `localhost` 하드코딩이 제거됐는지 확인한다.
- README 또는 배포 문서에 새 환경변수 규칙이 반영됐는지 확인한다.
