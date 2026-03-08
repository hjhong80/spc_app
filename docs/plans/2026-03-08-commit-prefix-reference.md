# 커밋 접두사 설명 문서 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 자주 쓰는 Git 커밋 메시지 접두사와 의미를 한국어로 정리한 참고 문서를 만든다.

**Architecture:** Conventional Commits 계열 접두사를 중심으로 목록을 추려 `.docs` 아래 단일 Markdown 문서로 정리한다. 각 접두사는 의미, 사용 시점, 예시 커밋 메시지까지 포함한다.

**Tech Stack:** Markdown, Git commit conventions

---

### Task 1: 설명 범위 정의

**Files:**
- Create: `docs/plans/2026-03-08-commit-prefix-reference.md`

**Step 1: Define prefix list**

- `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`, `revert`를 설명 대상으로 확정한다.

### Task 2: `.docs` 문서 작성

**Files:**
- Create: `.docs/2026-03-08/2026-03-08_git_commit_prefix_guide.md`

**Step 1: Write the document**

- 각 접두사의 의미, 사용 시점, 예시를 한국어로 정리한다.

### Task 3: 내용 확인

**Files:**
- Verify only

**Step 1: Review generated document**

- 항목 누락 여부와 예시 형식을 확인한다.
