# 문서 공개 구조 정리 설계

## 작업 목적
- GitHub 업로드 전 공개 대상 문서를 `docs` 폴더로 일관되게 정리한다.
- `.docs`에 흩어진 날짜별 작업 정리 문서를 날짜당 1개 문서로 압축해 공개 가능한 형태로 재배치한다.
- 테스트/목데이터용 엑셀 파일이 저장소에 포함되지 않도록 ignore 규칙을 명확히 한다.

## 문제 배경
- 현재 `docs`는 `docs/plans`만 존재하고, 실제 작업 히스토리와 DB 문서는 `.docs`에 섞여 있다.
- `.docs` 아래에는 공개 가능한 Markdown, 배포용 SQL, 그리고 대량 목데이터 Excel 파일이 함께 섞여 있어 업로드 기준이 불명확하다.
- 루트 `README.md`도 일부 문서를 `.docs` 경로로 참조하고 있어 GitHub 업로드 시 링크가 깨질 수 있다.

## 접근안

### 1. 최소 이동안
- `.docs`는 그대로 두고 `docs`에는 index 문서만 추가한다.
- Excel ignore만 강화한다.
- 장점: 작업량이 작다.
- 단점: 공개 문서와 비공개 자산이 계속 섞여 남는다.

### 2. 권장안
- 공개 대상 Markdown은 `docs` 아래로 재구성한다.
- 날짜별 여러 작업 정리는 날짜당 1개 통합 문서로 합친다.
- DB 문서와 배포용 SQL도 `docs/database` 계층으로 옮겨 README 참조를 정리한다.
- `.docs`는 샘플/목데이터 자산 중심으로 남기고 Excel 파일은 전역 ignore로 막는다.
- 장점: GitHub 업로드 구조가 명확해지고 문서 탐색성이 좋아진다.
- 단점: 문서 경로 갱신이 필요하다.

### 3. 대수술안
- `docs` 전체를 기능별 handbook 구조로 재편하고 기존 plans도 재분류한다.
- 장점: 장기적으로 가장 깔끔하다.
- 단점: 지금 단계에는 변경 범위가 너무 넓다.

## 최종 설계
- `docs/README.md`를 새로 두고 문서 진입점 역할을 맡긴다.
- `docs/history/`에 날짜별 통합 작업 정리 문서를 생성한다.
  - 예: `docs/history/2026-02-14.md`
  - 기존 `.docs/YYYY-MM-DD/*.md`는 같은 날짜 문서로 병합한다.
- `docs/database/schema.md`로 `.docs/db.md` 내용을 이동한다.
- `docs/database/sql/`로 배포용 수동 SQL을 이동한다.
- 루트 `README.md`와 관련 문서의 `.docs/...` 참조는 모두 `docs/...`로 갱신한다.
- `.gitignore`에는 모든 Excel 확장자(`.xls`, `.xlsx`, `.xlsm`)를 저장소 전역에서 제외하도록 명시한다.
- `.docs`는 공개 문서가 아닌 작업 자산 보관소로 남긴다.

## 병합 기준
- 같은 날짜에 여러 개의 작업 정리 문서가 있으면 1개 문서로 합친다.
- 통합 문서는 다음 섹션을 유지한다.
  - 작업 목적
  - 주요 변경 사항
  - 검증 결과
  - 남은 TODO
- 각 날짜 문서 상단에 통합된 원본 파일 목록을 남겨 추적 가능하게 한다.
- 동일 의미의 항목은 중복을 제거하고, 서로 다른 작업은 flat bullet로 합친다.

## 영향 범위
- 문서 추가/이동
  - `docs/README.md`
  - `docs/history/*.md`
  - `docs/database/schema.md`
  - `docs/database/sql/*.sql`
- 문서 삭제/정리
  - `.docs/YYYY-MM-DD/*.md`
  - `.docs/db.md`
  - 필요 시 이동 완료 후 빈 날짜 디렉터리 정리
- 참조 경로 수정
  - `README.md`
  - 기타 `docs/plans/*.md` 또는 루트 문서 중 `.docs` 참조 파일
- ignore 규칙 수정
  - `.gitignore`

## 검증 계획
- `docs` 아래 새 구조가 의도한 경로대로 생성됐는지 확인한다.
- `.docs/YYYY-MM-DD/*.md`가 날짜별 1개 문서로 통합되었는지 확인한다.
- `.gitignore`에 Excel 제외 규칙이 있는지 확인한다.
- `README.md`에서 `.docs` 참조가 남아 있는지 검색한다.
