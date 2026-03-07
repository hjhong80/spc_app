# GitHub Upload Prep Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 모노레포 기준으로 GitHub 첫 업로드가 가능하도록 중첩 Git 저장소를 정리하고 추적 대상과 원격 연결 준비 상태를 확인한다.

**Architecture:** 루트 저장소를 기준으로 `spc_back/.git` 중첩 저장소를 제거한 뒤, `.gitignore`가 적용된 실제 추적 파일 목록을 검증한다. 이후 첫 커밋이 가능한 상태로 staging 범위를 확인하고, GitHub 웹에서 만든 빈 저장소에 연결할 명령만 정리한다.

**Tech Stack:** Git, PowerShell

---

### Task 1: 업로드 준비 기준 확정

**Files:**
- Create: `C:/Users/USER/Documents/MyProjects/spc_project/docs/plans/2026-03-07-github-upload-prep.md`

**Step 1: 루트 저장소 상태 확인**

Run: `git rev-parse --is-inside-work-tree`
Expected: 현재 루트가 저장소인지 여부 확인

**Step 2: 중첩 저장소 위치 확인**

Run: `Get-ChildItem C:\Users\USER\Documents\MyProjects\spc_project\spc_back -Force`
Expected: `spc_back/.git` 존재 확인

### Task 2: 중첩 저장소 제거

**Files:**
- Delete: `C:/Users/USER/Documents/MyProjects/spc_project/spc_back/.git`

**Step 1: 사용자 승인 범위 내에서 `.git` 디렉터리 제거**

Run: `Remove-Item -Recurse -Force C:\Users\USER\Documents\MyProjects\spc_project\spc_back\.git`
Expected: `spc_back`가 일반 폴더로 전환

**Step 2: 루트 저장소 기준으로 상태 재확인**

Run: `git status --short --ignored`
Expected: `spc_back`가 embedded repo 경고 없이 일반 추적 대상로 보임

### Task 3: 추적 대상 최종 점검

**Files:**
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/.gitignore`

**Step 1: dry-run staging 확인**

Run: `git add -A -n`
Expected: 업로드 대상 파일과 ignore 제외 파일 목록 확인

**Step 2: 민감정보/산출물 제외 상태 확인**

Run: `git status --short --ignored`
Expected: `.docs`, `.env`, 엑셀 목데이터, build 산출물이 ignored 처리됨

### Task 4: 첫 커밋 및 원격 연결 준비

**Files:**
- Modify: `C:/Users/USER/Documents/MyProjects/spc_project/.git`

**Step 1: 실제 staging 준비**

Run: `git add -A`
Expected: 첫 커밋 대상이 index에 반영

**Step 2: 커밋 상태 요약 확인**

Run: `git status --short`
Expected: staged 파일 목록 확인

**Step 3: 사용자용 원격 연결 명령 정리**

Run:
```bash
git remote add origin https://github.com/<owner>/<repo>.git
git commit -m "chore: prepare initial public repository"
git push -u origin main
```
Expected: GitHub 빈 저장소와 연결 가능한 명령 제공
