---
source: notion
title: "🏛️ Phase 2 — AOSP Architecture & Source Code"
slug: "phase-2-aosp-architecture-and-source-code"
notionId: "38cda883-bddd-8175-a270-d330573e0074"
notionRootId: "38cda883bddd81b98874c1adfe349ac5"
parent: "aosp-learning-roadmap"
children: []
order: 6
icon: "🏛️"
cover: null
---

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
