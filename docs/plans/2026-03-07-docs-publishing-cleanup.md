# 문서 공개 구조 정리 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** GitHub 업로드 전 공개 문서는 `docs`로 정리하고, `.docs`는 샘플 자산 중심으로 남기며 Excel 파일은 업로드 제외 상태로 만든다.

**Architecture:** `docs`를 공개 문서 루트로 삼고 `history`, `database`, `plans` 세 축으로 나눈다. `.docs`의 날짜별 작업 정리는 날짜당 1개 문서로 통합해 `docs/history`로 이동하고, 기존 DB 문서와 수동 SQL도 `docs/database`로 이동한다.

**Tech Stack:** Markdown, PowerShell 파일 탐색, root `.gitignore`

---

### Task 1: 공개 문서 구조 생성

**Files:**
- Create: `docs/README.md`
- Create: `docs/history/2026-02-14.md`
- Create: `docs/history/2026-02-15.md`
- Create: `docs/history/2026-02-16.md`
- Create: `docs/history/2026-02-18.md`
- Create: `docs/history/2026-03-06.md`
- Create: `docs/database/schema.md`

**Step 1: 원본 날짜별 Markdown를 읽고 병합 기준을 정리한다**

Run: PowerShell로 `.docs/YYYY-MM-DD/*.md`를 확인
Expected: 날짜별 파일 목록과 섹션 구조가 파악된다

**Step 2: 날짜별 통합 문서를 작성한다**

내용:
- 원본 파일 목록
- 작업 목적
- 주요 변경 사항
- 검증 결과
- 남은 TODO

**Step 3: DB 문서를 `docs/database/schema.md`로 옮긴다**

내용:
- 기존 `.docs/db.md` 내용을 그대로 유지하되 제목과 경로만 정리

### Task 2: 문서 진입점과 참조 경로 정리

**Files:**
- Modify: `README.md`
- Create: `docs/README.md`
- Modify: `docs/plans/*` 중 `.docs` 경로가 남은 문서

**Step 1: `docs/README.md` 인덱스를 만든다**

내용:
- `plans`
- `history`
- `database`
- 업로드 제외 자산 규칙

**Step 2: 루트 `README.md`의 `.docs` 참조를 `docs` 기준으로 바꾼다**

대상:
- DB 인덱스 SQL 경로
- DB 문서 경로

**Step 3: 남은 `.docs` 경로를 검색해 공개 문서 기준으로 갱신한다**

Run: 검색 명령
Expected: 공개 문서에서 `.docs/...md`, `.docs/...sql` 참조가 남지 않는다

### Task 3: `.gitignore`와 `.docs` 정리

**Files:**
- Modify: `.gitignore`
- Delete or move: `.docs/YYYY-MM-DD/*.md`
- Delete or move: `.docs/db.md`
- Move: `.docs/2026-03-07/sql/2026-03-07_add_distribution_fetch_indexes.sql`

**Step 1: Excel 확장자 ignore 규칙을 추가한다**

규칙:
- `*.xls`
- `*.xlsx`
- `*.xlsm`

**Step 2: 공개 대상으로 옮긴 Markdown 원본을 `.docs`에서 정리한다**

방식:
- 날짜별 통합본 생성 후 원본 Markdown 삭제
- `db.md`는 이동 후 삭제

**Step 3: 배포용 SQL을 `docs/database/sql`로 이동한다**

이유:
- README와 공개 문서가 실제 업로드되는 경로를 가리키게 맞춘다

### Task 4: 최종 확인

**Files:**
- Check: `docs/**`
- Check: `.docs/**`
- Check: `.gitignore`
- Check: `README.md`

**Step 1: 문서 구조를 다시 나열해 확인한다**

Run: PowerShell `Get-ChildItem -Recurse docs`
Expected: `plans`, `history`, `database` 구조가 보인다

**Step 2: `.docs`에 날짜별 Markdown 원본이 남아 있는지 확인한다**

Run: PowerShell `Get-ChildItem -Recurse .docs -Include *.md`
Expected: 날짜별 원본이 제거되고 비공개 자산만 남는다

**Step 3: `.docs` 참조 잔존 여부를 검색한다**

Run: PowerShell 또는 `Select-String`
Expected: 공개 문서 기준 잔존 참조가 없거나 의도된 비공개 자산 참조만 남는다
