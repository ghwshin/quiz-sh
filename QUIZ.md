# Quiz Data Format

퀴즈 데이터 파일의 형식과 규칙을 정의합니다.

## 파일 구조

```
data/
├── linux-kernel/          # 10개 서브카테고리
│   ├── process-management.json
│   ├── memory-management.json
│   ├── filesystem.json
│   ├── device-driver.json
│   ├── networking.json
│   ├── kernel-module.json
│   ├── scheduling.json
│   ├── system-call.json
│   ├── synchronization-ipc.json
│   └── boot-process.json
└── android-system/        # 10개 서브카테고리
    ├── system-architecture.json
    ├── activity-service.json
    ├── binder-ipc.json
    ├── hal.json
    ├── android-runtime.json
    ├── build-system.json
    ├── selinux-security.json
    ├── init-zygote.json
    ├── framework-services.json
    └── hidl-aidl.json
```

각 JSON 파일은 퀴즈 객체의 배열(`Quiz[]`)입니다.

## 파일당 구성

| 항목 | 값 |
|------|-----|
| 총 문제 수 | 25문제 |
| 객관식 (multiple-choice) | 10문제 |
| 빈칸 채우기 (short-answer) | 8문제 |
| 코드 빈칸 채우기 (code-fill) | 7문제 |
| 난이도 분배 | 초급/중급/고급 균등 |

## 공통 필드

모든 퀴즈 유형에 공통으로 존재하는 필드:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `id` | `string` | O | 고유 식별자. `{서브카테고리 약어}-{번호}` 형식 (예: `mm-001`) |
| `category` | `"linux-kernel" \| "android-system"` | O | 상위 카테고리 |
| `subcategory` | `string` | O | 서브카테고리 (파일명과 일치) |
| `difficulty` | `"초급" \| "중급" \| "고급"` | O | 난이도 |
| `type` | `"multiple-choice" \| "short-answer" \| "code-fill"` | O | 문제 유형 |
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

번호는 3자리 zero-padded (예: `mm-001`, `mm-025`). 파일 내에서 순번이 연속적이어야 합니다.

## 검증 체크리스트

새 문제를 추가하거나 수정할 때 확인할 항목:

- [ ] JSON 파싱 오류 없음
- [ ] `id`가 파일 내에서 유일
- [ ] `category`/`subcategory`가 파일 경로와 일치
- [ ] `difficulty`가 `"초급"`, `"중급"`, `"고급"` 중 하나
- [ ] `type`이 `"multiple-choice"`, `"short-answer"`, `"code-fill"` 중 하나
- [ ] 객관식: `options` 4개, `answer` 0~3
- [ ] 빈칸 채우기: `question` 내 `___` 개수 = `blankAnswers.length`
- [ ] 코드 빈칸: `codeTemplate` 내 `___` 개수 = `blankAnswers.length`
- [ ] `blankAnswers`의 각 항목에 최소 1개의 비어있지 않은 답안
- [ ] `explanation`이 비어있지 않음

## TypeScript 타입 정의

```typescript
type QuizType = "multiple-choice" | "short-answer" | "code-fill";
type Difficulty = "초급" | "중급" | "고급";
type Category = "linux-kernel" | "android-system";

interface Quiz {
  id: string;
  category: Category;
  subcategory: string;
  difficulty: Difficulty;
  type: QuizType;
  question: string;
  options?: string[];       // multiple-choice only
  answer?: number;          // multiple-choice only
  codeTemplate?: string;    // code-fill only
  codeLanguage?: string;    // code-fill only
  blankAnswers?: string[][]; // short-answer & code-fill
  explanation: string;
}
```
