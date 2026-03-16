import type { Category, Difficulty, ScenarioType } from "@/types/quiz";

export const CATEGORIES: { id: Category; name: string; description: string }[] = [
  {
    id: "linux-kernel",
    name: "Linux Kernel",
    description: "리눅스 커널의 핵심 개념과 내부 구조를 학습합니다.",
  },
  {
    id: "android-system",
    name: "Android System",
    description: "안드로이드 시스템의 아키텍처와 핵심 컴포넌트를 학습합니다.",
  },
];

export const SUBCATEGORIES: Record<Category, { id: string; name: string }[]> = {
  "linux-kernel": [
    { id: "process-management", name: "프로세스 관리" },
    { id: "memory-management", name: "메모리 관리" },
    { id: "filesystem", name: "파일시스템" },
    { id: "device-driver", name: "디바이스 드라이버" },
    { id: "networking", name: "네트워킹" },
    { id: "kernel-module", name: "커널 모듈" },
    { id: "scheduling", name: "스케줄링" },
    { id: "system-call", name: "시스템 콜" },
    { id: "synchronization-ipc", name: "동기화/IPC" },
    { id: "boot-process", name: "부팅 과정" },
    { id: "kernel-observability-debugging", name: "커널 관측성/디버깅" },
    { id: "containers-isolation", name: "컨테이너/격리" },
    { id: "block-storage-io", name: "블록 스토리지/I/O" },
    { id: "arm64-architecture", name: "ARM64 아키텍처" },
    { id: "dev-conversation", name: "개발자 대화 상황" },
    { id: "terminal-lab", name: "터미널 실습" },
  ],
  "android-system": [
    { id: "system-architecture", name: "시스템 아키텍처" },
    { id: "activity-service", name: "Activity/Service" },
    { id: "binder-ipc", name: "Binder IPC" },
    { id: "hal", name: "HAL" },
    { id: "android-runtime", name: "Android Runtime" },
    { id: "build-system", name: "빌드 시스템" },
    { id: "selinux-security", name: "SELinux/보안" },
    { id: "init-zygote", name: "Init/Zygote" },
    { id: "framework-services", name: "Framework Services" },
    { id: "hidl-aidl", name: "HIDL/AIDL" },
    { id: "boot-integrity-updates", name: "부트 무결성/업데이트" },
    { id: "platform-debugging-performance", name: "플랫폼 디버깅/성능" },
    { id: "platform-modularity-virtualization", name: "플랫폼 모듈화/가상화" },
    { id: "arm64-platform", name: "ARM64 플랫폼" },
    { id: "dev-conversation", name: "개발자 대화 상황" },
    { id: "terminal-lab", name: "터미널 실습" },
  ],
};

export const DIFFICULTIES: { id: Difficulty; slug: string; name: string; color: string }[] = [
  { id: "초급", slug: "beginner", name: "초급", color: "text-green-400" },
  { id: "중급", slug: "intermediate", name: "중급", color: "text-yellow-400" },
  { id: "고급", slug: "advanced", name: "고급", color: "text-red-400" },
];

export const SCENARIO_TYPES: { id: ScenarioType; name: string }[] = [
  { id: "bug-report", name: "버그 리포트" },
  { id: "code-review", name: "코드 리뷰" },
  { id: "design-discussion", name: "설계 토론" },
];

/** Map URL slug to Difficulty value */
export function slugToDifficulty(slug: string): Difficulty | "random" | undefined {
  if (slug === "random") return "random";
  const found = DIFFICULTIES.find((d) => d.slug === slug);
  return found?.id;
}

/** Map Difficulty value to URL slug */
export function difficultyToSlug(diff: Difficulty | "random"): string {
  if (diff === "random") return "random";
  const found = DIFFICULTIES.find((d) => d.id === diff);
  return found?.slug ?? diff;
}
