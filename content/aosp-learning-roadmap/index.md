---
source: notion
title: "🤖 AOSP Learning Roadmap"
slug: "aosp-learning-roadmap"
notionId: "38cda883bddd81b98874c1adfe349ac5"
notionRootId: "38cda883bddd81b98874c1adfe349ac5"
parent: null
children: ["aosp-master-checklist","phase-6-customization-ota-and-contributing","phase-5-framework-internals-ams-wms-pms","phase-4-hal-binder-ipc-and-system-services","phase-3-boot-process-and-linux-kernel","phase-1-prerequisites-and-environment-setup","phase-2-aosp-architecture-and-source-code"]
order: 0
icon: "🤖"
cover: null
---
> **Goal:** Go from Android app developer → AOSP contributor / platform engineer who understands Android internals deeply.

This roadmap is divided into **6 Phases** spanning roughly **6–9 months** of focused study. Each phase builds on the previous one.


---


## 🗺️ Roadmap Overview


| Phase   | Topic                               | Duration  | Level        |
| ------- | ----------------------------------- | --------- | ------------ |
| Phase 1 | Prerequisites & Environment Setup   | 2–3 weeks | Foundation   |
| Phase 2 | AOSP Architecture & Source Code     | 3–4 weeks | Intermediate |
| Phase 3 | Android Boot Process & Linux Kernel | 4–5 weeks | Intermediate |
| Phase 4 | HAL, Binder IPC & System Services   | 4–6 weeks | Advanced     |
| Phase 5 | Framework Internals (AMS, WMS, PMS) | 4–6 weeks | Advanced     |
| Phase 6 | Customization, OTA & Contributing   | 3–4 weeks | Expert       |


---


## 🧭 How to Use This Roadmap

1. Follow phases **sequentially** — each phase is a prerequisite for the next.
2. Each phase page has **concepts**, **hands-on tasks**, **key files to read**, and **resources**.
3. Use the **checklist** at the bottom of each phase to track progress.
4. Set up your **AOSP build environment early** (Phase 1) — it takes hours to download and build.

---


## 🛠️ Your End Goal Skills

- Build AOSP from source and flash to a device / emulator
- Read and navigate the AOSP codebase confidently
- Understand Android boot sequence end-to-end
- Write and integrate a custom HAL module
- Understand Binder IPC and add a system service
- Modify the Android Framework (AMS, WMS)
- Build a custom Android ROM
- Submit a patch to AOSP

---


## 📚 Sub-Pages

- 🔧 Phase 1 — Prerequisites & Environment Setup
- 🏛️ Phase 2 — AOSP Architecture & Source Code
- 🥾 Phase 3 — Boot Process & Linux Kernel
- 🔌 Phase 4 — HAL, Binder IPC & System Services
- ⚙️ Phase 5 — Framework Internals (AMS, WMS, PMS)
- 🚀 Phase 6 — Customization, OTA & Contributing
- 📋 AOSP Master Checklist

## 🔧 Phase 1 — Prerequisites & Environment Setup

# Phase 1 — Prerequisites & Environment Setup


**Duration:** 2–3 weeks | **Level:** Foundation

> You cannot learn AOSP without a working build. Get the machine ready first, then learn the theory.

---


## 📋 Prerequisites You Must Have


### Linux / Command Line

- Comfortable with `bash`, `grep`, `find`, `make`, `git`
- Understand file permissions, symlinks, environment variables
- Know how to read a `Makefile`

### C / C++ Basics

- Pointers, memory management, structs
- Compilation pipeline: preprocessor → compiler → linker
- Reading `.h` header files
- AOSP Framework and HAL are heavily C/C++

### Java / Kotlin (you already have this ✅)

- Android Framework APIs are Java/Kotlin
- Android System Services are written in Java

### Git

- `git log`, `git diff`, `git cherry-pick`, `git rebase`
- AOSP uses `repo` tool (a wrapper around multiple git repos)

---


## 🖥️ Machine Requirements


| Requirement | Minimum          | Recommended      |
| ----------- | ---------------- | ---------------- |
| OS          | Ubuntu 20.04 LTS | Ubuntu 22.04 LTS |
| RAM         | 16 GB            | 32–64 GB         |
| Disk        | 250 GB free      | 500 GB SSD       |
| CPU         | 8 cores          | 16+ cores        |
| Build time  | ~3–5 hours       | ~1–2 hours       |

> ⚠️ macOS is officially unsupported for building recent AOSP versions. Use Linux or a Linux VM/WSL2.

---


## ⚙️ Environment Setup Steps


### Step 1 — Install build dependencies


```bash
sudo apt-get update
sudo apt-get install -y git-core gnupg flex bison build-essential \
  zip curl zlib1g-dev libc6-dev-i386 libncurses5 \
  lib32ncurses5-dev x11proto-core-dev libx11-dev lib32z1-dev \
  libgl1-mesa-dev libxml2-utils xsltproc unzip fontconfig \
  python3 python-is-python3 openjdk-11-jdk
```


### Step 2 — Install `repo` tool


```bash
mkdir -p ~/.bin
curl https://storage.googleapis.com/git-repo-downloads/repo > ~/.bin/repo
chmod a+x ~/.bin/repo
export PATH="${HOME}/.bin:${PATH}"
```


### Step 3 — Initialize AOSP source


```bash
mkdir ~/aosp && cd ~/aosp
repo init -u https://android.googlesource.com/platform/manifest \
  -b android-14.0.0_r1   # pick a stable branch
repo sync -c -j$(nproc) --force-sync --no-clone-bundle
# This downloads ~100 GB. Leave it overnight.
```


### Step 4 — Set up build environment


```bash
cd ~/aosp
source build/envsetup.sh
lunch aosp_x86_64-eng   # for emulator
# or: lunch aosp_arm64-eng
```


### Step 5 — Build AOSP


```bash
m -j$(nproc)   # full build — takes 1–5 hours
# Incremental: m -j$(nproc) framework
```


### Step 6 — Run on emulator


```bash
emulator &
```


---


## 📁 AOSP Source Tree — First Look


```javascript
aosp/
├── art/          # Android Runtime (ART) — Java bytecode execution
├── bionic/       # Android's C library (replaces glibc)
├── build/        # Build system (Soong + Make)
├── device/       # Device-specific configs
├── frameworks/   # Android Framework (Java APIs, System Services)
│   ├── base/     # Core framework — AMS, WMS, PMS, etc.
│   └── native/   # Native framework (SurfaceFlinger, etc.)
├── hardware/     # HAL interfaces and implementations
├── kernel/       # Linux kernel
├── packages/     # Built-in apps (Settings, SystemUI, etc.)
├── system/       # Low-level system (init, vold, netd)
├── vendor/       # OEM/vendor-specific code
└── external/     # Third-party open-source libs
```


---


## 🛠️ Key Tools to Learn


| Tool             | Purpose                                                               |
| ---------------- | --------------------------------------------------------------------- |
| `repo`           | Manage multi-git AOSP workspace                                       |
| `lunch`          | Select build target (device + variant)                                |
| `m / mm / mmm`   | Build entire tree / current module / specific module                  |
| `adb`            | Connect to device/emulator, push/pull files                           |
| `fastboot`       | Flash system partitions                                               |
| `logcat`         | View system logs                                                      |
| `Android Studio` | Browse AOSP source with indexing                                      |
| `OpenGrok`       | Web-based AOSP code search ([cs.android.com](http://cs.android.com/)) |


---


## ✅ Phase 1 Checklist

- [ ] Ubuntu machine or VM ready with 250 GB+ free
- [ ] All build dependencies installed
- [ ] `repo` tool installed
- [ ] AOSP source synced (android-14 branch)
- [ ] `source build/envsetup.sh` && `lunch` working
- [ ] Full AOSP build completed (`m`)
- [ ] Emulator launches successfully
- [ ] Can `adb shell` into the emulator
- [ ] Familiar with top-level directory structure
- [ ] Can use `cs.android.com` to search source code
- [ ] Read a simple `Android.bp` build file
- [ ] Made a trivial code change + incremental build

## 🏛️ Phase 2 — AOSP Architecture & Source Code

# Phase 2 — AOSP Architecture & Source Code


**Duration:** 3–4 weeks | **Level:** Intermediate

> Understand the layered architecture of Android before diving into any single component.

---


## 🗂️ Android System Architecture (Layers)


```javascript
┌──────────────────────────────────────────┐
│            Applications                  │  ← APKs (your apps)
├──────────────────────────────────────────┤
│         Application Framework            │  ← Java APIs: AMS, WMS, PMS, etc.
├──────────────────────────────────────────┤
│    Native Libraries  │  Android Runtime  │  ← C/C++ libs + ART/Dalvik
├──────────────────────────────────────────┤
│         Hardware Abstraction Layer       │  ← HAL: camera, audio, sensors
├──────────────────────────────────────────┤
│              Linux Kernel                │  ← Drivers, memory, power
└──────────────────────────────────────────┘
```


Android is built in **layers**. Each layer only communicates with the layer directly below it through well-defined interfaces.


---


## 🏗️ Build System: Soong + Make


Android's build system has two components:


### [Android.mk](http://android.mk/) (legacy Make)


```makefile
LOCAL_PATH := $(call my-dir)
include $(CLEAR_VARS)
LOCAL_MODULE    := hello_world
LOCAL_SRC_FILES := hello.cpp
include $(BUILD_EXECUTABLE)
```


### Android.bp (Soong — modern)


```json
cc_binary {
    name: "hello_world",
    srcs: ["hello.cpp"],
    shared_libs: ["liblog"],
}
```


Soong uses Blueprint language. Most new modules use `.bp`. Key build rules:

- `cc_binary`, `cc_library_shared`, `cc_library_static` — C/C++ targets
- `java_library`, `android_app` — Java/app targets
- `hidl_interface`, `aidl_interface` — IPC interface definitions

---


## 📦 Key Directories Deep Dive


### `frameworks/base/`


The heart of the Android Framework. Read these:


```javascript
frameworks/base/
├── core/java/android/         # Public Android APIs
├── services/core/java/        # System services (AMS, WMS, PMS)
├── core/jni/                  # JNI bridge to native code
└── cmds/                      # System command-line tools
```


### `system/core/`


Low-level system daemons:


```javascript
system/core/
├── init/       # Android init process (PID 1)
├── adb/        # ADB daemon
├── fastboot/   # Fastboot protocol
└── libutils/   # Base utility libraries
```


### `hardware/interfaces/`


HIDL/AIDL HAL interface definitions:


```javascript
hardware/interfaces/
├── audio/
├── camera/
├── sensors/
└── wifi/
```


---


## 🔍 Reading AOSP Source Code


### How to find anything fast


```bash
# Find all files with a class name
find . -name "ActivityManagerService.java"

# grep with context
grep -rn "startActivity" frameworks/base/services/core/ --include="*.java" | head -30

# Use cs.android.com (best for navigation)
```


### Key source files to read first


| File                                                                      | Why                              |
| ------------------------------------------------------------------------- | -------------------------------- |
| `system/core/init/main.cpp`                                               | Entry point of Android userspace |
| `frameworks/base/core/java/android/app/ActivityThread.java`               | App process main loop            |
| `frameworks/base/services/core/java/com/android/server/SystemServer.java` | Launches all system services     |
| `frameworks/base/core/java/android/os/Binder.java`                        | IPC base class                   |
| `build/soong/Android.bp`                                                  | Build system entry               |


---


## 🧩 Android Runtime (ART)


ART replaced Dalvik in Android 5.0+.

- **AOT compilation**: On install, `.dex` bytecode → native machine code via `dex2oat`
- **JIT compilation**: At runtime, hot paths get JIT compiled
- **Garbage Collection**: Concurrent, generational GC
- **Profile-guided optimization (PGO)**: After first run, frequently-used paths get AOT compiled

Key ART files: `art/runtime/`, `art/compiler/`


---


## 🛠️ Hands-On Tasks

1. Add a log line to `SystemServer.java` and rebuild framework only:

    ```bash
    mmm frameworks/base/services
    adb sync system
    adb reboot
    ```

2. Add a new `cc_binary` hello world using Soong (`Android.bp`), build and push to emulator.
3. Explore `ActivityThread.java` — find where `onCreate()` is called.
4. Read `SystemServer.java` — list all services started in `startOtherServices()`.

---


## ✅ Phase 2 Checklist

- [ ] Can explain all 5 layers of Android architecture
- [ ] Understand Soong build system (`Android.bp`)
- [ ] Can build a single module (`mmm`)
- [ ] Know top-level dirs: `frameworks/`, `system/`, `hardware/`, `art/`
- [ ] Read `SystemServer.java` and listed all started services
- [ ] Read `ActivityThread.java` — understand app main loop
- [ ] Added a custom `Android.bp` module and built it
- [ ] Can use `cs.android.com` for code navigation
- [ ] Understand what ART does vs Dalvik

## 🥾 Phase 3 — Boot Process & Linux Kernel

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

## 🔌 Phase 4 — HAL, Binder IPC & System Services

**Duration:** 4–6 weeks | **Level:** Advanced

> Binder is the backbone of Android. Everything talks through it. HAL is how the framework talks to hardware. Master both.

---


## 🔄 Binder IPC — The Core of Android IPC


### What is Binder?


Binder is Android's **primary inter-process communication (IPC)** mechanism. It's a Linux kernel driver (`drivers/android/binder.c`) that enables:

- Fast, safe, synchronous RPC between processes
- Identity-based security (callerUID, callerPID tracking)
- Object references across process boundaries

### Why not UNIX sockets or pipes?

- Binder is ~10x faster than D-Bus (used on Linux desktop)
- Supports passing file descriptors and complex objects
- Enforces permissions via `uid`/`pid` of the calling process
- One copy instead of two (copy-on-write via kernel memory mapping)

---


## 📱 Binder Architecture


```javascript
App Process (Client)          System Server (Service)
┌────────────────────┐     ┌────────────────────┐
│ Proxy (IActivityManager)│     │ Stub (ActivityManager)│
│ calls transact()         │     │ onTransact() handles│
└────────────────────┘     └────────────────────┘
           ↓  Binder kernel driver  ↑
         /dev/binder  (mmap shared buffer)
```


### Binder Transaction Flow

1. Client calls method on **Proxy** object
2. Proxy serializes arguments into a `Parcel`
3. Calls `IBinder.transact()` → syscall into kernel
4. Kernel driver copies data to service process's memory
5. Service's **Stub** `onTransact()` deserializes and calls real method
6. Result parceled back the same way

---


## 📝 AIDL — Android Interface Definition Language


AIDL auto-generates Proxy + Stub boilerplate from an interface definition:


```java
// IMyService.aidl
interface IMyService {
    String getMessage(int id);
    void setData(in ParcelableData data);
}
```


Build generates:

- `IMyService.java` — interface
- `IMyService.Stub` — extend this in your service
- `IMyService.Stub.Proxy` — used by clients automatically

### AIDL in AOSP context

- Framework services (AMS, WMS) define AIDL in `frameworks/base/core/java/android/`
- New AIDL-based HAL interfaces live in `hardware/interfaces/`

---


## 📞 ServiceManager — The IPC Registry


`ServiceManager` is the Binder name registry (like DNS for services):


```java
// Registering (done in SystemServer)
ServiceManager.addService("activity", mActivityManagerService);

// Getting a service (done in client)
IBinder binder = ServiceManager.getService("activity");
IActivityManager am = IActivityManager.Stub.asInterface(binder);
```


Key files:

- `frameworks/native/cmds/servicemanager/servicemanager.cpp`
- `frameworks/base/core/java/android/os/ServiceManager.java`

---


## 🔌 Hardware Abstraction Layer (HAL)


### Why HAL exists

- Different phones have different hardware (cameras, sensors, audio chips).
- HAL provides a **standard interface** between Android Framework and hardware drivers.
- OEMs implement HAL for their specific hardware in `vendor/` without modifying framework.

### HAL Evolution


| Generation       | Interface                                | Location                |
| ---------------- | ---------------------------------------- | ----------------------- |
| Legacy HAL       | C struct (`hw_module_t`)                 | `hardware/libhardware/` |
| HIDL HAL (8.0+)  | HIDL (HAL Interface Definition Language) | `hardware/interfaces/`  |
| AIDL HAL (11.0+) | AIDL (same as framework AIDL)            | `hardware/interfaces/`  |


### HIDL HAL example


```javascript
hardware/interfaces/sensors/2.0/
├── ISensors.hal          # Interface definition
├── types.hal             # Data types
└── default/
    ├── Sensors.h           # Implementation header
    └── Sensors.cpp         # OEM-provided implementation
```


### Writing a simple Legacy HAL module


```c
// my_hal.c
#include <hardware/hardware.h>

static struct hw_module_methods_t my_module_methods = {
    .open = my_device_open,
};

struct hw_module_t HAL_MODULE_INFO_SYM = {
    .tag = HARDWARE_MODULE_TAG,
    .id = "com.example.my_hal",
    .name = "My HAL Module",
    .methods = &my_module_methods,
};
```


---


## 🛠️ Hands-On Tasks

1. **Trace a Binder call**: Use `adb shell am` to start an Activity and trace it through `ActivityManagerService`.
2. **Write a custom AIDL service**:
    - Define `IHelloService.aidl`
    - Implement `HelloService.java` extending `Stub`
    - Register in `SystemServer.java`
    - Access it from an app
3. **Read a real system service AIDL**: Browse `frameworks/base/core/java/android/app/IActivityManager.aidl`
4. **Implement a stub Legacy HAL**: Write a `.c` file with `hw_module_t`, add `Android.bp`, build and push to `/vendor/lib/hw/`.
5. Use `adb shell service list` to see all registered Binder services.

---


## ✅ Phase 4 Checklist

- [ ] Can explain Binder IPC flow (client proxy → kernel → service stub)
- [ ] Know why Android uses Binder instead of UNIX sockets
- [ ] Understand `Parcel` and how data is serialized
- [ ] Can write a basic AIDL interface + service
- [ ] Read `IActivityManager.aidl` and traced a real call
- [ ] Understand `ServiceManager` as a name registry
- [ ] Know the difference between Legacy HAL, HIDL, and AIDL HAL
- [ ] Read a HIDL `.hal` interface file
- [ ] Implemented a stub Legacy HAL module
- [ ] Registered a custom service in `SystemServer.java`
- [ ] Used `service list` and `service call` from adb shell

## ⚙️ Phase 5 — Framework Internals (AMS, WMS, PMS)

**Duration:** 4–6 weeks | **Level:** Advanced

> The Android Framework is the bridge between your app and the OS. Understanding it makes you a 10x Android engineer.

---


## 🏛️ The Big Three System Services


| Service                | Acronym | Responsibility                                                   |
| ---------------------- | ------- | ---------------------------------------------------------------- |
| ActivityManagerService | AMS     | Manages Activities, app lifecycle, processes                     |
| WindowManagerService   | WMS     | Manages windows, layers, display                                 |
| PackageManagerService  | PMS     | Manages APK install/uninstall, permissions, component resolution |


All three live in `frameworks/base/services/core/java/com/android/server/`


---


## ⏳ ActivityManagerService (AMS)


AMS is the most complex service in Android. It manages:

- Activity stack management (back stack, tasks)
- Starting / killing app processes
- Broadcasting (`sendBroadcast`)
- Starting Services
- App lifecycle (foreground/background)
- Process memory pressure (LRU cache of processes)

### startActivity() deep dive


```javascript
Activity.startActivity(intent)
  ↓
Instrumentation.execStartActivity()
  ↓
ActivityTaskManager.getService().startActivity()   # Binder call to AMS
  ↓
ActivityTaskManagerService.startActivity()
  ↓
ActivityStarter.execute()
  ↓
RootWindowContainer.resumeFocusedTasksTopActivities()
  ↓
ActivityRecord.makeActiveIfNeeded() → realStartActivityLocked()
  ↓
ClientTransaction sent to app process via Binder
  ↓
ActivityThread handles LaunchActivityItem
  ↓
Instrumentation.callActivityOnCreate() → Activity.onCreate()
```


### Key AMS files


```javascript
frameworks/base/services/core/java/com/android/server/am/
├── ActivityManagerService.java      # Main service
├── ProcessRecord.java               # Represents one app process
├── BroadcastQueue.java              # Broadcast dispatch
├── ActiveServices.java             # Service lifecycle
└── OomAdjuster.java                # Process kill decisions

frameworks/base/services/core/java/com/android/server/wm/
├── ActivityTaskManagerService.java  # Activity-specific (split from AMS in Android 10)
├── ActivityRecord.java              # Represents one Activity instance
├── Task.java                        # Back stack task
└── ActivityStarter.java             # Start activity logic
```


---


## 🪟 WindowManagerService (WMS)


WMS manages **every window** on screen:

- Assigns Z-order (layers) to windows
- Handles input event routing to correct window
- Coordinates with **SurfaceFlinger** (native compositor) for rendering
- Manages window animations and transitions

### Window hierarchy


```javascript
Display
  └─ RootDisplayArea
       ├─ StatusBar window
       ├─ NavigationBar window
       └─ AppWindowToken (per app)
            └─ WindowState (per window surface)
```


### SurfaceFlinger relationship

- WMS manages **which** windows exist and their properties
- SurfaceFlinger (native, C++) does the actual **compositing** (merging layers into final pixels)
- Apps draw into their `Surface` buffers; SurfaceFlinger reads them

**Key files:**


```javascript
frameworks/base/services/core/java/com/android/server/wm/WindowManagerService.java
frameworks/native/services/surfaceflinger/SurfaceFlinger.cpp
```


---


## 📦 PackageManagerService (PMS)


PMS handles everything related to installed apps:

- Parsing `AndroidManifest.xml` of every installed APK
- Storing component info (Activities, Services, Receivers, Providers)
- Resolving intents to components
- Enforcing permissions
- APK install/uninstall pipeline

### APK install flow


```javascript
User taps "Install"
  ↓
PackageInstaller UI → PackageInstallerSession
  ↓
PMS.installPackage()
  ↓
PackageParser.parsePackage()   # Parses AndroidManifest.xml
  ↓
dex2oat (ART compilation of .dex files)
  ↓
Copy to /data/app/<package>/
  ↓
Update package database (packages.xml)
  ↓
Broadcast ACTION_PACKAGE_ADDED
```


---


## 🔥 Other Important Framework Components


### InputManagerService

- Reads raw input events from kernel (`/dev/input/eventX`)
- Routes touch/key events to the focused window via WMS
- Key file: `frameworks/base/services/core/java/com/android/server/input/InputManagerService.java`

### ContentProvider & ContentResolver

- IPC mechanism for structured data sharing between apps
- Uses Binder under the hood
- SQLite + URI-based query interface

### BroadcastReceiver dispatch


```javascript
sendBroadcast(intent)
  ↓
AMS.broadcastIntent()
  ↓
BroadcastQueue.enqueueOrderedBroadcastLocked()
  ↓
BroadcastQueue.processNextBroadcast()
  ↓
App process → ActivityThread.handleReceiver()
  ↓
Receiver.onReceive()
```


---


## 🛠️ Hands-On Tasks

1. Add a log to `ActivityManagerService.java` in `startActivity()` and trace a real launch.
2. Add a log to `PackageManagerService.java` in `scanPackageLI()` — watch it during `adb install`.
3. Read `OomAdjuster.java` — understand how the system decides which process to kill.
4. Use `adb shell dumpsys activity` to inspect live AMS state.
5. Use `adb shell dumpsys window` to inspect live WMS window state.
6. Use `adb shell dumpsys package <your.package>` to see parsed manifest info.

---


## ✅ Phase 5 Checklist

- [ ] Can explain the roles of AMS, WMS, and PMS
- [ ] Traced `startActivity()` from app to `Activity.onCreate()`
- [ ] Read `ActivityRecord.java` and `Task.java`
- [ ] Understand window hierarchy in WMS
- [ ] Know SurfaceFlinger's role vs WMS
- [ ] Traced APK install flow through PMS
- [ ] Understand `OomAdjuster` — how processes are killed
- [ ] Understand `BroadcastQueue` dispatch
- [ ] Used `dumpsys activity`, `dumpsys window`, `dumpsys package`
- [ ] Modified a system service and built incrementally

## 🚀 Phase 6 — Customization, OTA & Contributing

# Phase 6 — Customization, OTA & Contributing


**Duration:** 3–4 weeks | **Level:** Expert

> Build a custom ROM. Understand OTA updates. Contribute back to AOSP.

---


## 📱 Building a Custom ROM


### What is a custom ROM?


A custom ROM = a full Android OS build (`system.img`, `vendor.img`, `boot.img`) customized beyond stock AOSP.


Popular custom ROMs: **LineageOS**, **GrapheneOS**, **CalyxOS** — all based on AOSP.


### ROM customization areas


| Area            | What you can change                            |
| --------------- | ---------------------------------------------- |
| **SystemUI**    | Status bar, notification shade, quick settings |
| **Settings**    | Add custom settings panels                     |
| **Launcher**    | Replace the home screen                        |
| **Build flags** | Feature flags, debug options                   |
| **Init.rc**     | Service startup behavior                       |
| **Kernel**      | CPU governor, I/O scheduler                    |
| **HAL**         | Custom camera/audio processing                 |


---


## 🎚️ SystemUI Customization


SystemUI is the process that renders the status bar, notification shade, lock screen, and navigation bar.


Source: `frameworks/base/packages/SystemUI/`


```javascript
packages/SystemUI/src/com/android/systemui/
├── statusbar/           # Status bar + notification shade
├── qs/                  # Quick Settings tiles
├── navigationbar/       # Navigation bar
├── lockscreen/          # Lock screen
└── keyguard/            # Keyguard (PIN/pattern/biometric)
```


### Add a custom Quick Settings tile


```java
// 1. Create class extending TileService
public class MyCustomTile extends TileService {
    @Override
    public void onTileAdded() { }

    @Override
    public void onClick() {
        // toggle something
        getQsTile().setState(Tile.STATE_ACTIVE);
        getQsTile().updateTile();
    }
}

// 2. Register in SystemUI manifest
// 3. Add to default tile list in config
```


---


## 📦 OTA (Over-The-Air) Updates


### Android OTA architecture


```javascript
Server generates OTA package (.zip)
  ↓
Device downloads to /data/ota_package/
  ↓
Update Engine (update_engine daemon)
  ↓
A/B partition switch OR Recovery mode flash
  ↓
Device reboots into new system
```


### A/B (Seamless) Updates (Android 7.0+)

- Device has **two sets** of system partitions (slot A and slot B)
- New system written to inactive slot **while device is running**
- On next boot, device switches to updated slot
- If boot fails, rolls back to previous slot automatically
- **No downtime** for user during update

### Generating an OTA package


```bash
# Full OTA
m otapackage

# Output: out/target/product/<device>/‘device’-ota-*.zip

# Incremental OTA (delta between two builds)
android/tools/releasetools/ota_from_target_files.py \
  -i old_build.zip new_build.zip incremental_ota.zip
```


### Recovery mode

- Minimal Linux environment separate from main Android
- Can flash system partition from OTA zip
- Source: `bootable/recovery/`

---


## 🔐 Android Verified Boot (AVB)


AVB ensures the device only boots signed, unmodified system images:


```javascript
Bootloader verifies kernel signature
  ↓
Kernel verifies dm-verity hash tree of /system partition
  ↓
Any modification to /system → boot fails
```

- Prevents persistent rootkits
- OEM key stored in bootloader (efuse)
- Unlocking bootloader disables AVB and wipes device

---


## 🤝 Contributing to AOSP


### Gerrit — Android's code review system


AOSP uses **Gerrit** (at `android-review.googlesource.com`) for all code reviews.


### Submit a patch step-by-step


```bash
# Step 1: Create a branch
cd frameworks/base
git checkout -b my-fix

# Step 2: Make your change
# edit files...

# Step 3: Commit with proper message
git add -A
git commit -m "Fix: correct NPE in ActivityManagerService

This commit fixes a NullPointerException that occurs when...

Bug: 12345678
Test: atest ActivityManagerServiceTest"

# Step 4: Upload to Gerrit
git push origin HEAD:refs/for/main
```


### AOSP commit message format


```javascript
<component>: <short description>

<detailed explanation of why the change is needed>

Bug: <bug number or 'None'>
Test: <how to verify the fix>
```


### Good first contributions

- Fix typos in comments/documentation
- Fix lint warnings
- Improve error messages
- Fix small bugs in non-critical paths
- Add test coverage
- Browse: `https://issuetracker.google.com/issues?q=status:open%20component:192705`

---


## 📚 Key AOSP Resources


| Resource                | URL                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------- |
| AOSP Source Browser     | [https://cs.android.com](https://cs.android.com/)                                       |
| AOSP Documentation      | [https://source.android.com](https://source.android.com/)                               |
| Gerrit Code Review      | [https://android-review.googlesource.com](https://android-review.googlesource.com/)     |
| Issue Tracker           | [https://issuetracker.google.com](https://issuetracker.google.com/)                     |
| Android Developers Blog | [https://android-developers.googleblog.com](https://android-developers.googleblog.com/) |
| AOSP on GitHub (mirror) | [https://github.com/aosp-mirror](https://github.com/aosp-mirror)                        |


---


## 🛠️ Hands-On Tasks

1. Modify `SystemUI` status bar to show a custom icon permanently.
2. Customize the Settings app — add a new preference screen.
3. Build an OTA package with `m otapackage` and flash it on the emulator.
4. Study LineageOS source — pick one of their custom features and understand how it works.
5. Find a real AOSP bug on the issue tracker and study the patch that fixed it on Gerrit.
6. Submit your first AOSP change (even a docs typo fix counts!).

---


## ✅ Phase 6 Checklist

- [ ] Understand SystemUI process structure
- [ ] Modified status bar or added a QS tile
- [ ] Understand A/B partition update model
- [ ] Know how OTA packages are generated
- [ ] Understand Android Verified Boot (AVB)
- [ ] Can generate an OTA package with `m otapackage`
- [ ] Set up Gerrit account (`android-review.googlesource.com`)
- [ ] Know AOSP commit message format
- [ ] Studied at least one LineageOS custom feature patch
- [ ] Submitted or reviewed a change on Gerrit

## 📋 AOSP Master Checklist

Track your complete AOSP learning journey. Work through phases sequentially.


---


## 🔧 Phase 1 — Prerequisites & Environment

- [ ] Ubuntu machine ready with 250 GB+ disk
- [ ] Build dependencies installed (`apt-get`)
- [ ] `repo` tool installed
- [ ] AOSP source synced (android-14 branch, ~100 GB)
- [ ] `source build/envsetup.sh` && `lunch aosp_x86_64-eng` working
- [ ] Full AOSP build completed (`m`)
- [ ] Emulator runs successfully
- [ ] `adb shell` works into emulator
- [ ] Comfortable with top-level directory structure
- [ ] Can use `cs.android.com` for code navigation
- [ ] Read and understood a simple `Android.bp` file
- [ ] Made a trivial code change + incremental build

---


## 🏛️ Phase 2 — Architecture & Source Code

- [ ] Can explain all 5 Android architecture layers
- [ ] Understand Soong (`Android.bp`) vs Make (`Android.mk`)
- [ ] Can build a single module with `mmm`
- [ ] Know purpose of: `frameworks/`, `system/`, `hardware/`, `art/`, `bionic/`
- [ ] Read `SystemServer.java` and listed all services
- [ ] Read `ActivityThread.java` — understand main loop
- [ ] Written and built a custom `Android.bp` module
- [ ] Understand what ART does, AOT vs JIT compilation
- [ ] Know what `bionic` is (Android's libc)

---


## 🥾 Phase 3 — Boot Process & Linux Kernel

- [ ] Can draw boot sequence: BootROM → Bootloader → Kernel → init → Zygote → SystemServer
- [ ] Understand BootROM vs Bootloader responsibilities
- [ ] Know Android-specific kernel additions: Binder, Wakelocks, LMK, ION, Ashmem
- [ ] Read `system/core/init/main.cpp`
- [ ] Understand `init.rc` service/action/trigger syntax
- [ ] Know why Zygote exists and how forking saves startup time
- [ ] Read `ZygoteInit.java` — understand class preloading
- [ ] Read `SystemServer.java` — listed bootstrap/core/other services
- [ ] Used `adb shell ps` to identify PID 1, Zygote, SystemServer
- [ ] Traced `startActivity` to Zygote fork

---


## 🔌 Phase 4 — HAL, Binder IPC & System Services

- [ ] Can explain Binder IPC flow (client proxy → kernel driver → stub)
- [ ] Know why Binder is faster than UNIX sockets for Android
- [ ] Understand `Parcel` serialization
- [ ] Written a basic AIDL interface + service implementation
- [ ] Read `IActivityManager.aidl` and traced a call
- [ ] Understand `ServiceManager` as a Binder name registry
- [ ] Know Legacy HAL vs HIDL vs AIDL HAL differences
- [ ] Read a HIDL `.hal` interface definition
- [ ] Implemented a stub Legacy HAL module
- [ ] Registered a custom service in `SystemServer.java`
- [ ] Used `service list` and `service call` from adb shell

---


## ⚙️ Phase 5 — Framework Internals

- [ ] Can explain roles of AMS, WMS, PMS
- [ ] Traced `startActivity()` from app to `Activity.onCreate()`
- [ ] Read `ActivityRecord.java` and `Task.java`
- [ ] Understand window hierarchy in WMS
- [ ] Know SurfaceFlinger's role vs WMS
- [ ] Traced APK install flow through PMS
- [ ] Understand `OomAdjuster` — process kill decisions
- [ ] Understand `BroadcastQueue` dispatch chain
- [ ] Used `dumpsys activity` to inspect AMS state
- [ ] Used `dumpsys window` to inspect WMS state
- [ ] Used `dumpsys package <app>` to see parsed manifest
- [ ] Modified a system service + incremental build

---


## 🚀 Phase 6 — Customization, OTA & Contributing

- [ ] Understand SystemUI process components (statusbar, QS, lockscreen)
- [ ] Modified SystemUI (custom icon or QS tile)
- [ ] Understand A/B partition seamless update model
- [ ] Know OTA package generation pipeline
- [ ] Understand Android Verified Boot (AVB) and dm-verity
- [ ] Generated an OTA package with `m otapackage`
- [ ] Set up Gerrit account
- [ ] Know AOSP commit message format (`Bug:`, `Test:` fields)
- [ ] Studied LineageOS source for one custom feature
- [ ] Submitted or reviewed a change on Gerrit

---


## 🌟 Bonus / Advanced Topics

- [ ] SELinux policies in Android (`system/sepolicy/`)
- [ ] Android Keystore and TEE (Trusted Execution Environment)
- [ ] Camera HAL3 architecture
- [ ] Audio HAL and AudioFlinger
- [ ] Graphics pipeline: OpenGL → Vulkan → SurfaceFlinger → HWC2
- [ ] Treble architecture (vendor interface / VNDK)
- [ ] Android App Sandbox and permissions model
- [ ] ART internals: dex2oat, garbage collector
- [ ] Android Automotive OS (AAOS)
- [ ] Fuchsia / Fuchsia driver model (Google's next-gen OS)

---


## 📚 Essential Reference Files


| File                                                                                   | Why It Matters             |
| -------------------------------------------------------------------------------------- | -------------------------- |
| `system/core/init/main.cpp`                                                            | First userspace process    |
| `system/core/rootdir/init.rc`                                                          | System service definitions |
| `frameworks/base/core/java/com/android/internal/os/ZygoteInit.java`                    | App process factory        |
| `frameworks/base/services/java/com/android/server/SystemServer.java`                   | All service launches       |
| `frameworks/base/services/core/java/com/android/server/am/ActivityManagerService.java` | Activity/process mgmt      |
| `frameworks/base/services/core/java/com/android/server/wm/WindowManagerService.java`   | Window management          |
| `frameworks/base/services/core/java/com/android/server/pm/PackageManagerService.java`  | APK management             |
| `frameworks/base/core/java/android/app/ActivityThread.java`                            | App main thread            |
| `kernel/drivers/android/binder.c`                                                      | Binder IPC kernel driver   |
| `frameworks/native/services/surfaceflinger/SurfaceFlinger.cpp`                         | Display compositing        |

