# GCP VM + Nginx + systemd + GitHub Actions 배포 설계

## 작업 목적
- Docker 없이 GCP Linux VM 1대에 프론트와 백엔드를 배포할 수 있는 구조를 만든다.
- 백엔드는 `systemd` 서비스로 관리하고, 프론트는 Nginx 정적 파일 배포로 운영한다.
- GitHub Actions가 SSH/SCP로 빌드 산출물을 전달하고 서비스 재시작까지 수행하도록 정리한다.
- 저장소 전체 줄바꿈 정책을 통일해 Windows 환경의 LF/CRLF 경고를 줄인다.

## 목표 운영 구조
- 도메인 메인: `https://zustand.store`
- `https://www.zustand.store`는 `https://zustand.store`로 리다이렉트
- 기존 서비스 프론트: `https://zustand.store/15min`
- 기존 서비스 백엔드: `https://zustand.store/15min/api`
- 프론트: `https://zustand.store/spc`
- 백엔드: `https://zustand.store/spc/api`
- Nginx:
  - `/15min`은 기존 Docker 프론트로 proxy
  - `/15min/api`는 기존 Docker 백엔드로 proxy
  - `/spc` 정적 파일 제공
  - `/spc/api`를 Spring Boot로 reverse proxy
- Spring Boot:
  - `127.0.0.1:8080`에서 실행
  - `systemd`가 기동/재시작/로그 관리를 담당

## 배포 방식 비교

### 1. 서버에서 직접 git pull 후 빌드
- 장점: 업로드 파일 수가 적다.
- 단점: 서버에 Node, npm, JDK, Maven 환경을 전부 갖춰야 하고 재현성이 떨어진다.

### 2. 선택안
- GitHub Actions에서 프론트와 백엔드를 각각 빌드한다.
- 프론트는 `dist`를, 백엔드는 `jar`를 서버로 업로드한다.
- 서버는 이미 준비된 Nginx/systemd 설정으로 파일만 교체하고 reload/restart 한다.
- 장점: 서버가 단순하고, 배포 실패 원인을 Actions와 서버로 분리해 추적하기 쉽다.

### 3. Docker 기반 배포
- 장점: 컨테이너 격리와 이식성이 좋다.
- 단점: 현재 목표는 Docker 단순화이므로 범위를 벗어난다.

선택은 2번이다.

## 저장소 반영 범위
- 루트 `.gitattributes`
- `.github/workflows/frontend-deploy.yml`
- `.github/workflows/backend-deploy.yml`
- `deploy/nginx/zustand.store.conf`
- `deploy/systemd/spc-backend.service`
- `.docs` 사용자 사전 준비 체크리스트

## 사용자 사전 준비 범위
- GCP VM 접속 계정과 SSH 키 준비
- 서버 패키지 설치: `nginx`, `openjdk-21-jre`, `rsync` 또는 `scp` 사용 가능 환경
- 기존 Docker 15min 서비스가 새 포트에서 뜨도록 compose/컨테이너 포트 조정
- 배포 디렉터리 생성
- 서버용 실제 `spc.env` 생성
- `systemd` 서비스 등록 및 활성화
- Nginx 사이트 설정 반영 및 인증서 경로 연결
- GitHub Secrets 등록

## 줄바꿈 정책
- 루트 `.gitattributes`로 텍스트 파일 기본 `LF`
- Windows 실행 스크립트(`*.cmd`, `*.bat`)만 `CRLF`
- Java/TS/JS/YAML/MD/Properties는 `LF`
- 기존 `spc_back/.gitattributes`는 유지하되 루트 정책으로 저장소 전반을 커버한다.

## 검증 기준
- 워크플로 파일이 프론트/백엔드 배포를 각각 정의해야 한다.
- Nginx/systemd 예시 파일이 실제 경로 기준으로 바로 수정 가능해야 한다.
- `.docs` 체크리스트만 보고도 사용자가 서버 사전 준비를 할 수 있어야 한다.
