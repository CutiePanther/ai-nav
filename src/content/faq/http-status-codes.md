---
title: 「HTTP 状态码与 RESTful 风格」
category: 计算机基础
difficulty: 入门
answer: HTTP 状态码按 1-5xx 分五类表达结果语义，RESTful 是用资源 + 方法（GET/POST/PUT/DELETE）表达接口语义的风格。
refs:
  - label: MDN·HTTP 状态码
    url: https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status
tags: ["计算机网络", "HTTP", "RESTful", "状态码"]
---

## 核心概念

**HTTP 状态码**是服务器对请求结果的三位数字描述，按百位数字分为五类：1xx（信息）、2xx（成功）、3xx（重定向）、4xx（客户端错误）、5xx（服务器错误）。**RESTful** 是一套面向资源的接口设计风格，用 URI 表示资源、用 HTTP 方法表示对资源的操作。

## 常见状态码速记

- **2xx 成功**：`200 OK`、`201 Created`（资源创建成功）、`204 No Content`；
- **3xx 重定向**：`301`（永久重定向）、`302`（临时重定向）、`304 Not Modified`（协商缓存命中）；
- **4xx 客户端错误**：`400 Bad Request`、`401 Unauthorized`（未认证）、`403 Forbidden`（无权限）、`404 Not Found`、`429`（限流）；
- **5xx 服务器错误**：`500 Internal Server Error`、`502 Bad Gateway`、`503 Service Unavailable`、`504 Gateway Timeout`。

## RESTful 设计要点

- **用名词表示资源，动词交给 HTTP 方法**：推荐 `GET /users`、`POST /users`、`PUT /users/1`、`DELETE /users/1`；
- **URL 尽量层级化、可读**：用复数名词（`/orders/1/items`），不使用动词式 URL（如 `/getUser`）；
- **状态码准确表义**：创建成功返回 201、资源不存在返回 404，而**不要一律返回 200**；
- **无状态 + 幂等**：GET/PUT/DELETE 应幂等，POST 用于产生新资源的非幂等操作。

## 面试加分点 / 追问方向

- **401 vs 403**：401 是「未提供有效凭证」，403 是「已认证但没权限」，最常被混淆；
- **302 vs 307/308**：涉及重定向后方法是否改变，深坑考点；
- **REST 的不足与替代**：字段冗余、多次请求，可用 GraphQL 或 JSON-RPC 对比；
- **幂等性**：网络重试场景下，GET 幂等 vs POST 可能重复下单，需用幂等键处理。