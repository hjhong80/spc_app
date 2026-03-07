# TODO

## 작업 목적
- 포트폴리오용 메인 홈페이지와 현재 SPC 앱을 분리된 진입점으로 구성한다.
- 추후 `zustand.store` 도메인으로 배포할 수 있도록 프런트/백엔드 설정을 정리한다.

## 해야 할 일
- 포트폴리오 홈페이지 구조 결정
  - `zustand.store`를 포트폴리오 메인으로 사용할지 검토
  - 현재 SPC 앱은 `app.zustand.store` 또는 `zustand.store/spc` 형태 중 하나로 결정
- 프런트 API 주소 환경변수화
  - `spc_front/src/apis/custom-instance.ts`의 `http://localhost:8080` 하드코딩 제거
  - `import.meta.env.VITE_API_BASE_URL` 기반으로 변경
  - 로컬/운영용 `.env` 전략 정리
- 프런트 배포 경로 검토
  - 앱을 서브도메인에 둘지 서브경로에 둘지 결정
  - 서브경로 배포 시 Vite `base`와 React Router 경로 설정 검토
- 백엔드 운영 설정 정리
  - `application.properties`의 DB 계정, 비밀번호, JWT secret 외부 환경변수화
  - 운영 환경 CORS 허용 도메인을 실제 배포 도메인으로 제한
- 배포 구조 문서화
  - 도메인 구성, 프런트 URL, API URL, 인증 흐름 정리

## 참고 메모
- 현재 프런트는 API 주소를 코드에 하드코딩하고 있음
- 현재 백엔드는 CORS를 전체 허용 상태로 두고 있음
- 세팅 버튼 기능은 아직 미정이므로 홈 화면에는 자리만 유지된 상태
