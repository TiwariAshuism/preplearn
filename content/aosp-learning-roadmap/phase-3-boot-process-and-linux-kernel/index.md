---
source: notion
title: "🥾 Phase 3 — Boot Process & Linux Kernel"
slug: "phase-3-boot-process-and-linux-kernel"
notionId: "38cda883-bddd-81ad-bcfb-c007a321547a"
notionRootId: "38cda883bddd81b98874c1adfe349ac5"
parent: "aosp-learning-roadmap"
children: []
order: 4
icon: "🥾"
cover: null
---

# Phase 3 — Boot Process & Linux Kernel


**Duration:** 4–5 weeks | **Level:** Intermediate

> Understanding boot sequence is the skeleton key to all AOSP internals. Every component you study later fits into this sequence.

---


## 🚀 Android Full Boot Sequence


```javascript
Power ON
  ↓
BootROM (chip-level, vendor code)
  ↓
Bootloader (e.g. U-Boot / LK / UEFI)
  ↓
Linux Kernel
  ↓
init (PID 1) — parses init.rc
  ↓
Zygote (app process incubator)
  ↓
System Server (all Java system services)
  ↓
Activity Manager Service (AMS)
  ↓
Home Launcher (first Activity)
```


Each step is a separate deep area. Learn them from bottom to top.


---


## 1️⃣ BootROM & Bootloader


### BootROM

- Burned into SoC (System-on-Chip) at manufacture time
- Loads the **bootloader** from flash into SRAM and executes it
- Handles secure boot verification (on modern devices)

### Bootloader

- Sets up hardware (RAM, clocks, peripherals)
- Displays the boot logo
- Decides boot mode: **normal boot**, **recovery**, **fastboot**
- Verifies kernel signature (Android Verified Boot / AVB)
- Loads kernel image + initrd into RAM and jumps to kernel entry

**Key concepts:**

- `fastboot` mode = bootloader-level USB protocol for flashing
- Unlocking bootloader disables AVB signature verification
- OEMs implement their own bootloaders (LK, UEFI-based)

---


## 2️⃣ Linux Kernel


Android runs a **modified Linux kernel** with Android-specific patches:


| Feature                     | Description                                     |
| --------------------------- | ----------------------------------------------- |
| **Binder**                  | Android's IPC mechanism (not in mainline Linux) |
| **Ashmem**                  | Anonymous shared memory                         |
| **Logger**                  | `logcat` kernel driver (`/dev/log`)             |
| **Wakelocks**               | Power management — prevents CPU sleep           |
| **ION allocator**           | Shared memory between CPU and GPU/camera        |
| **Low Memory Killer (LMK)** | Kills background processes when memory is low   |


### Kernel Boot Steps


```javascript
Kernel entry (arch/arm64/kernel/head.S)
  ↓
Start kernel (init/main.c: start_kernel())
  ↓
Mount initial RAM disk (initramfs / initrd)
  ↓
Run /init (userspace begins)
```


### Key kernel files to read


```javascript
kernel/drivers/android/binder.c      # Binder IPC driver
kernel/drivers/android/ashmem.c      # Shared memory
kernel/drivers/staging/android/ion/  # ION allocator
```


---


## 3️⃣ init — PID 1


`init` is the first userspace process. Source: `system/core/init/`


### What init does

1. Mounts filesystems (`/proc`, `/sys`, `/dev`)
2. Parses `init.rc` and device-specific `.rc` files
3. Starts critical daemons: `ueventd`, `servicemanager`, `vold`, `netd`
4. Starts **Zygote**
5. Monitors services — restarts them on crash

### init.rc syntax


```bash
# Service definition
service zygote /system/bin/app_process64 -Xzygote /system/bin --zygote --start-system-server
    class main
    socket zygote stream 660 root system
    onrestart write /sys/android_power/request_state wake
    onrestart restart media

# Action trigger
on boot
    write /proc/sys/kernel/panic_on_oops 1
    start zygote
```


**Key files:**

- `system/core/init/main.cpp` — entry point
- `system/core/init/init.cpp` — rc file parsing
- `system/core/rootdir/init.rc` — main rc file

---


## 4️⃣ Zygote


Zygote is the **parent of all Android app processes**.


### Why Zygote exists

- Starting a JVM process is slow (seconds).
- Zygote pre-loads all Android framework classes and resources once at boot.
- When launching a new app, the OS **forks Zygote** — a fork is milliseconds.
- The forked process has all framework code already loaded in memory (Copy-on-Write).

### Zygote startup


```javascript
app_process64 starts
  ↓
ZygoteInit.main() (frameworks/base/core/java/com/android/internal/os/ZygoteInit.java)
  ↓
Preload classes (preloaded-classes file ~7000 classes)
Preload resources (drawables, colors)
  ↓
Start SystemServer in a fork
  ↓
Open Zygote socket and wait for fork requests
```


### Launching an app


```javascript
AMS sends fork request via Zygote socket
  ↓
Zygote forks itself
  ↓
Child process: ActivityThread.main() runs
  ↓
App's Application.onCreate() → Activity.onCreate()
```


**Key file:** `frameworks/base/core/java/com/android/internal/os/ZygoteInit.java`


---


## 5️⃣ SystemServer


`SystemServer` runs in a Zygote-forked process and **starts all Java system services**:


```java
// frameworks/base/services/java/com/android/server/SystemServer.java
private void startBootstrapServices() {
    mActivityManagerService = ActivityManagerService.Lifecycle.startService(...);
    mPackageManagerService = PackageManagerService.main(...);
    // ...
}
private void startCoreServices() { ... }
private void startOtherServices() {
    // WindowManagerService, InputManagerService,
    // NetworkManagementService, AudioService, etc.
}
```


All system services register themselves with `ServiceManager` (the IPC registry).


---


## 🛠️ Hands-On Tasks

1. Add a log to `ZygoteInit.java`, rebuild, and watch it in `logcat -b all`:

    ```bash
    adb logcat -s Zygote
    ```

2. Read `init.rc` and list every service that starts before Zygote.
3. Trace the `startActivity` call from app → AMS → Zygote fork → ActivityThread.
4. Read `ActivityThread.main()` and understand what the main Looper is doing.
5. Use `adb shell ps` on the emulator — identify PID 1 (init), Zygote, and SystemServer.

---


## ✅ Phase 3 Checklist

- [ ] Can draw the full boot sequence from power-on to launcher
- [ ] Understand BootROM vs Bootloader roles
- [ ] Know Android-specific Linux kernel additions (Binder, Wakelocks, LMK)
- [ ] Read `system/core/init/main.cpp`
- [ ] Understand `init.rc` service/action syntax
- [ ] Know why Zygote exists and how forking saves time
- [ ] Read `ZygoteInit.java` and understand preloading
- [ ] Read `SystemServer.java` — list bootstrap, core, and other services
- [ ] Run `adb shell ps` and identify all key processes
- [ ] Traced `startActivity` from app process to Zygote fork
