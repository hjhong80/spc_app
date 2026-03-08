# GCP VM + Nginx + systemd + GitHub Actions 배포 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Docker 없이 GCP Linux VM에 프론트와 백엔드를 배포하는 SSH 기반 CI/CD 구성을 추가한다.

**Architecture:** GitHub Actions가 프론트 `dist`와 백엔드 `jar`를 빌드하고 SSH/SCP로 서버에 업로드한다. 서버는 Nginx가 기존 15min 서비스는 `/15min`, `/15min/api`로 우회시키고 새 SPC 서비스는 `/spc`, `/spc/api`로 라우팅한다. Spring Boot는 `systemd` 서비스로 관리하며 저장소 줄바꿈 정책은 루트 `.gitattributes`에서 통합한다.

**Tech Stack:** GitHub Actions, Nginx, systemd, Spring Boot, Vite, OpenJDK 21, Markdown

---

### Task 1: 배포 준비 문서 작성

**Files:**
- Create: `docs/plans/2026-03-08-systemd-ssh-cicd-design.md`
- Create: `docs/plans/2026-03-08-systemd-ssh-cicd.md`
- Create: `.docs/systemd_ssh_cicd_prerequisites.md`

**Step 1: Write deployment design and checklist**

- 배포 구조, 서버 준비물, GitHub Secrets, 수동 설치 목록을 문서화한다.

### Task 2: 줄바꿈 정책 통합

**Files:**
- Create: `.gitattributes`

**Step 1: Add repository-wide line ending policy**

- 텍스트 파일 기본 `LF`, Windows 스크립트만 `CRLF`로 고정한다.

### Task 3: 서버 배포 예시 파일 작성

**Files:**
- Create: `deploy/nginx/zustand.store.conf`
- Create: `deploy/systemd/spc-backend.service`

**Step 1: Add runtime server config examples**

- Nginx reverse proxy와 정적 파일 경로, `www` 리다이렉트, `/15min` 공존 경로, systemd 서비스 예시를 작성한다.

### Task 4: GitHub Actions 워크플로 작성

**Files:**
- Create: `.github/workflows/frontend-deploy.yml`
- Create: `.github/workflows/backend-deploy.yml`

**Step 1: Add SSH/SCP based deployment workflows**

- 프론트는 `dist` 업로드 후 Nginx reload
- 백엔드는 `jar` 업로드 후 systemd restart

### Task 5: 결과 점검

**Files:**
- Verify only

**Step 1: Review generated deployment assets**

- 경로, 서비스명, Java 버전, 도메인 경로가 설계와 일치하는지 확인한다.
