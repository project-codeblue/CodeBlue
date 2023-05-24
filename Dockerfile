# 로컬 node 버전과 맞춤
FROM node:16.16.0

# 명령어를 실행할 워크 디렉토리 생성
RUN mkdir /app
WORKDIR /app

# 프로젝트 전체를 워크 디렉토리에 추가
ADD . /app

# 프로젝트에 사용되는 모듈 설치
RUN npm install

# Nest.js 빌드
RUN npm run build

# Port (3000) 개방
EXPOSE 3000

# 서버 실행
ENTRYPOINT npm run start:prod
