# SPC Docs

이 디렉터리는 SPC App의 공개 문서 허브입니다.  
루트 [README.md](../README.md)가 프로젝트 소개와 실행 기준을 설명한다면, 이 문서들은 작업 배경, 설계 의사결정, DB 구조를 더 자세히 보여줍니다.

## 문서 구성

### History
- [docs/history](history)
- 날짜별 작업 정리를 통합한 문서입니다.
- 기능 추가, 리팩터링, 테스트/성능 개선 흐름을 시간순으로 따라갈 수 있습니다.

### Plans
- [docs/plans](plans)
- 설계 문서와 구현 계획 문서입니다.
- 왜 이런 구조를 선택했는지, 어떤 방식으로 구현을 진행했는지 확인할 수 있습니다.

### Database
- [docs/database/schema.md](database/schema.md)
- [docs/database/sql](database/sql)
- DB 스키마와 배포용 수동 SQL을 정리한 문서입니다.

## 추천 읽기 순서
1. [루트 README](../README.md)
2. [DB 문서](database/schema.md)
3. [최근 설계/구현 계획](plans)
4. [작업 히스토리](history)

## 업로드 제외 자산
- 테스트용 Excel, 매크로, 임시 샘플 자산은 `.docs/` 아래에 보관합니다.
- Excel 확장자(`.xls`, `.xlsx`, `.xlsm`)와 실제 환경설정 파일은 `.gitignore`로 업로드 대상에서 제외합니다.
