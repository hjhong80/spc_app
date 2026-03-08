# 로컬 환경파일 복구 및 실행 경로 정리 설계

## 작업 목적
- 로컬에서 다시 프로젝트를 실행할 수 있도록 루트 `spc.env` 기준을 확정한다.
- 프론트 개발 서버와 백엔드 API 연결 경로를 로컬 개발 흐름에 맞게 정리한다.
- 중복된 `.gitignore` 규칙을 루트 기준으로 통합해 CI/CD 준비 전 설정 혼선을 줄인다.

## 현재 상태
- 백엔드는 `spc_back/src/main/resources/application.properties`에서 `./spc.env`와 `./deploy/spc.env`를 읽도록 되어 있다.
- 프론트 예시 파일은 배포 경로 `/spc/api`를 기본값으로 두고 있어 `npm run dev` 시 로컬 백엔드와 바로 연결되지 않는다.
- 루트 `.gitignore`, `spc_back/.gitignore`, `spc_front/.gitignore`에 환경파일 관련 규칙이 분산돼 있다.
- 실제 운영용 `jwt.secret`는 복구 불가하므로 로컬 실행용 새 Base64 값을 생성해 사용해야 한다.

## 접근안 비교

### 1. 기존 구조 유지 + 문서만 보강
- 장점: 변경 범위가 작다.
- 단점: 루트 실행과 하위 디렉터리 실행 기준이 계속 섞여 혼선이 남는다.

### 2. 선택안
- 루트 `spc.env`를 로컬 표준으로 고정한다.
- 백엔드는 루트에서 실행하는 명령을 기준으로 안내한다.
- 프론트 로컬 예시는 `http://localhost:8080/spc/api`를 사용하고, 배포 예시는 별도 파일에 유지한다.
- `.gitignore`는 루트에서만 환경파일 규칙을 관리하고 하위 `.gitignore`에서는 도구별 산출물만 남긴다.

### 3. 프록시 기반 개발 서버 전환
- 장점: 프론트 환경변수에 절대 URL을 덜 적어도 된다.
- 단점: Vite 프록시 설정과 E2E 기준까지 함께 손봐야 해서 현재 목표 대비 과하다.

선택은 2번이다.

## 최종 설계

### 환경파일 전략
- 로컬 실행용 실제 파일: 프로젝트 루트 `spc.env`
- 배포 예시 파일: `deploy/spc.env.example`
- 프론트 로컬 개발 예시 파일: `spc_front/.env.example`
- `spc.env`는 Git에서 제외하고 예시 파일만 저장소에 남긴다.

### 로컬 실행 기준
- 백엔드: 프로젝트 루트에서 `spc_back\mvnw.cmd -f spc_back\pom.xml spring-boot:run`
- 백엔드 포트: `8080`
- 백엔드 context path: `/spc/api`
- 프론트: `spc_front`에서 `npm run dev`
- 프론트 개발 서버 포트: Vite 기본값 `5173`
- 프론트 로컬 API 기본값: `http://localhost:8080/spc/api`

### JWT secret 전략
- 운영용 secret 복구는 범위 밖이다.
- 로컬용 새 secret는 사용자가 즉시 생성할 수 있도록 PowerShell과 OpenSSL 예시를 문서에 남긴다.
- `JwtUtils`가 Base64 디코딩을 요구하므로 예시는 충분한 길이의 Base64 문자열 기준으로 작성한다.

### .gitignore 통합 전략
- 루트 `.gitignore`에서 환경파일 규칙을 단일 관리한다.
- `spc_back/.gitignore`와 `spc_front/.gitignore`에서는 중복 환경파일 규칙을 제거한다.
- 하위 `.gitignore`는 IDE, 빌드 산출물, 패키지 산출물만 유지한다.

### 검증 전략
- 로컬 실행 기준 파일에 하드코딩된 `localhost`와 배포 경로를 다시 검색한다.
- 테스트/예시/문서 목적의 `localhost`, `127.0.0.1`, `4173`은 허용하되 실행 기본값과 충돌하는지 구분한다.
- 마지막에 백엔드 테스트와 프론트 빌드를 한 번만 실행한다.
