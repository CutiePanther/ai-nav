---
title: TCP 三次握手与四次挥手
category: 计算机基础
difficulty: 入门
answer: 三次握手确认双方收发能力，防止历史连接；四次挥手因 TCP 全双工需双方分别关闭发送与接收通道。
refs:
  - label: 小林 coding·TCP 握手挥手
    url: https://xiaolincoding.com/network/3_tcp/tcp_interview.html
  - label: 知乎·三次握手详解
    url: https://www.zhihu.com/
tags: ["网络", "TCP", "握手", "挥手"]
---

## 三次握手（建立连接）

1. **SYN**：客户端 → 服务端，`SYN=1, seq=x`，客户端进入 SYN-SENT；
2. **SYN+ACK**：服务端 → 客户端，`SYN=1, ACK=1, seq=y, ack=x+1`，服务端进入 SYN-RCVD；
3. **ACK**：客户端 → 服务端，`ACK=1, seq=x+1, ack=y+1`，双方进入 ESTABLISHED。

## 为什么是三次，不是两次

- **确认双方收发能力**：两次握手只能确认「客户端能发、服务端能收」，无法确认「服务端能发、客户端能收」；
- **防止历史连接**：若客户端第一个 SYN 因网络延迟滞留，服务端两次握手就建立连接，会浪费资源；三次握手可让客户端用 ACK 判断是否接受。

## 四次挥手（断开连接）

1. **FIN**：主动方 → 被动方，主动方进入 FIN-WAIT-1；
2. **ACK**：被动方 → 主动方，被动方进入 CLOSE-WAIT，主动方进入 FIN-WAIT-2（被动方可能还有数据要发）；
3. **FIN**：被动方 → 主动方，被动方进入 LAST-ACK；
4. **ACK**：主动方 → 被动方，主动方进入 TIME-WAIT，等待 2MSL 后关闭。

## 为什么挥手要四次

TCP 是**全双工**的：一方发 FIN 只表示「我没有数据要发了」，对方仍可继续发送剩余数据，因此「发 FIN」和「回 ACK/FIN」必须分开，故比握手多一次。

## 面试加分点 / 追问方向

- **TIME-WAIT 为什么 2MSL**：保证最后一个 ACK 能到达（否则对方重传 FIN），并让旧连接报文在网络上彻底消失；
- **大量 TIME-WAIT 如何优化**：开启 tcp_tw_reuse、调整内核参数，或服务端采用长连接/连接复用；
- **SYN Flood 攻击**：利用握手阶段半连接队列耗尽，可用 SYN Cookie 防御。
