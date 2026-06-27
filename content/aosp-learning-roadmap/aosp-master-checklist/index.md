---
source: notion
title: "📋 AOSP Master Checklist"
slug: "aosp-master-checklist"
notionId: "38cda883-bddd-8178-b537-e27bd09fa11d"
notionRootId: "38cda883bddd81b98874c1adfe349ac5"
parent: "aosp-learning-roadmap"
children: []
order: 0
icon: "📋"
cover: null
---

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

