# JVM Warning Cleanup Design

## 배경

백엔드 `mvnw.cmd test` 실행 시 기능 실패와 무관한 JVM 경고가 남아 있었다.

- `WARNING: A terminally deprecated method in sun.misc.Unsafe has been called`
- `WARNING: sun.misc.Unsafe::objectFieldOffset has been called by lombok.permit.Permit`
- `OpenJDK 64-Bit Server VM warning: Sharing is only supported for boot loader classes because bootstrap classpath has been appended`

최근 확인 결과:

- `mockito.version`은 `5.20.0`
- `lombok.version`은 Spring Boot BOM 기준 `1.18.42`
- 즉 Lombok은 이미 최신 계열이라 단순 버전 상향만으로 `Unsafe` 경고가 사라질 가능성은 낮다.

## 목표

- `mvnw.cmd test` 기준 테스트 실행 로그에서 위 두 종류의 경고를 제거하거나 최소화한다.
- 기존 테스트 통과 상태와 성능 테스트 구조는 유지한다.
- 설정 변경이 왜 들어갔는지 테스트와 문서로 남긴다.

## 접근 방식

### 1. `Unsafe` 경고

`sun.misc.Unsafe` 경고는 JDK 24+에서 런타임 경고로 출력되며, 현재 프로젝트에서는 Lombok annotation processor 경로에서 발생한다.  
프로젝트 Lombok 버전은 이미 `1.18.42`이므로, 테스트 실행 환경에서 Maven JVM에 허용 옵션을 전달하는 방식이 가장 현실적이다.

적용:

- `.mvn/jvm.config` 추가
- `--sun-misc-unsafe-memory-access=allow` 설정

이 옵션은 `mvnw.cmd test`를 실행하는 Maven JVM 자체에 적용되므로, 컴파일 단계에서 출력되는 Lombok 기반 경고를 억제할 수 있다.

### 2. CDS(class data sharing) 경고

`Sharing is only supported for boot loader classes...` 경고는 Surefire 테스트 JVM이 Mockito javaagent를 붙이며 bootstrap classpath를 건드릴 때 발생한다.

적용:

- `maven-surefire-plugin`의 `argLine` 앞에 `-Xshare:off` 추가

이렇게 하면 테스트 fork JVM에서 class data sharing을 비활성화해 해당 경고를 없앨 수 있다.

### 3. Lombok 버전 명시

실제 경고 제거의 핵심은 아니지만, 테스트 실행 환경을 고정하기 위해 `pom.xml`에 `lombok.version`을 명시하고 의존성과 annotation processor 경로 모두 같은 속성을 사용한다.

목적:

- BOM 변경 시 Lombok 버전이 암묵적으로 바뀌지 않게 고정
- 테스트로 검증 가능한 명시적 설정으로 남기기

## 테스트 전략

1. 설정 회귀 테스트 추가
   - `.mvn/jvm.config`에 `--sun-misc-unsafe-memory-access=allow`가 있는지 확인
   - `pom.xml`에 `lombok.version` 속성이 명시되어 있는지 확인
   - Surefire `argLine`에 `-Xshare:off`가 포함되는지 확인

2. 최종 검증
   - `.\spc_back\mvnw.cmd -f spc_back/pom.xml test`
   - 전체 테스트 통과 여부와 로그 경고 여부를 함께 확인

## 영향 범위

- `spc_back/pom.xml`
- `spc_back/.mvn/jvm.config`
- `spc_back/src/test/java/com/spc/spc_back/TestJvmWarningSettingsIntegrationTest.java`
- `README.md`

## 비목표

- Mockito agent 제거
- 테스트 프레임워크 교체
- Lombok 미사용 리팩터링
