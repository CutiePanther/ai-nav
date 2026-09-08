---
title: 数据库事务的 ACID
category: 计算机基础
difficulty: 进阶
answer: 原子性、一致性、隔离性、持久性四要素；隔离级别通过锁与 MVCC 实现，InnoDB 默认可重复读。
refs:
  - label: 小林 coding·事务
    url: https://xiaolincoding.com/mysql/transaction/mvcc.html
tags: ["数据库", "事务", "ACID", "隔离级别"]
---

## 四大特性

- **原子性（Atomicity）**：事务内的操作要么全部成功，要么全部回滚，由 undo log 保证；
- **一致性（Consistency）**：事务前后数据库都处于合法状态（约束、主外键不被破坏），是最终目标；
- **隔离性（Isolation）**：并发事务互不干扰，由锁 + MVCC 保证；
- **持久性（Durability）**：事务提交后结果永久保存，由 redo log 保证（崩溃可恢复）。

## 隔离级别与并发问题

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
| --- | --- | --- | --- |
| 读未提交 | 可能 | 可能 | 可能 |
| 读已提交 | 否 | 可能 | 可能 |
| 可重复读（InnoDB 默认） | 否 | 否 | 基本解决 |
| 串行化 | 否 | 否 | 否 |

- **脏读**：读到别的事务未提交的数据；
- **不可重复读**：同一事务两次读同一行，结果不同；
- **幻读**：同一事务两次范围查询，行数不同（新增/删除）。

## 面试加分点 / 追问方向

- **MVCC 原理**：通过隐藏字段（事务 ID + 回滚指针）和 Read View 实现快照读，读不加锁、写不阻塞读；
- **redo log vs undo log**：redo 保证持久性（物理日志、顺序写），undo 保证原子性（逻辑日志、回滚用）；
- **当前读与快照读**：`SELECT ... FOR UPDATE` 是当前读会加锁，普通 `SELECT` 是快照读走 MVCC。
