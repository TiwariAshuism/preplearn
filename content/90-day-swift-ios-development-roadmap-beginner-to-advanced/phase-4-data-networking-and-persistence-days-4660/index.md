---
source: notion
title: "Phase 4 — Data, Networking & Persistence (Days 46—60)"
slug: "phase-4-data-networking-and-persistence-days-4660"
notionId: "39cda883-bddd-8173-859f-ef95be1264c6"
notionRootId: "39cda883bddd81908f86f82489b8c0c1"
parent: "90-day-swift-ios-development-roadmap-beginner-to-advanced"
children: []
order: 4
icon: "🗄️"
cover: null
---
> **Core insight:** Every real app does three things: fetches remote data, persists local data, and syncs between the two. Getting this layer right — proper error handling, loading states, offline support, cache invalidation — is what separates hobby apps from production apps.

---


## Day 46—48 — Networking with async/await


```swift
import Foundation

// The modern way: async/await + Codable
// This is cleaner than completion handlers and avoids callback pyramids

// 1. Define your models with Codable
struct Movie: Codable, Identifiable {
    let id: Int
    let title: String
    let overview: String
    let posterPath: String?
    let voteAverage: Double
    let releaseDate: String
    
    enum CodingKeys: String, CodingKey {
        case id, title, overview
        case posterPath = "poster_path"      // snake_case JSON -> camelCase Swift
        case voteAverage = "vote_average"
        case releaseDate = "release_date"
    }
}

struct MoviesResponse: Codable {
    let results: [Movie]
    let totalPages: Int
    let totalResults: Int
    
    enum CodingKeys: String, CodingKey {
        case results
        case totalPages = "total_pages"
        case totalResults = "total_results"
    }
}

// 2. A NetworkService that throws errors properly
enum NetworkError: LocalizedError {
    case invalidURL
    case invalidResponse(Int)
    case decodingFailed
    case noInternet
    
    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .invalidResponse(let code): return "Server error: \(code)"
        case .decodingFailed: return "Could not parse server response"
        case .noInternet: return "No internet connection"
        }
    }
}

actor MovieService {  // actor: thread-safe by default
    private let baseURL = "https://api.themoviedb.org/3"
    private let apiKey: String
    private let session: URLSession
    
    init(apiKey: String, session: URLSession = .shared) {
        self.apiKey = apiKey
        self.session = session
    }
    
    func fetchPopularMovies(page: Int = 1) async throws -> MoviesResponse {
        var components = URLComponents(string: "\(baseURL)/movie/popular")!
        components.queryItems = [
            URLQueryItem(name: "api_key", value: apiKey),
            URLQueryItem(name: "page", value: "\(page)")
        ]
        guard let url = components.url else { throw NetworkError.invalidURL }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse(0)
        }
        guard (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.invalidResponse(httpResponse.statusCode)
        }
        
        do {
            let decoder = JSONDecoder()
            return try decoder.decode(MoviesResponse.self, from: data)
        } catch {
            throw NetworkError.decodingFailed
        }
    }
}

// 3. ViewModel using async/await with proper error handling
@MainActor  // all property changes happen on main thread automatically
class MoviesViewModel: ObservableObject {
    @Published var movies: [Movie] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var currentPage = 1
    
    private let service: MovieService
    private var loadTask: Task<Void, Never>?
    
    init(service: MovieService) { self.service = service }
    
    func loadMovies() {
        loadTask?.cancel()  // cancel any in-flight request
        loadTask = Task {
            isLoading = true
            errorMessage = nil
            defer { isLoading = false }  // runs on ANY exit path
            
            do {
                let response = try await service.fetchPopularMovies(page: currentPage)
                movies = response.results
            } catch is CancellationError {
                // Task was cancelled, don't show error
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
    
    func loadMoreIfNeeded(currentItem: Movie) {
        guard let lastMovie = movies.last, currentItem.id == lastMovie.id else { return }
        currentPage += 1
        Task { try? await loadNextPage() }
    }
    
    private func loadNextPage() async throws {
        let response = try await service.fetchPopularMovies(page: currentPage)
        movies.append(contentsOf: response.results)
    }
}
```


---


## Day 49—51 — Core Data


```swift
import CoreData

// Core Data: Apple's object graph persistence framework
// Best for: complex relational data, large datasets, need for predicates

// PersistenceController: the standard stack setup
struct PersistenceController {
    static let shared = PersistenceController()
    
    let container: NSPersistentContainer
    
    init(inMemory: Bool = false) {
        container = NSPersistentContainer(name: "MyApp")  // matches .xcdatamodel filename
        if inMemory {
            container.persistentStoreDescriptions.first!.url = URL(fileURLWithPath: "/dev/null")
        }
        container.loadPersistentStores { _, error in
            if let error { fatalError("Core Data error: \(error)") }
        }
        container.viewContext.automaticallyMergesChangesFromParent = true
    }
    
    static var preview: PersistenceController = {
        let controller = PersistenceController(inMemory: true)  // for SwiftUI previews
        // seed preview data here
        return controller
    }()
}

// CRUD operations on Core Data
func saveNote(title: String, body: String, context: NSManagedObjectContext) {
    let note = Note(context: context)  // Note is generated from your .xcdatamodel
    note.id = UUID()
    note.title = title
    note.body = body
    note.createdAt = Date()
    
    do {
        try context.save()  // commits the transaction
    } catch {
        context.rollback()  // undo on failure
        print("Save error: \(error)")
    }
}

// Fetch with NSPredicate and NSSortDescriptor
func fetchNotes(searchText: String, context: NSManagedObjectContext) -> [Note] {
    let request = Note.fetchRequest()
    if !searchText.isEmpty {
        request.predicate = NSPredicate(format: "title CONTAINS[cd] %@ OR body CONTAINS[cd] %@",
                                         searchText, searchText)
    }
    request.sortDescriptors = [NSSortDescriptor(keyPath: \Note.createdAt, ascending: false)]
    return (try? context.fetch(request)) ?? []
}

// In SwiftUI: use @FetchRequest for reactive Core Data queries
struct NoteListView: View {
    @Environment(\.managedObjectContext) private var viewContext
    
    @FetchRequest(
        sortDescriptors: [SortDescriptor(\.createdAt, order: .reverse)],
        animation: .default
    ) private var notes: FetchedResults<Note>
    
    var body: some View {
        List(notes) { note in
            Text(note.title ?? "")
        }
    }
}
```


---


## Day 52—53 — SwiftData (iOS 17+)


```swift
import SwiftData

// SwiftData: the modern replacement for Core Data
// Requires iOS 17+, but dramatically less boilerplate

@Model  // macro: generates all the Core Data infrastructure automatically
class Note {
    var id: UUID
    var title: String
    var body: String
    var createdAt: Date
    var tags: [Tag] = []
    
    init(title: String, body: String) {
        self.id = UUID()
        self.title = title
        self.body = body
        self.createdAt = Date()
    }
}

@Model
class Tag {
    var name: String
    @Relationship(inverse: \Note.tags) var notes: [Note] = []
    
    init(name: String) { self.name = name }
}

// Setup: replace NSPersistentContainer with ModelContainer
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [Note.self, Tag.self])  // inject container into environment
    }
}

// In SwiftUI views:
struct NoteListView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Note.createdAt, order: .reverse) private var notes: [Note]
    
    var body: some View {
        List(notes) { note in
            Text(note.title)
        }
        .toolbar {
            Button("Add") {
                let note = Note(title: "New Note", body: "")
                context.insert(note)  // no need to call save() in most cases
            }
        }
    }
}
```


---


## Day 54—56 — UserDefaults, Keychain, and File Storage


```swift
// UserDefaults: small, simple key-value storage
// Use for: user preferences, settings, lightweight non-sensitive data
// NEVER use for: sensitive data (passwords, tokens) or large data
UserDefaults.standard.set(true, forKey: "hasCompletedOnboarding")
UserDefaults.standard.set("dark", forKey: "colorScheme")
let onboarded = UserDefaults.standard.bool(forKey: "hasCompletedOnboarding")

// @AppStorage: SwiftUI wrapper for UserDefaults (reactive)
struct SettingsView: View {
    @AppStorage("colorScheme") var colorScheme = "system"
    @AppStorage("fontSize") var fontSize: Double = 16
    
    var body: some View {
        Form {
            Picker("Color Scheme", selection: $colorScheme) {
                Text("System").tag("system")
                Text("Light").tag("light")
                Text("Dark").tag("dark")
            }
        }
    }
}

// Keychain: secure encrypted storage for sensitive data
// Use for: passwords, API tokens, biometric secrets
import Security

class KeychainManager {
    static let shared = KeychainManager()
    
    func save(key: String, value: String) throws {
        let data = value.data(using: .utf8)!
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        SecItemDelete(query as CFDictionary)  // delete old value first
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else { throw KeychainError.saveFailed(status) }
    }
    
    func load(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
}
```


---


## Day 57—60 — Phase 4 Capstone: Movie Browser with Offline Support


```javascript
Build a movie discovery app using TMDB API:

Screens:
  1. Movie List (paginated, infinite scroll)
  2. Search (debounced input, real-time results)
  3. Movie Detail (poster, overview, cast, similar movies)
  4. Favorites (persisted in SwiftData, works fully offline)

Requirements:
  - Networking: async/await + actor-based service layer
  - Codable with CodingKeys for snake_case JSON
  - Offline-first: cache API responses in Core Data or SwiftData
  - Image loading: async image with placeholder and error states
  - Loading/error/empty states for every list
  - Pagination: load next page when last item is visible
  - Search debouncing: don't fire API call on every keystroke (debounce 300ms)
  - Keychain: store API key securely, never hardcode in source
  - Handle network errors gracefully (show retry button)
```

