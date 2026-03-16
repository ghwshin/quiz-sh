# Quiz Data Format

퀴즈 데이터 파일의 형식과 규칙을 정의합니다.

## 파일 구조

```
data/
├── linux-kernel/          # 15개 서브카테고리
│   ├── process-management.json
│   ├── memory-management.json
│   ├── filesystem.json
│   ├── device-driver.json
│   ├── networking.json
│   ├── kernel-module.json
│   ├── scheduling.json
│   ├── system-call.json
│   ├── synchronization-ipc.json
│   ├── boot-process.json
│   ├── kernel-observability-debugging.json
│   ├── containers-isolation.json
│   ├── block-storage-io.json
│   ├── arm64-architecture.json
│   └── dev-conversation.json
└── android-system/        # 15개 서브카테고리
    ├── system-architecture.json
    ├── activity-service.json
    ├── binder-ipc.json
    ├── hal.json
    ├── android-runtime.json
    ├── build-system.json
    ├── selinux-security.json
    ├── init-zygote.json
    ├── framework-services.json
    ├── hidl-aidl.json
    ├── boot-integrity-updates.json
    ├── platform-debugging-performance.json
    ├── platform-modularity-virtualization.json
    ├── arm64-platform.json
    └── dev-conversation.json
```

각 JSON 파일은 퀴즈 객체의 배열(`Quiz[]`)입니다.

## 파일당 구성

### 일반 서브카테고리 (28파일)

| 항목 | 값 |
|------|-----|
| 총 문제 수 | 25문제 |
| 객관식 (multiple-choice) | 10문제 |
| 빈칸 채우기 (short-answer) | 8문제 |
| 코드 빈칸 채우기 (code-fill) | 7문제 |
| 난이도 분배 | 초급/중급/고급 균등 |

### 대화형 서브카테고리 (dev-conversation, 2파일)

| 항목 | 값 |
|------|-----|
| 총 문제 수 | 25문제 |
| 대화형 객관식 (conversation/objective) | 15문제 |
| 대화형 빈칸 (conversation/fill-blank) | 10문제 |
| 난이도 분배 | 초급 8 / 중급 9 / 고급 8 |

## 공통 필드

모든 퀴즈 유형에 공통으로 존재하는 필드:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `id` | `string` | O | 고유 식별자. `{서브카테고리 약어}-{번호}` 형식 (예: `mm-001`) |
| `category` | `"linux-kernel" \| "android-system"` | O | 상위 카테고리 |
| `subcategory` | `string` | O | 서브카테고리 (파일명과 일치) |
| `difficulty` | `"초급" \| "중급" \| "고급"` | O | 난이도 |
| `type` | `"multiple-choice" \| "short-answer" \| "code-fill" \| "conversation"` | O | 문제 유형 |
| `question` | `string` | O | 문제 텍스트 |
| `explanation` | `string` | O | 해설 |

## 유형별 필드

### 1. 객관식 (`multiple-choice`)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `options` | `string[]` | O | 선택지 배열 (4개) |
| `answer` | `number` | O | 정답 인덱스 (0-based) |

```json
{
  "id": "mm-001",
  "category": "linux-kernel",
  "subcategory": "memory-management",
  "difficulty": "초급",
  "type": "multiple-choice",
  "question": "Linux 커널에서 물리 메모리를 관리하는 기본 단위는 무엇인가?",
  "options": ["Segment", "Page", "Block", "Sector"],
  "answer": 1,
  "explanation": "Linux 커널은 물리 메모리를 page 단위로 관리합니다."
}
```

규칙:
- `options`는 정확히 4개
- `answer`는 0~3 범위의 정수

### 2. 빈칸 채우기 (`short-answer`)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `blankAnswers` | `string[][]` | O | 빈칸별 허용 답안 배열 |

```json
{
  "id": "mm-004",
  "category": "linux-kernel",
  "subcategory": "memory-management",
  "difficulty": "초급",
  "type": "short-answer",
  "question": "가상 주소를 물리 주소로 변환할 때, 최근 사용된 페이지 테이블 항목을 캐싱하여 변환 속도를 높이는 하드웨어 장치를 ___라고 한다.",
  "blankAnswers": [["TLB", "Translation Lookaside Buffer"]],
  "explanation": "TLB는 MMU 내부에 위치한 고속 연관 캐시입니다."
}
```

규칙:
- `question` 내 `___` 개수 = `blankAnswers.length` (반드시 일치)
- 각 `blankAnswers[i]`는 해당 빈칸의 허용 답안 배열 (최소 1개)
- 답안은 1~3단어로 간결하게, 한/영 대안을 모두 포함
- 채점: case-insensitive, 앞뒤 공백 trim, 내부 공백 정규화 (`/\s+/g → ' '`)

### 3. 코드 빈칸 채우기 (`code-fill`)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `codeTemplate` | `string` | O | `___`가 포함된 코드 템플릿 |
| `codeLanguage` | `string` | O | 프로그래밍 언어 (`c`, `java`, `kotlin`, `cpp`, `shell`, `xml` 등) |
| `blankAnswers` | `string[][]` | O | 빈칸별 허용 답안 배열 |

```json
{
  "id": "mm-007",
  "category": "linux-kernel",
  "subcategory": "memory-management",
  "difficulty": "초급",
  "type": "code-fill",
  "question": "커널 모듈에서 GFP_KERNEL 플래그를 사용하여 256바이트의 메모리를 할당하고, 사용 후 해제하는 코드를 완성하시오.",
  "codeTemplate": "void *ptr;\n\nptr = ___(256, GFP_KERNEL);\nif (!ptr) {\n    printk(KERN_ERR \"Memory allocation failed\\n\");\n    return -ENOMEM;\n}\n\n/* 메모리 사용 */\n\n___(ptr);",
  "codeLanguage": "c",
  "blankAnswers": [["kmalloc"], ["kfree"]],
  "explanation": "kmalloc()은 커널에서 가장 일반적으로 사용되는 메모리 할당 함수입니다."
}
```

규칙:
- `codeTemplate` 내 `___` 개수 = `blankAnswers.length` (반드시 일치)
- `question`은 코드 설명 (빈칸 없음), `codeTemplate`에 빈칸 배치
- `codeLanguage`는 코드 블록의 언어 표시에 사용
- 채점 방식은 short-answer와 동일

### 4. 대화형 (`conversation`)

개발자 대화 시나리오를 읽고 기술적 상황을 파악하는 문제입니다. 슬랙/메신저 스타일의 대화를 제시하고, 객관식(objective) 또는 빈칸 채우기(fill-blank) 형식으로 출제합니다.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `conversation` | `ConversationMessage[]` | O | 대화 메시지 배열 (시니어 제외) |
| `seniorHint` | `ConversationMessage[]` | O | 시니어 힌트 메시지 (접힌 상태로 표시) |
| `conversationMode` | `"objective" \| "fill-blank"` | O | 대화형 하위 모드 |
| `scenarioType` | `"bug-report" \| "code-review" \| "design-discussion"` | O | 시나리오 유형 |
| `options` | `string[]` | objective만 | 선택지 배열 (4개) |
| `answer` | `number` | objective만 | 정답 인덱스 (0-based) |
| `blankAnswers` | `string[][]` | fill-blank만 | 빈칸별 허용 답안 배열 |
| `blankDistractors` | `string[][]` | fill-blank만 | 빈칸별 오답 선택지 (2-3개) |

**ConversationMessage 인터페이스:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `speaker` | `string` | O | 화자 이름 (예: "박신입") |
| `role` | `string` | O | 역할 (팀장/신입/AI/QA/리뷰어/PM/동료) |
| `avatar` | `string` | O | 이모지 아바타 |
| `text` | `string` | △ | 메시지 텍스트 (fill-blank이면 `___` 포함 가능) |
| `code` | `string` | △ | 코드 블록 (선택) |
| `codeLanguage` | `string` | △ | 코드 언어 (선택) |

**페르소나:**

| 아바타 | 이름 | 역할 | 특성 | 배치 |
|--------|------|------|------|------|
| 👩‍💻 | 이시니어 | 시니어 | 시스템 전문가. 방향만 제시하는 힌트 | `seniorHint` 전용 |
| 🧑‍💻 | 박신입 | 신입 | 열정적이지만 경험 부족. 증상 보고, 잘못된 추측 | `conversation` |
| 🤖 | Copilot | AI | 그럴듯한 hallucination. 틀린/불완전한 조언 | `conversation` |
| 🧑‍💼 | 최팀장 | 팀장 | 경력 많지만 시스템은 약함. 지시, 성급한 결론 | `conversation` |
| 🔍 | 환영 | QA | 버그 증상/로그 보고 | `conversation` |
| 👀 | 민수 | 리뷰어 | "이게 맞나요?" 식 지적 | `conversation` |
| 📋 | 수진 | PM | 비기술적 요구사항 전달 | `conversation` |
| 💬 | 지훈 | 동료 | 대등한 토론, 확신 없는 의견 | `conversation` |

**시나리오 유형:**

| 유형 | 설명 | 전형적 대화 흐름 |
|------|------|-----------------|
| `bug-report` | QA가 증상 보고 | QA → 신입 잘못된 추측 → AI 틀린 조언 |
| `code-review` | 리뷰어가 문제 지적 | 리뷰어 → 동료 의견 → 토론 |
| `design-discussion` | PM이 요구사항 전달 | PM → 동료들이 다른 접근법 제안 |

**seniorHint 규칙:**

- 시니어(이시니어)는 `conversation` 배열에 절대 포함되지 않음
- `seniorHint` 배열에만 존재하며, UI에서 접힌 힌트로 표시
- 힌트는 방향만 제시하고 정답을 직접 말하지 않음
- `seniorHint` 메시지에 `___` (빈칸) 금지
- `conversation` 배열에 role "고객" 금지 (삭제된 역할)

```json
{
  "id": "dc-001",
  "category": "linux-kernel",
  "subcategory": "dev-conversation",
  "difficulty": "초급",
  "type": "conversation",
  "conversationMode": "objective",
  "scenarioType": "bug-report",
  "conversation": [
    { "speaker": "환영", "role": "QA", "avatar": "🔍",
      "text": "프로덕션 서버에서 Java 프로세스가 갑자기 종료되었습니다." },
    { "speaker": "박신입", "role": "신입", "avatar": "🧑‍💻",
      "text": "dmesg에 이런 로그가 있어요.",
      "code": "Out of memory: Killed process 3421 (java) total-vm:8192000kB",
      "codeLanguage": "shell" },
    { "speaker": "최팀장", "role": "팀장", "avatar": "🧑‍💼",
      "text": "Java 버그 아니야? JVM 힙 설정 확인해봐." }
  ],
  "seniorHint": [
    { "speaker": "이시니어", "role": "시니어", "avatar": "👩‍💻",
      "text": "dmesg 로그의 'Out of memory' 키워드에 주목해보세요. 커널 레벨의 메모리 관리 메커니즘을 확인해보면 됩니다." }
  ],
  "question": "dmesg 로그에서 확인된 현상의 원인은 무엇인가?",
  "options": ["시스템 메모리 부족으로 OOM Killer가 프로세스를 강제 종료함", "..."],
  "answer": 0,
  "explanation": "OOM Killer는 시스템 메모리가 극도로 부족할 때 커널이 프로세스를 강제 종료하는 메커니즘입니다."
}
```

규칙:
- `conversation` 배열에 최소 2개의 메시지
- 각 메시지에 `text` 또는 `code` 중 하나 이상 존재
- `seniorHint` 필수, 최소 1개의 메시지
- `seniorHint` 메시지의 role은 반드시 "시니어"
- `conversation` 배열에 role "시니어" 금지 (seniorHint로 분리)
- `conversation` 배열에 role "고객" 금지 (삭제된 역할)
- `scenarioType` 필수: "bug-report", "code-review", "design-discussion" 중 하나
- fill-blank: 대화 메시지 `text` 내 `___` 개수 = `blankAnswers.length`
- objective: `options` 4개, `answer` 0~3

## ID 규칙

| 카테고리 | 서브카테고리 | 접두어 |
|----------|-------------|--------|
| linux-kernel | process-management | `pm-` |
| linux-kernel | memory-management | `mm-` |
| linux-kernel | filesystem | `fs-` |
| linux-kernel | device-driver | `dd-` |
| linux-kernel | networking | `nw-` |
| linux-kernel | kernel-module | `km-` |
| linux-kernel | scheduling | `sc-` |
| linux-kernel | system-call | `sy-` |
| linux-kernel | synchronization-ipc | `si-` |
| linux-kernel | boot-process | `bp-` |
| android-system | system-architecture | `sa-` |
| android-system | activity-service | `as-` |
| android-system | binder-ipc | `bi-` |
| android-system | hal | `hl-` |
| android-system | android-runtime | `ar-` |
| android-system | build-system | `bs-` |
| android-system | selinux-security | `se-` |
| android-system | init-zygote | `iz-` |
| android-system | framework-services | `fw-` |
| android-system | hidl-aidl | `ha-` |
| linux-kernel | kernel-observability-debugging | `kd-` |
| linux-kernel | containers-isolation | `ci-` |
| linux-kernel | block-storage-io | `io-` |
| android-system | boot-integrity-updates | `bu-` |
| android-system | platform-debugging-performance | `dp-` |
| android-system | platform-modularity-virtualization | `mv-` |
| linux-kernel | arm64-architecture | `aa-` |
| android-system | arm64-platform | `ap-` |
| linux-kernel | dev-conversation | `dc-` |
| android-system | dev-conversation | `ad-` |

번호는 3자리 zero-padded (예: `mm-001`, `mm-025`). 파일 내에서 순번이 연속적이어야 합니다.

## 검증 체크리스트

새 문제를 추가하거나 수정할 때 확인할 항목:

- [ ] JSON 파싱 오류 없음
- [ ] `id`가 파일 내에서 유일
- [ ] `category`/`subcategory`가 파일 경로와 일치
- [ ] `difficulty`가 `"초급"`, `"중급"`, `"고급"` 중 하나
- [ ] `type`이 `"multiple-choice"`, `"short-answer"`, `"code-fill"`, `"conversation"` 중 하나
- [ ] 객관식: `options` 4개, `answer` 0~3
- [ ] 빈칸 채우기: `question` 내 `___` 개수 = `blankAnswers.length`
- [ ] 코드 빈칸: `codeTemplate` 내 `___` 개수 = `blankAnswers.length`
- [ ] `blankAnswers`의 각 항목에 최소 1개의 비어있지 않은 답안
- [ ] `explanation`이 비어있지 않음
- [ ] 대화형: `seniorHint` 배열 필수, 각 메시지의 role은 "시니어"
- [ ] 대화형: `conversation` 배열에 role "시니어" 금지
- [ ] 대화형: `conversation` 배열에 role "고객" 금지
- [ ] 대화형: `seniorHint` 메시지에 `___` 금지
- [ ] 대화형: `scenarioType` 필수 ("bug-report", "code-review", "design-discussion")

## TypeScript 타입 정의

```typescript
type QuizType = "multiple-choice" | "short-answer" | "code-fill" | "conversation";
type Difficulty = "초급" | "중급" | "고급";
type Category = "linux-kernel" | "android-system";
type ScenarioType = "bug-report" | "code-review" | "design-discussion";

interface ConversationMessage {
  speaker: string;
  role: string;
  avatar: string;
  text?: string;
  code?: string;
  codeLanguage?: string;
}

type ConversationMode = "objective" | "fill-blank";

interface Quiz {
  id: string;
  category: Category;
  subcategory: string;
  difficulty: Difficulty;
  type: QuizType;
  question: string;
  options?: string[];               // multiple-choice & conversation/objective
  answer?: number;                  // multiple-choice & conversation/objective
  codeTemplate?: string;            // code-fill only
  codeLanguage?: string;            // code-fill only
  blankAnswers?: string[][];        // short-answer, code-fill & conversation/fill-blank
  blankDistractors?: string[][];    // word bank distractors
  conversation?: ConversationMessage[]; // conversation only
  conversationMode?: ConversationMode;  // conversation only
  seniorHint?: ConversationMessage[];   // conversation only - senior hint messages
  scenarioType?: ScenarioType;          // conversation only - scenario type
  explanation: string;
}
```
