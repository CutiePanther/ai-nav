---
title: Redis 常见数据结构与应用场景
category: 计算机基础
difficulty: 入门
answer: String/Hash/List/Set/ZSet 五大基础类型 + Bitmap/HyperLogLog/GEO 等扩展，各自对应计数、缓存、队列、去重、排行榜等场景。
refs:
  - label: Redis 官方文档
    url: https://redis.io/docs/latest/develop/data-types/
tags: ["Redis", "缓存", "数据结构"]
---

## 基础数据结构与场景

| 类型 | 底层 | 典型场景 |
| --- | --- | --- |
| String | 简单动态字符串/整数 | 缓存、计数器、分布式锁（SETNX） |
| Hash | 压缩列表/哈希表 | 存储对象（用户信息）、购物车 |
| List | 双向链表/quicklist | 消息队列、最新列表、时间线 |
| Set | 哈希表/整数集合 | 去重、共同好友、标签 |
| ZSet | 跳表 + 哈希 | 排行榜、延迟队列、按分数排序 |

## 扩展类型

- **Bitmap**：位图，签到打卡、布隆过滤器的底层；
- **HyperLogLog**：基数统计（UV），内存极小但有误差；
- **GEO**：地理位置，附近的人；
- **Stream**：消息流，支持消费组，近似轻量消息队列。

## 面试加分点 / 追问方向

- **ZSet 为什么用跳表不用红黑树**：跳表实现简单、支持范围查询、可 O(logN) 定位区间，更适合排行榜；
- **Redis 单线程为什么快**：纯内存 + IO 多路复用 + 单线程避免锁竞争（注：新版本已引入多线程处理网络 IO）；
- **持久化**：RDB 快照 + AOF 追加日志，生产常两者配合。
