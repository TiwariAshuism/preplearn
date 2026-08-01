---
source: notion
title: "🗓️ All 90 Days Reference — Swift/iOS Roadmap"
slug: "all-90-days-reference-swiftios-roadmap"
notionId: "39eda883-bddd-819f-a0dc-fb827c509e0d"
notionRootId: "39cda883bddd81908f86f82489b8c0c1"
parent: "90-day-swift-ios-development-roadmap-beginner-to-advanced"
children: []
order: 7
icon: "🗓️"
cover: null
---
> Every day has a specific deliverable. Mark Done only when the code runs on the simulator AND you can explain the mechanism without notes.

---


## Phase 1 — Swift Foundations (Days 1–15)


| Day | Topic                                    | Daily Milestone                                                                               |
| --- | ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Variables, types, string interpolation   | Write a struct with 5 properties. Print formatted strings using all property types.           |
| 2   | Arrays, dictionaries, sets, control flow | Build a student grade tracker using arrays + dictionaries. Print sorted results.              |
| 3   | Functions and argument labels            | Write 5 functions with external/internal labels. Call each reading like English.              |
| 4   | Optionals: if let, guard let             | Fix 10 force-unwrapped optionals using if let / guard let / nil coalescing.                   |
| 5   | Optional chaining and nil coalescing     | Build a user profile with deeply nested optional properties. Access safely.                   |
| 6   | Closures and trailing closure syntax     | Implement map, filter, reduce on a [String] without using standard library versions.          |
| 7   | Capture lists and [weak self]            | Create a retain cycle, detect it, fix it with [weak self]. Verify with deinit print.          |
| 8   | Structs and value semantics              | Prove struct copying is independent. Build a Point and transform it without mutation.         |
| 9   | Classes and reference semantics          | Prove class sharing by showing two variables reflecting the same mutation.                    |
| 10  | Protocols and extensions                 | Define a Describable protocol. Add default extension. Conform 3 different types.              |
| 11  | Delegation pattern                       | Build a download manager that uses a protocol delegate to report progress.                    |
| 12  | Enums with associated values             | Build a NetworkState enum. Switch over all cases in a function.                               |
| 13  | Generics and constraints                 | Build a generic Stack<T: Equatable>. Add contains() method.                                   |
| 14  | Error handling with do-catch             | Implement a file parser that throws typed errors. Handle each case.                           |
| 15  | **Phase 1 Capstone**                     | **Contact book CLI: add/search/delete with Codable JSON persistence. Protocol-based design.** |


---


## Phase 2 — UIKit Essentials (Days 16–30)


| Day | Topic                                  | Daily Milestone                                                                              |
| --- | -------------------------------------- | -------------------------------------------------------------------------------------------- |
| 16  | Xcode setup and project structure      | Create a UIKit project (no Storyboard). Set programmatic root VC in SceneDelegate.           |
| 17  | App and ViewController lifecycle       | Add print statements to all lifecycle methods. Run and explain the order in the console.     |
| 18  | UIView and Auto Layout in code         | Build a profile card with 4 views using NSLayoutConstraint.activate only.                    |
| 19  | Safe area and content insets           | Handle safe area on all iPhone sizes including notch and Dynamic Island.                     |
| 20  | UIStackView                            | Replace manual constraints on 3 views with a UIStackView. Compare the code length.           |
| 21  | UITableView basics                     | Display 20 items in a UITableView with a custom UITableViewCell subclass.                    |
| 22  | UITableView: dequeue and reuse         | Add 1000 items. Verify smooth scrolling. Profile with Instruments Time Profiler.             |
| 23  | UITableView: swipe actions and reorder | Add swipe-to-delete and drag-to-reorder. Handle the data source array correctly.             |
| 24  | UICollectionView                       | Build a 3-column grid with UICollectionViewFlowLayout.                                       |
| 25  | UINavigationController                 | Push a detail VC on cell tap. Pass data via initializer. Pop on back.                        |
| 26  | Modal presentation and sheets          | Present a form VC as a .sheet. Dismiss and pass data back via delegate.                      |
| 27  | UITabBarController                     | Build a 3-tab app. Each tab is a NavigationController.                                       |
| 28  | UITextField and keyboard               | Login form with email/password fields. Handle Return key, keyboard avoidance.                |
| 29  | Gesture recognizers                    | Add tap, long press, swipe gestures to views. Handle each with an @objc method.              |
| 30  | **Phase 2 Capstone**                   | **Notes app: UITableView, search, swipe-delete, programmatic UI, UserDefaults persistence.** |


---


## Phase 3 — SwiftUI & Modern UI (Days 31–45)


| Day | Topic                            | Daily Milestone                                                                                 |
| --- | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| 31  | SwiftUI View basics              | Build a profile card with VStack/HStack/ZStack. No UIKit.                                       |
| 32  | Modifiers and SF Symbols         | Style the profile card: padding, cornerRadius, shadow. Use 5 SF Symbols.                        |
| 33  | @State and @Binding              | Build a counter with @State. Extract the button into a child view with @Binding.                |
| 34  | @StateObject and @ObservedObject | Create a ViewModel. Use @StateObject in parent, @ObservedObject in child.                       |
| 35  | @EnvironmentObject               | Inject a UserSession into the app. Access it 3 levels deep without passing it.                  |
| 36  | NavigationStack                  | Build a 3-level deep navigation. Navigate programmatically with NavigationPath.                 |
| 37  | List and ForEach                 | Display a list. Add swipe-to-delete. Add a toolbar button to add items.                         |
| 38  | .searchable and .refreshable     | Add search filtering and pull-to-refresh to the list.                                           |
| 39  | SwiftUI forms and pickers        | Build a settings screen with Toggle, Picker, Slider, Stepper in a Form.                         |
| 40  | Custom ViewModifier              | Extract card styling into a ViewModifier. Apply to 3 different views.                           |
| 41  | ViewBuilder                      | Build a reusable Section container that accepts any content as a trailing closure.              |
| 42  | Animations and transitions       | Animate a card expanding. Add .transition(.slide) on appearance.                                |
| 43  | Matched geometry effect          | Build a hero animation: thumbnail expands to full detail view.                                  |
| 44  | UIViewRepresentable              | Wrap WKWebView in a UIViewRepresentable. Load a URL from SwiftUI.                               |
| 45  | **Phase 3 Capstone**             | **Weather app: NavigationStack, @StateObject, animations, custom modifiers, Widget Extension.** |


---


## Phase 4 — Data, Networking & Persistence (Days 46—60)


| Day | Topic                               | Daily Milestone                                                                                     |
| --- | ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| 46  | URLSession with async/await         | Fetch a JSON array from a public API. Decode it with Codable. Display in a List.                    |
| 47  | Codable and CodingKeys              | Decode a snake_case JSON response into camelCase Swift structs.                                     |
| 48  | Error handling in networking        | Add typed NetworkError. Show error state in UI. Add retry button.                                   |
| 49  | Actor-based service layer           | Wrap your service in an actor. Prove it’s safe to call from multiple Task{}.                        |
| 50  | Task cancellation                   | Cancel an in-flight request when the view disappears. Verify no stale result is shown.              |
| 51  | Pagination                          | Load next page when last visible item appears. Show loading indicator at bottom.                    |
| 52  | Core Data: stack setup              | Set up PersistenceController. Create a Note entity. Insert and fetch 5 notes.                       |
| 53  | Core Data: CRUD                     | Add delete, update, and NSPredicate search. Verify data survives app restart.                       |
| 54  | Core Data: @FetchRequest in SwiftUI | Replace manual fetch with @FetchRequest. Observe that UI updates automatically.                     |
| 55  | SwiftData                           | Reimplement the Note model with @Model. Replace Core Data stack with .modelContainer.               |
| 56  | UserDefaults and @AppStorage        | Build a settings screen. Verify settings persist across launches.                                   |
| 57  | Keychain                            | Store and retrieve an API token in the Keychain. Verify it survives app deletion (iCloud Keychain). |
| 58  | Image caching                       | Build a simple NSCache-based image cache. Avoid re-downloading the same URL.                        |
| 59  | Offline-first architecture          | Cache API responses in SwiftData. Show stale data when offline. Refresh when online.                |
| 60  | **Phase 4 Capstone**                | **Movie browser: async/await, Codable, pagination, SwiftData offline cache, Keychain API key.**     |


---


## Phase 5 — Architecture & Advanced Topics (Days 61—75)


| Day | Topic                                  | Daily Milestone                                                                                   |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 61  | MVVM: extract a ViewModel              | Take a View with inline logic. Extract all logic into a ViewModel. View becomes declarative-only. |
| 62  | Protocol-based ViewModel               | Add a PostServiceProtocol. Inject real vs mock service. Verify both compile.                      |
| 63  | ViewState enum                         | Add .idle/.loading/.loaded/.error states. Handle all in the View body with switch.                |
| 64  | Combine: debounce and removeDuplicates | Wire a search TextField to an API call using Combine. Fire only after 300ms silence.              |
| 65  | Combine: CombineLatest                 | Enable a login button only when both email and password are valid using CombineLatest.            |
| 66  | Combine: flatMap and error handling    | Chain two network calls with flatMap. Absorb errors with .catch.                                  |
| 67  | Unit tests: ViewModel                  | Write 5 unit tests for a ViewModel using XCTest and a MockService. All pass.                      |
| 68  | Async testing with XCTestExpectation   | Test an async ViewModel method. Use async/await test method (XCTest supports this).               |
| 69  | UI testing with XCUITest               | Write a UI test for the main user journey. Run it headlessly.                                     |
| 70  | Instruments: Leaks                     | Profile your Phase 4 capstone with Instruments Leaks. Find and fix one retain cycle.              |
| 71  | Instruments: Time Profiler             | Find the slowest function in your app. Optimise it. Document the improvement.                     |
| 72  | Image downsampling                     | Replace a UIImage(contentsOfFile:) with a downsampled version. Measure memory reduction.          |
| 73  | Accessibility                          | Add .accessibilityLabel and .accessibilityHint to all interactive elements. Test with VoiceOver.  |
| 74  | Localization                           | Add English + Hindi localisation to your Phase 5 app. Verify with scheme language override.       |
| 75  | **Phase 5 Capstone**                   | **Social feed app: MVVM, Combine, 5 unit-tested ViewModels, Instruments clean, VoiceOver ready.** |


---


## Phase 6 — Production & App Store (Days 76—90)


| Day | Topic                            | Daily Milestone                                                                                 |
| --- | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| 76  | Push notification permission     | Request permission. Print APNs token in console. Verify on a real device.                       |
| 77  | Remote push notifications        | Send a test push via APNs tool. App receives it in foreground and background.                   |
| 78  | Local notifications              | Schedule a notification 10 seconds in the future. Handle the tap to navigate.                   |
| 79  | URL scheme deep links            | Register myapp:// scheme. Handle myapp://post/123 to open post detail.                          |
| 80  | Universal Links                  | Set up Associated Domains. Handle [https://yourapp.com/post/123](https://yourapp.com/post/123). |
| 81  | Firebase Analytics               | Track 5 events. View them in the Firebase DebugView within 60 seconds.                          |
| 82  | Crashlytics                      | Trigger a test crash. Verify it appears in Firebase Crashlytics dashboard.                      |
| 83  | Feature flags with Remote Config | Gate a UI feature behind a Remote Config boolean. Toggle it without a new build.                |
| 84  | StoreKit 2: load products        | Load 2 products from StoreKit sandbox. Display their localised prices.                          |
| 85  | StoreKit 2: purchase flow        | Complete a sandbox purchase. Unlock a feature. Restore purchases on reinstall.                  |
| 86  | Fastlane: test lane              | Run fastlane test. All unit tests pass in the Fastlane output.                                  |
| 87  | Fastlane: beta lane              | Run fastlane beta. Archive is uploaded to TestFlight automatically.                             |
| 88  | App Store Connect                | Fill in metadata: screenshots, description, privacy policy, age rating, keywords.               |
| 89  | TestFlight beta                  | Add 5 external testers. They receive the build and can install it.                              |
| 90  | **Phase 6 Capstone**             | **Ship Phase 5 app to TestFlight. All 15 checklist items complete. Zero Instruments leaks.**    |


---


## Daily ritual

1. Open this table. Find today’s row.
2. Open Xcode. Create a new file or project as appropriate.
3. Write the code. If you’re stuck for more than 20 minutes, look at the phase page — not Google/Stack Overflow first.
4. Run on simulator (or real device for notifications/IAP).
5. Log in tracker: tick **Code written** and **Runs on simulator**.
6. Write one **Key insight** — one thing that surprised you or that you’d forget.
7. Mark **Done** only when you can close Xcode and explain the concept to another developer.
