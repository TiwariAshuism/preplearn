# 04 — WebSockets & Real-time at Scale (50M Users)

> **Scenario:** Live cricket scores, chat, order tracking, stock prices — yeh sab polling se nahi hota. 50M users × real-time = WebSocket at scale. Yeh easy problem nahi hai.

---

## Real-time Protocols Comparison

```
Polling (setInterval every 2s):
  Client: "Koi update hai?" → Server: "Nahi"
  Client: "Koi update hai?" → Server: "Nahi"
  Client: "Koi update hai?" → Server: "Haan, yeh raha"
  
  ❌ Wasteful (99% requests useless)
  ❌ High latency (up to 2s delay)
  ❌ Server load: 50M × 0.5 req/s = 25M req/s — impossible

Long Polling:
  Client: "Koi update hai?" → Server: [holds connection until update]
  Server: "Yeh raha update" → Client: immediately reconnects
  
  ✅ Lower latency than polling
  ❌ Still HTTP overhead per update
  ❌ Connection state complex

Server-Sent Events (SSE):
  Client opens ONE HTTP connection.
  Server PUSHES text events anytime.
  Client cannot send data (server-to-client only).
  
  ✅ Simple, HTTP/2 multiplexed
  ✅ Auto-reconnect built into browser
  ✅ No special library needed
  ❌ Server-to-client only
  ❌ Text only (no binary)

WebSockets:
  Full-duplex bidirectional TCP channel over HTTP upgrade.
  Both client and server can send anytime.
  
  ✅ Bidirectional
  ✅ Binary support (protobuf, msgpack)
  ✅ Low latency (no HTTP headers per message)
  ❌ Complex at scale (sticky sessions, connection state)
  ❌ Firewall/proxy issues in some corporate networks
  
Choose:
  Updates only → SSE (simpler)
  Chat, gaming, collaborative → WebSocket
```

---

## WebSocket Handshake

```
Client sends HTTP request with upgrade:
  GET /ws/chat HTTP/1.1
  Host: api.example.com
  Upgrade: websocket
  Connection: Upgrade
  Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
  Sec-WebSocket-Version: 13

Server responds:
  HTTP/1.1 101 Switching Protocols
  Upgrade: websocket
  Connection: Upgrade
  Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

After this: raw TCP frames, no more HTTP.
```

---

## WebSocket Server in Go

```go
import "github.com/gorilla/websocket"

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        // CSRF protection: only allow your domain
        origin := r.Header.Get("Origin")
        return origin == "https://app.example.com"
    },
}

type Client struct {
    conn   *websocket.Conn
    userID string
    send   chan []byte  // buffered channel for outgoing messages
}

func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
    // Authenticate before upgrade (JWT in query param or cookie)
    userID, err := authenticateWS(r)
    if err != nil {
        http.Error(w, "Unauthorized", 401)
        return
    }
    
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    
    client := &Client{
        conn:   conn,
        userID: userID,
        send:   make(chan []byte, 256),  // buffer for slow clients
    }
    
    hub.Register(client)
    defer hub.Unregister(client)
    
    // Two goroutines per connection
    go client.writePump()  // sends messages to client
    client.readPump()      // reads messages from client (blocks)
}

func (c *Client) readPump() {
    defer c.conn.Close()
    
    c.conn.SetReadLimit(512 * 1024)  // max message: 512KB
    c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
    c.conn.SetPongHandler(func(string) error {
        c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
        return nil
    })
    
    for {
        _, message, err := c.conn.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
                log.Println("ws error:", err)
            }
            return  // exits, defer closes connection
        }
        hub.Broadcast(message)
    }
}

func (c *Client) writePump() {
    ticker := time.NewTicker(30 * time.Second)  // ping every 30s
    defer func() {
        ticker.Stop()
        c.conn.Close()
    }()
    
    for {
        select {
        case message, ok := <-c.send:
            c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
            if !ok {
                c.conn.WriteMessage(websocket.CloseMessage, []byte{})
                return
            }
            if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
                return
            }
            
        case <-ticker.C:
            c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
            if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
                return  // client gone
            }
        }
    }
}
```

---

## Hub Pattern — Fan-out

```go
type Hub struct {
    clients    map[*Client]bool
    rooms      map[string]map[*Client]bool  // room → clients
    broadcast  chan []byte
    register   chan *Client
    unregister chan *Client
    mu         sync.RWMutex
}

func (h *Hub) Run() {
    for {
        select {
        case client := <-h.register:
            h.mu.Lock()
            h.clients[client] = true
            h.mu.Unlock()
            
        case client := <-h.unregister:
            h.mu.Lock()
            if _, ok := h.clients[client]; ok {
                delete(h.clients, client)
                close(client.send)
            }
            h.mu.Unlock()
            
        case message := <-h.broadcast:
            h.mu.RLock()
            for client := range h.clients {
                select {
                case client.send <- message:
                    // sent
                default:
                    // client's send buffer full (slow client)
                    // drop message OR disconnect client
                    close(client.send)
                    delete(h.clients, client)
                }
            }
            h.mu.RUnlock()
        }
    }
}
```

---

## Scaling WebSockets — The Hard Problem

### The Sticky Session Problem

```
Server A: Client 1, 2, 3, 4 connected (10K connections)
Server B: Client 5, 6, 7, 8 connected (10K connections)

Client 1 sends message to Client 5.
Client 1 is on Server A. Client 5 is on Server B.
Server A doesn't know about Client 5!

Solutions:
1. Sticky sessions (same user → same server always)
2. Pub/Sub backbone (Redis, Kafka) between servers
```

### Solution: Redis Pub/Sub for Fan-out

```
                    ┌─────────────┐
                    │    Redis    │
                    │  Pub/Sub   │
                    └──────┬──────┘
              publish       │        subscribe
         ┌─────────────────┤──────────────────┐
         │                  │                  │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │   WS    │        │   WS    │        │   WS    │
    │Server A │        │Server B │        │Server C │
    │         │        │         │        │         │
    │Client1  │        │Client5  │        │Client9  │
    │Client2  │        │Client6  │        │Client10 │
    └─────────┘        └─────────┘        └─────────┘

Client 1 (Server A) sends message:
  1. Server A receives message from Client 1
  2. Server A publishes to Redis channel "room:cricket_live"
  3. ALL servers subscribed to "room:cricket_live" receive it
  4. Each server delivers to its local connected clients in that room

Redis pub/sub is fast (~1ms) and handles this perfectly.
At huge scale: use Kafka instead (persistent, replay possible).
```

```go
// Subscribe to Redis channel on server startup
func (h *Hub) SubscribeToRedis(ctx context.Context, rdb *redis.Client) {
    pubsub := rdb.Subscribe(ctx, "ws:broadcast", "ws:room:*")
    defer pubsub.Close()
    
    for msg := range pubsub.Channel() {
        var wsMsg WSMessage
        json.Unmarshal([]byte(msg.Payload), &wsMsg)
        
        // Deliver to local clients only
        h.DeliverLocal(wsMsg)
    }
}

// Send message from any service → publish to Redis → all WS servers receive
func (s *ChatService) SendMessage(ctx context.Context, roomID string, msg *Message) {
    payload, _ := json.Marshal(WSMessage{Room: roomID, Data: msg})
    rdb.Publish(ctx, "ws:room:"+roomID, payload)
}
```

### Connection Count Math

```
50M MAU. Peak concurrent: ~2M users online.
WebSocket server: can handle ~50K-100K connections (depending on RAM + goroutines)

  2M connections ÷ 50K per server = 40 WebSocket servers minimum

Memory per connection:
  2 goroutines × 8KB (stack) = 16KB
  Send buffer: 256 × message_size
  Connection overhead: ~8KB
  Total: ~32KB per connection
  
  40 servers × 50K connections × 32KB = ~64GB total memory
  → 40 × 4 core, 8GB RAM servers
  → Use spot instances (stateless after Redis pub/sub)
```

---

## Backpressure — Slow Clients

```
Problem: Server generates 1000 messages/sec but client only consumes 10/sec.
Buffer fills up → OOM → server crashes.

Solutions:

1. Drop old messages (ring buffer):
   If send buffer full, drop oldest message.
   OK for: live scores (stale score not needed)

2. Drop new messages:
   If buffer full, reject new.
   OK for: non-critical notifications

3. Disconnect slow client:
   Buffer full → close connection → client reconnects fresh.
   OK for: high-frequency data streams (trading)

4. Apply back pressure (block producer):
   Wait for client to consume before producing more.
   OK for: reliable delivery required

Most real-time apps: drop old + send "you missed N messages, reload"
```

---

## Server-Sent Events (SSE) — Simpler Option

```go
// When bidirectional not needed (order tracking, notifications)
func OrderUpdatesSSE(w http.ResponseWriter, r *http.Request) {
    // Check SSE support
    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "SSE not supported", 500)
        return
    }
    
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")
    w.Header().Set("Access-Control-Allow-Origin", "https://app.example.com")
    
    orderID := r.URL.Query().Get("order_id")
    ctx := r.Context()
    
    updateCh := orderService.Subscribe(ctx, orderID)
    
    for {
        select {
        case update := <-updateCh:
            // SSE format: "data: {json}\n\n"
            fmt.Fprintf(w, "id: %d\n", update.ID)
            fmt.Fprintf(w, "event: order_update\n")
            fmt.Fprintf(w, "data: %s\n\n", mustJSON(update))
            flusher.Flush()  // send immediately, don't buffer
            
        case <-ctx.Done():
            return  // client disconnected
        }
    }
}
```

```
SSE features:
  - Auto-reconnect: browser reconnects automatically
  - Last-Event-ID: resume from last event after reconnect
  - HTTP/2: multiple SSE streams multiplexed over one connection
  
When SSE > WebSocket:
  Notifications, news feeds, order updates, dashboards
  Any "server pushes, client just reads" scenario
  Simpler to implement, no special proxies needed
```
