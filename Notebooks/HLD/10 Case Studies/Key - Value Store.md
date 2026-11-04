---
title: "Key - Value Store"
source: "OneNote / System Design - HLD / Case Studies"
order: 8
---

# Key - Value Store

- Key-value data pairing non-relation database.

- Key is a unique identifier, stored with its associated value, which can be accessed using the key.

- Key can be plain text or hashed values. Short keys are better.

  - Plain text key: “last_logged_in_at”

  - Hashed key: 253DDEC4 f(key) -> A#Z1

- Value can be strings, list, objects etc.

  - Value = opaque object in Amazon Dynamo, Memcached, Redis

**Functional Requirements:**

  - The size of a key-value pair is small: less than 10 KB.

  - Ability to store big data.

  - High availability: The system responds quickly, even during failures.

  - High scalability: The system can be scaled to support large data set.

  - Automatic scaling: The addition/deletion of servers should be automatic based on traffic.

  - Tunable consistency.

  - Low latency.

Single server key-value store

  - Developing a key-value store that resides in a single server is easy.

  - An intuitive approach is to store key-value pairs in a hash table, which keeps everything in memory. Even though memory access is fast, fitting everything in memory may be impossible due to the space constraint.

  - Two optimizations can be done to fit more data in a single server:

    - Data compression

    - Store only frequently used data in memory and the rest on disk

  - Even with these optimizations, a single server can reach its capacity very quickly. A distributed key-value store is required to support big data.

Process:

  1. **Requirements**

    1. **Functional Requirements:**

      1. Retrieve Value \[GET\]

      1. Insert/Update Value \[PUT\]

      1. Remove a key-value pair \[DELETE\]

    1. **Non Functional Requirements:**

      1. Scalability - incremental scaling, high reads

      1. Low latency - In <10ms

      1. Symmetry - Decentralisation, no master/follower

      1. CAP Theorem Stance - AP since network partition, eventual consistency (writes don’t fail)

      1. Tuning from eventual consistency to Strong consistency

  1. **Data Storage**

    1. Write Ahead Log (WAL)

      1. When a write arrives, it will be appended to a sequential append-only file on the disk. This avoids slow random disk seeks and guarantees crash durability.

      1. 

    1. MemTable

      1. Simultaneously the same write will be inserted into MemTable (an in-memory balanced tree like a red-black tree or skip list).

      1. 

      1. It actively organise the data sorted for fast O(log N) reads.

      1. It perfectly pre-sorts the data so it can be eventually flushed to disk as an immutable SSTable (Sorted String Table)

    1. SSTables (Sorted String Table): Once the MEM table reaches a size threshold, it is flushed to disk as an immutable SS table, which frees up RAM while persisting the data using highly efficient sequential IO disk writes.

      1. 

  1. API Design

  1. **Deep Dive 1: **

    1. **Data Partitioning**

    1. For large applications, it is infeasible to fit the complete data set in a single server. The simplest way to accomplish this is to split the data into smaller partitions and store them in multiple servers.

    1. There are two challenges while partitioning the data:

• Distribute data across multiple servers evenly.

• Minimize data movement when nodes are added or removed.

    1. Use **consistent hashing to partition the data.**

| First, servers are placed on a hash ring. Eight servers, represented by s0, s1, …, s7, are placed on the hash ring. Next, a key is hashed onto the same ring, and it is stored on the first server encountered while moving in the clockwise direction. For instance, key0 is stored in s1 using this logic.<br>Consistent Hashing provides:<br>  - Automatic Scaling - servers added and deleted based on load<br>  - Hetrogenity - number of virtual nodes for a server  proportional to capacity | <br> |
| --- | --- |

    1. **Data Replication**

    1. | Data must be replicated asynchronously over N servers where N is configurable parameter |  |
| --- | --- |
| These N servers are chosen using the following logic: after a key is mapped to a position on the hash ring, walk clockwise from that position and choose the first N servers on the ring to store data copies.<br>With virtual nodes, the first N nodes on the ring may be owned by fewer than N physical servers. To avoid this issue, we only choose unique servers while performing the clockwise<br>walk logic. | <br>N = 3<br>key0 replicated on s1, s2, s3 |

  1. Deep Dive 2: Quorum Consensus & Consistency

    1. Since data is replicated at multiple nodes, it must be synchronized across replicas. Quorum consensus can guarantee consistency for both read and write operations.

    1. | **N** = The number of replicas<br>**W** = A write quorum of size W. For a write operation to be considered as successful, coordinator must receive acknowledgements from atleast W replicas.<br>**R** = A read quorum of size R. For a read operation to be considered as successful, read operation must wait for responses from at least R replicas.<br>**Coordinator** = A coordinator acts as a proxy between the client and the nodes. |  |
| --- | --- |

    1. Consistency Models:

      1. Strong consistency: any read operation returns a value corresponding to the result of the most updated write data item. A client never sees out-of-date data.

      1. Weak consistency: subsequent read operations may not see the most updated value.

      1. **Eventual consistency (recommended, Dynamo/Cassandra):** this is a specific form of weak consistency. Given enough time, all updates are propagated, and all replicas are consistent.

    1. From concurrent writes, eventual consistency allows inconsistent values to enter the system and force the client to read the values to reconcile. The next section explains how reconciliation works with versioning.

  1. Deep Dive 3: Conflict Resolution

    1. **Inconsistency Resolution - Versioning**

  1. Deep Dive 4: Failure Detection

  1. Complete Architecture

  1. Additional Discussion Points

