# Test Hikari Tuning Design

## 작업 목적

Testcontainers 기반 백엔드 테스트 종료 후 반복적으로 찍히는 Hikari closed connection 경고를 줄이기 위해 테스트 전용 datasource 설정을 추가한다.

## 현재 상태

- 여러 통합 테스트가 각각 Testcontainers MySQL을 띄운다.
- 테스트는 모두 통과하지만, 컨테이너 종료 후 Hikari가 idle connection을 검증하거나 재연결을 시도하면서 경고가 남는다.
- 현재 테스트 환경에는 공통 test용 `application.properties`가 없다.

## 접근안 비교

### 1. 각 테스트 클래스에 DynamicPropertySource 반복 추가

- 장점: 바로 적용 가능
- 단점: 중복이 커지고 유지보수가 나쁘다.

### 2. 선택안

`src/test/resources/application.properties`를 추가해 Hikari 설정을 공통화한다.

- 장점: 설정이 한 곳에 모인다.
- 장점: 기존 DynamicPropertySource는 URL/계정만 유지하면 된다.
- 장점: 향후 test datasource 튜닝도 같은 파일에서 관리할 수 있다.
- 단점: 설정이 전체 테스트에 적용되므로 값은 보수적으로 잡아야 한다.

### 3. 테스트 인프라 재구성

- 장점: 더 근본적일 수 있다.
- 단점: 현재 목표 대비 과하다.

선택은 2번이다.

## 설계

### 테스트 설정

- 파일: `spc_back/src/test/resources/application.properties`
- 후보 값:
  - `spring.datasource.hikari.minimum-idle=0`
  - `spring.datasource.hikari.maximum-pool-size=2`
  - `spring.datasource.hikari.idle-timeout=10000`
  - `spring.datasource.hikari.max-lifetime=30000`

### 테스트

- `HikariDataSource`를 주입받아 위 설정이 실제로 반영되는지 확인하는 스모크 테스트를 추가한다.
- 기존 전체 테스트를 다시 실행해 경고량 변화를 확인한다.

## 반영 범위

- `spc_back/src/test/resources/application.properties`
- `spc_back/src/test/java/com/spc/spc_back/...` 내 설정 검증 테스트
- `README.md`

## 검증 계획

1. 설정 검증 테스트를 먼저 실패시키고 통과시킨다.
2. `mvnw.cmd test` 전체 실행
3. 테스트 통과 유지와 경고 감소 여부를 함께 확인한다.
