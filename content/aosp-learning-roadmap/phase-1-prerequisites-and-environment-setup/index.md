---
source: notion
title: "🔧 Phase 1 — Prerequisites & Environment Setup"
slug: "phase-1-prerequisites-and-environment-setup"
notionId: "38cda883-bddd-8161-8718-c3e768fd4203"
notionRootId: "38cda883bddd81b98874c1adfe349ac5"
parent: "aosp-learning-roadmap"
children: []
order: 5
icon: "🔧"
cover: null
---

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
