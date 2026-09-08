---
title: 「select / poll / epoll 对比」
category: 计算机基础
difficulty: 高级
answer: 三者都是 I/O 多路复用；select/poll 每次把 fd 集合拷进内核并线性扫描，连接多时 O(n)；epoll 事件驱动只回传就绪的 fd，无需每次全量拷贝。
refs:
  - label: man7·epoll(7)
    url: https://man7.org/linux/man-pages/man7/epoll.7.html
  - label: man7·select(2)
    url: https://man7.org/linux/man-pages/man2/select.2.html
tags: ["操作系统", "I/O多路复用", "epoll", "select"]
---

## 核心概念

**I/O 多路复用**允许单线程同时监听多个文件描述符，只有描述符就绪时才去读写，是支撑高并发网络服务（如 Nginx、Redis、Netty）的关键。select、poll、epoll 是 Linux 上三代实现。

## 三者的差别

| 维度 | select | poll | epoll |
| --- | --- | --- | --- |
| fd 数量上限 | 有限（通常 1024，用位图） | 受内存限制（链表） | 受系统上限 |
| 内核通知方式 | 每次全量拷贝 fd 集合 + 线性扫描 | 同 select，数组拷贝 | 事件驱动，只回传就绪 fd |
| 时间复杂度 | O(n) | O(n) | O(就绪数) |
| 触发模式 | 仅水平触发（LT） | 仅 LT | LT + 边沿触发（ET） |
| 是否需重建 fd 集合 | 是 | 是 | 否（epoll_ctl 增删即可） |
| 跨平台 | 是 | 是 | 仅 Linux |

## epoll 高效的关键

- **红黑树登记 + 就绪链表**：用 `epoll_ctl` 把关心的 fd 以红黑树注册进内核事件表，一旦就绪就挂入就绪链表；
- **`epoll_wait` 只返回就绪的 fd**，并用 **mmap** 映射内核就绪队列，减少用户态/内核态拷贝；
- **LT 与 ET**：LT 只要缓冲区有数据就一直提醒；ET 仅在状态变化时提醒一次，需一次性把数据读完。

## 面试加分点 / 追问方向

- **为什么 select 有限制**：fd_set 是位图，大小有限，且 `FD_SETSIZE` 固定；
- **ET 模式的坑**：必须循环读直到 `EAGAIN`，否则丢数据；
- **与阻塞/非阻塞 TCP 连接**：epoll 的 ET 常搭配非阻塞 fd + 边缘触发使用；
- **对比其他模型**：Reactor / Proactor 模型如何基于 epoll 实现，是高频延伸考点。