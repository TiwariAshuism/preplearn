---
source: notion
title: "Phase 1 — Foundations (Days 1–15)"
slug: "phase-1-foundations-days-1-15"
notionId: "358da883-bddd-818a-9050-fd79a6900a5f"
notionRootId: "358da883bddd81e1b394ca83aa7ed599"
parent: "90-day-backend-engineering-roadmap"
children: []
order: 3
icon: "📘"
cover: null
---
> **Goal:** Understand how computers and networks actually communicate before writing a single line of backend code. Everything in backend engineering — latency, reliability, security — traces back to these fundamentals.

---


## 🧠 Mental model


You've been building on top of abstractions your whole career. HTTP, fetch(), WebSockets — these all feel like magic. Phase 1 is about pulling back the curtain. When you finish this phase, you'll be able to trace exactly what happens — at the byte level — when a user clicks a button in your app.


---


## 📚 Topics in order


### Day 1–2 — How the internet works

- Packets, routing, BGP intuition
- ISPs, hops, traceroute
- IP addressing (CIDR notation, subnets)
- Why latency exists: physical speed-of-light constraints

### Day 3–4 — TCP vs UDP

- TCP 3-way handshake (SYN → SYN-ACK → ACK)
- Sequence numbers and acknowledgements
- Flow control (sliding window), congestion control (CWND)
- Why UDP wins for gaming, video streaming, DNS
- When to use each: the decision framework

### Day 5–6 — HTTP/1.1 vs HTTP/2 vs HTTP/3

- HTTP/1.1: text-based, head-of-line blocking, keep-alive
- HTTP/2: binary framing, multiplexing, header compression (HPACK), server push
- HTTP/3: QUIC over UDP, 0-RTT, connection migration, QPACK
- The head-of-line blocking problem and how each version solves (or doesn't solve) it

### Day 7 — DNS resolution

- Recursive resolver vs authoritative nameserver
- The full resolution chain: stub → recursive → root → TLD → authoritative
- TTL, negative caching, DNS over HTTPS (DoH)
- Why DNS failure takes down entire services

### Day 8–9 — TLS 1.3 handshake internals

- Symmetric vs asymmetric encryption
- Certificate chains and root CAs
- TLS 1.3 handshake: ClientHello → ServerHello → Finished (1-RTT)
- 0-RTT session resumption and its replay attack risk
- Why TLS 1.2 is slower (2-RTT)

### Day 10–11 — OS fundamentals

- Process vs thread: memory isolation, context switch cost
- Virtual memory: pages, page faults, the MMU
- File descriptors: everything is a file in Unix
- epoll / kqueue: how event loops actually work
- The C10K problem and why it matters for backend design

### Day 12–13 — Full request lifecycle

- Client → DNS → TCP connect → TLS handshake → HTTP request → App server → DB → HTTP response → Client
- Where latency hides at each step
- What happens when any step fails
- Exercise: curl -v a real API and identify every step in the output

### Day 14–15 — Network debugging tools

- `tcpdump` and `wireshark`: capturing real packets
- `curl -v`: reading TLS and HTTP negotiation
- `dig`: tracing DNS resolution
- `netstat` / `ss`: viewing open connections and socket states
- `strace`: tracing system calls
- `htop` + `lsof`: process and file descriptor inspection

---


## 🔨 Projects


### Project 1 — Raw TCP chat server


**Stack:** Go, `net` package, goroutines, `sync.Mutex`


Build a multi-client TCP chat server without any library. Accept connections in a loop. Spawn a goroutine per client. Broadcast messages to all connected clients using a shared slice protected by a mutex. No HTTP. No frameworks. Just raw bytes over TCP.


**Deliverable:** Server runs on port 8080. Multiple telnet clients can connect and see each other's messages in real-time.


**What you'll learn:** What a socket actually is. Why you need concurrency. What happens when a client disconnects mid-write.


### Project 2 — HTTP/1.1 parser from scratch


**Stack:** Go, `bufio.Scanner`, manual string parsing


Read raw bytes from a TCP connection. Parse the HTTP request line, headers, and body by hand. Route to 3 handlers: `GET /`, `GET /hello`, `POST /echo`. Write a valid HTTP response. Test with `telnet` and `curl`.


**Deliverable:** A server that any browser can hit and receive a real HTML response from — written in ~150 lines of Go with zero HTTP libraries.


### Project 3 — DNS query tracer CLI


**Stack:** Go, `golang.org/x/net/dns/dnsmessage`, CLI flags


Write a tool that takes a domain name and traces the full DNS resolution path: stub → recursive → authoritative. Print each hop, the server IP, the TTL, and the response time. Compare results for cached vs uncached lookups.


**Deliverable:** `./dnsTrace google.com` prints the full resolution chain with latency at each step.


---


## ⚠️ Common mistakes


### Mistake 1


**❌ Thinking HTTP is text over a socket.**


HTTP/2 is binary framing. HTTP/3 runs over UDP via QUIC. If you think of HTTP as just ASCII text, you won't understand multiplexing, stream prioritization, or why gRPC requires HTTP/2.


**✅ Mental model:** HTTP is a protocol layered on top of a transport. The transport changes (TCP, QUIC), and so does the framing format. Text is just the human-readable representation of HTTP/1.1.


### Mistake 2


**❌ Ignoring TCP backpressure in high-throughput systems.**


When the receiver's buffer fills up, the sender's TCP window closes. Your write() call blocks. If you don't handle this in your goroutine model, you'll silently lose throughput or deadlock.


**✅ Mental model:** TCP flow control is an end-to-end mechanism. Design your application-layer backpressure to match it.


### Mistake 3


**❌ Treating DNS as instant.**


Every uncached DNS lookup adds 20–120ms. If your microservice calls 5 external APIs, you could have 500ms of DNS overhead on cold starts.


**✅ Mental model:** DNS is a cache with TTLs. Pre-resolve critical hostnames at startup. Use connection pooling to avoid re-resolving on every request.


### Mistake 4


**❌ Skipping TLS internals because 'HTTPS just works'.**


In production, you need to understand certificate rotation, OCSP stapling, mTLS setup, and cipher suite configuration. "Just add HTTPS" breaks when certificates expire or when you need service-to-service auth.


**✅ Mental model:** TLS is an identity + confidentiality system. The certificate is a signed claim about who the server is. Understanding this is mandatory for mTLS, Vault PKI, and service mesh configuration.


---


## 🏢 How real companies solved this


**Cloudflare:** Built their edge network on HTTP/3 + QUIC before it became an RFC. Their engineering blog post on eliminating head-of-line blocking at scale is required reading. They saw 10–15% throughput improvement on mobile connections by switching to QUIC.


**AWS Route 53:** Uses Anycast routing — your DNS query is automatically answered by the nearest AWS PoP, which is why Route 53 resolves in under 1ms for most users globally.


**Google:** Invented QUIC internally to fix TCP head-of-line blocking in Chrome. It was used in production for years before it became the IETF standard HTTP/3 in 2022. This is how to think about working at the frontier: standardize what works.


**Cloudflare Workers:** Each Worker runs in an Isolate (not a container), sharing a single V8 process per edge node. This is only possible because they deeply understand OS process/thread models and could design a safer, lighter-weight isolation model.


---


> ✅ Write test successful — I can update this page now.


## 📝 Detailed notes (deep dive)


> 🎯 **How to study (daily loop):** learn → observe → build → break → debug → write a short post-mortem.


### Day 1–2 — How the internet works (notes)

<details>
<summary>Packets, routing, latency — what’s actually happening</summary>
- **Layers**: L2 frames → L3 packets → L4 TCP/UDP → L7 HTTP/DNS.
- **BGP** picks routes by policy, not shortest path.
- **Latency** = propagation + serialization + queueing + processing.
- **Labs**: `tracert <domain>`, `ping` 3 regions, write a 5-line conclusion.

</details>


### Day 3–4 — TCP vs UDP (notes)

<details>
<summary>Reliability, ordering, and backpressure</summary>
- **TCP**: ordered, reliable **byte stream**; handshake SYN → SYN-ACK → ACK.
- **Flow control** (receiver window) vs **congestion control** (network capacity).
- **UDP**: datagrams; reliability is app-level (e.g., QUIC).
- **Checkpoint**: explain how backpressure becomes slow `write()` + timeouts.

</details>


### Day 8–9 — TLS 1.3 handshake (notes)

<details>
<summary>Identity + encryption + operational realities</summary>
- TLS provides confidentiality + integrity + **server identity** (cert chain).
- Certs expire → hard outages. Missing intermediates → “works on my machine” failures.
- **Lab**: `curl -v https://...` and read issuer + validity dates.
- **Checkpoint**: explain why 0-RTT has replay risk.

</details>


### Day 5–6 — HTTP/1.1 vs HTTP/2 vs HTTP/3 (notes)

<details>
<summary>Framing, multiplexing, head-of-line blocking</summary>
- **HTTP/1.1**: text, limited multiplexing; request-level HOL.
- **HTTP/2**: binary framing + multiplexed streams + HPACK; still TCP HOL on packet loss.
- **HTTP/3**: QUIC over UDP; avoids TCP HOL; better on lossy/mobile networks.
- **Lab**: `curl -v --http2 https://example.com` and note negotiated protocol.

</details>


### Day 10–11 — OS fundamentals (notes)

<details>
<summary>Processes, threads, file descriptors, event loops</summary>
- **FDs** are finite; sockets and DB conns consume them → “too many open files”.
- Event loops (epoll/kqueue) = handle many sockets efficiently.
- **Checkpoint**: explain why “1 thread per connection” collapses under load.

</details>


[[PHASE1_NOTES_MARKER]]


## 📝 Detailed notes completion pass


### Day 7 — DNS resolution (notes)


**Core mental model:** DNS is a distributed, cached naming system. A hostname does not magically become an IP address; it is resolved through local cache, recursive resolvers, root servers, TLD servers, and authoritative nameservers.


**Resolution chain:** Browser/OS stub resolver checks local cache, then asks a recursive resolver. The recursive resolver may ask root, TLD, and authoritative servers before returning the answer. Each answer has a TTL that controls how long it can be cached.


**Records to know:** `A` for IPv4, `AAAA` for IPv6, `CNAME` for aliases, `NS` for delegation, `MX` for mail, and `TXT` for verification/security metadata. Production outages often come from wrong records, bad delegation, low TTL storms, or stale resolver caches.


**Backend relevance:** Cold DNS lookups add latency to outbound calls. Microservices that repeatedly create new clients may pay DNS and TCP/TLS setup again and again. Connection pooling avoids much of this cost.


**Practice:** Run `dig +trace example.com`, identify root/TLD/authoritative hops, then compare answers from `1.1.1.1` and `8.8.8.8`.


### Day 12–13 — Full request lifecycle (notes)


**Core mental model:** A backend request is a chain, and total latency is the sum of every link. Good debugging means locating which link is slow or failing.


**Lifecycle:** User action -> DNS lookup -> TCP connect -> TLS handshake -> HTTP negotiation -> load balancer -> reverse proxy/API gateway -> app handler -> cache/database/downstream service -> response serialization -> network transfer -> client processing.


**Where failures hide:** DNS NXDOMAIN or stale records, SYN timeout, TLS certificate errors, load balancer health checks, connection pool exhaustion, slow database query, retry storms, oversized responses, and client disconnects.


**Backend relevance:** Timeouts should be smaller as calls go deeper into the system. A public API with a 2s timeout should not call a downstream service with a 5s timeout.


**Practice:** Use `curl -v` and write a timeline: DNS, connect, TLS, first byte, total. Then repeat against a slow endpoint and explain the difference.


### Day 14–15 — Network debugging tools (notes)


**Core mental model:** Tools give you visibility at different layers. Do not use logs for everything; use the layer-specific tool that matches the symptom.


**Tool map:** `curl -v` for HTTP/TLS, `dig` for DNS, `tracert` for routing path, `tcpdump`/Wireshark for packets, `ss` or `netstat` for socket state, `lsof` for file descriptors, `strace` for syscalls, and `htop` for CPU/memory/process behavior.


**Common TCP states:** `LISTEN` means waiting for connections. `ESTABLISHED` means active connection. `TIME_WAIT` is normal after close but can indicate churn if excessive. `CLOSE_WAIT` often means the application did not close sockets properly.


**Practice:** Start a local server, connect with multiple clients, inspect listening sockets, established sockets, and open file descriptors. Then kill a client abruptly and observe server behavior.


## Phase 1 mastery checklist

- Explain BGP at a high level without claiming it always chooses shortest path.
- Explain TCP flow control vs congestion control.
- Explain why UDP is useful despite lacking reliability.
- Compare HTTP/1.1, HTTP/2, and HTTP/3 accurately.
- Trace DNS resolution and explain TTL effects.
- Read a TLS certificate chain and explain trust.
- Explain process, thread, virtual memory, and file descriptor basics.
- Use `curl -v`, `dig`, `ss`, `tcpdump`, and `strace` for real debugging.

## 📖 Resources

- _Computer Networks: A Top-Down Approach_ — Kurose & Ross (read Ch 1–3)
- Cloudflare blog: "The QUIC protocol" series
- Julia Evans: "How DNS works" (zine)
- _The Linux Programming Interface_ — Michael Kerrisk (Ch 56–61 for sockets)
- `man 7 tcp` — yes, the man page. Read it.
