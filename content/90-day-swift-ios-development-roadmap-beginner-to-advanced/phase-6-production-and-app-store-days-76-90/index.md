---
source: notion
title: "Phase 6 — Production & App Store (Days 76–90)"
slug: "phase-6-production-and-app-store-days-76-90"
notionId: "39eda883-bddd-8129-b94a-f3e8a4ea4a86"
notionRootId: "39cda883bddd81908f86f82489b8c0c1"
parent: "90-day-swift-ios-development-roadmap-beginner-to-advanced"
children: []
order: 6
icon: "🚀"
cover: null
---
> **Core insight:** Shipping to the App Store is a skill separate from building the app. Push notifications, deep links, in-app purchases, crash monitoring, CI/CD, and the App Store review process each have their own gotchas. This phase turns your app from a dev build into a production product.

---


## Day 76—78 — Push Notifications


```swift
import UserNotifications
import FirebaseMessaging

// Step 1: Request permission
func requestNotificationPermission() {
    UNUserNotificationCenter.current().requestAuthorization(
        options: [.alert, .badge, .sound]
    ) { granted, error in
        guard granted else { return }
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
}

// Step 2: Send APNs token to your server
func application(_ application: UIApplication,
                 didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    print("APNs token: \(token)")
    // Send this token to your backend
    // If using Firebase: Messaging.messaging().apnsToken = deviceToken
}

func application(_ application: UIApplication,
                 didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("Failed to register: \(error)")
}

// Step 3: Handle foreground notifications
class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completion: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Show notification even when app is in foreground
        completion([.banner, .badge, .sound])
    }
    
    // Step 4: Handle tap on notification
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completion: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        // Parse the payload and navigate to the appropriate screen
        if let postId = userInfo["post_id"] as? String {
            NotificationCenter.default.post(
                name: .openPost,
                object: nil,
                userInfo: ["postId": postId]
            )
        }
        completion()
    }
}

// Local notifications: schedule without a server
func scheduleLocalNotification(title: String, body: String, inSeconds: Double) {
    let content = UNMutableNotificationContent()
    content.title = title
    content.body = body
    content.sound = .default
    
    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: inSeconds, repeats: false)
    let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
    UNUserNotificationCenter.current().add(request)
}
```


---


## Day 79—81 — Deep Links and Universal Links


```swift
// URL Scheme deep links: myapp://post/123
// Configure in Info.plist under URL Types

// In AppDelegate (UIKit)
func application(_ app: UIApplication, open url: URL,
                 options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    return handleDeepLink(url)
}

// In SwiftUI
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    handleDeepLink(url)
                }
        }
    }
}

func handleDeepLink(_ url: URL) -> Bool {
    // myapp://post/123 -> show post 123
    // myapp://profile/ashu -> show profile
    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: true),
          let host = components.host else { return false }
    
    switch host {
    case "post":
        let postId = components.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        NavigationRouter.shared.navigate(to: .post(id: postId))
        return true
    case "profile":
        let username = components.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        NavigationRouter.shared.navigate(to: .profile(username: username))
        return true
    default:
        return false
    }
}

// Universal Links: https://yourapp.com/post/123
// Requires: Associated Domains entitlement + apple-app-site-association file on server
// In Signing & Capabilities: add Associated Domains -> applinks:yourapp.com

// apple-app-site-association (on your server at /.well-known/apple-app-site-association)
// {
//   "applinks": {
//     "apps": [],
//     "details": [{
//       "appID": "TEAMID.com.yourcompany.yourapp",
//       "paths": ["/post/*", "/profile/*"]
//     }]
//   }
// }

// Handle in SceneDelegate or SwiftUI .onOpenURL -- same as URL scheme
func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
          let url = userActivity.webpageURL else { return }
    handleDeepLink(url)
}
```


---


## Day 82–84 — Analytics, Crash Reporting, and Feature Flags


```swift
// Firebase Analytics: track user behaviour
import FirebaseAnalytics

// Protocol-based analytics (swap implementations without changing call sites)
protocol AnalyticsService {
    func track(event: AnalyticsEvent)
    func setUser(id: String, properties: [String: Any])
}

enum AnalyticsEvent {
    case screenViewed(name: String)
    case postLiked(postId: String)
    case searchPerformed(query: String, resultCount: Int)
    case purchaseCompleted(productId: String, price: Double)
    
    var name: String {
        switch self {
        case .screenViewed: return "screen_viewed"
        case .postLiked: return "post_liked"
        case .searchPerformed: return "search_performed"
        case .purchaseCompleted: return "purchase_completed"
        }
    }
    
    var parameters: [String: Any] {
        switch self {
        case .screenViewed(let name): return ["screen_name": name]
        case .postLiked(let id): return ["post_id": id]
        case .searchPerformed(let q, let count): return ["query": q, "result_count": count]
        case .purchaseCompleted(let id, let price): return ["product_id": id, "price": price]
        }
    }
}

struct FirebaseAnalyticsService: AnalyticsService {
    func track(event: AnalyticsEvent) {
        Analytics.logEvent(event.name, parameters: event.parameters)
    }
    func setUser(id: String, properties: [String: Any]) {
        Analytics.setUserID(id)
    }
}

// Feature flags with Firebase Remote Config
import FirebaseRemoteConfig

class FeatureFlags {
    static let shared = FeatureFlags()
    private let remoteConfig = RemoteConfig.remoteConfig()
    
    enum Flag: String {
        case newOnboardingEnabled = "new_onboarding_enabled"
        case maxPostsPerPage = "max_posts_per_page"
    }
    
    func isEnabled(_ flag: Flag) -> Bool {
        remoteConfig.configValue(forKey: flag.rawValue).boolValue
    }
    
    func fetch() async {
        try? await remoteConfig.fetchAndActivate()
    }
}

// Usage: gradually roll out features without App Store updates
if FeatureFlags.shared.isEnabled(.newOnboardingEnabled) {
    show(NewOnboardingViewController())
} else {
    show(LegacyOnboardingViewController())
}
```


---


## Day 85—87 — In-App Purchases with StoreKit 2


```swift
import StoreKit

// StoreKit 2 (iOS 15+): async/await API, much cleaner than SK1
@MainActor
class StoreManager: ObservableObject {
    @Published private(set) var products: [Product] = []
    @Published private(set) var purchasedProductIDs: Set<String> = []
    
    private var updates: Task<Void, Never>?
    
    init() {
        updates = observeTransactionUpdates()
    }
    
    deinit { updates?.cancel() }
    
    func loadProducts(ids: [String]) async {
        do {
            products = try await Product.products(for: ids)
        } catch {
            print("Failed to load products: \(error)")
        }
    }
    
    func purchase(_ product: Product) async throws -> Bool {
        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            await updatePurchasedProducts()
            await transaction.finish()  // ALWAYS call finish
            return true
        case .userCancelled:
            return false
        case .pending:
            return false  // awaiting parent approval (Ask to Buy)
        @unknown default:
            return false
        }
    }
    
    func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified(_, let error):
            throw error  // receipt verification failed
        case .verified(let value):
            return value
        }
    }
    
    func updatePurchasedProducts() async {
        var purchased: Set<String> = []
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                purchased.insert(transaction.productID)
            }
        }
        purchasedProductIDs = purchased
    }
    
    private func observeTransactionUpdates() -> Task<Void, Never> {
        Task {
            for await update in Transaction.updates {
                if case .verified(let transaction) = update {
                    await updatePurchasedProducts()
                    await transaction.finish()
                }
            }
        }
    }
}
```


---


## Day 88—89 — CI/CD with Xcode Cloud and Fastlane


```ruby
# Fastlane: automate build and deployment
# Fastfile

lane :test do
  run_tests(
    workspace: "MyApp.xcworkspace",
    scheme: "MyApp",
    devices: ["iPhone 15"],
    code_coverage: true
  )
end

lane :beta do
  # 1. Increment build number
  increment_build_number(
    build_number: ENV["CI_BUILD_NUMBER"] || latest_testflight_build_number + 1
  )
  
  # 2. Build the app
  build_app(
    workspace: "MyApp.xcworkspace",
    scheme: "MyApp",
    export_method: "app-store",
    configuration: "Release"
  )
  
  # 3. Upload to TestFlight
  upload_to_testflight(
    skip_waiting_for_build_processing: true,
    changelog: "Bug fixes and improvements"
  )
  
  # 4. Notify Slack
  slack(message: "New beta build uploaded to TestFlight!")
end

lane :release do
  test  # run tests first
  beta  # build and upload
  upload_to_app_store(  # submit for review
    submit_for_review: true,
    automatic_release: false
  )
end

# GitHub Actions workflow (.github/workflows/ci.yml)
# name: iOS CI
# on: [push, pull_request]
# jobs:
#   test:
#     runs-on: macos-14
#     steps:
#       - uses: actions/checkout@v4
#       - run: bundle exec fastlane test
```


---


## Day 90 — Phase 6 Capstone: Ship to TestFlight


```javascript
Final production checklist for your Phase 5 Social Feed App:

App Store Requirements:
  ✅ App icon: all required sizes (use Asset Catalog, provide 1024x1024)
  ✅ Launch screen: works on all device sizes and orientations
  ✅ Privacy manifest: declare all APIs used (camera, location, etc.)
  ✅ Privacy policy URL: required for any data-collecting app
  ✅ Screenshots: at least iPhone 6.5" and 6.9" sizes in App Store Connect

Code quality:
  ✅ No force unwraps (!) in production code
  ✅ No hardcoded API keys in source (use Info.plist or environment variables)
  ✅ Crash-free: run on a real device + Instruments Leaks = zero leaks
  ✅ All push notification flows tested on real device (not simulator)
  ✅ Deep links tested from Safari, Messages, and Notes

TestFlight tasks:
  1. Archive the app (Product -> Archive) with Release configuration
  2. Validate archive in Xcode Organizer (catches most common issues)
  3. Upload to App Store Connect
  4. Add TestFlight beta testers (internal: unlimited, external: up to 10,000)
  5. Submit for Beta App Review (required for external testers)
  6. Monitor crash reports in Xcode Organizer or Firebase Crashlytics

Post-launch:
  - Set up crash alerting (Crashlytics alert when crash-free rate drops below 99%)
  - Monitor App Store Connect metrics (installs, sessions, crashes, ratings)
  - Respond to App Store reviews
  - Track key funnels in analytics (onboarding completion rate, D1/D7/D30 retention)
```


---


## Common mistakes


### Mistake 1


**❌ Not testing push notifications on a real device.**


The simulator cannot receive real APNs push notifications. Everything looks fine on the simulator and then fails silently in production.


**✅ Correct approach:** Test all notification flows on a physical device early. Use APNs sandbox environment during development (set in App Store Connect provisioning profile).


### Mistake 2


**❌ Hardcoding sensitive keys in source code.**


API keys and secrets committed to git are indexed by bots within minutes. This is a major security incident.


**✅ Correct approach:** Store secrets in environment variables (CI/CD) or Info.plist entries that read from environment variables at build time. Never commit a secret to version control. Consider a secrets manager for production.


### Mistake 3


**❌ Skipping privacy manifests (PrivacyInfo.xcprivacy).**


Since iOS 17, Apple requires a privacy manifest declaring every privacy-impacting API your app (and its SDKs) uses. Missing manifests cause App Store rejection.


**✅ Correct approach:** Add PrivacyInfo.xcprivacy to your target. Declare every required reason API you use (UserDefaults, file timestamps, etc.). Check all third-party SDKs include their own privacy manifests.

