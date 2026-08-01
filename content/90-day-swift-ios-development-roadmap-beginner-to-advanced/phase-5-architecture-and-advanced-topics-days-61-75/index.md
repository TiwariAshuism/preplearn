---
source: notion
title: "Phase 5 — Architecture & Advanced Topics (Days 61–75)"
slug: "phase-5-architecture-and-advanced-topics-days-61-75"
notionId: "39dda883-bddd-8173-a467-f887723639db"
notionRootId: "39cda883bddd81908f86f82489b8c0c1"
parent: "90-day-swift-ios-development-roadmap-beginner-to-advanced"
children: []
order: 5
icon: "🏗️"
cover: null
---
> **Core insight:** Architecture is not about following a pattern religiously — it's about making your code testable, navigable, and changeable. MVVM + Combine + async/await is the modern iOS sweet spot. Combine is the reactive plumbing; async/await is the sequential async plumbing. Knowing both and choosing the right tool is what makes a senior iOS engineer.

---


## Day 61–63 — MVVM Architecture


```swift
// MVVM: Model - View - ViewModel
// Model: pure data and business logic (structs, Core Data entities)
// ViewModel: prepares data for display, handles user actions, owns async work
// View: purely declarative, binds to ViewModel, no business logic

// The dependency flow:
// View -> observes -> ViewModel -> uses -> Model
// ViewModel knows nothing about the View (testable!)
// View knows nothing about the Model (decoupled!)

// Bad: logic in the View
struct BadPostView: View {
    @State var posts: [Post] = []
    var body: some View {
        List(posts) { post in Text(post.title) }
        .task {
            // WRONG: networking in the View
            let url = URL(string: "https://api.example.com/posts")!
            let (data, _) = try! await URLSession.shared.data(from: url)
            posts = try! JSONDecoder().decode([Post].self, from: data)
        }
    }
}

// Good: ViewModel owns all async/business logic
@MainActor
final class PostListViewModel: ObservableObject {
    @Published private(set) var posts: [Post] = []  // private(set): View can read, not write
    @Published private(set) var state: ViewState = .idle
    @Published var searchText = ""
    
    var filteredPosts: [Post] {
        guard !searchText.isEmpty else { return posts }
        return posts.filter { $0.title.localizedCaseInsensitiveContains(searchText) }
    }
    
    private let service: PostServiceProtocol  // protocol, not concrete type -- testable!
    
    init(service: PostServiceProtocol = PostService()) {
        self.service = service
    }
    
    func loadPosts() async {
        state = .loading
        do {
            posts = try await service.fetchPosts()
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }
}

enum ViewState: Equatable {
    case idle, loading, loaded
    case error(String)
}

struct PostListView: View {
    @StateObject private var vm = PostListViewModel()
    
    var body: some View {
        Group {
            switch vm.state {
            case .idle, .loading: ProgressView()
            case .loaded:
                List(vm.filteredPosts) { post in
                    Text(post.title)
                }
                .searchable(text: $vm.searchText)
            case .error(let message):
                ContentUnavailableView(message, systemImage: "exclamationmark.triangle")
            }
        }
        .task { await vm.loadPosts() }
    }
}
```


---


## Day 64—66 — Combine Framework


```swift
import Combine

// Combine: reactive streams for handling asynchronous events
// Think of it as: observable sequences + functional operators
// Publisher emits values -> Operators transform them -> Subscriber consumes them

// When to use Combine vs async/await:
// async/await: single async operation (fetch data, save to disk)
// Combine: ongoing streams (search text, timer, notifications, multiple publishers combined)

class SearchViewModel: ObservableObject {
    @Published var searchText = ""
    @Published private(set) var results: [Movie] = []
    @Published private(set) var isSearching = false
    
    private var cancellables = Set<AnyCancellable>()  // holds subscriptions
    private let service: MovieServiceProtocol
    
    init(service: MovieServiceProtocol) {
        self.service = service
        setupSearchPipeline()
    }
    
    private func setupSearchPipeline() {
        $searchText                                      // Publisher: emits every keystroke
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)  // wait 300ms of silence
            .removeDuplicates()                          // ignore identical consecutive values
            .filter { $0.count >= 2 }                    // don't search for 0-1 chars
            .handleEvents(receiveOutput: { [weak self] _ in
                self?.isSearching = true
            })
            .flatMap { [weak self] query -> AnyPublisher<[Movie], Never> in
                guard let self else { return Just([]).eraseToAnyPublisher() }
                return self.service.searchPublisher(query: query)
                    .catch { _ in Just([]) }             // absorb errors, return empty
                    .eraseToAnyPublisher()
            }
            .receive(on: DispatchQueue.main)             // always update UI on main thread
            .sink { [weak self] movies in
                self?.results = movies
                self?.isSearching = false
            }
            .store(in: &cancellables)                    // keep subscription alive
    }
}

// Combine + URLSession
extension URLSession {
    func publisher<T: Decodable>(for url: URL, type: T.Type) -> AnyPublisher<T, Error> {
        dataTaskPublisher(for: url)
            .map(\.data)
            .decode(type: T.self, decoder: JSONDecoder())
            .eraseToAnyPublisher()
    }
}

// Merge multiple publishers
Publishers.Merge(locationPublisher, manualRefreshPublisher)
    .sink { [weak self] _ in self?.refresh() }
    .store(in: &cancellables)

// CombineLatest: react when EITHER publisher emits
Publishers.CombineLatest($username, $password)
    .map { username, password in
        !username.isEmpty && password.count >= 8
    }
    .assign(to: &$isLoginEnabled)  // assign to @Published without sink
```


---


## Day 67—68 — Unit Testing and UI Testing


```swift
import XCTest
@testable import MyApp  // access internal types

// Unit test: test a ViewModel in isolation (no UI, no network)
final class PostListViewModelTests: XCTestCase {
    
    var sut: PostListViewModel!  // SUT = System Under Test
    var mockService: MockPostService!
    
    override func setUp() {
        super.setUp()
        mockService = MockPostService()
        sut = PostListViewModel(service: mockService)  // inject mock
    }
    
    override func tearDown() {
        sut = nil
        mockService = nil
        super.tearDown()
    }
    
    func testLoadPosts_success_populatesPostsArray() async {
        // Arrange
        let expectedPosts = [Post(id: 1, title: "Test Post")]
        mockService.stubbedPosts = expectedPosts
        
        // Act
        await sut.loadPosts()
        
        // Assert
        XCTAssertEqual(sut.posts, expectedPosts)
        XCTAssertEqual(sut.state, .loaded)
    }
    
    func testLoadPosts_failure_setsErrorState() async {
        // Arrange
        mockService.shouldFail = true
        
        // Act
        await sut.loadPosts()
        
        // Assert
        guard case .error = sut.state else {
            XCTFail("Expected error state")
            return
        }
    }
    
    func testFilteredPosts_withSearchText_returnsMatchingPosts() async {
        mockService.stubbedPosts = [
            Post(id: 1, title: "Swift Tutorial"),
            Post(id: 2, title: "UIKit Basics"),
            Post(id: 3, title: "Swift Concurrency")
        ]
        await sut.loadPosts()
        
        sut.searchText = "Swift"
        
        XCTAssertEqual(sut.filteredPosts.count, 2)
    }
}

// Mock service: implement the protocol for testing
final class MockPostService: PostServiceProtocol {
    var stubbedPosts: [Post] = []
    var shouldFail = false
    
    func fetchPosts() async throws -> [Post] {
        if shouldFail { throw TestError.mockFailure }
        return stubbedPosts
    }
}

// UI Testing with XCUITest
final class PostListUITests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUp() {
        app = XCUIApplication()
        app.launchArguments = ["--uitesting", "--mock-data"]  // signal to app to use mock data
        app.launch()
    }
    
    func testSearchFiltersResults() {
        let searchBar = app.searchFields.firstMatch
        searchBar.tap()
        searchBar.typeText("Swift")
        
        XCTAssertTrue(app.cells.count > 0)
        XCTAssertTrue(app.cells.firstMatch.staticTexts["Swift Tutorial"].exists)
    }
}
```


---


## Day 69—71 — Performance and Memory


```swift
// Instruments: Xcode's profiling toolkit
// Product -> Profile -> Choose instrument:
// - Leaks: find retain cycles and memory leaks
// - Time Profiler: find slow code (CPU hotspots)
// - Allocations: track memory growth over time
// - Energy Log: battery usage

// Common memory issues and fixes:

// 1. Retain cycle in closure
class DownloadManager {
    var completionHandler: (() -> Void)?
    
    func download() {
        // WRONG: self -> DownloadManager -> completionHandler -> self = cycle
        completionHandler = { self.updateUI() }  // strong capture
        
        // RIGHT: break the cycle
        completionHandler = { [weak self] in
            self?.updateUI()
        }
    }
}

// 2. Lazy properties: defer expensive setup until first use
class ImageProcessor {
    lazy var ciContext = CIContext()  // only created when first accessed (CIContext is expensive)
}

// 3. Image resizing before display
// WRONG: loading a 4K photo into a 100pt UIImageView wastes 100x memory
imageView.image = UIImage(contentsOfFile: path)  // loads full resolution

// RIGHT: downscale to display size
func downsampleImage(at url: URL, to pointSize: CGSize, scale: CGFloat) -> UIImage? {
    let imageSourceOptions = [kCGImageSourceShouldCache: false] as CFDictionary
    guard let imageSource = CGImageSourceCreateWithURL(url as CFURL, imageSourceOptions) else { return nil }
    let maxDimension = max(pointSize.width, pointSize.height) * scale
    let options = [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceShouldCacheImmediately: true,
        kCGImageSourceCreateThumbnailWithTransform: true,
        kCGImageSourceThumbnailMaxPixelSize: maxDimension
    ] as CFDictionary
    guard let thumbnail = CGImageSourceCreateThumbnailAtIndex(imageSource, 0, options) else { return nil }
    return UIImage(cgImage: thumbnail)
}

// 4. @MainActor for UI updates
@MainActor
func updateUI(with data: [Item]) {
    // guaranteed to run on main thread
    self.items = data
    self.tableView.reloadData()
}
```


---


## Day 72—74 — Accessibility and Localization


```swift
// Accessibility: not optional for App Store approval or professional apps
// iOS accessibility features: VoiceOver, Dynamic Type, Reduce Motion, High Contrast

struct AccessibleCardView: View {
    let item: Item
    
    var body: some View {
        HStack {
            Image(systemName: item.iconName)
            VStack(alignment: .leading) {
                Text(item.title).font(.headline)
                Text(item.subtitle).font(.subheadline).foregroundColor(.secondary)
            }
        }
        // Group the card as a single accessibility element
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(item.title), \(item.subtitle)")
        .accessibilityHint("Double tap to view details")
        .accessibilityAddTraits(.isButton)
    }
}

// Dynamic Type: always use system font styles, not fixed sizes
Text("Title").font(.headline)         // scales with user's text size preference
Text("Body").font(.body)              // NOT: .font(.system(size: 16))

// Localization: prepare for global markets
// Strings.swift (or use the .xcstrings catalog in Xcode 15)
extension String {
    func localized(comment: String = "") -> String {
        NSLocalizedString(self, comment: comment)
    }
}
// Usage: Text("welcome_message".localized())
// Strings/en.lproj/Localizable.strings: "welcome_message" = "Welcome to MyApp";
// Strings/hi.lproj/Localizable.strings: "welcome_message" = "MyApp में आपका स्वागत है";

// Date and number formatting: always use locale-aware formatters
let formatted = item.date.formatted(.dateTime.day().month().year())
let price = amount.formatted(.currency(code: Locale.current.currency?.identifier ?? "USD"))
```


---


## Day 75 — Phase 5 Capstone: Full-Featured Social Feed App


```javascript
Build a full social feed app with complete architecture:

Architecture:
  - MVVM throughout with protocol-based service layer
  - Dependency injection via initializer (testable)
  - Combine for search debouncing and real-time updates
  - async/await for all network calls

Screens:
  1. Feed (infinite scroll, like/save actions, optimistic updates)
  2. Search (Combine pipeline with debounce, type filters)
  3. Profile (stats, grid layout, edit profile sheet)
  4. Post Detail (comments, share sheet, haptic feedback)
  5. Notifications (grouped, unread count badge)

Technical requirements:
  - Unit tests for all 5 ViewModels (>80% coverage)
  - UI tests for the main user journey (login -> view feed -> like a post)
  - Memory profile: zero leaks in Instruments
  - Accessibility: all interactive elements VoiceOver-readable
  - Localization: English + Hindi strings
  - Dynamic Type: all text scales correctly
  - Haptic feedback on key interactions (UIImpactFeedbackGenerator)
```

