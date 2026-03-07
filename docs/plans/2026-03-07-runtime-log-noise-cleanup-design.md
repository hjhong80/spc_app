# Runtime Log Noise Cleanup Design

## 배경

JVM 경고는 정리됐지만, 테스트 실행과 로컬 개발 실행에서 다음과 같은 일반 INFO 로그가 여전히 많다.

- Spring Boot startup banner 및 startup info
- Hikari pool 시작/완료 로그
- Spring Test context bootstrap 로그
- Testcontainers Docker/container lifecycle INFO 로그
- Actuator endpoint exposure INFO 로그

이 로그들은 장애 분석에는 큰 도움이 되지 않는 반면, 성능 로그와 업로드/차트 도메인 로그를 읽기 어렵게 만든다.

## 목표

- `mvnw.cmd test`와 `mvnw.cmd spring-boot:run`에서 불필요한 일반 INFO 로그를 줄인다.
- 우리 애플리케이션의 도메인 로그(`com.spc.spc_back`)는 유지한다.
- 테스트/로컬 개발 공통으로 적용되되, 테스트 전용 소음은 별도로 더 낮춘다.

## 접근 방식

### 1. 메인 설정

`spc_back/src/main/resources/application.properties`에 다음 성격의 설정을 추가한다.

- `spring.main.banner-mode=off`
- `spring.main.log-startup-info=false`
- `logging.level.com.spc.spc_back=INFO`
- `logging.level.com.zaxxer.hikari=WARN`
- `logging.level.org.springframework.boot.actuate.endpoint.web=WARN`

효과:

- 로컬 실행에서 배너, startup info, Hikari/Actuator INFO를 줄인다.
- 애플리케이션 업로드/차트 관련 INFO 로그는 그대로 유지한다.

### 2. 테스트 설정

`spc_back/src/test/resources/application.properties`에는 메인과 같은 기본 억제에 더해 테스트 전용 로그를 추가로 낮춘다.

- `logging.level.org.springframework.test.context=WARN`
- `logging.level.org.springframework.boot.test.context=WARN`
- `logging.level.org.testcontainers=WARN`
- `logging.level.com.github.dockerjava=WARN`

효과:

- Spring Test bootstrap과 Testcontainers 준비 로그를 줄인다.

### 3. 회귀 테스트

설정이 빠지지 않도록 파일 기반 회귀 테스트를 추가한다.

- 메인 설정 파일에 startup/banner/Hikari 억제 설정 존재
- 테스트 설정 파일에 Spring Test/Testcontainers 로그 억제 설정 존재

## 영향 범위

- `spc_back/src/main/resources/application.properties`
- `spc_back/src/test/resources/application.properties`
- `spc_back/src/test/java/com/spc/spc_back/TestRuntimeLogNoiseSettingsTest.java`
- `README.md`

## 비목표

- 도메인 로깅 구조 개편
- 파일 로그/JSON 로그 도입
- 프로덕션 로그 정책 전면 재설계
