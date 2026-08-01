---
source: notion
title: "Phase 2 — UIKit Essentials (Days 16–30)"
slug: "phase-2-uikit-essentials-days-16-30"
notionId: "39cda883-bddd-8123-b97c-c5b815b85363"
notionRootId: "39cda883bddd81908f86f82489b8c0c1"
parent: "90-day-swift-ios-development-roadmap-beginner-to-advanced"
children: []
order: 2
icon: "🧱"
cover: null
---
> **Core insight:** UIKit is the battle-tested foundation of iOS UI. SwiftUI sits on top of it. Understanding UIKit’s view lifecycle, responder chain, Auto Layout, and delegate pattern makes you dangerous in any iOS codebase — including SwiftUI apps, which often embed UIKit components.

---


## Day 16–17 — Xcode Setup and App Lifecycle


```swift
// iOS App Lifecycle: understand this or you’ll have mysterious bugs
// AppDelegate -> SceneDelegate -> ViewController

@main
struct MyApp: App {  // SwiftUI entry point
    var body: some Scene {
        WindowGroup { ContentView() }
    }
}

// UIKit AppDelegate lifecycle (you must know this for background tasks, push notifications)
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // App has launched. Set up global state here.
        return true
    }
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        // App is in foreground and active. Resume paused tasks.
    }
    
    func applicationWillResignActive(_ application: UIApplication) {
        // About to leave foreground. Save state, pause ongoing work.
    }
    
    func applicationDidEnterBackground(_ application: UIApplication) {
        // App is in background. You have ~5 seconds before suspension.
        // Save user data HERE.
    }
}

// ViewController Lifecycle: know the order or you’ll call UI updates at the wrong time
class MyViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()  // ALWAYS call super first
        // View hierarchy is loaded. Set up UI here. Called ONCE.
    }
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        // About to become visible. Refresh data here.
    }
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        // View is fully visible. Start animations here.
    }
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        // About to leave screen. Stop animations, save state.
    }
    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        // No longer visible.
    }
}
```


---


## Day 18–20 — Views, Auto Layout, and Programmatic UI


```swift
// Auto Layout in code (no Storyboard) -- the professional way
class ProfileViewController: UIViewController {
    
    private let avatarImageView: UIImageView = {
        let iv = UIImageView()
        iv.translatesAutoresizingMaskIntoConstraints = false  // ALWAYS set this
        iv.contentMode = .scaleAspectFill
        iv.clipsToBounds = true
        iv.layer.cornerRadius = 40
        iv.backgroundColor = .systemGray5
        return iv
    }()
    
    private let nameLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.font = .systemFont(ofSize: 24, weight: .bold)
        label.textAlignment = .center
        return label
    }()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        view.addSubview(avatarImageView)
        view.addSubview(nameLabel)
        
        // NSLayoutConstraint.activate: the preferred way (all active at once)
        NSLayoutConstraint.activate([
            avatarImageView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 32),
            avatarImageView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            avatarImageView.widthAnchor.constraint(equalToConstant: 80),
            avatarImageView.heightAnchor.constraint(equalToConstant: 80),
            
            nameLabel.topAnchor.constraint(equalTo: avatarImageView.bottomAnchor, constant: 16),
            nameLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            nameLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16)
        ])
    }
}
```


---


## Day 21–23 — UITableView and UICollectionView


```swift
// UITableView: the workhorse of iOS apps
class FeedViewController: UIViewController, UITableViewDataSource, UITableViewDelegate {
    
    private let tableView = UITableView(frame: .zero, style: .insetGrouped)
    private var posts: [Post] = []
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupTableView()
    }
    
    private func setupTableView() {
        tableView.translatesAutoresizingMaskIntoConstraints = false
        tableView.dataSource = self
        tableView.delegate = self
        tableView.register(PostCell.self, forCellReuseIdentifier: PostCell.identifier)
        view.addSubview(tableView)
        // ... constraints
    }
    
    // MARK: - UITableViewDataSource
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return posts.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        // dequeueReusableCell: CRITICAL for performance. Reuses off-screen cells.
        // Never create a new cell every time -- that’s O(n) memory for a long list
        guard let cell = tableView.dequeueReusableCell(
            withIdentifier: PostCell.identifier, for: indexPath) as? PostCell
        else { return UITableViewCell() }
        
        cell.configure(with: posts[indexPath.row])
        return cell
    }
    
    // MARK: - UITableViewDelegate
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        let post = posts[indexPath.row]
        let detail = PostDetailViewController(post: post)
        navigationController?.pushViewController(detail, animated: true)
    }
}

// Custom cell: always use a reuse identifier
class PostCell: UITableViewCell {
    static let identifier = "PostCell"
    
    func configure(with post: Post) {
        textLabel?.text = post.title
        detailTextLabel?.text = post.author
    }
}
```


---


## Day 24—26 — Navigation and Presentation


```swift
// UINavigationController: push/pop navigation
navigationController?.pushViewController(detailVC, animated: true)
navigationController?.popViewController(animated: true)

// Passing data forward (push): use initializer or properties
class DetailVC: UIViewController {
    private let item: Item
    init(item: Item) { self.item = item; super.init(nibName: nil, bundle: nil) }
    required init?(coder: NSCoder) { fatalError() }
}

// Passing data backward (pop): use the delegate pattern
protocol DetailViewControllerDelegate: AnyObject {
    func detailViewController(_ vc: DetailViewController, didUpdate item: Item)
}

// Modal presentation
let modal = ModalVC()
modal.modalPresentationStyle = .sheet        // bottom sheet (iOS 15+)
modal.modalTransitionStyle = .coverVertical
present(modal, animated: true)
dismiss(animated: true)

// Tab bar controller
let tabBar = UITabBarController()
let vc1 = HomeViewController()
vc1.tabBarItem = UITabBarItem(title: "Home", image: UIImage(systemName: "house"), tag: 0)
tabBar.viewControllers = [UINavigationController(rootViewController: vc1)]

// Programmatic segue alternative: coordinator pattern for complex navigation
protocol Coordinator {
    var navigationController: UINavigationController { get }
    func start()
}
```


---


## Day 27—29 — User Input and Gestures


```swift
// UITextField with delegate
class LoginViewController: UIViewController, UITextFieldDelegate {
    
    @IBOutlet weak var emailTextField: UITextField!
    @IBOutlet weak var passwordTextField: UITextField!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        emailTextField.delegate = self
        passwordTextField.delegate = self
        passwordTextField.isSecureTextEntry = true
        emailTextField.returnKeyType = .next
        passwordTextField.returnKeyType = .done
        
        // Dismiss keyboard when tapping outside
        let tap = UITapGestureRecognizer(target: self, action: #selector(dismissKeyboard))
        view.addGestureRecognizer(tap)
    }
    
    // UITextFieldDelegate: handle Return key
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        if textField == emailTextField {
            passwordTextField.becomeFirstResponder()
        } else {
            textField.resignFirstResponder()
            login()
        }
        return true
    }
    
    @objc private func dismissKeyboard() { view.endEditing(true) }
    
    @IBAction func loginTapped(_ sender: UIButton) { login() }
    
    private func login() {
        guard
            let email = emailTextField.text, !email.isEmpty,
            let password = passwordTextField.text, !password.isEmpty
        else {
            showAlert(title: "Error", message: "Please fill in all fields")
            return
        }
        // Proceed with login
    }
}

// Gesture recognizers
let longPress = UILongPressGestureRecognizer(target: self, action: #selector(handleLongPress(_:)))
view.addGestureRecognizer(longPress)

@objc func handleLongPress(_ gesture: UILongPressGestureRecognizer) {
    if gesture.state == .began {
        let location = gesture.location(in: view)
        print("Long press at: \(location)")
    }
}
```


---


## Day 30 — Phase 2 Capstone: Notes App (UIKit)


```javascript
Build a full Notes app with UIKit, all programmatic UI (no Storyboard):

Screens:
  1. Notes List (UITableView with swipe-to-delete, search bar)
  2. Note Detail (UITextView, edit title + body)
  3. Tags filter (UICollectionView with horizontal scroll)

Requirements:
  - No Storyboard: all UI built in code with NSLayoutConstraint.activate
  - Delegate pattern: Detail VC notifies List VC when a note is saved
  - UISearchBar to filter notes by content
  - Swipe-to-delete on table cells
  - Sort by last modified date
  - Persist notes to UserDefaults (JSON encoded)
  - Dark mode support (use .systemBackground, semantic colors)
  - Smooth keyboard avoidance (adjust scroll insets when keyboard appears)
```


---


## Common mistakes


### Mistake 1


**❌ Updating UI from a background thread.**


URLSession callbacks and GCD background queues return on a background thread. Modifying any UIView property off the main thread causes random crashes and visual glitches.


**✅ Correct approach:** Always dispatch UI updates to the main thread:


```swift
URLSession.shared.dataTask(with: url) { data, _, _ in
    guard let data = data else { return }
    DispatchQueue.main.async {  // REQUIRED before any UI update
        self.tableView.reloadData()
    }
}.resume()
```


### Mistake 2


**❌ Forgetting** **`translatesAutoresizingMaskIntoConstraints = false`****.**


If you add Auto Layout constraints to a view but forget this line, the view’s old autoresizing mask creates conflicting constraints. The layout breaks in unpredictable ways with `UIViewAlertForUnsatisfiableConstraints` warnings.


**✅ Correct approach:** Any time you create a view programmatically and plan to use Auto Layout, set this to false immediately:


```swift
let label = UILabel()
label.translatesAutoresizingMaskIntoConstraints = false
view.addSubview(label)
```


### Mistake 3


**❌ Strong delegate references causing retain cycles.**


If ViewController A holds ViewController B as a strong delegate, and B has a strong reference back to A, neither will ever be deallocated.


**✅ Correct approach:** Delegate properties are ALWAYS `weak`:


```swift
weak var delegate: SomeDelegate?  // weak prevents the retain cycle
```

