---
title: 「LRU 缓存实现」
category: 计算机基础
difficulty: 进阶
answer: LRU 淘汰最久未访问的 key，通用实现是「哈希表 + 双向链表」，即可 O(1) 访问又可 O(1) 移动与淘汰。
refs:
  - label: Cache replacement policies（Wikipedia）
    url: https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU
tags: ["数据结构", "LRU", "缓存", "算法"]
---

## 核心概念

**LRU（Least Recently Used，最近最少使用）** 是一种缓存淘汰策略：内存/缓存满了需要腾空间时，优先淘汰**最久没有被访问**的数据，因为「最近使用过」往往意味着短期内更可能再被用到。

## 为什么用「哈希表 + 双向链表」

- **哈希表（Map）**：`key -> 链表节点` 的映射，实现 **O(1)** 定位节点对应缓存项；
- **双向链表**：**头部**放最近使用的节点，**尾部**放最久未使用的节点，用于 **O(1)** 移动与删除；
- **get(key)**：未命中返回 -1；命中则把节点**移到链表头部**，O(1)；
- **put(key, value)**：若已存在则更新并移到头部；若不存在且超容量，则**删除尾部节点**再插入头部，O(1)。

> 只有双向链表才能在 O(1) 内删除任意指定节点（需要有前驱指针），单向链表做不到。

## 关键要点

- **访问即更新**：无论是 get 还是 put，一旦命中就要把节点移动到头部，才能体现 "recently used"；
- **线程安全**：多线程并发读写需加锁（依赖语言，如 Go 用 `sync.Mutex`，Java 可用 `LinkedHashMap` + 同步）；
- **变体**：LRU-K（记录访问次数）、LFU（按访问频次淘汰，用双哈希 + 双向链表）、ARC。

## 面试加分点 / 追问方向

- **标准面试题**：手写一个 `LRUCache`，要求 get/put 都 O(1)，数据量大压测；
- **LFU vs LRU**：LFU 按「频率」淘汰，适合缓存热点长期稳定场景，但实现更复杂；
- **工程实现**：Redis 的近似 LRU（惰性淘汰 + 采样）、Java `LinkedHashMap` 的 `accessOrder` 都隐藏了 LRU 思想；
- **实际挑战**：哈希倾斜、过期与淘汰的冲突如何取舍。