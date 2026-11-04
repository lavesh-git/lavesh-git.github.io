---
title: "Online Auction"
source: "OneNote / System Design - HLD / Case Studies"
order: 32
---

# Online Auction

[System Design: Online Auction & Bidding Service (with FAANG Senior Engineer)](<https://www.youtube.com/watch?v=g8XqFuDkga0>)

[Meta Interview Question | System Design: Online Auction & Bidding Service (Revisited, 5+ Approaches)](<https://www.youtube.com/watch?v=m626ixog2d8&list=PLlvnxKilk3aJXqDN65Sm8vIqSyfJy4-v0&index=6&pp=iAQB>)

Second Round: This was a System design round, the objective was to design an auction platform. Interviewer focussed primarily on DB schemas, scaling and designing low latency apis (caching). No LP was asked instead the interviewer asked to explain any interesting project from my past work.

Follow ups:

  1. How do you handle edits to bids ( I suggesting allowing multiple bids rather than providing an edit option.)

  1. How would you support a near real-time leaderboard (redis sorted sets)

  1. How would you identify/track the winning bid (can’t rely on redis as source of truth)

I relied on hello interview for my prep, although I hadn’t previously solved this question I was able to come up with an acceptable solution in time.
