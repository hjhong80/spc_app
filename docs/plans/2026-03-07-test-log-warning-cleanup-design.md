# Test Log Warning Cleanup Design

## 작업 목적

백엔드 테스트 실행 시 반복적으로 출력되는 Thymeleaf 템플릿 위치 경고와 SpringDoc 운영 권고 로그를 테스트 전용 설정으로 정리한다.

## 현재 상태

- 전체 백엔드 테스트는 통과한다.
- Testcontainers 종료 후 Hikari 경고는 이미 테스트 전용 datasource 설정으로 정리됐다.
- 아직 남아 있는 주요 로그는 다음 두 가지다.
  - `Cannot find template location: classpath:/templates/`
  - SpringDoc의 `/v3/api-docs`, `/swagger-ui.html` 기본 활성화 권고 로그
- 실제 앱에서는 Thymeleaf starter와 SpringDoc UI 의존성을 유지하고 있으므로, 운영 동작을 바꾸지 않는 선에서 테스트 로그만 정리하는 것이 목적이다.

## 접근안 비교

### 1. 선택안

`spc_back/src/test/resources/application.properties`에 테스트 전용 설정을 추가해 경고를 억제한다.

- 장점: 운영 설정을 바꾸지 않는다.
- 장점: 전체 테스트에 일관되게 적용된다.
- 장점: 설정이 한 곳에 모여 유지보수가 쉽다.
- 단점: 테스트 설정 파일이 메인 설정 일부를 계속 복제하게 된다.

### 2. 메인 설정 전역 변경

- 장점: 로그가 가장 확실히 줄어든다.
- 단점: 개발/운영에서도 Swagger UI와 템플릿 체크 동작이 바뀔 수 있다.
- 단점: 지금 목표보다 영향 범위가 크다.

### 3. 테스트 클래스별 property 주입

- 장점: 제어 범위가 가장 좁다.
- 단점: `@SpringBootTest` 기반 테스트마다 중복 설정이 늘어난다.

선택은 1번이다.

## 설계

### 테스트 전용 설정

- 파일: `spc_back/src/test/resources/application.properties`
- 추가 설정:
  - `spring.thymeleaf.check-template-location=false`
  - `springdoc.api-docs.enabled=false`
  - `springdoc.swagger-ui.enabled=false`

### 테스트

- `Environment`를 주입받아 위 3개 설정이 실제 테스트 컨텍스트에 반영되는지 검증하는 스모크 테스트를 추가한다.
- 이 테스트는 경고 억제 의도가 코드로 남는 역할을 한다.

### 문서

- `README.md`에 테스트 전용 Hikari 설정과 함께 테스트 로그 경고 억제 설정이 추가되었음을 기록한다.

## 반영 범위

- `spc_back/src/test/resources/application.properties`
- `spc_back/src/test/java/com/spc/spc_back/...` 내 설정 검증 테스트
- `README.md`

## 검증 계획

1. 설정 검증 테스트를 먼저 추가하고 실제로 실패하는지 확인한다.
2. 테스트 전용 설정을 반영한다.
3. 전체 `mvnw.cmd test`를 다시 실행해 통과 여부와 로그 정리 결과를 확인한다.
