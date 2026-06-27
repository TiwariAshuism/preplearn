---
source: notion
title: "🔌 Phase 4 — HAL, Binder IPC & System Services"
slug: "phase-4-hal-binder-ipc-and-system-services"
notionId: "38cda883-bddd-817b-975d-d50eb6293493"
notionRootId: "38cda883bddd81b98874c1adfe349ac5"
parent: "aosp-learning-roadmap"
children: []
order: 3
icon: "🔌"
cover: null
---

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
