---
source: notion
title: "Phase 3 — SwiftUI & Modern UI (Days 31–45)"
slug: "phase-3-swiftui-and-modern-ui-days-31-45"
notionId: "39cda883-bddd-814c-97b2-e09900473c52"
notionRootId: "39cda883bddd81908f86f82489b8c0c1"
parent: "90-day-swift-ios-development-roadmap-beginner-to-advanced"
children: []
order: 3
icon: "🌟"
cover: null
---
> **Core insight:** SwiftUI is declarative — you describe WHAT the UI should look like given a state, and SwiftUI figures out HOW to update it. This is fundamentally different from UIKit’s imperative model. The mental shift from “manipulate views” to “bind views to state” is the single biggest adjustment coming from UIKit.

---


## Day 31–33 — SwiftUI Fundamentals


```swift
import SwiftUI

// Everything in SwiftUI is a View that returns some View
struct ContentView: View {
    var body: some View {
        // 'some View' is an opaque type -- the compiler knows the concrete type
        VStack(spacing: 16) {
            Text("Hello, SwiftUI!")
                .font(.largeTitle)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            Image(systemName: "swift")
                .resizable()
                .scaledToFit()
                .frame(width: 100, height: 100)
                .foregroundColor(.orange)
            
            Button("Tap me") { print("tapped") }
                .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}

// Layout containers
VStack { }  // vertical
HStack { }  // horizontal
ZStack { }  // overlay (Z-axis)
LazyVStack { }  // lazy: only renders visible items (use for long lists)
Grid { }    // two-dimensional grid (iOS 16+)

// Spacer and padding
HStack {
    Text("Left")
    Spacer()     // pushes items to edges
    Text("Right")
}
.padding(.horizontal, 16)
```


---


## Day 34–36 — State Management


```swift
// The four main property wrappers -- know when to use each

// @State: local, simple state owned by THIS view
struct CounterView: View {
    @State private var count = 0  // private: state is encapsulated
    
    var body: some View {
        VStack {
            Text("Count: \(count)")
            Button("+") { count += 1 }  // mutating @State triggers view refresh
        }
    }
}

// @Binding: share state from a parent to a child (two-way)
struct ToggleRow: View {
    let title: String
    @Binding var isOn: Bool  // bound to parent's @State
    
    var body: some View {
        Toggle(title, isOn: $isOn)  // $ prefix creates the Binding
    }
}

// @StateObject: create and own a reference type ViewModel
// Use when THIS view creates the object
struct FeedView: View {
    @StateObject private var viewModel = FeedViewModel()
    
    var body: some View {
        List(viewModel.posts) { post in
            PostRow(post: post)
        }
        .task { await viewModel.loadPosts() }  // runs on appear, cancels on disappear
    }
}

// @ObservedObject: observe a reference type created ELSEWHERE
// Use when the object is passed in, not created here
struct PostDetailView: View {
    @ObservedObject var viewModel: PostDetailViewModel  // injected from outside
    ...
}

// @EnvironmentObject: inject into the entire view hierarchy
// Use for app-wide state (auth session, theme, user preferences)
@main
struct MyApp: App {
    @StateObject private var authManager = AuthManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)  // available to ALL descendants
        }
    }
}

// Any descendant can access it:
struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    
    var body: some View {
        Text("Logged in as: \(authManager.currentUser?.name ?? "Guest")")
    }
}

// Observable macro (iOS 17+): replaces @StateObject/@ObservedObject
@Observable
class FeedViewModel {
    var posts: [Post] = []  // automatically observed, no @Published needed
    var isLoading = false
}
// Usage: just use the object directly, no wrapper needed in many cases
```


---


## Day 37–39 — Navigation and Lists


```swift
// NavigationStack (iOS 16+): programmatic, type-safe navigation
struct AppView: View {
    @State private var path = NavigationPath()  // navigation stack state
    
    var body: some View {
        NavigationStack(path: $path) {
            HomeView()
                .navigationDestination(for: Post.self) { post in
                    PostDetailView(post: post)
                }
                .navigationDestination(for: User.self) { user in
                    ProfileView(user: user)
                }
        }
    }
}

// Navigate programmatically
path.append(selectedPost)  // push
path.removeLast()          // pop
path = NavigationPath()    // pop to root

// List: SwiftUI's UITableView equivalent
struct PostListView: View {
    @StateObject private var vm = PostListViewModel()
    
    var body: some View {
        List {
            ForEach(vm.posts) { post in
                NavigationLink(value: post) {
                    PostRow(post: post)
                }
            }
            .onDelete { indexSet in vm.delete(at: indexSet) }
            .onMove { source, dest in vm.move(from: source, to: dest) }
        }
        .searchable(text: $vm.searchText)  // adds a search bar
        .refreshable { await vm.refresh() } // pull-to-refresh
        .listStyle(.insetGrouped)
        .navigationTitle("Posts")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button("Add", systemImage: "plus") { vm.showAddPost = true }
            }
            EditButton()  // enables swipe-to-delete and drag-to-reorder
        }
    }
}
```


---


## Day 40–42 — SwiftUI Animations and Custom Components


```swift
// Animations: declarative and composable
struct AnimatedButton: View {
    @State private var isPressed = false
    @State private var isLoading = false
    
    var body: some View {
        Button(action: { triggerAction() }) {
            ZStack {
                if isLoading {
                    ProgressView()
                        .transition(.opacity)
                } else {
                    Text("Submit")
                        .transition(.opacity)
                }
            }
        }
        .buttonStyle(.borderedProminent)
        .scaleEffect(isPressed ? 0.95 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
    }
}

// Custom view modifiers: extract repeated styling into reusable components
struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding()
            .background(.background)
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardStyle())
    }
}

// Usage:
Text("Hello")
    .cardStyle()  // clean and reusable

// ViewBuilder: build reusable container views
struct Section<Content: View>: View {
    let title: String
    @ViewBuilder let content: () -> Content  // accepts any view as trailing closure
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(title).font(.headline)
            content()
        }
    }
}

// Matched geometry effect: shared element transitions
struct HeroAnimation: View {
    @Namespace private var animation
    @State private var isExpanded = false
    
    var body: some View {
        if isExpanded {
            RoundedRectangle(cornerRadius: 20)
                .matchedGeometryEffect(id: "card", in: animation)
                .frame(maxWidth: .infinity, maxHeight: 300)
        } else {
            RoundedRectangle(cornerRadius: 12)
                .matchedGeometryEffect(id: "card", in: animation)
                .frame(width: 80, height: 80)
        }
    }
}
```


---


## Day 43—44 — SwiftUI + UIKit Interoperability


```swift
// UIViewRepresentable: wrap a UIKit view inside SwiftUI
struct WebView: UIViewRepresentable {
    let url: URL
    
    func makeUIView(context: Context) -> WKWebView {
        return WKWebView()
    }
    
    func updateUIView(_ webView: WKWebView, context: Context) {
        webView.load(URLRequest(url: url))
    }
}

// UIViewControllerRepresentable: wrap a UIKit VC inside SwiftUI
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var selectedImage: UIImage?
    @Environment(\.presentationMode) var presentationMode
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ vc: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePicker
        init(_ parent: ImagePicker) { self.parent = parent }
        
        func imagePickerController(_ picker: UIImagePickerController,
                                   didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            parent.selectedImage = info[.originalImage] as? UIImage
            parent.presentationMode.wrappedValue.dismiss()
        }
    }
}
```


---


## Day 45 — Phase 3 Capstone: Weather App (SwiftUI)


```javascript
Build a full Weather app in SwiftUI:

Screens:
  1. City Search (searchable list, NavigationStack)
  2. Current Weather (animated icons, temperature, conditions)
  3. 7-day Forecast (horizontal ScrollView with custom cards)
  4. Settings (dark mode toggle, temperature unit, stored in @AppStorage)

Requirements:
  - MVVM architecture: one ViewModel per screen
  - @StateObject / @ObservedObject / @EnvironmentObject used correctly
  - Smooth animations: weather icon transitions, loading states
  - At least 2 custom ViewModifiers and 1 custom ViewBuilder container
  - NavigationStack with programmatic navigation
  - Pull-to-refresh
  - Widget Extension: a basic home screen widget showing current temperature
  - Dark mode support throughout
```


---


## Common mistakes


### Mistake 1


**❌ Using @State for data shared between views or data that belongs in a ViewModel.**


@State is for LOCAL, ephemeral UI state (is this button pressed? is this modal showing?). Putting business logic or shared data in @State creates tangled, untestable views.


**✅ Correct approach:** Business data lives in a ViewModel (class conforming to ObservableObject). Only pure UI state (selected tab, sheet presentation, animation trigger) lives in @State.


### Mistake 2


**❌ @StateObject vs @ObservedObject confusion causing the object to be recreated.**


Using @ObservedObject for an object that the view creates causes it to be destroyed and recreated every time the view re-renders — losing all state.


**✅ Correct approach:** Use @StateObject for objects the view CREATES and OWNS. Use @ObservedObject for objects PASSED IN from a parent. Simple rule: if you write the `= ViewModel()` initializer inside the view, use @StateObject.


### Mistake 3


**❌ Putting too much logic in the View body.**


A View body that fetches data, transforms it, and renders it is impossible to test and hard to read.


**✅ Correct approach:** The View body should only reference pre-computed properties from the ViewModel. All filtering, sorting, formatting, and async operations live in the ViewModel.

