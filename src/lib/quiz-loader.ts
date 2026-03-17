import type { Quiz, Category, Difficulty } from "@/types/quiz";
import { SUBCATEGORIES } from "@/lib/constants";

// Linux Kernel quiz data
import processManagement from "../../data/linux-kernel/process-management.json";
import memoryManagement from "../../data/linux-kernel/memory-management.json";
import filesystem from "../../data/linux-kernel/filesystem.json";
import deviceDriver from "../../data/linux-kernel/device-driver.json";
import networking from "../../data/linux-kernel/networking.json";
import kernelModule from "../../data/linux-kernel/kernel-module.json";
import scheduling from "../../data/linux-kernel/scheduling.json";
import systemCall from "../../data/linux-kernel/system-call.json";
import synchronizationIpc from "../../data/linux-kernel/synchronization-ipc.json";
import bootProcess from "../../data/linux-kernel/boot-process.json";
import kernelObservabilityDebugging from "../../data/linux-kernel/kernel-observability-debugging.json";
import containersIsolation from "../../data/linux-kernel/containers-isolation.json";
import blockStorageIo from "../../data/linux-kernel/block-storage-io.json";
import arm64Architecture from "../../data/linux-kernel/arm64-architecture.json";
import arm64CacheMemory from "../../data/linux-kernel/arm64-cache-memory.json";
import arm64VirtPower from "../../data/linux-kernel/arm64-virtualization-power.json";
import linuxDevConversation from "../../data/linux-kernel/dev-conversation.json";
import linuxTerminalLab from "../../data/linux-kernel/terminal-lab.json";

// Android System quiz data
import systemArchitecture from "../../data/android-system/system-architecture.json";
import activityService from "../../data/android-system/activity-service.json";
import binderIpc from "../../data/android-system/binder-ipc.json";
import hal from "../../data/android-system/hal.json";
import androidRuntime from "../../data/android-system/android-runtime.json";
import buildSystem from "../../data/android-system/build-system.json";
import selinuxSecurity from "../../data/android-system/selinux-security.json";
import initZygote from "../../data/android-system/init-zygote.json";
import frameworkServices from "../../data/android-system/framework-services.json";
import hidlAidl from "../../data/android-system/hidl-aidl.json";
import bootIntegrityUpdates from "../../data/android-system/boot-integrity-updates.json";
import platformDebuggingPerformance from "../../data/android-system/platform-debugging-performance.json";
import platformModularityVirtualization from "../../data/android-system/platform-modularity-virtualization.json";
import arm64Platform from "../../data/android-system/arm64-platform.json";
import arm64Development from "../../data/android-system/arm64-development.json";
import androidDevConversation from "../../data/android-system/dev-conversation.json";
import androidTerminalLab from "../../data/android-system/terminal-lab.json";

const quizDataMap: Record<Category, Record<string, Quiz[]>> = {
  "linux-kernel": {
    "process-management": processManagement as Quiz[],
    "memory-management": memoryManagement as Quiz[],
    filesystem: filesystem as Quiz[],
    "device-driver": deviceDriver as Quiz[],
    networking: networking as Quiz[],
    "kernel-module": kernelModule as Quiz[],
    scheduling: scheduling as Quiz[],
    "system-call": systemCall as Quiz[],
    "synchronization-ipc": synchronizationIpc as Quiz[],
    "boot-process": bootProcess as Quiz[],
    "kernel-observability-debugging": kernelObservabilityDebugging as Quiz[],
    "containers-isolation": containersIsolation as Quiz[],
    "block-storage-io": blockStorageIo as Quiz[],
    "arm64-architecture": arm64Architecture as Quiz[],
    "arm64-cache-memory": arm64CacheMemory as Quiz[],
    "arm64-virtualization-power": arm64VirtPower as Quiz[],
    "dev-conversation": linuxDevConversation as Quiz[],
    "terminal-lab": linuxTerminalLab as unknown as Quiz[],
  },
  "android-system": {
    "system-architecture": systemArchitecture as Quiz[],
    "activity-service": activityService as Quiz[],
    "binder-ipc": binderIpc as Quiz[],
    hal: hal as Quiz[],
    "android-runtime": androidRuntime as Quiz[],
    "build-system": buildSystem as Quiz[],
    "selinux-security": selinuxSecurity as Quiz[],
    "init-zygote": initZygote as Quiz[],
    "framework-services": frameworkServices as Quiz[],
    "hidl-aidl": hidlAidl as Quiz[],
    "boot-integrity-updates": bootIntegrityUpdates as Quiz[],
    "platform-debugging-performance": platformDebuggingPerformance as Quiz[],
    "platform-modularity-virtualization": platformModularityVirtualization as Quiz[],
    "arm64-platform": arm64Platform as Quiz[],
    "arm64-development": arm64Development as Quiz[],
    "dev-conversation": androidDevConversation as Quiz[],
    "terminal-lab": androidTerminalLab as unknown as Quiz[],
  },
};

/** Get all quizzes for a category */
export function getQuizzesByCategory(category: Category): Quiz[] {
  const subcategories = quizDataMap[category];
  return Object.values(subcategories).flat();
}

/** Get quizzes for a specific subcategory */
export function getQuizzesBySubcategory(
  category: Category,
  subcategory: string
): Quiz[] {
  if (subcategory === "all") {
    return getQuizzesByCategory(category);
  }
  return quizDataMap[category][subcategory] ?? [];
}

/** Filter quizzes by category, subcategory, and difficulty */
export function filterQuizzes(
  category: Category,
  subcategory: string,
  difficulty?: Difficulty | "random"
): Quiz[] {
  const quizzes = getQuizzesBySubcategory(category, subcategory);
  if (!difficulty || difficulty === "random") {
    return quizzes;
  }
  return quizzes.filter((q) => q.difficulty === difficulty);
}

/** Shuffle an array using Fisher-Yates algorithm */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Get quiz count per subcategory for a category */
export function getSubcategoryCounts(
  category: Category
): Record<string, number> {
  const counts: Record<string, number> = {};
  const subcategories = SUBCATEGORIES[category];
  for (const sub of subcategories) {
    counts[sub.id] = (quizDataMap[category][sub.id] ?? []).length;
  }
  return counts;
}

/** Get total quiz count for a category */
export function getCategoryQuizCount(category: Category): number {
  return getQuizzesByCategory(category).length;
}
