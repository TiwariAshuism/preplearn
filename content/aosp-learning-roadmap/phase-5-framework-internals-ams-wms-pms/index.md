---
source: notion
title: "⚙️ Phase 5 — Framework Internals (AMS, WMS, PMS)"
slug: "phase-5-framework-internals-ams-wms-pms"
notionId: "38cda883-bddd-81ad-9dd2-c19d79bd59dc"
notionRootId: "38cda883bddd81b98874c1adfe349ac5"
parent: "aosp-learning-roadmap"
children: []
order: 2
icon: "⚙️"
cover: null
---

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
