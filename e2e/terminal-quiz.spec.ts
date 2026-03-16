import { test, expect } from "@playwright/test";

test.describe("Terminal Quiz — Linux Kernel", () => {
  test("lk-tl-001: GPIO LED 모듈 로드", async ({ page }) => {
    await page.goto("/quiz/linux-kernel/terminal-lab/beginner");
    await expect(page.getByText("GPIO LED")).toBeVisible();
    await expect(page.getByText("터미널", { exact: true })).toBeVisible();

    // Type correct command
    const input = page.locator('input[type="text"]');
    await input.fill("insmod /lib/modules/gpio_led.ko");
    await input.press("Enter");

    // Verify mission
    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 성공!")).toBeVisible();
    await expect(page.getByText("gpio_led 모듈이 로드됨")).toBeVisible();
  });

  test("lk-tl-001: fails without correct commands", async ({ page }) => {
    await page.goto("/quiz/linux-kernel/terminal-lab/beginner");
    await expect(page.getByText("GPIO LED")).toBeVisible();

    // Verify without doing anything
    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 실패")).toBeVisible();
  });

  test("lk-tl-002: sysctl IP 포워딩 설정", async ({ page }) => {
    await page.goto("/quiz/linux-kernel/terminal-lab/beginner");

    // Navigate to second question
    await page.getByText("다음").click();
    await expect(page.getByText("sysctl")).toBeVisible();

    const input = page.locator('input[type="text"]');

    // Add config to sysctl.conf
    await input.fill("echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf");
    await input.press("Enter");

    // Apply with sysctl -p
    await input.fill("sysctl -p");
    await input.press("Enter");

    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 성공!")).toBeVisible();
  });

  test("lk-tl-003: I2C 센서 모듈 로드 및 권한 변경", async ({ page }) => {
    await page.goto("/quiz/linux-kernel/terminal-lab/intermediate");
    await expect(page.getByText("I2C 센서")).toBeVisible();

    const input = page.locator('input[type="text"]');

    await input.fill("insmod /lib/modules/i2c_sensor.ko");
    await input.press("Enter");

    await input.fill("chmod 666 /dev/i2c_sensor0");
    await input.press("Enter");

    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 성공!")).toBeVisible();
  });

  test("lk-tl-004: softdog 모듈 언로드 및 블랙리스트", async ({ page }) => {
    await page.goto("/quiz/linux-kernel/terminal-lab/intermediate");

    // Navigate to second intermediate question
    await page.getByText("다음").click();
    await expect(page.getByText("softdog")).toBeVisible();

    const input = page.locator('input[type="text"]');

    await input.fill("rmmod softdog");
    await input.press("Enter");

    await input.fill("echo 'blacklist softdog' >> /etc/modprobe.d/blacklist.conf");
    await input.press("Enter");

    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 성공!")).toBeVisible();
  });

  test("lk-tl-005: 네트워크 인터페이스 설정", async ({ page }) => {
    await page.goto("/quiz/linux-kernel/terminal-lab/advanced");
    await expect(page.getByText(/eth0.*DOWN/)).toBeVisible();

    const input = page.locator('input[type="text"]');

    await input.fill("ip link set eth0 up");
    await input.press("Enter");

    await input.fill("ip addr add 192.168.1.100/24 dev eth0");
    await input.press("Enter");

    await input.fill("echo 'nameserver 8.8.8.8' >> /etc/resolv.conf");
    await input.press("Enter");

    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 성공!")).toBeVisible();
  });
});

test.describe("Terminal Quiz — Android System", () => {
  test("as-tl-001: ADB 디바이스 정보 조회", async ({ page }) => {
    await page.goto("/quiz/android-system/terminal-lab/beginner");
    await expect(page.getByText("ADB")).toBeVisible();

    const input = page.locator('input[type="text"]');

    // Get device info and save to file
    await input.fill("echo '14' > /tmp/device-info.txt");
    await input.press("Enter");

    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 성공!")).toBeVisible();
  });

  test("as-tl-002: init.rc에서 zygote 경로 확인", async ({ page }) => {
    await page.goto("/quiz/android-system/terminal-lab/beginner");

    // Navigate to second question
    await page.getByText("다음").click();
    await expect(page.getByText("zygote")).toBeVisible();

    const input = page.locator('input[type="text"]');

    await input.fill("grep zygote /system/etc/init/init.rc > /tmp/zygote-path.txt");
    await input.press("Enter");

    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 성공!")).toBeVisible();
  });

  test("as-tl-003: SELinux 스크립트 파일 생성", async ({ page }) => {
    await page.goto("/quiz/android-system/terminal-lab/intermediate");
    await expect(page.getByText(/test\.sh/)).toBeVisible();

    const input = page.locator('input[type="text"]');

    await input.fill("echo '#!/bin/sh' > /data/local/tmp/test.sh");
    await input.press("Enter");

    await input.fill("chmod 755 /data/local/tmp/test.sh");
    await input.press("Enter");

    await input.fill("echo 'chcon u:object_r:shell_exec:s0 /data/local/tmp/test.sh' > /tmp/selinux-cmd.txt");
    await input.press("Enter");

    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 성공!")).toBeVisible();
  });

  test("as-tl-004: logcat 크래시 앱 확인", async ({ page }) => {
    await page.goto("/quiz/android-system/terminal-lab/intermediate");

    // Navigate to second intermediate question
    await page.getByText("다음").click();
    await expect(page.getByText("logcat")).toBeVisible();

    const input = page.locator('input[type="text"]');

    await input.fill("echo 'com.example.buggyapp' > /tmp/crash-app.txt");
    await input.press("Enter");

    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 성공!")).toBeVisible();
  });

  test("as-tl-005: 시스템 파티션 hosts 파일 수정", async ({ page }) => {
    await page.goto("/quiz/android-system/terminal-lab/advanced");
    await expect(page.getByText("시스템 파티션")).toBeVisible();

    const input = page.locator('input[type="text"]');

    await input.fill("mount -o remount,rw /system");
    await input.press("Enter");

    await input.fill("echo '127.0.0.1 ads.example.com' >> /system/etc/hosts");
    await input.press("Enter");

    await input.fill("mount -o remount,ro /system");
    await input.press("Enter");

    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 성공!")).toBeVisible();
  });
});

test.describe("Terminal Quiz — UI Interaction", () => {
  test("hint reveal works progressively", async ({ page }) => {
    await page.goto("/quiz/linux-kernel/terminal-lab/beginner");

    // Click hint button
    await page.getByText("힌트 1 보기").click();
    await expect(page.getByText("insmod 명령어로 커널 모듈을 로드할 수 있습니다")).toBeVisible();
  });

  test("retry resets terminal state", async ({ page }) => {
    await page.goto("/quiz/linux-kernel/terminal-lab/beginner");

    // Fail the mission
    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 실패")).toBeVisible();

    // Retry
    await page.getByText("다시 도전").click();
    await expect(page.getByText("미션 완료 확인")).toBeVisible();
  });

  test("command history navigation with arrow keys", async ({ page }) => {
    await page.goto("/quiz/linux-kernel/terminal-lab/beginner");

    const input = page.locator('input[type="text"]');

    await input.fill("echo first");
    await input.press("Enter");

    await input.fill("echo second");
    await input.press("Enter");

    // Press ArrowUp to get last command
    await input.press("ArrowUp");
    await expect(input).toHaveValue("echo second");

    await input.press("ArrowUp");
    await expect(input).toHaveValue("echo first");

    await input.press("ArrowDown");
    await expect(input).toHaveValue("echo second");
  });
});

test.describe("Terminal Quiz — New Linux Kernel Questions", () => {
  test("lk-tl-006: 커널 로그 에러 분석", async ({ page }) => {
    await page.goto("/quiz/linux-kernel/terminal-lab/beginner");
    // Navigate past first two beginner questions
    await page.getByText("다음").click();
    await page.getByText("다음").click();
    await expect(page.getByText("kern.log")).toBeVisible();

    const input = page.locator('input[type="text"]');
    await input.fill("grep error /var/log/kern.log > /tmp/errors.txt");
    await input.press("Enter");
    await input.fill("grep -c error /var/log/kern.log > /tmp/error-count.txt");
    await input.press("Enter");

    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 성공!")).toBeVisible();
  });

  test("lk-tl-007: runaway 프로세스 종료", async ({ page }) => {
    await page.goto("/quiz/linux-kernel/terminal-lab/intermediate");
    // Navigate past first two intermediate questions
    await page.getByText("다음").click();
    await page.getByText("다음").click();
    await expect(page.getByText("crypto_miner")).toBeVisible();

    const input = page.locator('input[type="text"]');
    await input.fill("kill -9 4567");
    await input.press("Enter");
    await input.fill("echo 'killed crypto_miner process' > /var/log/action.log");
    await input.press("Enter");

    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 성공!")).toBeVisible();
  });

  test("lk-tl-008: 설정 파일 감사", async ({ page }) => {
    await page.goto("/quiz/linux-kernel/terminal-lab/intermediate");
    await page.getByText("다음").click();
    await page.getByText("다음").click();
    await page.getByText("다음").click();
    await expect(page.getByText(".conf")).toBeVisible();

    const input = page.locator('input[type="text"]');
    await input.fill("find /etc -name '*.conf' > /tmp/config-list.txt");
    await input.press("Enter");
    await input.fill("find /etc -name '*.conf' | wc -l > /tmp/config-count.txt");
    await input.press("Enter");

    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 성공!")).toBeVisible();
  });

  test("lk-tl-010: 메모리 튜닝", async ({ page }) => {
    await page.goto("/quiz/linux-kernel/terminal-lab/advanced");
    // Navigate past first two advanced questions
    await page.getByText("다음").click();
    await page.getByText("다음").click();
    await expect(page.getByText("swappiness")).toBeVisible();

    const input = page.locator('input[type="text"]');
    await input.fill("sysctl -w vm.swappiness=10");
    await input.press("Enter");
    await input.fill("echo 3 > /proc/sys/vm/drop_caches");
    await input.press("Enter");

    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 성공!")).toBeVisible();
  });
});

test.describe("Terminal Quiz — New Android Questions", () => {
  test("as-tl-006: 빌드 로그 분석", async ({ page }) => {
    await page.goto("/quiz/android-system/terminal-lab/beginner");
    await page.getByText("다음").click();
    await page.getByText("다음").click();
    await expect(page.getByText("FAILED")).toBeVisible();

    const input = page.locator('input[type="text"]');
    await input.fill("grep FAILED build.log > /tmp/failed-module.txt");
    await input.press("Enter");

    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 성공!")).toBeVisible();
  });

  test("as-tl-008: system_server ANR 분석", async ({ page }) => {
    await page.goto("/quiz/android-system/terminal-lab/intermediate");
    await page.getByText("다음").click();
    await page.getByText("다음").click();
    await page.getByText("다음").click();
    await expect(page.getByText("system_server")).toBeVisible();

    const input = page.locator('input[type="text"]');
    await input.fill("kill -9 1234");
    await input.press("Enter");
    await input.fill("grep DEADLOCK /data/anr/traces.txt > /tmp/anr-cause.txt");
    await input.press("Enter");

    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 성공!")).toBeVisible();
  });

  test("as-tl-009: HAL 라이브러리 감사", async ({ page }) => {
    await page.goto("/quiz/android-system/terminal-lab/advanced");
    await page.getByText("다음").click();
    await expect(page.getByText("HAL")).toBeVisible();

    const input = page.locator('input[type="text"]');
    await input.fill("ls /vendor/lib64/hw > /tmp/hal-list.txt");
    await input.press("Enter");
    await input.fill("grep version /vendor/etc/vintf/manifest.xml > /tmp/audio-hal-version.txt");
    await input.press("Enter");

    await page.getByText("미션 완료 확인").click();
    await expect(page.getByText("미션 성공!")).toBeVisible();
  });
});
