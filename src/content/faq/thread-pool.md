---
title: 线程池原理与核心参数
category: 计算机基础
difficulty: 进阶
answer: 线程池复用线程降低创建销毁开销；核心参数为 corePoolSize、maxPoolSize、队列、拒绝策略，任务按「核心线程→队列→非核心线程→拒绝」流转。
refs:
  - label: 美团技术·线程池
    url: https://tech.meituan.com/2020/04/02/java-pooling-pratice-in-meituan.html
tags: ["Java", "并发", "线程池"]
---

## 为什么用线程池

频繁创建/销毁线程代价高（栈内存分配、内核态切换），线程池通过**复用线程**降低开销，同时统一管理并发度、防止线程无限膨胀拖垮系统。

## 核心参数（以 Java ThreadPoolExecutor 为例）

- **corePoolSize**：核心线程数，即使空闲也不回收（除非 allowCoreThreadTimeOut）；
- **maxPoolSize**：最大线程数；
- **keepAliveTime**：非核心线程空闲存活时间；
- **workQueue**：任务队列（有界 ArrayBlockingQueue / 无界 LinkedBlockingQueue）；
- **threadFactory**：线程工厂；
- **handler**：拒绝策略。

## 任务执行流程

1. 线程数 < corePoolSize → 创建核心线程执行；
2. 核心线程满 → 任务入队列；
3. 队列满 → 线程数 < maxPoolSize → 创建非核心线程执行；
4. 队列满且线程数达到 maxPoolSize → 触发**拒绝策略**。

## 面试加分点 / 追问方向

- **拒绝策略**：AbortPolicy（抛异常，默认）、CallerRunsPolicy（调用者线程执行）、DiscardPolicy（丢弃）、DiscardOldestPolicy（丢弃最旧）；
- **线程池大小怎么定**：CPU 密集型 ≈ 核数 + 1；IO 密集型 ≈ 核数 × 2 或按 IO 阻塞比计算；
- **为什么不推荐 Executors 快捷方法**：可能创建无界队列导致 OOM，阿里规约要求手动指定参数。
