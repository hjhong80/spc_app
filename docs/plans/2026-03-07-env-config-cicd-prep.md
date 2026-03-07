# 환경설정/배포 경로 정리 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 실제 설정 파일은 Git에서 제외하고, 프론트/백엔드가 `/spc` 및 `/spc/api` 배포 경로와 환경변수를 기준으로 동작하도록 정리한다.

**Architecture:** 백엔드는 Spring placeholder와 서버 환경파일(`spc.env`) 기반으로 전환하고, 프론트는 `VITE_SPC_*` 변수를 기준으로 API 주소와 외부 키를 읽는다. 저장소에는 예시 파일만 남기고 실제 값 파일은 `.gitignore`로 제외한다.

**Tech Stack:** Spring Boot properties, Vite env, Orval config, root `.gitignore`, Markdown docs

---

### Task 1: ignore 규칙과 예시 파일 추가

**Files:**
- Modify: `.gitignore`
- Create: `spc_back/application-example.properties`
- Create: `spc_front/.env.example`
- Create: `deploy/spc.env.example`

**Step 1: ignore 규칙 추가**
- `application.properties`
- `application-*.properties`
- `.env`
- `.env.*`
- 단, `*.example`은 유지

**Step 2: 백엔드 예시 파일 작성**
- DB/JWT/Redis/OpenAPI URL을 `SPC_*` 변수 기준으로 안내

**Step 3: 프론트 예시 파일 작성**
- `VITE_SPC_API_BASE_URL=/spc/api`
- 필요한 외부 키를 `VITE_SPC_*` 기준으로 정리

**Step 4: 서버 예시 환경파일 작성**
- `spc.env` 형식 예시와 SSH 배포 후 참조 방식을 남긴다

### Task 2: 백엔드 설정 환경변수화

**Files:**
- Replace or move: `spc_back/src/main/resources/application.properties`
- Modify: `spc_back/src/main/java/com/spc/spc_back/config/OpenApiConfig.java`
- Check: `spc_back/src/main/java/com/spc/spc_back/security/jwt/JwtUtils.java`

**Step 1: 실제 `application.properties`를 예시 파일로 대체**
- 실제 값 제거
- `${SPC_DB_URL:...}` 형태 placeholder 사용

**Step 2: context path와 외부 URL 전략 반영**
- `/spc/api` 기준 설정 검토
- Swagger/OpenAPI 설명용 URL도 환경변수로 정리

**Step 3: JWT/Redis/DB 참조가 새 변수명과 맞는지 확인**

### Task 3: 프론트 설정 환경변수화

**Files:**
- Modify: `spc_front/src/apis/custom-instance.ts`
- Modify: `spc_front/orval.config.cjs`
- Check: Vite/Router 관련 설정 파일

**Step 1: API base URL을 `VITE_SPC_API_BASE_URL` 참조로 변경**

**Step 2: Orval OpenAPI target도 환경변수 기준으로 변경**

**Step 3: `/spc` base path가 필요한 파일이 있으면 같이 정리**

### Task 4: 문서 반영

**Files:**
- Modify: `README.md`
- Create or modify: `docs/README.md`
- Optional: add deployment note under `docs`

**Step 1: 로컬/배포용 환경파일 구조 설명 추가**

**Step 2: `zustand.store/spc`, `zustand.store/spc/api` 기준 경로 설명 추가**

### Task 5: 최종 검증

**Files:**
- Check: `.gitignore`
- Check: `spc_back/application-example.properties`
- Check: `spc_front/.env.example`
- Check: `deploy/spc.env.example`
- Check: 프론트/백엔드 설정 파일

**Step 1: `localhost` 하드코딩 검색**
- 프론트/백엔드 소스 기준으로 확인

**Step 2: example 파일과 ignore 규칙 존재 확인**

**Step 3: 마지막에 필요한 빌드/테스트를 한 번만 실행**
