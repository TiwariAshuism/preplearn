---
source: notion
title: "🚀 Phase 6 — Customization, OTA & Contributing"
slug: "phase-6-customization-ota-and-contributing"
notionId: "38cda883-bddd-8156-bf5f-cfe424f2c944"
notionRootId: "38cda883bddd81b98874c1adfe349ac5"
parent: "aosp-learning-roadmap"
children: []
order: 1
icon: "🚀"
cover: null
---

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
