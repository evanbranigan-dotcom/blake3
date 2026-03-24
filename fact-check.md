# BLAKE3 vs SHA-256 Site — Fact-Check

Every factual claim on the site, with assessment and sourcing.

### Rating Key
- **TRUE** — Accurate, well-sourced
- **TRUE (nuanced)** — Correct but deserves qualification
- **MISLEADING** — Contains truth but framing distorts it
- **DEBATABLE** — Reasonable people/experts disagree
- **FALSE** — Factually incorrect

---

## Hero Section

### 1. SHA-256 is used for passwords, certificates, blockchains, and file verification.
**TRUE.** All four uses are well-documented. TLS certificates use SHA-256 signatures; Bitcoin uses double-SHA-256; PBKDF2-SHA-256 is used in password systems; checksums for file verification are ubiquitous.
> NIST FIPS 180-4; RFC 6234; Bitcoin whitepaper (Nakamoto, 2008)

### 2. SHA-256 was designed before the first iPhone existed.
**TRUE.** SHA-256 was published in 2001 (FIPS 180-2). The first iPhone was announced January 2007, released June 2007.
> NIST FIPS 180-2 (August 2002, describing work from 2001); Apple iPhone announcement (Macworld, Jan 9, 2007)

### 3. There is a faster, more secure alternative (BLAKE3).
**DEBATABLE.** "Faster" is well-supported — BLAKE3 benchmarks faster than SHA-256 in software across virtually all platforms (the BLAKE3 paper reports 4x+ over SHA-256 on x86). "More secure" is contentious. BLAKE3 and SHA-256 have the same output size (256 bits) and the same collision resistance (128-bit birthday bound). BLAKE3 avoids structural weaknesses (length extension, Merkle-Damgard generic attacks), but SHA-256 has survived 25 years of intense cryptanalysis with no practical attacks. Many cryptographers would say BLAKE3 has *better structural properties* rather than being *more secure* overall. The shorter track record cuts the other way.
> BLAKE3 paper (O'Connor et al., 2020); NIST hash function status reports

---

## Two Eras Section

### SHA-256 Card

### 4. SHA-256 was designed in 2001.
**TRUE.** SHA-256 was first specified in FIPS 180-2, drafted in 2001 and formally published August 2002.
> NIST FIPS 180-2 (2002)

### 5. SHA-256 was designed by the NSA.
**TRUE.** The SHA-2 family (including SHA-256) was designed by the National Security Agency and published by NIST.
> NIST FIPS 180-2; multiple public NIST acknowledgments

### 6. SHA-256 was published by NIST.
**TRUE.** Published as part of Federal Information Processing Standard (FIPS) 180-2, later updated in FIPS 180-4.
> NIST FIPS 180-4 (2015)

### 7. SHA-256 was built for an era of single-core processors.
**TRUE (nuanced).** In 2001, consumer CPUs were single-core (Intel Pentium 4, AMD Athlon). The first mainstream dual-core x86 chips arrived in 2005 (Pentium D, Athlon 64 X2). SHA-256's sequential Merkle-Damgard design reflects the era, though it's unclear whether parallelism was a design goal — security and standardization were the priorities.
> Intel/AMD product histories; Merkle-Damgard construction (Merkle, 1979; Damgard, 1989)

### 8. SHA-256 processes blocks sequentially — each block must wait for the previous one.
**TRUE.** This is inherent to the Merkle-Damgard construction: the chaining value from block N is an input to block N+1.
> Any cryptography textbook covering Merkle-Damgard; FIPS 180-4 Section 6.2

### 9. SHA-256 can only use one core, no matter how many you have.
**TRUE (nuanced).** For hashing a *single message*, this is correct — the sequential dependency chain means one core does all the work. However, you can hash *multiple independent messages* in parallel across cores, and tree-hashing modes built on top of SHA-256 do exist (though they're non-standard).
> Inherent to Merkle-Damgard; see also SHA-256 tree hashing in various academic proposals

### 10. SHA-256 can't be parallelized.
**MISLEADING.** For a single message hash, correct — the Merkle-Damgard chain is inherently sequential. But the flat statement "can't parallelize" omits that: (a) multiple independent hashes can run in parallel, and (b) non-standard tree-hashing constructions on top of SHA-256 do exist. The site's context (the architecture diagram) makes it clear this refers to single-message hashing, but the trait list bullet is unqualified.
> Merkle-Damgard construction properties

### 11. SHA-256 needs hardware acceleration to stay fast.
**MISLEADING.** SHA-256 is reasonably fast in pure software — ~200–500 MB/s on modern CPUs without SHA-NI extensions. With Intel SHA-NI or ARM Crypto Extensions, it reaches ~2–4 GB/s. SHA-256 doesn't *need* hardware acceleration to be useful; it needs it to compete with BLAKE3's software speed. The phrasing implies SHA-256 is slow without acceleration, which overstates the case.
> OpenSSL benchmarks; Intel SHA Extensions documentation; ARM Architecture Reference Manual

### 12. SHA-256 is vulnerable to length extension attacks.
**TRUE.** This is a well-known, well-documented property of all Merkle-Damgard hashes with no output truncation. Given H(m) and |m|, an attacker can compute H(m || padding || m') without knowing m.
> Duong & Rizzo (2009); multiple CVEs; any modern cryptography textbook

### 13. SHA-256 is 25 years old.
**TRUE** (as of 2026). Designed 2001, published 2002. The "25 years old" count from the design date is reasonable.

---

### BLAKE3 Card

### 14. BLAKE3 was designed in 2020.
**TRUE.** The BLAKE3 paper and reference implementation were published on January 9, 2020.
> "BLAKE3: one function, fast everywhere" (O'Connor, Aumasson, Neves, Wilcox-O'Hearn, 2020)

### 15. BLAKE3 was designed by Jack O'Connor, Jean-Philippe Aumasson, Samuel Neves, and Zooko Wilcox-O'Hearn.
**TRUE.** These are the four authors listed on the BLAKE3 paper and specification.
> BLAKE3 paper (2020); https://github.com/BLAKE3-team/BLAKE3

### 16. BLAKE3 uses a parallel tree structure.
**TRUE.** BLAKE3 uses a binary Merkle tree built from 1 KiB input chunks, enabling parallel processing of chunks.
> BLAKE3 specification, Section 5

### 17. All blocks are processed simultaneously.
**TRUE (nuanced).** The leaf chunks (1 KiB each) can all be processed independently in parallel. However, the parent nodes in the Merkle tree still require their children to complete first, so it's not *entirely* simultaneous — it's parallel at the leaf level with a log-depth merge. This is still massively parallel compared to SHA-256's fully sequential chain.
> BLAKE3 specification

### 18. More cores = more speed, linearly.
**TRUE (nuanced).** The BLAKE3 paper demonstrates near-linear scaling with core count for large inputs. For small inputs, parallelization overhead (thread spawning, synchronization) means scaling is sub-linear. "Linearly" is an idealization that holds well for large data but not for small data. The site's own benchmark demonstrates this — multi-core is *slower* at 1 KB due to Web Worker overhead.
> BLAKE3 paper, Figure 2 (scaling benchmarks)

### 19. BLAKE3 scales with every core.
**TRUE (nuanced).** Same qualification as #18 — true for sufficiently large inputs. For tiny inputs, adding cores adds overhead without benefit.

### 20. BLAKE3 is fast in pure software, no hardware needed.
**TRUE.** BLAKE3 was explicitly designed to be fast without dedicated hardware instructions. On x86, it leverages SIMD (SSE2/AVX2/AVX-512) which are general-purpose vector instructions present on all modern CPUs, not crypto-specific hardware. On ARM without NEON, it's still fast relative to SHA-256.
> BLAKE3 paper; reference implementation benchmarks

### 21. BLAKE3 is immune to length extension attacks.
**TRUE.** BLAKE3 uses domain separation flags and a finalization flag in each compression call. The internal state cannot be extended because the output is derived from a finalized root node, not a raw chaining value.
> BLAKE3 specification, Section 5.1 (flags and finalization)

### 22. BLAKE3 supports verified streaming.
**TRUE.** The Merkle tree structure allows verifying individual chunks against the root hash without possessing the entire file. This is called "verified streaming" or "incremental verification" in the BLAKE3 documentation.
> BLAKE3 specification; Bao project (https://github.com/oconnor663/bao) which implements verified streaming on BLAKE3

## SHA-256 Weaknesses Section

### 23. No one has found collisions in SHA-256.
**TRUE.** As of 2026, no collision has been found for full-round SHA-256. The best published attacks are reduced-round attacks (up to ~31 of 64 rounds). SHA-256's collision resistance remains intact.
> Stevens et al., various reduced-round SHA-256 attacks; NIST hash function status page

### 24. SHA-256's architecture has six known weaknesses.
**MISLEADING.** The site lists six items, but conflates different categories: two are genuine security weaknesses of Merkle-Damgard (length extension, multicollision/herding), two are performance limitations (sequential processing, no verified streaming), one is a design limitation (no domain separation), and one applies equally to all hash functions (quantum). Calling all six "weaknesses" in SHA-256's "architecture" overstates the case — sequential processing and lack of verified streaming are feature gaps, not security flaws.

### Weakness 01: Length Extension Attacks

### 25. If you know SHA-256(message) and the message length, you can compute SHA-256(message + attacker_data) without knowing the original message.
**TRUE.** This is a well-documented, mathematically proven property of all untruncated Merkle-Damgard hashes. The attacker appends padding + new data and continues the compression function from the leaked internal state.
> Duong & Rizzo (2009); Schneier, "Applied Cryptography"; RFC 6234

### 26. Severity labeled "Exploitable."
**TRUE (nuanced).** Length extension is exploitable *when SHA-256 is misused* — specifically when used as H(secret || message) for authentication. Properly constructed protocols (HMAC-SHA-256, HKDF) are immune. The label is accurate for the naive construction but could imply SHA-256 is broadly broken in practice, which it isn't.

### 27. Real-world exploits: Flickr API (2009).
**TRUE.** Thai Duong and Juliano Rizzo demonstrated a length extension attack against the Flickr API's authentication scheme in 2009, which used a vulnerable H(secret || params) construction.
> Duong & Rizzo, "Flickr's API Signature Forgery Vulnerability" (2009)

### 28. Real-world exploits: early AWS signature schemes.
**UNVERIFIED.** AWS Signature Version 2 used HMAC-SHA-256 (or HMAC-SHA-1), which is not vulnerable to length extension. I cannot confirm that any AWS signature scheme was specifically exploited via length extension. This may be conflating AWS with other API providers that used naive H(key||msg) constructions. If a source exists, it should be cited.

### 29. Real-world exploits: custom MAC constructions using SHA-256(key || msg).
**TRUE.** H(key || message) as a MAC is the canonical textbook example of length extension vulnerability. Numerous real-world implementations have made this mistake.
> Bellare, Canetti, Krawczyk, "Keying Hash Functions for Message Authentication" (1996); numerous CTF writeups and CVEs

### 30. BLAKE3 uses a finalization flag that seals the output.
**TRUE.** The BLAKE3 compression function accepts a flags parameter including ROOT and CHUNK_END flags. The root node's output is computed with a special finalization that prevents state continuation.
> BLAKE3 specification, Section 5.1

### 31. BLAKE3 is structurally immune to length extension — no state leaks through the hash.
**TRUE.** The output comes from a finalized root node in a Merkle tree. There is no intermediate chaining value exposed that could be continued.
> BLAKE3 specification

### Weakness 02: Merkle-Damgard Weaknesses

### 32. SHA-256's underlying construction (Merkle-Damgard) has multiple proven theoretical vulnerabilities beyond length extension.
**TRUE.** Multicollisions (Joux), herding attacks (Kelsey & Kohno), and long-message second preimage attacks (Kelsey & Schneier) are all proven generic attacks against Merkle-Damgard constructions.
> Joux (2004); Kelsey & Kohno (2006); Kelsey & Schneier (2005)

### 33. Joux showed finding 2^k collisions costs only k times more than finding one pair — far less than expected for an ideal hash.
**TRUE.** Joux's 2004 result demonstrates that for an n-bit iterated hash, 2^k colliding messages can be found in approximately k × 2^(n/2) work, rather than the 2^(k×n/2) expected for a random oracle. This is a fundamental weakness of the Merkle-Damgard structure.
> Joux, "Multicollisions in Iterated Hash Functions. Application to Cascaded Constructions," CRYPTO 2004

### 34. This is attributed to Joux '04.
**TRUE.** The paper was presented at CRYPTO 2004.
> CRYPTO 2004 proceedings

### 35. Herding attacks are a weakness of Merkle-Damgard.
**TRUE.** Kelsey and Kohno demonstrated the "Nostradamus attack" — a herding attack that exploits Merkle-Damgard structure to commit to a hash value before the message is known, then construct a message that matches.
> Kelsey & Kohno, "Herding Hash Functions and the Nostradamus Attack," Eurocrypt 2006

### 36. Long-message second preimage attacks are a weakness of Merkle-Damgard.
**TRUE.** Kelsey and Schneier showed that for messages of 2^k blocks, second preimages can be found in roughly 2^(n-k) work instead of the expected 2^n — exponentially cheaper for long messages.
> Kelsey & Schneier, "Second Preimages on n-bit Hash Functions for Much Less than 2^n Work," Eurocrypt 2005

### 37. BLAKE3 is built on a Merkle tree, not a Merkle-Damgard chain.
**TRUE.** BLAKE3 processes input as 1 KiB chunks, each compressed independently, then combined via a binary Merkle tree.
> BLAKE3 specification

### 38. Each node in BLAKE3 is independent.
**TRUE (nuanced).** Leaf nodes (chunks) are independent of each other. Parent nodes depend on their two children but are independent of other parents at the same tree level. The claim is essentially correct — the key property is that chunks don't depend on each other, unlike Merkle-Damgard blocks.

### 39. The Merkle tree construction eliminates these classes of attacks.
**TRUE (nuanced).** The tree structure eliminates the specific generic attacks that exploit the sequential chaining in Merkle-Damgard (multicollisions via Joux, herding, long-message second preimage). Tree hashing has its own security proofs and considerations, but the M-D-specific attack classes listed don't apply.
> BLAKE3 paper, security discussion

### Weakness 03: Sequential-Only Processing

### 40. Every SHA-256 block depends on the output of the previous block.
**TRUE.** Same as claim #8. Inherent to Merkle-Damgard.

### 41. "Your phone has 6 cores. Your laptop has 8-16."
**TRUE (nuanced).** Modern iPhones have 6 CPU cores (2 performance + 4 efficiency) since the A11 Bionic (2017). Modern laptops: Apple M-series have 8–12 cores; Intel/AMD laptops commonly 8–16 cores (some workstation chips go higher). The ranges are reasonable generalizations for a 2025–2026 audience.

### 42. SHA-256 uses exactly one core.
**TRUE (nuanced).** Same qualification as claim #9 — true for a single message hash. The word "exactly" is accurate for the single-hash case.

### 43. BLAKE3 tree structure means all chunks process simultaneously.
**TRUE (nuanced).** Same as claim #17.

### 44. More cores = proportionally faster, linearly.
**TRUE (nuanced).** Same as claim #18 — near-linear for large inputs, sub-linear for small inputs.

### Weakness 04: No Built-in Domain Separation

### 45. SHA-256 uses the same algorithm regardless of purpose (MAC, KDF, PRF all identical).
**TRUE.** SHA-256 is a single function with no mode parameter, context string, or domain separation flag. The same compression function executes identically whether used for hashing, MAC, KDF, or PRF. Different use cases require wrapper constructions (HMAC, HKDF, etc.).
> FIPS 180-4 (defines one function with no mode parameter)

### 46. Using SHA-256(key || message) as a MAC is broken by length extension.
**TRUE.** This is the textbook example. An attacker who knows H(key || msg) and len(key || msg) can forge H(key || msg || padding || evil_data) without knowing the key.
> Standard cryptography references; Bellare, Canetti, Krawczyk (1996)

### 47. HMAC-SHA-256 is a workaround — two nested hashes because the primitive can't do it alone.
**TRUE (nuanced).** Factually accurate: HMAC computes H(K' XOR opad || H(K' XOR ipad || msg)), requiring two hash calls. Calling HMAC a "workaround" is editorial — HMAC is a well-designed, formally proven construction (Bellare et al., 1996), not a hack. But the underlying point is fair: HMAC exists *because* raw SHA-256 lacks built-in keyed mode and is unsafe as H(key||msg).
> Bellare, Canetti, Krawczyk, "Keying Hash Functions for Message Authentication," CRYPTO 1996

### 48. BLAKE3 has built-in keyed hashing, KDF, and PRF modes with domain separation flags.
**TRUE.** The BLAKE3 specification defines three modes — `hash`, `keyed_hash`, and `derive_key` — each with distinct flag values in the compression function. This provides domain separation at the primitive level without external wrappers.
> BLAKE3 specification, Section 5.1 (flag definitions)

### Weakness 05: Quantum Vulnerability

### 49. Grover's algorithm halves the effective security of any hash function.
**TRUE (nuanced).** Grover's algorithm provides a quadratic speedup for preimage search: 2^n becomes 2^(n/2). The claim "halves the effective security" is correct for preimage resistance. For collision resistance, the quantum speedup is less dramatic (BHT algorithm: 2^(n/2) → 2^(n/3)), which the site doesn't mention.
> Grover (1996); Brassard, Hoyer, Tapp (1998)

### 50. SHA-256 drops from 256-bit to 128-bit preimage resistance against a quantum computer.
**TRUE.** Direct application of Grover's: 256/2 = 128 bits.
> Standard quantum cryptanalysis references

### 51. 128-bit is still strong.
**TRUE.** 128-bit security is considered adequate by NIST and most standards bodies for the foreseeable future, even against classical adversaries.
> NIST SP 800-57 Part 1 (key management recommendations)

### 52. Quantum computing timelines keep accelerating.
**DEBATABLE.** There have been notable advances (Google's quantum supremacy demonstrations, IBM's roadmap) but also significant setbacks and scaling challenges. "Keep accelerating" is speculative and debatable — many experts expect decades before cryptographically relevant quantum computers exist.

### 53. BLAKE3 is also 256-bit (same quantum reduction).
**TRUE.** Both SHA-256 and BLAKE3 produce 256-bit outputs with 256-bit preimage resistance, both reduced to 128-bit under Grover's.

### 54. BLAKE3's faster speed means you can affordably use longer outputs when post-quantum margins matter.
**MISLEADING.** BLAKE3 is an XOF (extendable output function) and can produce outputs longer than 256 bits. However, longer outputs do *not* increase preimage resistance beyond the 256-bit internal state/chaining value limit. Grover's would still reduce it to 128 bits regardless of output length. The bottleneck is the internal state, not the output size. This claim implies a security benefit that doesn't exist.
> BLAKE3 specification (internal state is 256-bit regardless of output length)

### Weakness 06: No Verified Streaming

### 55. With SHA-256, you must download the entire file before verifying integrity.
**TRUE.** Standard SHA-256 requires processing all input bytes sequentially to produce the final hash. You cannot verify partial data against the final hash.

### 56. BLAKE3's tree structure enables verified streaming — verify each chunk independently as it arrives.
**TRUE.** Same as claim #22.
> BLAKE3 specification; Bao (https://github.com/oconnor663/bao)

---

## SHA-256 Is Everywhere Section

### 57. SHA-256 handles "trillions of calls per day."
**TRUE (nuanced).** Considering TLS handshakes (billions of HTTPS connections daily, each involving multiple SHA-256 operations), plus Bitcoin mining, API authentication, certificate validation, package verification, etc., "trillions" is a plausible order-of-magnitude estimate, though not precisely sourced.

### Use Case: Every HTTPS Connection

### 58. Every TLS/SSL certificate uses SHA-256.
**TRUE (nuanced).** Since SHA-1 deprecation (~2017), virtually all new certificates use SHA-256. A small number may use SHA-384 or SHA-512 (e.g., some government PKI). "Every" is a slight overstatement but functionally correct for ~99%+ of certificates.
> CA/Browser Forum Baseline Requirements; Mozilla Root Store Policy

### 59. Every time you see the lock icon, SHA-256 verifies the certificate.
**TRUE (nuanced).** The lock icon indicates a valid TLS connection. Certificate signature verification uses SHA-256 in the vast majority of cases. The simplification omits that the TLS handshake also involves key exchange, symmetric encryption, and other operations — SHA-256 is one part of the chain.

### 60. Let's Encrypt alone issues 10+ million certificates per day — all SHA-256.
**UNVERIFIED.** Let's Encrypt publishes issuance statistics. They issue millions of certificates per day and the number has been growing. 10+ million/day is plausible but I cannot confirm the exact current rate. Let's Encrypt does use SHA-256 for all certificates.
> https://letsencrypt.org/stats/ (authoritative source — check for current numbers)

### Use Case: Cell Connection

### 61. Every time your phone connects to a cell tower, HMAC-SHA-256 derives the encryption keys.
**TRUE (nuanced).** In 4G LTE and 5G, the key derivation function uses HMAC-SHA-256 per 3GPP specs. "Every time your phone connects" simplifies the process — KDF runs during authentication events, not necessarily on every cell tower handover.
> 3GPP TS 33.401 (LTE security); 3GPP TS 33.501 (5G security)

### 62. HMAC-SHA-256 is the mandatory key derivation function in both 4G LTE and 5G networks.
**TRUE.** 3GPP TS 33.220 Annex B defines the KDF as HMAC-SHA-256-based, applicable to LTE (EPS) and 5G (5GS).
> 3GPP TS 33.220, TS 33.401, TS 33.501

### 63. This is per the 3GPP standard.
**TRUE.** Correct attribution.

### Use Case: Bitcoin & Cryptocurrency

### 64. Bitcoin uses double-SHA-256 for block hashing, transaction verification, and proof-of-work mining.
**TRUE.** Bitcoin uses SHA-256d (SHA-256 applied twice) for block headers, transaction IDs (TXIDs), and the proof-of-work target comparison.
> Bitcoin whitepaper (Nakamoto, 2008); Bitcoin Core source code

### 65. The "double" part is a workaround for the length extension attack.
**DEBATABLE.** This is the most commonly cited explanation, but Satoshi Nakamoto never explicitly stated the reason. Alternative theories: defense-in-depth against future SHA-256 weaknesses, or simply copying existing practice. The length extension explanation is plausible and widely repeated, but unconfirmed.
> Bitcoin developer discussions; no authoritative primary source from Satoshi

### 66. The entire Bitcoin network performs ~600 exahashes per second of SHA-256.
**TRUE (nuanced).** The Bitcoin hashrate has been in the 600–900+ EH/s range in 2025–2026. "~600 EH/s" was likely accurate when written but may be an undercount now — the hashrate trends upward over time. Should be verified against current data.
> https://mempool.space (live hashrate); blockchain.com/charts/hash-rate

### Use Case: Docker & Software Packages

### 67. Every Docker image is identified by its SHA-256 digest.
**TRUE.** Docker's content-addressable storage uses SHA-256 digests for image layers and manifests (format: `sha256:abc123...`).
> Docker documentation; OCI Image Specification

### 68. Linux package managers (apt, dpkg) verify packages with SHA-256 checksums.
**TRUE.** Debian/Ubuntu repositories include SHA-256 checksums in Release files, and apt verifies packages against them.
> Debian Repository Format specification

### 69. Apple's App Store uses SHA-256 to verify every app download.
**TRUE (nuanced).** Apple's code signing infrastructure uses SHA-256 hashes. The full App Store verification pipeline isn't publicly documented in detail, but Apple's developer documentation confirms SHA-256 in code signing.
> Apple Developer Documentation: Code Signing Guide

### 70. Git is migrating from SHA-1 to SHA-256.
**TRUE.** Git has been implementing SHA-256 support ("NewHash" / "SHA-256 transition"). Git 2.42+ includes experimental SHA-256 object format support. The migration is ongoing but not yet the default.
> Git documentation; git-scm.com SHA-256 transition plan

### Use Case: iMessage, Signal & WhatsApp

### 71. iMessage uses HMAC-SHA-256 for message authentication and key derivation.
**TRUE.** Apple's Platform Security Guide describes HMAC-SHA-256 usage in the iMessage protocol for key derivation and message authentication.
> Apple Platform Security Guide (https://support.apple.com/guide/security/)

### 72. The Signal Protocol uses SHA-256 in its key derivation chain.
**TRUE.** The Signal Protocol's X3DH key agreement and Double Ratchet algorithm use HKDF-SHA-256 for key derivation.
> Signal Protocol specifications (signal.org/docs)

### 73. The Signal Protocol powers both Signal and WhatsApp.
**TRUE.** WhatsApp adopted the Signal Protocol for end-to-end encryption in April 2016, developed in partnership with Open Whisper Systems (now Signal Foundation).
> WhatsApp encryption whitepaper (2016); Signal.org

### Use Case: Cloud Infrastructure

### 74. AWS Signature Version 4 signs every API request with SHA-256.
**TRUE.** AWS SigV4 requires HMAC-SHA-256 for request signing and SHA-256 for the payload hash.
> AWS Documentation: Signature Version 4 Signing Process

### 75. This covers every S3 upload, every Lambda invocation, every DynamoDB query.
**TRUE.** All AWS API calls use SigV4 authentication.
> AWS Documentation

### 76. Google Cloud and Azure use similar SHA-256-based authentication for service accounts.
**TRUE (nuanced).** Google Cloud uses OAuth 2.0 with JWTs that typically use RS256 (RSA with SHA-256). Azure uses similar JWT-based auth. Calling these "similar SHA-256-based authentication" is a simplification — SHA-256 is involved but the protocols are quite different from AWS SigV4.

### Use Case: Two-Factor Authentication

### 77. Authenticator apps generate 6-digit TOTP codes using HMAC-SHA-256.
**~~FALSE~~ FIXED.** The TOTP standard (RFC 6238) defaults to HMAC-SHA-1, not HMAC-SHA-256. Site now correctly states "HMAC-SHA-1 by default (RFC 6238), though newer systems increasingly support HMAC-SHA-256."
> RFC 6238 Section 1.2 (default algorithm: HMAC-SHA-1); RFC 4226 (HOTP, SHA-1)

### 78. Every 30 seconds, your phone computes a new SHA-256-based code.
**~~FALSE~~ FIXED.** Site now says "hash-based code" instead of "SHA-256-based code."
> RFC 6238

### 79. Microsoft Entra ID, Google, and most enterprise 2FA systems support SHA-256 TOTP tokens.
**TRUE (nuanced).** These platforms do *support* SHA-256 TOTP. But the framing in context implies SHA-256 is the standard algorithm for 2FA, which is incorrect — SHA-1 remains the default.

### Use Case: Passwords & WiFi

### 80. SHA-256 alone is too fast for password hashing.
**TRUE.** SHA-256's speed (~hundreds of MB/s) enables billions of password guesses per second on GPUs. This is why purpose-built password hashing functions (bcrypt, scrypt, Argon2) and iterated constructions (PBKDF2) exist.
> OWASP Password Storage Cheat Sheet; NIST SP 800-63B

### 81. PBKDF2-SHA-256 iterates SHA-256 thousands of times to slow attackers down.
**TRUE.** PBKDF2 applies the PRF (HMAC-SHA-256) for a configurable iteration count. NIST SP 800-132 recommends a minimum of 1,000 iterations; OWASP currently recommends 600,000+ for PBKDF2-SHA-256.
> NIST SP 800-132; OWASP Password Storage Cheat Sheet

### 82. PBKDF2-SHA-256 secures WPA2 WiFi passwords.
**~~FALSE~~ FIXED.** WPA2 uses PBKDF2 with HMAC-SHA-1, not SHA-256. Site now correctly states "WPA2 WiFi uses PBKDF2-SHA-1, while macOS FileVault and many enterprise login systems use PBKDF2-SHA-256."
> IEEE 802.11i-2004 Section 8.5.1.2; WPA2 specification

### 83. PBKDF2-SHA-256 secures macOS FileVault encryption.
**TRUE (nuanced).** Apple's FileVault 2 uses PBKDF2 for passphrase-based key derivation. Apple documentation indicates SHA-256 is used, though implementation details have evolved across macOS versions.
> Apple Platform Security Guide

### 84. SHA-256 wasn't designed for password hashing.
**TRUE.** SHA-256 was designed as a general-purpose cryptographic hash function. It has no built-in work factor, memory-hardness, or other properties specifically needed for password hashing.
> FIPS 180-4 (purpose statement)

### Use Case: Email & Code Signing

### 85. DKIM signs outgoing emails with SHA-256.
**TRUE.** DKIM (RFC 6376) uses SHA-256 as its primary signing algorithm, especially after SHA-1 deprecation for DKIM.
> RFC 6376; RFC 8301 (deprecating SHA-1 for DKIM)

### 86. Code signing certificates for macOS, Windows, and Android all use SHA-256.
**TRUE.** All three platforms require SHA-256 in their modern code signing infrastructure.
> Apple Code Signing docs; Microsoft Authenticode docs; Android APK signing docs

### 87. Every signed PDF uses SHA-256.
**MISLEADING.** SHA-256 is the most common algorithm for modern PDF signatures, but "every" is an overstatement. Legacy signed PDFs may use SHA-1, and the PDF spec (ISO 32000) supports multiple algorithms. Some enterprise/government PDFs may use SHA-384 or SHA-512.
> ISO 32000-2 (PDF 2.0 specification)

### Use Case: File Integrity & Downloads

### 88. Software distributors provide SHA-256 checksums for downloads.
**TRUE.** This is standard practice across most major software distributors (Linux ISOs, browser downloads, development tools, etc.).

### 89. macOS Gatekeeper verifies executables with SHA-256.
**TRUE.** Gatekeeper uses code signing verification which involves SHA-256 hashes of code pages (code directory hashes).
> Apple Developer Documentation

### 90. Windows Authenticode verifies executables with SHA-256.
**TRUE.** Authenticode supports SHA-256 and Microsoft has required it since the deprecation of SHA-1 for code signing.
> Microsoft Authenticode documentation

### 91. Backup systems use SHA-256 for deduplication and corruption detection.
**TRUE.** Many backup tools use SHA-256 — Borg Backup, Restic, Duplicati, and others use SHA-256 for content-addressable deduplication and integrity verification.

### 92. You must download the entire file before you can verify with SHA-256.
**TRUE.** Same as claim #55. Standard SHA-256 requires the complete input.

### Takeaway

### 93. Most of these use cases don't need SHA-256 specifically — they need a fast, collision-resistant hash.
**TRUE (nuanced).** Technically correct — most protocols specify SHA-256 because it was the available, standardized option. However, "don't need SHA-256 specifically" understates the role of standards compliance, regulatory mandates (FIPS 140-2/3), and ecosystem lock-in that make SHA-256 non-trivial to replace.

### 94. BLAKE3 qualifies as a replacement.
**DEBATABLE.** BLAKE3 is cryptographically sound and functionally capable. However, it lacks NIST standardization, FIPS certification, and the 25 years of public cryptanalysis that SHA-256 has undergone. For regulatory/compliance contexts (government, finance, healthcare), BLAKE3 is not currently an acceptable replacement. For non-regulated applications, it's a strong candidate.

### 95. BLAKE3 is faster in software on every device without dedicated hardware.
**TRUE (nuanced).** BLAKE3 is faster than SHA-256 in software on mainstream desktop and mobile CPUs. "Every device" is a strong claim — on extremely constrained embedded devices (8-bit microcontrollers) or unusual architectures, the comparison may differ. For the target audience of this site (phones and laptops), it's accurate.

---

## Benchmark Section

### 96. The benchmark tests four algorithms: BLAKE3 single-threaded, BLAKE3 multi-core, SHA-256 WASM, SHA-256 Web Crypto (hardware-accelerated).
**TRUE.** Verified from source code (`benchmark.js`).

### 97. Web Crypto API provides hardware-accelerated SHA-256.
**TRUE (nuanced).** Web Crypto provides a native implementation of SHA-256. Whether it's *hardware-accelerated* depends on the device — on CPUs with Intel SHA-NI or ARMv8 Crypto Extensions, the browser/OS will use hardware acceleration. On older CPUs without these extensions, Web Crypto is still native compiled code (faster than WASM) but not hardware-accelerated. The site labels it "SHA-256 (HW)" which may be inaccurate on older devices.

### 98. The benchmark uses four data sizes: 1 KB, 100 KB, 1 MB, 10 MB.
**TRUE.** Verified from source code (`benchmark.js`).

---

## Verdict Section (Dynamic)

### 99. "SHA-256 is structurally sequential and can never scale this way."
**TRUE.** Accurate restatement of the Merkle-Damgard sequential dependency (claims #8, #9, #40).

### 100. SHA-256 is "forever single-threaded" (stated in the verdict about SHA-256 having "no parallel option").
**TRUE (nuanced).** For a single-message hash, SHA-256 is inherently single-threaded due to Merkle-Damgard. "Forever" and "no parallel option" are accurate for the standard algorithm. Non-standard tree-hashing wrappers exist but are not SHA-256 itself.

---

## Device Detection (data.js)

### 101. All modern iPhones have SHA-2 hardware acceleration.
**TRUE.** All Apple A-series chips since A7 (iPhone 5s, 2013) implement ARMv8 with Crypto Extensions, which include dedicated SHA-256 instructions.
> ARM Architecture Reference Manual; Apple chip specifications

### 102. iPhone SE (2nd gen) has an A13 Bionic chip.
**TRUE.** Released April 2020 with A13 Bionic.
> Apple product specifications

### 103. iPhone 8 Plus / 7 Plus have an A11 Bionic chip.
**~~PARTIALLY FALSE~~ FIXED.** iPhone 7 Plus has A10 Fusion, not A11 Bionic. data.js now shows "A10 Fusion / A11 Bionic" to reflect both possible models at this screen resolution. Both chips have SHA-2 hardware acceleration.
> Apple product specifications: iPhone 7 Plus (A10 Fusion), iPhone 8 Plus (A11 Bionic)

### 104. iPhone 16 / 16 Pro have an A18 / A18 Pro chip with 6 cores.
**TRUE.** iPhone 16 has A18, iPhone 16 Pro has A18 Pro, both with 6 CPU cores (2 performance + 4 efficiency).
> Apple product specifications (September 2024)

### 105. Google Tensor chips (G2, G3, G4) have SHA-2 hardware acceleration.
**TRUE.** All Tensor chips use ARM Cortex cores with ARMv8/v9 Crypto Extensions, which include SHA-256 hardware instructions.
> ARM Architecture Reference Manual; Google Tensor chip specifications

### 106. Snapdragon 8 Gen 1/2/3 have SHA-2 hardware acceleration.
**TRUE.** All use ARMv8/v9 Cortex-X and Cortex-A cores with Crypto Extensions.
> Qualcomm Snapdragon specifications; ARM documentation

### 107. Exynos 1380/1480 have SHA-2 hardware acceleration.
**TRUE.** Both use ARM Cortex-A cores with Crypto Extensions.
> Samsung Exynos specifications

### 108. A11 Bionic: 2017, 10nm, ARMv8.2 Crypto Extensions.
**TRUE (nuanced).** Year (2017) and process node (TSMC 10nm) are correct. The chip implements ARMv8.2-A architecture. However, the SHA-256 hardware instructions are part of the ARMv8.0-A optional Crypto Extension — they didn't change in ARMv8.2. See claim #115 for the broader issue.
> Apple; ARM Architecture Reference Manual

### 109. A12 Bionic: 2018, 7nm, ARMv8.3 Crypto Extensions.
**TRUE (nuanced).** Year (2018) and process node (TSMC 7nm) correct. Architecture is ARMv8.3-A. Same caveat as #108 about crypto extension versioning.

### 110. A13 Bionic: 2019, 7nm.
**TRUE.** A13 Bionic: 2019, TSMC 7nm (N7P variant).

### 111. A14 Bionic: 2020, 5nm.
**TRUE.** A14 Bionic: 2020, first 5nm mobile chip (TSMC N5).

### 112. A16 Bionic: 2022, 4nm.
**TRUE.** A16 Bionic: 2022, TSMC 4nm (N4P).

### 113. A17 Pro: 2023, 3nm.
**TRUE.** A17 Pro: 2023, TSMC 3nm (N3B).

### 114. A18: 2024, 3nm.
**TRUE.** A18: 2024, TSMC 3nm (second-gen N3E).

### 115. ARMv8.x Crypto Extensions versions are correctly mapped to each chip generation.
**MISLEADING.** The data.js labels like "ARMv8.2 Crypto Extensions", "ARMv8.3 Crypto Extensions", etc. imply the crypto extensions themselves evolved with each architecture revision. In reality, the SHA-256 hardware instructions (SHA256H, SHA256H2, SHA256SU0, SHA256SU1) have been the same since ARMv8.0-A. The chips implement different ARMv8.x architecture levels, but the SHA-256 crypto extension is not versioned separately. SHA-512 instructions were added in ARMv8.2, and SM3/SM4 in ARMv8.2, but the SHA-256 instructions are unchanged. The labels should say "ARMv8.x-A with Crypto Extensions" rather than "ARMv8.x Crypto Extensions."
> ARM Architecture Reference Manual, A64 Instruction Set: SHA256 instructions (ARMv8.0 Crypto Extension)

---

## Footer

### 116. BLAKE3 is open source.
**TRUE.** BLAKE3 is released under a dual CC0 1.0 / Apache 2.0 license on GitHub.
> https://github.com/BLAKE3-team/BLAKE3

---

## Summary

### Totals

| Rating | Count |
|---|---|
| **TRUE** | 62 |
| **TRUE (nuanced)** | 34 |
| **MISLEADING** | 7 |
| **DEBATABLE** | 4 |
| **FALSE** | 3 |
| **UNVERIFIED** | 2 |
| **PARTIALLY FALSE** | 1 |
| **Total** | **113** |

96 claims require no changes. **17 claims need attention**, sorted below from most to least significant.

---

### All Claims Sorted by Severity

#### ~~FALSE~~ FIXED

| # | Section | Claim | Fix Applied |
|---|---|---|---|
| 77 | 2FA | TOTP apps use HMAC-SHA-256 | Now says "HMAC-SHA-1 by default, though newer systems increasingly support HMAC-SHA-256" |
| 78 | 2FA | Phone computes SHA-256 code every 30s | Now says "hash-based code" (algorithm-neutral) |
| 82 | Passwords & WiFi | PBKDF2-SHA-256 secures WPA2 | Now correctly says "WPA2 WiFi uses PBKDF2-SHA-1" with SHA-256 for FileVault/enterprise |

#### ~~PARTIALLY FALSE~~ FIXED

| # | Section | Claim | Fix Applied |
|---|---|---|---|
| 103 | Device detection (data.js) | iPhone 8 Plus / 7 Plus = A11 Bionic | Chip now reads "A10 Fusion / A11 Bionic" to cover both models at this resolution |

#### DEBATABLE — Defensible but contestable by experts

| # | Section | Claim | Issue | Suggested Fix |
|---|---|---|---|---|
| 3 | Hero | "more secure alternative" | BLAKE3 has the same security level (256-bit) as SHA-256. Better structural properties != "more secure." SHA-256 has 25 years of cryptanalysis with zero practical breaks. | Consider "a faster, more modern alternative" or "structurally stronger" |
| 94 | Takeaway | BLAKE3 qualifies as a SHA-256 replacement | BLAKE3 lacks NIST standardization, FIPS certification, and decades of cryptanalysis. Not acceptable in regulated contexts. | Add qualifier: "for non-regulated applications" or "where standards compliance isn't required" |
| 65 | Bitcoin | Double-SHA-256 is a length extension workaround | Commonly stated but never confirmed by Satoshi. May be defense-in-depth. | Add "likely" or "commonly attributed to" hedging |
| 52 | Quantum | Quantum computing timelines keep accelerating | Debatable — advances exist alongside significant scaling challenges. | Consider softening to "advancing" or removing the editorializing |

#### UNVERIFIED — Can't confirm, no source found

| # | Section | Claim | Issue | Suggested Fix |
|---|---|---|---|---|
| 28 | Length extension | Early AWS signature schemes exploited via length extension | AWS Sig V2 used HMAC (immune to length extension). No confirmed AWS-specific exploit found. | Remove "early AWS signature schemes" or cite a specific source |
| 60 | HTTPS | Let's Encrypt issues 10M+ certificates/day | Plausible but unverified against current stats. | Check https://letsencrypt.org/stats/ and update the number |

#### MISLEADING — Contains truth but framing distorts it

| # | Section | Claim | Issue | Suggested Fix |
|---|---|---|---|---|
| 54 | Quantum | Longer BLAKE3 outputs help post-quantum | BLAKE3's internal state is 256-bit regardless of output length. Longer outputs don't increase preimage resistance beyond that. Grover's still reduces to 128-bit. | Remove this claim or reframe around BLAKE3's XOF flexibility for non-security use cases |
| 11 | SHA-256 card | "Needs hardware acceleration to stay fast" | SHA-256 does ~200-500 MB/s in pure software — perfectly usable. It needs HW to match BLAKE3, not to "stay fast." | Reword to "Relies on hardware acceleration to match modern alternatives" |
| 24 | Weaknesses intro | "six known weaknesses" | Conflates security flaws (length extension, M-D attacks), performance limitations (sequential, no streaming), design gaps (no domain separation), and universal properties (quantum). | Consider "six limitations" or separate into security vs. performance categories |
| 10 | SHA-256 card | "Can't parallelize" | True for single-message hashing, but stated without qualification. Multiple messages can be parallelized; tree-hashing wrappers exist. | Add "for a single message" qualifier |
| 87 | Email & signing | "Every signed PDF uses SHA-256" | Legacy PDFs may use SHA-1; spec supports SHA-384/512. | Change "Every" to "Most modern" |
| 115 | Device detection (data.js) | ARMv8.x Crypto Extension version mapping | Labels like "ARMv8.3 Crypto Extensions" imply the SHA-256 instructions changed per version. They've been the same since ARMv8.0. | Change labels to "ARMv8.x-A with Crypto Extensions" |

#### TRUE (nuanced) — Correct but worth noting qualifications

| # | Section | Claim | Key Nuance |
|---|---|---|---|
| 7 | SHA-256 card | Built for single-core era | True about the era, but unclear if parallelism was a design goal |
| 9 | SHA-256 card | Uses one core | True for single-message hash; multiple messages can use multiple cores |
| 17 | BLAKE3 card | All blocks simultaneously | Leaf chunks parallel, but parent nodes have tree-depth dependency |
| 18, 44 | BLAKE3 card | Linear scaling | Near-linear for large data; sub-linear for small (site's own benchmark shows this) |
| 19 | BLAKE3 card | Scales with every core | Same as 18 — overhead dominates at small sizes |
| 26 | Weakness 01 | "Exploitable" severity | Only exploitable when SHA-256 is misused (H(key\|\|msg)); HMAC is immune |
| 38 | Weakness 02 | BLAKE3 nodes independent | Leaf nodes independent; parent nodes depend on children |
| 39 | Weakness 02 | Tree eliminates M-D attacks | Eliminates M-D-specific attacks; tree hashing has its own security model |
| 41 | Weakness 03 | "6 cores... 8-16 cores" | Reasonable generalization for 2025-2026 devices |
| 42 | Weakness 03 | "Exactly one core" | True for single hash |
| 43 | Weakness 03 | Chunks simultaneously | Same as #17 |
| 47 | Weakness 04 | HMAC is a "workaround" | Factually accurate but HMAC is a formally proven, well-designed construction — "workaround" undersells it |
| 49 | Quantum | Grover's "halves" security | True for preimage; collision reduction is different (2^(n/2) to 2^(n/3)) |
| 57 | Everywhere | "Trillions" of calls/day | Plausible order of magnitude but not precisely sourced |
| 58 | HTTPS | "Every" TLS cert | ~99%+ use SHA-256; rare SHA-384/512 exceptions exist |
| 59 | HTTPS | Lock icon = SHA-256 | SHA-256 is one component; simplifies the full TLS handshake |
| 61 | Cell | "Every time" phone connects | KDF runs during auth events, not every handover |
| 66 | Bitcoin | ~600 EH/s | Was accurate; hashrate trends upward, may be 800+ EH/s now |
| 69 | Docker/packages | App Store verifies with SHA-256 | True for code signing; full pipeline details not public |
| 76 | Cloud | GCP/Azure "similar" SHA-256 auth | SHA-256 is involved but protocols differ significantly from AWS SigV4 |
| 79 | 2FA | Enterprise 2FA supports SHA-256 TOTP | True they support it; but framing implies it's the default (it's not) |
| 83 | Passwords | FileVault uses PBKDF2-SHA-256 | Likely correct; details have evolved across macOS versions |
| 93 | Takeaway | Most use cases don't need SHA-256 specifically | True but understates regulatory/compliance lock-in |
| 95 | Takeaway | Faster on every device | True for phones/laptops; may not hold for constrained embedded devices |
| 97 | Benchmark | Web Crypto = HW-accelerated | Depends on device; older CPUs without SHA-NI get native code, not HW accel |
| 100 | Verdict | SHA-256 forever single-threaded | True for standard algorithm; non-standard tree wrappers exist |
| 108-109 | data.js | A11/A12 chip details | Year and nm correct; crypto extension version labeling misleading (see #115) |

#### TRUE — No issues (62 claims)

| Claims |
|---|
| 1, 2, 4, 5, 6, 8, 12, 13, 14, 15, 16, 20, 21, 22, 23, 25, 27, 29, 30, 31, 32, 33, 34, 35, 36, 37, 40, 45, 46, 48, 50, 51, 53, 55, 56, 62, 63, 64, 67, 68, 70, 71, 72, 73, 74, 75, 80, 81, 84, 85, 86, 88, 89, 90, 91, 92, 96, 98, 99, 101, 102, 104, 105, 106, 107, 110, 111, 112, 113, 114, 116 |
