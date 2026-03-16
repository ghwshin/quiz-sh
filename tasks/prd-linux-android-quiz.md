# PRD: quiz.sh — 개발자를 위한 CS 학습 퀴즈 웹앱

## Introduction

개발자를 위한 CS 지식을 테스트하고 학습할 수 있는 한국어 퀴즈 웹앱이다. 현재 Linux Kernel과 Android System 카테고리를 제공하며, 서브 카테고리와 난이도(초급/중급/고급/랜덤)를 설정하여 선다형·주관식·코드 빈칸 채우기 등 다양한 형태의 문제를 풀 수 있다. 750개의 퀴즈를 정적 데이터로 포함하며, 로그인 없이 로컬 스토리지로 진행 상황을 관리한다. UI는 한국어, 코드와 기술 용어는 영어 원문 그대로 사용한다.

## Goals

- Linux Kernel과 Android System 각각 250개 이상, 총 500개 이상의 고품질 퀴즈 제공
- 선다형 / 주관식(키워드 매칭) / 코드 빈칸 채우기 문제를 균형 있게 구성
- 서브 카테고리별 분류로 체계적 학습 지원
- 초급·중급·고급 난이도 분류와 랜덤 모드 지원
- 한국어 UI (코드·기술 용어는 영어 원문 유지)
- 로그인 없이 로컬 스토리지로 풀이 진행 상황 저장
- 실용적이고 학습에 집중된 깔끔한 UI
- Vercel로 정적 배포 (Next.js SSG, DB 불필요, 무료 tier 활용 가능)

## Tech Stack

- **Framework:** Next.js (App Router, SSG)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Quiz Data:** JSON 정적 파일 (빌드 시 포함)
- **State:** LocalStorage (진행 상황 저장)
- **Deploy:** Vercel (정적 사이트에 최적, 무료 tier 충분, Next.js 네이티브 지원)
- **Code Highlighting:** Prism.js 또는 Shiki (코드 블록 퀴즈용)

## User Stories

### US-001: 메인 페이지 - 카테고리 선택
**Description:** As a 학습자, I want to 메인 페이지에서 Linux Kernel 또는 Android System을 선택할 수 있도록 so that 원하는 분야를 공부할 수 있다.

**Acceptance Criteria:**
- [ ] 메인 페이지에 Linux Kernel / Android System 두 개의 카테고리 카드 표시
- [ ] 각 카드에 카테고리 아이콘, 이름, 간단한 설명 포함
- [ ] 카드 클릭 시 해당 카테고리의 난이도 선택 페이지로 이동
- [ ] 반응형 디자인 (모바일/데스크톱)
- [ ] Typecheck 통과

### US-002: 서브 카테고리 선택 페이지
**Description:** As a 학습자, I want to 서브 카테고리를 선택할 수 있도록 so that 특정 주제를 집중적으로 공부할 수 있다.

**Acceptance Criteria:**
- [ ] 카테고리 선택 후 서브 카테고리 목록 표시
- [ ] Linux Kernel: 프로세스 관리, 메모리 관리, 파일시스템, 디바이스 드라이버, 네트워킹, 커널 모듈, 스케줄링, 시스템 콜, 동기화/IPC, 부팅 과정
- [ ] Android System: 시스템 아키텍처, Activity/Service, Binder IPC, HAL, Android Runtime(ART), 빌드 시스템, SELinux/보안, Init/Zygote, Framework Services, HIDL/AIDL
- [ ] 각 서브 카테고리에 문제 수와 진행률 표시
- [ ] "전체" 옵션으로 모든 서브 카테고리 포함 가능
- [ ] 선택 시 난이도 선택 페이지로 이동
- [ ] Typecheck 통과

### US-003: 난이도 선택 페이지
**Description:** As a 학습자, I want to 초급/중급/고급/랜덤 중 난이도를 선택할 수 있도록 so that 내 수준에 맞는 문제를 풀 수 있다.

**Acceptance Criteria:**
- [ ] 초급 / 중급 / 고급 / 랜덤 4가지 옵션 표시
- [ ] 각 난이도별 총 문제 수와 풀이 완료 수 표시 (선택된 서브 카테고리 기준)
- [ ] 랜덤 선택 시 모든 난이도에서 무작위로 출제
- [ ] 선택 시 퀴즈 풀이 페이지로 이동
- [ ] Typecheck 통과

### US-004: 선다형 퀴즈 풀이
**Description:** As a 학습자, I want to 선다형 문제를 풀고 정답/해설을 확인할 수 있도록 so that 지식을 테스트하고 학습할 수 있다.

**Acceptance Criteria:**
- [ ] 문제 번호, 난이도 배지, 카테고리 표시
- [ ] 4지선다 보기 표시, 하나 선택 가능
- [ ] 제출 후 정답/오답 즉시 표시 (정답은 초록, 오답은 빨강)
- [ ] 해설(explanation) 표시
- [ ] 다음 문제로 이동 버튼
- [ ] Typecheck 통과

### US-005: 주관식 퀴즈 풀이 (키워드 매칭)
**Description:** As a 학습자, I want to 주관식 문제에 답을 입력하고 키워드 기반으로 채점받을 수 있도록 so that 깊이 있는 학습이 가능하다.

**Acceptance Criteria:**
- [ ] 텍스트 입력 필드 제공
- [ ] 제출 시 입력값에서 필수 키워드 포함 여부로 채점
- [ ] 대소문자 무시, 공백 정규화 처리
- [ ] 정답 키워드 목록과 모범 답안 해설 표시
- [ ] Typecheck 통과

### US-006: 코드 빈칸 채우기 퀴즈
**Description:** As a 학습자, I want to 코드 블록에서 빈칸에 알맞은 코드를 입력할 수 있도록 so that 실무적인 코딩 능력을 기를 수 있다.

**Acceptance Criteria:**
- [ ] 코드 블록을 syntax highlighting과 함께 표시
- [ ] 빈칸 부분(`___`)을 인라인 입력 필드로 렌더링
- [ ] 제출 시 키워드 매칭으로 채점
- [ ] 정답 코드와 해설 표시
- [ ] C, Java, Shell 등 다양한 언어 코드 지원
- [ ] Typecheck 통과

### US-007: 퀴즈 진행 상황 로컬 저장
**Description:** As a 학습자, I want to 풀이 진행 상황이 자동 저장되도록 so that 다음에 이어서 풀 수 있다.

**Acceptance Criteria:**
- [ ] 각 문제의 풀이 여부와 정답/오답 결과를 LocalStorage에 저장
- [ ] 페이지 새로고침/재방문 시 진행 상황 복원
- [ ] 난이도 선택 페이지에서 풀이 진행률(N/M) 표시
- [ ] 데이터 초기화(리셋) 버튼 제공
- [ ] Typecheck 통과

### US-008: 퀴즈 데이터 생성 (500개+)
**Description:** As a 개발자, I need to 500개 이상의 고품질 퀴즈 데이터를 JSON으로 생성 so that 앱에서 사용할 수 있다.

**Acceptance Criteria:**
- [ ] Linux Kernel 관련 250개 이상 (초급 ~80, 중급 ~90, 고급 ~80)
- [ ] Android System 관련 250개 이상 (초급 ~80, 중급 ~90, 고급 ~80)
- [ ] 문제 유형 비율: 선다형 ~40%, 주관식 ~30%, 코드 빈칸 채우기 ~30%
- [ ] 각 문제에 id, category, difficulty, type, question, options/keywords/code, answer, explanation 포함
- [ ] JSON Schema 검증 통과
- [ ] 퀴즈 내용이 정확하고 실무에 도움이 되는 수준

### US-009: 정답/오답 해설 표시
**Description:** As a 학습자, I want to 문제를 풀고 나면 상세한 해설을 볼 수 있도록 so that 틀린 이유를 이해하고 학습할 수 있다.

**Acceptance Criteria:**
- [ ] 모든 문제에 해설(explanation) 포함
- [ ] 정답 제출 후 해설이 자동으로 펼쳐짐
- [ ] 코드 빈칸 문제의 경우 완성된 전체 코드도 표시
- [ ] 관련 개념이나 참고 키워드 포함
- [ ] Typecheck 통과

## Functional Requirements

- FR-1: 메인 페이지에서 Linux Kernel / Android System 카테고리 선택
- FR-2: 카테고리 선택 후 서브 카테고리 선택 (전체 포함)
- FR-3: 서브 카테고리 선택 후 초급/중급/고급/랜덤 난이도 선택
- FR-4: 선다형 문제 - 4지선다에서 하나를 선택하여 제출
- FR-5: 주관식 문제 - 텍스트 입력 후 키워드 포함 여부로 채점 (대소문자 무시, 공백 정규화)
- FR-6: 코드 빈칸 채우기 - syntax highlighted 코드 블록 내 빈칸에 코드 입력, 키워드 매칭 채점
- FR-7: 문제 풀이 후 정답/오답 표시 및 해설 노출
- FR-8: 풀이 결과(정답/오답)를 LocalStorage에 자동 저장
- FR-9: 서브 카테고리 및 난이도 선택 페이지에서 진행률 표시
- FR-10: 퀴즈 데이터를 JSON 정적 파일로 관리 (빌드 시 포함)
- FR-11: 퀴즈 순서는 순차 진행, 랜덤 모드에서는 셔플
- FR-12: 모바일/데스크톱 반응형 레이아웃
- FR-13: 진행 상황 초기화(리셋) 기능
- FR-14: 500개 이상의 퀴즈 데이터 포함
- FR-15: UI 전체 한국어, 코드와 기술 용어는 영어 원문 유지

## Non-Goals

- 사용자 로그인/회원가입 기능 없음
- 서버 사이드 데이터베이스 없음
- AI 기반 실시간 채점 없음
- 틀린 문제 모아보기/복습 기능 없음 (v1 범위 밖)
- 정답률 통계/대시보드 없음 (v1 범위 밖)
- 사용자 간 랭킹/리더보드 없음
- 퀴즈 추가/편집 어드민 패널 없음

## Design Considerations

- 다크 테마 기본 (개발자 학습 도구에 적합)
- 코드 블록은 모노스페이스 폰트 + syntax highlighting 필수
- 난이도 배지: 초급(초록), 중급(노랑), 고급(빨강) 색상 구분
- 문제 유형 아이콘: 선다형(리스트), 주관식(키보드), 코드(코드 아이콘)
- 미니멀하고 집중력 있는 레이아웃 - 불필요한 장식 최소화
- 진행 프로그레스 바 표시

## Technical Considerations

- Next.js App Router + SSG (`generateStaticParams`)로 전체 정적 빌드
- 퀴즈 JSON 파일은 `data/` 디렉토리에 카테고리별로 분리
  - `data/linux-kernel.json`
  - `data/android-system.json`
- 서브 카테고리 정의:
  - **Linux Kernel:** process-management, memory-management, filesystem, device-driver, networking, kernel-module, scheduling, system-call, synchronization-ipc, boot-process
  - **Android System:** system-architecture, activity-service, binder-ipc, hal, android-runtime, build-system, selinux-security, init-zygote, framework-services, hidl-aidl
- LocalStorage key: `quiz-progress-{category}-{subcategory}-{difficulty}`
- 코드 하이라이팅: Shiki (Next.js와 호환성 좋음, 빌드 타임 하이라이팅 가능)
- Vercel 배포: `next build && next export` 또는 기본 Vercel 빌드
- 퀴즈 JSON Schema 정의 후 빌드 시 검증 스크립트 포함

### 퀴즈 데이터 스키마 (예시)

```typescript
interface Quiz {
  id: string;                          // "lk-001", "as-001"
  category: "linux-kernel" | "android-system";
  subcategory: string;                 // "process-management", "memory-management", etc.
  difficulty: "beginner" | "intermediate" | "advanced";
  type: "multiple-choice" | "short-answer" | "code-fill";
  question: string;
  // multiple-choice
  options?: string[];
  // short-answer
  keywords?: string[];
  sampleAnswer?: string;
  // code-fill
  codeTemplate?: string;              // "___" marks blanks
  codeLanguage?: string;              // "c", "java", "shell"
  blankAnswers?: string[];            // answers for each blank
  // common
  answer: string | number;            // correct option index or answer text
  explanation: string;
}
```

## Success Metrics

- 500개 이상의 퀴즈 데이터 포함
- 모든 문제 유형(선다형/주관식/코드 빈칸)이 정상 동작
- Lighthouse Performance 점수 90+ (정적 사이트)
- 모바일에서 불편 없이 사용 가능
- 퀴즈 풀이 → 정답 확인 → 해설 확인까지 3클릭 이내

## Open Questions

- ~~서브 카테고리~~ → 추가 확정 (Linux 10개, Android 10개 서브 카테고리)
- ~~v2 계획~~ → 현재 없음. v1에 집중
- ~~다국어 지원~~ → 한국어 전용 (코드/기술 용어는 영어) 으로 확정
