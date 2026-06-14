---
source: manual
title: "Phase 1 — Networking & OS Fundamentals"
parent: null
order: 20
icon: "🌐"
---

# Phase 1 — Networking & OS Fundamentals (Detailed Notes in Hinglish)

> **Goal:** Backend code likhne se pehle samajhna hai ki computers aur networks actually communicate kaise karte hain. Latency, reliability, security — sab kuch in fundamentals pe tikta hai.

---

## Day 1–2: How the Internet Works

### Packets kya hain?

Jab tum koi data bhejte ho internet pe (photo, message, API call), toh woh ek saath nahi jaata. Data ko chhote-chhote **packets** mein tod diya jaata hai. Har packet independently travel karta hai network ke through. Destination pe pahunchke woh reassemble hote hain.

**Kyun?** Agar ek bada chunk bhejo aur beech mein fail ho jaye, toh poora data dobara bhejana padega. Packets mein todne se sirf failed packet re-send hota hai. Plus, ek hi wire pe multiple conversations share ho sakti hain (multiplexing).

### Layers — The OSI/TCP-IP model (simple version)

Networking ko layers mein samjho. Har layer apna kaam karti hai:

| Layer | Kya karta hai | Example |
|-------|--------------|---------|
| **L2 — Data Link** | Local network pe frame bhejta hai (MAC address se) | Ethernet, Wi-Fi |
| **L3 — Network** | Packets ko route karta hai across networks (IP address se) | IP, ICMP |
| **L4 — Transport** | Reliable ya fast delivery ensure karta hai | TCP, UDP |
| **L7 — Application** | App-level protocol | HTTP, DNS, gRPC |

**Yaad rakho:** Jab tum `fetch()` likhte ho JS mein, toh tum L7 pe kaam kar rahe ho. Neeche L4 (TCP), L3 (IP), L2 (Ethernet frame) sab automatically handle hota hai. Phase 1 mein hum in sab layers ko samjhenge.

### Routing — Packets path kaise choose karte hain?

Internet pe koi ek fixed path nahi hota. **Routers** decide karte hain ki packet ko aage kahan bhejein. Har router ke paas ek **routing table** hoti hai — "is destination ke liye yeh next hop use karo."

#### BGP (Border Gateway Protocol)

BGP internet ka "postal routing system" hai. ISPs aur large networks (called **Autonomous Systems / AS**) BGP use karte hain apne routes advertise karne ke liye.

**Critical point:** BGP shortest path nahi choose karta. Yeh **policy-based** hai. Iska matlab:
- Business agreements decide karte hain route (peering, transit contracts)
- Ek ISP dusre ISP ka traffic apne network se guzarne de ya na de — yeh BGP policy pe depend karta hai
- Isliye kabhi kabhi packets geographically seedha nahi jaate — woh business route follow karte hain

**Real-world example:** India se US jaane wala packet kabhi kabhi Singapore ya Europe se hokar jaata hai, kyunki ISP ka peering agreement wahan hai.

### ISPs, Hops, aur Traceroute

**ISP tiers:**
- **Tier 1:** Global backbone (Tata Communications, AT&T, NTT) — yeh aapas mein free mein traffic exchange karte hain (peering)
- **Tier 2:** Regional ISPs — Tier 1 se transit khareedti hain
- **Tier 3:** Local ISPs — jo tumhare ghar mein broadband deti hain

**Hop:** Har router jisse packet guzarta hai, woh ek "hop" hai. Typically 10–20 hops hote hain source se destination tak.

**Traceroute** (`traceroute` on Mac/Linux, `tracert` on Windows):
```bash
traceroute google.com
```
Yeh har hop ka IP aur latency dikhata hai. Internally yeh packets bhejta hai increasing TTL (Time To Live) ke saath. Jab TTL 0 hota hai, router "time exceeded" message wapas bhejta hai — isse pata chalta hai ki woh hop kaunsa router tha.

**Lab karo:**
```bash
traceroute google.com
traceroute aws.amazon.com
traceroute cloudflare.com
```
Teen alag destinations pe traceroute karo aur compare karo — kitne hops hain, latency kahan badhti hai, kya koi common hop hai?

### IP Addressing aur CIDR

**IPv4 address:** 32-bit number, 4 octets mein likha jaata hai: `192.168.1.100`

**CIDR (Classless Inter-Domain Routing):**
- `192.168.1.0/24` ka matlab: pehle 24 bits network part hain, baaki 8 bits host part
- `/24` = 256 addresses (192.168.1.0 to 192.168.1.255)
- `/16` = 65,536 addresses
- `/32` = exactly 1 address

**Subnets:** Ek bade network ko chhote networks mein todna. Company ka `10.0.0.0/16` network hai, toh different teams ko different subnets de sakte ho:
- Engineering: `10.0.1.0/24`
- HR: `10.0.2.0/24`
- Production servers: `10.0.10.0/24`

**Private IP ranges (RFC 1918):** Yeh internet pe route nahi hote:
- `10.0.0.0/8`
- `172.16.0.0/12`
- `192.168.0.0/16`

Tumhara ghar ka Wi-Fi `192.168.x.x` deta hai — yeh private hai. NAT (Network Address Translation) inhe public IP mein convert karta hai bahar jaate waqt.

### Latency kyun exist karta hai?

Latency = request bhejne se response milne tak ka time. Iske 4 components hain:

1. **Propagation delay:** Light ki speed finite hai — fiber optic cable mein ~200,000 km/s. Mumbai se New York ~13,000 km hai, toh one-way ~65ms lagega sirf physics ki wajah se. **Isko koi optimize nahi kar sakta.** CDNs isliye kaam karte hain — data ko user ke paas le aao.

2. **Serialization delay:** Packet ko wire pe put karne mein kitna time lagta hai. Yeh bandwidth pe depend karta hai. 1 Gbps link pe 1500-byte packet = ~12 microseconds. Usually negligible.

3. **Queueing delay:** Router ke buffer mein packet wait karta hai apni baari ka. Jab network congested ho, yeh bahut badh jaata hai. **Yeh variable hota hai** — isliye latency spike hota hai peak hours mein.

4. **Processing delay:** Router ko packet ka header read karna, routing decision lena, checksum verify karna. Modern routers mein yeh microseconds mein hota hai.

**Practical takeaway for backend engineers:**
- User Mumbai mein hai aur server US-East mein → minimum ~130ms RTT (round-trip time) sirf propagation se
- Isliye CDN use karo, edge computing karo, ya regional servers deploy karo
- `ping` se RTT measure kar sakte ho:
```bash
ping google.com
ping aws.ap-south-1.amazonaws.com  # Mumbai region
ping aws.us-east-1.amazonaws.com   # Virginia region
```

---

## Day 3–4: TCP vs UDP

### TCP — Transmission Control Protocol

TCP ek **reliable, ordered byte stream** provide karta hai. Matlab:
- Jo data bheja, woh poora pahunchega (ya error milega)
- Jo order mein bheja, usi order mein milega
- Duplicate data filter ho jayega

#### 3-Way Handshake (Connection setup)

Koi bhi data bhejne se pehle, TCP connection establish karta hai:

```
Client                    Server
  |                         |
  |---- SYN (seq=100) ---->|    "Main connect karna chahta hoon"
  |                         |
  |<-- SYN-ACK (seq=300,   |    "Theek hai, main bhi ready hoon"
  |     ack=101) ----------|
  |                         |
  |---- ACK (ack=301) ---->|    "Chalo shuru karte hain"
  |                         |
  |   Connection ESTABLISHED|
```

**Yeh kyun important hai backend ke liye?**
- Har naya TCP connection mein **1 RTT** lagta hai sirf handshake mein (SYN + SYN-ACK + ACK)
- Agar RTT 100ms hai, toh sirf connection banane mein 100ms waste. TLS add karo toh 200ms+
- **Isliye connection pooling use karte hain** — baar baar handshake nahi karna padta
- HTTP keep-alive bhi isi liye hai — ek connection pe multiple requests bhejo

#### Sequence Numbers aur Acknowledgements

Har byte ka ek sequence number hota hai. Receiver acknowledge karta hai ki "mujhe itne bytes mil gaye, ab aage ke bhejo."

```
Client sends: [seq=1000, 500 bytes of data]
Server responds: [ack=1500]  → "Mujhe 1000 se 1499 tak mil gaya, ab 1500 se bhejo"
```

Agar koi packet drop ho jaye, toh receiver ack nahi bhejega uske liye. Sender ko timeout hoga aur woh re-send karega. **Yeh reliability ka core mechanism hai.**

#### Flow Control — Sliding Window

**Problem:** Agar sender bahut fast bheje aur receiver slow ho (busy hai, buffer full hai), toh packets drop honge.

**Solution:** Receiver apna **window size** advertise karta hai — "mere paas itni jagah hai buffer mein."

```
Receiver: "Mera window size 64KB hai"
Sender: 64KB tak ka data bhej sakta hai bina ack ke

Receiver busy ho gaya: "Window size = 0"
Sender: Ruk jao, data bhejne band karo (BACKPRESSURE!)
```

**Backend relevance:** Jab tum Go mein `conn.Write()` karte ho aur receiver ka buffer full hai, toh tumhara `Write()` **BLOCK** ho jayega. Agar tum goroutine mein handle nahi kar rahe, toh tumhara poora server hang ho sakta hai. **Yeh backpressure hai** — aur isko ignore karna production mein deadlock ka common reason hai.

#### Congestion Control (CWND)

Flow control receiver ke liye hai. Congestion control **network** ke liye hai.

**Problem:** Network congested hai (routers ke buffers full). Agar sab log full speed bhejte rahen, toh aur packets drop honge → aur retransmit → aur congestion → **congestion collapse**.

**Solution:** TCP ek **congestion window (CWND)** maintain karta hai:

1. **Slow Start:** Connection naya hai, toh chhota window se shuru karo. Har successful ACK pe window double karo (exponential growth)
2. **Congestion Avoidance:** Jab threshold pe pahuncho, slowly badhao (linear growth)
3. **Packet loss detect hua:** Window drastically kam karo aur phir se slowly badhao

**Backend relevance:**
- Nayi TCP connection pe throughput initially slow hota hai (slow start ki wajah se)
- Long-lived connections better throughput deti hain (CWND already warm hai)
- Yeh ek aur reason hai connection pooling ka

### UDP — User Datagram Protocol

UDP mein koi handshake nahi, koi ordering guarantee nahi, koi reliability nahi. Bas datagram bhejo aur bhool jao.

```
Client                    Server
  |                         |
  |---- Data packet ------->|   Bas. Itna hi.
  |                         |
```

**Kyun use karte hain?**
- **Gaming:** Player ka position update har 16ms aata hai. Agar ek packet drop ho gaya, toh purana position ka koi matlab nahi — naya wala aa jayega. TCP mein purane packet ka wait hoga (head-of-line blocking) aur game lag karega.
- **Video streaming:** Ek frame miss ho gaya toh chalta hai, next frame aa jayega. Latency zyada important hai reliability se.
- **DNS:** Chhota request, chhota response. Handshake ka overhead nahi chahiye. Agar response nahi aaya, client retry kar lega.
- **VoIP:** Real-time voice mein 200ms latency acceptable nahi. TCP ka retransmission wait unacceptable hai.

### Decision Framework: TCP ya UDP?

```
Kya data ka order matter karta hai?
  ├── Haan → TCP (ya application-level ordering over UDP)
  └── Nahi → UDP candidate

Kya har packet zaroori hai?
  ├── Haan → TCP
  └── Nahi (purana data stale ho jaata hai) → UDP

Kya low latency critical hai?
  ├── Haan → UDP (with app-level reliability if needed)
  └── Nahi → TCP

Kya connection setup overhead acceptable hai?
  ├── Haan → TCP
  └── Nahi (small, quick exchanges) → UDP
```

**Modern trend:** QUIC (HTTP/3 ka transport) UDP ke upar built hai, lekin reliability aur ordering application layer pe implement karta hai. Best of both worlds — UDP ki speed + TCP jaisi reliability, lekin without TCP's head-of-line blocking.

---

## Day 5–6: HTTP/1.1 vs HTTP/2 vs HTTP/3

### HTTP/1.1 — The OG

**Format:** Plain text. Human-readable.

```
GET /api/users HTTP/1.1
Host: example.com
Accept: application/json
Connection: keep-alive

```

**Key features:**
- **Text-based:** Headers aur request line plain ASCII text hain
- **Keep-alive:** Ek TCP connection pe multiple requests bhej sakte ho (pehle har request ke liye naya connection banta tha HTTP/1.0 mein)
- **Pipelining (theoretically):** Multiple requests bina response ka wait kiye bhej sakte ho. **Lekin practically koi use nahi karta** kyunki responses order mein aane chahiye

**Problem — Head-of-Line (HOL) Blocking:**

Ek connection pe ek waqt mein ek hi request-response ho sakta hai (practically). Agar pehla response slow hai (bada image), toh baaki sab requests wait karenge.

**Workaround:** Browsers 6-8 parallel TCP connections open karte hain ek domain ke liye. But har connection ka handshake cost hai.

```
Connection 1: GET /style.css  ████████████ (slow)
Connection 2: GET /app.js     ████ (fast, done)
Connection 3: GET /image.png  ████████ (medium)
```

6 connections = 6 separate TCP handshakes + 6 TLS handshakes = bahut overhead.

### HTTP/2 — Binary aur Multiplexed

**Key changes:**

1. **Binary framing:** Headers aur data binary frames mein encode hote hain. Machine ke liye parse karna fast hai. Human-readable nahi hai.

2. **Multiplexing:** Ek hi TCP connection pe **multiple streams** simultaneously chal sakte hain. Har request-response ek stream hai. Frames interleave ho sakte hain.

```
Ek TCP connection:
Stream 1 (CSS):   [HEADER][DATA][DATA]
Stream 2 (JS):    [HEADER][DATA]
Stream 3 (Image): [HEADER][DATA][DATA][DATA]

Wire pe: S1-H, S2-H, S1-D, S3-H, S2-D, S1-D, S3-D, S3-D, S3-D
```

Ab 6 connections ki zaroorat nahi — ek connection kaafi hai!

3. **HPACK header compression:** HTTP headers mein bahut repetition hota hai (same `Host`, `User-Agent`, `Accept` har request mein). HPACK ek shared table maintain karta hai aur sirf changes bhejta hai. **Header size 85-90% tak kam** ho jaata hai.

4. **Server Push:** Server bina client ke request kiye resources bhej sakta hai. Client ne HTML maanga → server CSS aur JS bhi saath mein bhej diya. (Practically zyada use nahi hota, most implementations ne disable kar diya hai.)

**But still ek problem hai — TCP-level HOL blocking:**

HTTP/2 ne application-level HOL blocking solve kar diya (streams independent hain). Lekin sab streams ek hi TCP connection pe hain. Agar **ek TCP packet drop** ho jaye, toh TCP saari streams ko rok dega jab tak woh packet retransmit na ho jaye.

```
TCP packet loss:
Stream 1: [frame] [frame] [LOST PACKET] [frame waiting...]
Stream 2: [frame] [frame blocked by stream 1's lost packet!]
Stream 3: [frame blocked too!]
```

Lossy network (mobile, Wi-Fi) pe yeh problem noticeable hoti hai.

### HTTP/3 — QUIC over UDP

**Core idea:** TCP hi problem hai. Chalo UDP pe apna transport protocol banate hain.

**QUIC (Quick UDP Internet Connections):**
- Google ne banaya, ab IETF standard hai
- UDP ke upar built hai
- Har stream independently reliable hai — ek stream ka packet loss dusri stream ko block nahi karta

```
QUIC pe:
Stream 1: [frame] [frame] [LOST] → sirf stream 1 wait karega
Stream 2: [frame] [frame] → chal rahi hai normally!
Stream 3: [frame] → chal rahi hai normally!
```

**HOL blocking completely solved!**

**Other QUIC benefits:**

1. **0-RTT connection setup:** Agar pehle connect kar chuke ho, toh next time bina handshake ke data bhej sakte ho. TLS + transport ek saath negotiate hota hai.

```
Traditional (TCP + TLS 1.3):
RTT 1: TCP SYN / SYN-ACK
RTT 2: TLS ClientHello / ServerHello
RTT 3: Data
Total: 2 RTT before data

QUIC (first time):
RTT 1: QUIC handshake + TLS (combined)
Total: 1 RTT before data

QUIC (repeat visit, 0-RTT):
RTT 0: Data immediately with cached keys!
Total: 0 RTT!
```

2. **Connection migration:** Phone Wi-Fi se 4G pe switch hua? TCP connection toot jayega (IP change hogi). QUIC mein connection ID hota hai (IP-independent), toh connection survive karta hai.

3. **QPACK:** HPACK jaisa header compression, lekin QUIC streams ke liye designed.

**Lab karo:**
```bash
curl -v --http2 https://example.com
# Output mein dekho: "using HTTP/2" aur "ALPN: h2"

curl -v --http3 https://cloudflare.com
# Agar support hai toh "using HTTP/3" dikhega
```

### HOL Blocking Summary Table

| Version | Transport | Application HOL | Transport HOL |
|---------|-----------|----------------|---------------|
| HTTP/1.1 | TCP | ✅ Yes (one req at a time) | ✅ Yes |
| HTTP/2 | TCP | ❌ No (multiplexed streams) | ✅ Yes (single TCP conn) |
| HTTP/3 | QUIC/UDP | ❌ No | ❌ No (independent streams) |

---

## Day 7: DNS Resolution

### DNS kya hai?

DNS (Domain Name System) internet ka phone book hai. Humans `google.com` yaad rakhte hain, computers `142.250.193.46` samajhte hain. DNS yeh translation karta hai.

### Resolution Chain — Step by Step

Jab tum browser mein `api.example.com` type karte ho:

```
1. Browser cache: "Kya mere paas pehle se answer hai?" 
   → Nahi? ↓

2. OS stub resolver: OS ka local cache check karo
   → Nahi? ↓

3. Recursive resolver (ISP ya 8.8.8.8/1.1.1.1):
   "Main dhundhta hoon tumhare liye"
   → Cache mein nahi hai? ↓

4. Root nameserver (.): "Main .com ke liye responsible nahi hoon,
   yeh raha .com TLD server ka address"
   → ↓

5. TLD nameserver (.com): "Main example.com ke liye responsible nahi,
   yeh raha example.com ka authoritative nameserver"
   → ↓

6. Authoritative nameserver (ns1.example.com):
   "api.example.com ka IP hai 93.184.216.34, TTL 300 seconds"
   → ↑ Answer wapas jaata hai

7. Recursive resolver: Cache kar lo (300 seconds ke liye), client ko bhejo
8. OS: Cache kar lo
9. Browser: Cache kar lo, ab TCP connection banao is IP pe
```

### DNS Record Types

| Record | Kya karta hai | Example |
|--------|--------------|---------|
| **A** | Domain → IPv4 | `example.com → 93.184.216.34` |
| **AAAA** | Domain → IPv6 | `example.com → 2606:2800:220:1:...` |
| **CNAME** | Domain → dusra domain (alias) | `www.example.com → example.com` |
| **NS** | Domain ke nameservers | `example.com → ns1.example.com` |
| **MX** | Mail servers | `example.com → mail.example.com` |
| **TXT** | Arbitrary text (SPF, DKIM, verification) | `example.com → "v=spf1 ..."` |

### TTL (Time To Live)

Har DNS response ke saath TTL aata hai — "itne seconds tak yeh answer valid hai, cache kar lo."

- **High TTL (86400 = 24 hours):** Kam DNS queries, lekin IP change karna slow hoga
- **Low TTL (60 = 1 minute):** Quickly update ho jayega, lekin zyada DNS queries
- **Migration ke time:** Pehle TTL low karo (300s), phir IP change karo, phir TTL wapas badhao

**Negative caching:** Agar domain exist nahi karta (NXDOMAIN), toh woh bhi cache hota hai. Isliye agar tum galat domain configure karo aur fix karo, toh kuch time tak purana (wrong) answer milta rahega.

### DNS over HTTPS (DoH)

Traditional DNS plaintext UDP pe hota hai — ISP, network admin, ya koi bhi beech mein dekh sakta hai ki tum kaunsi websites visit kar rahe ho.

**DoH:** DNS queries HTTPS ke through bhejo (encrypted). ISP nahi dekh sakta. Browsers (Firefox, Chrome) support karte hain.

### Why DNS failure takes down entire services

- DNS down → koi hostname resolve nahi hoga → koi HTTP request nahi jayegi
- Application level pe: `ENOTFOUND` errors everywhere
- **Real incident:** 2021 mein Facebook ka DNS authoritative server unreachable ho gaya (BGP misconfiguration). Facebook, Instagram, WhatsApp — sab down. ~6 hours.
- **Lesson:** DNS infrastructure ko redundant rakho. Multiple NS records, multiple providers (e.g., Route 53 + Cloudflare DNS).

**Practice:**
```bash
dig +trace example.com
dig @1.1.1.1 example.com    # Cloudflare resolver
dig @8.8.8.8 example.com    # Google resolver
dig example.com NS           # Nameservers dekho
dig example.com MX           # Mail servers dekho
```

---

## Day 8–9: TLS 1.3 Handshake Internals

### Encryption Basics

#### Symmetric encryption
- Ek hi key se encrypt aur decrypt
- Fast hai (AES-256 billion operations/sec handle karta hai)
- **Problem:** Key safely kaise share karein?

#### Asymmetric encryption (Public-key cryptography)
- Do keys: public key (sabko do) + private key (sirf tumhare paas)
- Public key se encrypt → sirf private key se decrypt ho sakta hai
- Slow hai symmetric se (1000x slower)
- **Use:** Key exchange ke liye. Actual data symmetric encryption se encrypt hota hai.

### Certificate Chains aur Root CAs

**Problem:** Tum `bank.com` se connect ho rahe ho. Kaise pata chalega ki woh actually bank.com hai aur koi attacker nahi?

**Solution:** Digital Certificates.

```
Root CA (pre-installed in OS/browser)
  ↓ signs
Intermediate CA
  ↓ signs
bank.com certificate (contains bank.com's public key)
```

1. `bank.com` ka certificate uski public key + identity info rakhta hai
2. Yeh certificate ek **Certificate Authority (CA)** ne sign kiya hai (e.g., Let's Encrypt, DigiCert)
3. CA ki certificate ek **Root CA** ne sign ki hai
4. Root CA ki certificates tumhare OS/browser mein pre-installed hain (**trust store**)

**Trust chain:** Browser root CA ko trust karta hai → root CA ne intermediate ko sign kiya → intermediate ne bank.com ko sign kiya → bank.com trusted hai!

### TLS 1.3 Handshake (1 RTT)

```
Client                              Server
  |                                    |
  |--- ClientHello ------------------>|
  |    - Supported cipher suites       |
  |    - Key share (DH public key)     |
  |    - Supported TLS versions        |
  |                                    |
  |<-- ServerHello -------------------|
  |    - Chosen cipher suite           |
  |    - Key share (DH public key)     |
  |    - {Certificate}                 |
  |    - {CertificateVerify}           |
  |    - {Finished}                    |
  |                                    |
  |--- {Finished} ------------------->|
  |                                    |
  |=== Encrypted data flowing ========|
```

**Sirf 1 RTT!** Client aur server ek round-trip mein key exchange + authentication dono kar lete hain.

**Key insight:** TLS 1.3 mein cipher suite negotiation + key exchange **simultaneously** hota hai (client pehle hi DH key share bhej deta hai). TLS 1.2 mein pehle negotiate karo, phir key exchange — isliye 2 RTT lagta tha.

### 0-RTT Session Resumption

Agar pehle connect kar chuke ho, toh TLS 1.3 mein **0-RTT** possible hai:
- Client cached keys use karke data **pehli hi packet** mein bhej sakta hai
- Server bina handshake complete kiye data process kar sakta hai

**Lekin DANGER — Replay Attack Risk:**
- Attacker 0-RTT data capture karke dobara bhej sakta hai
- Server ko duplicate request milegi
- **Isliye 0-RTT sirf idempotent requests (GET) ke liye use karo, never for POST/mutations**

### TLS 1.2 vs 1.3 Comparison

| Feature | TLS 1.2 | TLS 1.3 |
|---------|---------|---------|
| Handshake RTT | 2 | 1 |
| 0-RTT support | No | Yes (with caveats) |
| Cipher suites | Many (some weak) | Only 5 strong ones |
| Forward secrecy | Optional | Mandatory |
| RSA key exchange | Supported | Removed (not forward-secret) |

**Forward secrecy** ka matlab: agar server ki private key compromise ho jaye future mein, toh past conversations decrypt nahi ho sakti. TLS 1.3 mein yeh mandatory hai (Diffie-Hellman key exchange).

### Production mein kya jaanna zaroori hai

- **Certificate expiry:** Let's Encrypt certificates 90 days mein expire hoti hain. Auto-renewal setup karo (certbot). Certificate expire hone se **hard outage** hota hai — browser connection refuse kar dega.
- **Intermediate certificate missing:** "Works on my machine" problem. Chrome ko intermediate mil jaati hai (AIA fetching), lekin curl/Java client ko nahi milti. **Always full chain serve karo.**
- **mTLS (Mutual TLS):** Client bhi certificate present karta hai. Service-to-service auth ke liye use hota hai (Kubernetes, service mesh).
- **OCSP Stapling:** Server certificate revocation status khud check karke client ko batata hai, taaki client ko separately CA se check na karna pade.

**Lab:**
```bash
curl -v https://google.com 2>&1 | grep -E "SSL|TLS|subject|issuer|expire"
# Certificate chain, TLS version, cipher suite sab dikhega

openssl s_client -connect google.com:443 -showcerts
# Full certificate chain with details
```

---

## Day 10–11: OS Fundamentals

### Process vs Thread

#### Process
- Ek running program = ek process
- Apna **isolated memory space** (virtual address space)
- Ek process dusre process ki memory directly access nahi kar sakta
- Process create karna (fork) **expensive** hai — poora address space copy hota hai (copy-on-write optimization hoti hai lekin phir bhi costly)

#### Thread
- Ek process ke andar multiple threads ho sakte hain
- Threads **memory share** karte hain (same address space)
- Thread create karna process se **sasta** hai
- **Lekin:** Shared memory = race conditions, deadlocks. Isliye locks (mutex) chahiye.

#### Context Switch
Jab OS ek process/thread se dusre pe switch karta hai:
1. Current state save karo (registers, program counter)
2. New state load karo
3. TLB flush (for process switch, not thread switch)

**Cost:** ~1-10 microseconds. Agar hazaaron threads hain, toh context switching ka overhead significant ho jaata hai.

**Backend relevance:** "1 thread per connection" model mein 10,000 connections = 10,000 threads = bahut context switching = **C10K problem**.

### Virtual Memory

**Problem:** Har process ko lagta hai ki uske paas poora memory space hai (4GB on 32-bit, 128TB+ on 64-bit). Physical RAM itni nahi hai.

**Solution:** Virtual memory. OS ek **mapping** maintain karta hai virtual addresses se physical addresses tak.

#### Pages aur Page Faults
- Memory **pages** mein divided hoti hai (typically 4KB)
- **Page table:** Virtual page → Physical frame mapping
- **Page fault:** Process ne ek virtual address access kiya jiska physical frame RAM mein nahi hai → OS disk se load karta hai (swap) → **SLOW** (milliseconds vs nanoseconds)

**MMU (Memory Management Unit):** Hardware component jo virtual → physical translation karta hai. TLB (Translation Lookaside Buffer) cache rakhta hai recent translations ka.

**Backend relevance:**
- Agar server ki RAM full hai aur swapping ho rahi hai → **massive latency spikes**
- Production mein swap off karna common practice hai (databases especially)
- OOM Killer: Linux mein jab memory khatam hoti hai, kernel ek process ko kill kar deta hai

### File Descriptors — "Everything is a file"

Unix mein almost everything ek file descriptor (FD) hai:
- Regular files
- Sockets (TCP connections)
- Pipes
- stdin (0), stdout (1), stderr (2)

**FDs finite hain!** Default limit usually 1024 per process.

```bash
ulimit -n        # Current FD limit dekho
lsof -p <pid>    # Ek process ke open FDs dekho
```

**Backend relevance:**
- Har TCP connection = 1 FD
- Har DB connection = 1 FD
- Har open file = 1 FD
- 1000 concurrent connections + 50 DB connections + log files = easily 1100+ FDs
- "Too many open files" error → FD limit badhaao (`ulimit -n 65535`)

### epoll / kqueue — Event Loops ka secret

**Problem:** 10,000 TCP connections hain. Kaise pata chalega ki kin connections pe data available hai padne ke liye?

**Naive approach:** Har connection pe ek thread. 10K threads = bahut memory + context switching = C10K problem.

**Better approach (select/poll):** OS ko list do saari connections ki. OS batayega kaunsi ready hain. **Lekin:** Har baar poori list scan karni padti hai — O(n). 10K connections pe slow.

**Best approach (epoll on Linux, kqueue on macOS):**
- Register karo connections ek baar
- OS batayega **sirf ready connections** — O(1) per event
- Ek thread thousands of connections handle kar sakta hai

**Yeh hai event-driven architecture ka foundation:**
- Node.js ka event loop → libuv → epoll/kqueue
- Go ka runtime → netpoller → epoll/kqueue
- Nginx → epoll-based
- Redis → single-threaded + epoll

### C10K Problem

**2000s era ka problem:** Ek server pe 10,000 concurrent connections kaise handle karein?

**Thread-per-connection model failure:**
- 10K threads × 1MB stack per thread = 10GB RAM sirf stacks ke liye
- Context switching overhead = CPU time waste
- Lock contention = performance collapse

**Solution:** Event-driven I/O (epoll/kqueue) + small thread pool
- Ek thread pe thousands of connections monitor karo
- Sirf jab data ready ho, tab process karo
- Non-blocking I/O

**Modern context:** Ab C10M (10 million) ki baat hoti hai. Same principles, better hardware.

---

## Day 12–13: Full Request Lifecycle

### Complete Chain — Jab User Button Click Karta Hai

```
User clicks "Submit" button
        ↓
1. JavaScript fetch("/api/submit", {method: "POST", body: data})
        ↓
2. DNS Lookup: "/api/submit" → api.example.com → IP address
   [0-100ms, cached toh ~0ms]
        ↓
3. TCP Connect: SYN → SYN-ACK → ACK
   [1 RTT = ~20-200ms depending on distance]
        ↓
4. TLS Handshake: ClientHello → ServerHello → Finished
   [1 RTT for TLS 1.3 = ~20-200ms]
        ↓
5. HTTP Request bhejo: POST /api/submit with headers + body
        ↓
6. Load Balancer: Request receive karo, healthy backend choose karo
   [<1ms usually]
        ↓
7. Reverse Proxy / API Gateway: Rate limiting, auth check, routing
   [1-5ms]
        ↓
8. App Server: Request handler execute karo
   - Parse request body
   - Validate input
   - Business logic
   [5-50ms]
        ↓
9. Database Query: SELECT/INSERT/UPDATE
   [1-100ms+ depending on query]
        ↓
10. Response build karo: JSON serialize, headers set
        ↓
11. Response wapas bhejo: same TCP connection pe
        ↓
12. Client: Response parse karo, UI update karo
```

**Total latency (typical):** 50-500ms, depending on:
- Geographic distance (propagation)
- Connection reuse (new vs existing)
- Database query complexity
- Payload size

### Har Step Pe Failure Kaise Hoti Hai

| Step | Failure | Symptom |
|------|---------|---------|
| DNS | NXDOMAIN, timeout | `ENOTFOUND`, connection fails before starting |
| TCP | SYN timeout, RST | `ECONNREFUSED`, `ETIMEDOUT` |
| TLS | Cert expired, mismatch | `CERT_HAS_EXPIRED`, browser warning |
| Load Balancer | All backends unhealthy | 502 Bad Gateway, 503 Service Unavailable |
| App Server | Crash, OOM | 500 Internal Server Error |
| Database | Connection pool full, slow query | Timeout, 504 Gateway Timeout |

### Timeout Design Principle

```
Public API timeout: 2 seconds
  ↓ calls
Service A timeout: 1.5 seconds
  ↓ calls
Service B timeout: 1 second
  ↓ calls
Database timeout: 500ms
```

**Rule:** Inner services ka timeout outer se CHHOTA hona chahiye. Warna outer timeout ho jayega aur inner abhi bhi kaam kar raha hoga (resource waste).

### Practice Lab

```bash
# Har step ka timing dekho:
curl -w "\nDNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTLS: %{time_appconnect}s\nFirst byte: %{time_starttransfer}s\nTotal: %{time_total}s\n" -o /dev/null -s https://api.github.com

# Sample output:
# DNS: 0.012s
# Connect: 0.045s
# TLS: 0.098s
# First byte: 0.234s
# Total: 0.235s
```

Yeh command tumhe har step ki latency dikhayegi. Isko different URLs pe try karo — nearby server vs far server. Difference note karo.

---

## Day 14–15: Network Debugging Tools

### Tool Map — Kab Kya Use Karein

```
Symptom                          → Tool
"Site nahi khul raha"            → ping, dig, curl -v
"Connection slow hai"            → traceroute, curl -w (timing)
"TLS error aa raha hai"          → curl -v, openssl s_client
"DNS resolve nahi ho raha"       → dig, nslookup
"Packets drop ho rahe hain"      → tcpdump, wireshark
"Too many open files"            → lsof, ulimit -n
"Process hang hai"               → strace, htop
"Socket states check karne hain" → ss, netstat
```

### curl -v — HTTP/TLS debugging

```bash
curl -v https://example.com
```
Output mein dikhega:
- DNS resolution (`Trying 93.184.216.34...`)
- TCP connect (`Connected to example.com`)
- TLS handshake (protocol, cipher, certificate chain)
- HTTP request headers (`> GET / HTTP/2`)
- HTTP response headers (`< HTTP/2 200`)

**Timing ke saath:**
```bash
curl -w "DNS:%{time_namelookup} TCP:%{time_connect} TLS:%{time_appconnect} Total:%{time_total}\n" -o /dev/null -s https://example.com
```

### dig — DNS debugging

```bash
dig example.com              # Basic A record query
dig +trace example.com       # Full resolution chain (root → TLD → auth)
dig @8.8.8.8 example.com    # Specific resolver use karo
dig example.com ANY          # Saare records dekho
dig +short example.com       # Sirf answer
```

**+trace output samjho:**
```
.                     → Root server ne bataya .com ka NS
.com.                 → TLD server ne bataya example.com ka NS  
example.com.          → Authoritative ne bataya IP = 93.184.216.34
```

### tcpdump — Packet capture

```bash
# Ek interface pe saare packets capture karo
sudo tcpdump -i en0

# Sirf ek host ke packets
sudo tcpdump host 93.184.216.34

# Sirf TCP SYN packets (connection attempts)
sudo tcpdump 'tcp[tcpflags] & tcp-syn != 0'

# File mein save karo (baad mein Wireshark mein kholo)
sudo tcpdump -w capture.pcap
```

**Wireshark:** GUI tool, pcap file kholo aur visually packets analyze karo. Filters lagao, TCP streams follow karo, retransmissions dekho.

### ss / netstat — Socket states

```bash
ss -tlnp    # TCP listening sockets with process info
ss -tnp     # Established TCP connections
ss -s       # Summary (total sockets, states)
```

**Important TCP states:**
- `LISTEN` — Server wait kar raha hai connections ke liye
- `ESTABLISHED` — Active connection
- `TIME_WAIT` — Connection close hua, 2×MSL wait (normal, but excessive = connection churn)
- `CLOSE_WAIT` — Remote ne close kiya, local ne abhi nahi — **bug indicator!** Application ne socket close nahi kiya

```bash
# TIME_WAIT connections count karo
ss -tn state time-wait | wc -l

# CLOSE_WAIT connections (potential leak!)
ss -tn state close-wait | wc -l
```

### strace — System call tracing

```bash
strace -p <pid>              # Running process ke syscalls trace karo
strace -e trace=network curl https://example.com  # Sirf network syscalls
strace -e trace=open,read,write -p <pid>          # File operations
strace -c -p <pid>           # Syscall summary (counts + time)
```

**Kab use karo:** Process hang hai, ya slow hai, aur logs se pata nahi chal raha ki kyun. Strace exactly batayega ki process kaunse syscalls pe block hai.

### lsof — Open files/sockets

```bash
lsof -p <pid>                # Process ke saare open files/sockets
lsof -i :8080                # Port 8080 pe kya chal raha hai
lsof -i TCP                  # Saare TCP connections
```

### htop — Process monitoring

- CPU usage per core
- Memory usage (RES = actual RAM, VIRT = virtual)
- Thread count
- Process tree view (parent-child relationship)

**Pro tip:** Sort by memory (M) ya CPU (P) for quick diagnosis. `Shift+H` to hide/show threads.

---

## Projects Quick Reference

### Project 1: Raw TCP Chat Server (Go)

**Concept:** `net.Listen("tcp", ":8080")` se server banao. `listener.Accept()` loop mein naye clients accept karo. Har client ke liye goroutine spawn karo. Ek shared `[]net.Conn` slice mein saare connections rakho. Jab koi message aaye, broadcast karo sabko. `sync.Mutex` se slice protect karo.

**Test:** Multiple terminals mein `telnet localhost 8080` se connect karo.

### Project 2: HTTP/1.1 Parser from Scratch (Go)

**Concept:** TCP connection se raw bytes padho. `bufio.Scanner` se line-by-line read karo. Pehli line parse karo: `GET /path HTTP/1.1`. Headers parse karo (`Key: Value`). Empty line ke baad body hai. Response manually likho: `HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<h1>Hello</h1>`.

### Project 3: DNS Query Tracer CLI (Go)

**Concept:** Root servers se start karo (`198.41.0.4` etc.). DNS query bhejo, NS records follow karo TLD tak, phir authoritative tak. Har hop ka IP, response time, TTL print karo.

---

## Real-World Company Examples (Summary)

| Company | Kya kiya | Lesson |
|---------|----------|--------|
| **Cloudflare** | HTTP/3 + QUIC early adopt kiya | Mobile pe 10-15% throughput improvement. HOL blocking eliminate kiya. |
| **AWS Route 53** | Anycast routing for DNS | Nearest PoP se DNS resolve hota hai. <1ms globally. |
| **Google** | QUIC internally banaya, phir IETF standard bana | Innovation internally karo, phir standardize karo. |
| **Cloudflare Workers** | V8 Isolates (not containers) | OS fundamentals samajhne se lighter-weight isolation possible hua. |
| **Facebook (2021)** | BGP misconfiguration → DNS down → everything down | DNS = single point of failure. Redundancy mandatory. |

---

## Mastery Checklist

- [ ] BGP policy-based hai, shortest path nahi — explain kar sako
- [ ] TCP flow control (receiver window) vs congestion control (CWND) — difference clear hai
- [ ] UDP kyun useful hai bina reliability ke — examples de sako
- [ ] HTTP/1.1 vs 2 vs 3 — HOL blocking har version mein kaise change hua
- [ ] DNS resolution chain trace kar sako — `dig +trace` se
- [ ] TLS certificate chain samjho — trust kaise establish hota hai
- [ ] Process vs thread vs file descriptor — OS level pe clear hai
- [ ] `curl -v`, `dig`, `ss`, `tcpdump`, `strace` — hands-on use kiya hai
- [ ] Full request lifecycle — har step ki latency aur failure modes pata hain
- [ ] Backpressure, connection pooling, timeout design — production relevance clear hai
