---
title: 「Redis 持久化：RDB 与 AOF」
category: 计算机基础
difficulty: 进阶
answer: RDB 是定期全量快照（快、文件小但可能丢数据），AOF 是追加写命令日志（更安全但慢），生产常把两者结合成混合持久化。
refs:
  - label: 小林 coding·RDB 快照
    url: https://xiaolincoding.com/redis/storage/rdb.html
  - label: Redis 官方·持久化
    url: https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/
tags: ["Redis", "持久化", "RDB", "AOF"]
---

## 核心概念

Redis 是内存数据库，断电即丢数据，因此需要持久化机制把数据落盘。两种主流方案：**RDB（快照）** 记录某一时刻的全量二进制数据，**AOF（日志）** 记录每条写操作命令。

## 两种方案的对比

| 维度 | RDB | AOF |
| --- | --- | --- |
| 记录内容 | 全量快照（二进制数据） | 逐条写命令（文本） |
| 恢复速度 | 快（直接读入内存） | 慢（需重放命令） |
| 文件大小 | 小 | 大（可重写压缩） |
| 数据安全性 | 可能丢两次快照之间数据 | 可配置最多丢 1 秒（everysec） |
| 性能影响 | fork 子进程快照，基本不阻塞 | 每次写命令有磁盘开销 |

## 关键原理

- **RDB 通过 `bgsave` + 写时复制（COW）**：`fork()` 出子进程共享内存页表，主进程写入时才复制对应物理页，从而边写边快照不阻塞；
- **AOF 三种刷盘策略**：`always`（最强安全、最慢）、`everysec`（推荐，最多丢 1 秒）、`no`（交给系统，最快）；
- **AOF 重写**：AOF 不断追加会膨胀，Redis 会以当前内存状态重写一份精简日志；
- **混合持久化（4.0+）**：AOF 文件前部为 RDB 全量快照、后部为增量 AOF，兼顾恢复速度快与丢数据少。

## 面试加分点 / 追问方向

- **`save` vs `bgsave`**：`save` 会阻塞主线程，生产禁用；`bgsave` 通过子进程异步执行；
- **fork 阻塞害怕吗**：fork 瞬间要复制页表，大内存实例可能短暂阻塞数毫秒到百毫秒；
- **重组顺序**：开启 AOF 后优先加载 AOF；未开启才加载 RDB；
- **最坏丢多少数据**：RDB 可能丢几分钟，AOF 开启时可以控制在 1 秒以内。