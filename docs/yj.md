发送单条邮件。
## **授权信息**

下表是API对应的授权信息，可以在RAM权限策略语句的`Action`元素中使用，用来给RAM用户或RAM角色授予调用此API的权限。具体说明如下：

-   操作：是指具体的权限点。
    
-   访问级别：是指每个操作的访问级别，取值为写入（Write）、读取（Read）或列出（List）。
    
-   资源类型：是指操作中支持授权的资源类型。具体说明如下：
    
    -   对于必选的资源类型，用前面加 \* 表示。
        
    -   对于不支持资源级授权的操作，用`全部资源`表示。
        
-   条件关键字：是指云产品自身定义的条件关键字。
    
-   关联操作：是指成功执行操作所需要的其他权限。操作者必须同时具备关联操作的权限，操作才能成功。
    

| **操作** | **访问级别** | **资源类型** | **条件关键字** | **关联操作** |
| --- | --- | --- | --- | --- |
| dm:SingleSendMail | none | \\*全部资源 `*` | 无   | 无   |

## 请求参数

| **名称** | **类型** | **必填** | **描述** | **示例值** |
| --- | --- | --- | --- | --- |
| AccountName | string | 是   | 管理控制台中配置的发信地址。 | test\\*\\*\\*@example.net |
| AddressType | integer | 是   | 地址类型。取值： 0：为随机账号 1：为发信地址 | 1   |
| TagName | string | 否   | 在邮件推送控制台创建的标签，用于分类所发送的邮件批次，可以通过标签来查询每批邮件的发送情况，另外如果开启邮件跟踪功能，发信必须使用邮件标签。 长度为 1-128 个字符，允许英文字母、数字、\\_、- | test |
| ReplyToAddress | boolean | 是   | 是否启用管理控制台中配置好回信地址（状态须验证通过），取值范围是字符串 true 或者 false。 | true |
| ToAddress | string | 是   | 目标地址，多个 email 地址可以用逗号分隔，最多 100 个地址（支持邮件组）。 | test1\\*\\*\\*@example.net |
| Subject | string | 是   | 邮件主题，长度不大于 256 个字符。 | Subject |
| HtmlBody | string | 否   | 邮件 html 正文。 注意：HtmlBody 和 TextBody 是针对不同类型的邮件内容，两者必须传其一。 - URL 传参限制约 80KB - 新版 SDK 采用 Body 传参限制约 8MB（ java 1.4.0 及以上， python3 1.4.0 及以上， php 1.4.0 及以上 ） | body |
| TextBody | string | 否   | 邮件 text 正文。 注意：HtmlBody 和 TextBody 是针对不同类型的邮件内容，两者必须传其一。 - URL 传参限制约 80KB - 新版 SDK 采用 Body 传参限制约 8MB（ java 1.4.0 及以上， python3 1.4.0 及以上， php 1.4.0 及以上 ） | body |
| FromAlias | string | 否   | 发信人昵称，长度小于 15 个字符。 例如：发信人昵称设置为”小红”，发信地址为 test\\*\\*\\*@example.net，收信人看到的发信地址为“小红”test\\*\\*\\*@example.net。 | 小红  |
| ReplyAddress | string | 否   | 回信地址 | test2\\*\\*\\*@example.net |
| ReplyAddressAlias | string | 否   | 回信地址昵称 | 小红  |
| ClickTrace | string | 否   | 1：为打开数据跟踪功能 0（默认）：为关闭数据跟踪功能。 | 0   |
| UnSubscribeLinkType | string | 否   | disabled: 不生成 default: 采用默认策略：对批量类型的发信地址发给特定域名时会生成退订链接，如带有关键字"gmail", "yahoo", "google", "aol.com", "hotmail", "outlook", "ymail.com"等，具体参照[退订功能生成链接和过滤机制](https://help.aliyun.com/zh/direct-mail/user-guide/unsubscribe-function-help-description)文档 显示语言根据收件人的浏览器设置自动识别 | default |
| UnSubscribeFilterLevel | string | 否   | 过滤级别。参照[退订功能生成链接和过滤机制](https://help.aliyun.com/zh/direct-mail/user-guide/unsubscribe-function-help-description)文档 disabled: 不过滤 default: 采用默认策略，批量地址采用发信地址级别过滤 mailfrom: 发信地址级别过滤 mailfrom\\_domain: 发信域名级别过滤 edm\\_id: 账号级别过滤 | mailfrom\\_domain |
| Headers | string | 否   | 邮件头设置 标准字段和非标准字段都需要符合标准中对头的语法要求，API 发信最多可通过 headers 字段传入 10 个标头，超出限制会被忽略，SMTP 没有限制。 1、标准字段 Message-ID，List-Unsubscribe，List-Unsubscribe-Post 标准字段会覆盖掉邮件头中原有的值。 2、非标准字段 不区分大小写 a、以 X-User- 开头（不推送到事件总线 EB、消息服务 MNS。仅 API 要求，SMTP 任意自定义） b、以 X-User-Notify- 开头（推送到事件总线 EB、消息服务 MNS。API 和 SMTP 都支持） 推动到 EB 或 MNS 时，header 字段下会包含这些字段 | { "Message-ID": "", "X-User-UID1": "UID-1-000001", "X-User-UID2": "UID-2-000001", "X-User-Notify-UID1": "UID-3-000001", "X-User-Notify-UID2": "UID-4-000001" } |
| IpPoolId | string | 否   | 独立 IP 地址池 ID。购买了独立 IP 的用户可以通过这个参数指定本次发信出口 IP。 参照[独立 IP](https://help.aliyun.com/zh/direct-mail/user-guide/dedicated-ip)文档。 | e4xxxxxe-4xx0-4xx3-8xxa-74cxxxxx1cef |
| Attachments | array<object> | 否   | 仅支持下载新版 SDK 使用，openapi 和签名机制方式暂不支持。 参照[如何通过 SDK 方式发送带附件的邮件？](https://help.aliyun.com/zh/direct-mail/sdk-attachment)文档。 |     |
|     | object | 否   | 仅支持下载新版 SDK 使用，openapi 和签名机制方式暂不支持。 |     |
| AttachmentName | string | 否   | 仅支持下载新版 SDK 使用，openapi 和签名机制方式暂不支持。 | test.txt |
| AttachmentUrl | string | 否   | 仅支持下载新版 SDK 使用，openapi 和签名机制方式暂不支持。 | C:\\\\Users\\\\Downloads\\\\test.txt |
| Template | object | 否   | 模版发送，模版信息 |     |
| TemplateId | string | 否   | 模版 ID | xxx |
| TemplateData | object | 否   | 模版变量与值 |     |
|     | string | 否   | 模版变量参数与值 | { "name": "Tom", "age": "22" } |
| BccAddress | string | 否   | - 指定邮件的密送收件人列表。 - 系统会将与主邮件内容一致的副本分别发送至每个密送地址，但密送信息对所有收件人（含 ToAddress、BccAddress）均不可见。 - 为了保护密送收件人的隐私，发送给密送收件人的邮件将默认不开启任何邮件追踪功能。 这意味着，对于密送邮件，系统不会记录打开率、点击率等行为数据。但发送量的计费、和发送详情、和发送状态的统计与正常邮件一致。 - 每次发送最多可指定 2 个密送收件人。 注意：SingleSendMail 接口暂无 Cc 抄送字段，如果需要请使用 SMTP 发信方式。 | 1@example.com,2@example.com |
| DomainAuth | boolean | 否   | 启用域级别认证 - true - false 仅在域级别认证时使用，发信地址级别认证请忽略。 1、domain-auth-created-by-system@example.com 控制台创建这个地址，@前缀保持固定不变，后缀用自己域名。 2、 **API 场景** AccountName 填域名，收件人看到的发件人是 domain-auth-created-by-system@example.com。 **SMTP 场景** a.通过 ModifyPWByDomain 接口设置域名密码。 b.使用域名和设置的密码认证，真实发件人 mailfrom 传自定义的地址，如 user@example.com，收件人看到的发件人是 user@example.com。 | true |

## **返回参数**

| **名称** | **类型** | **描述** | **示例值** |
| --- | --- | --- | --- |
|     | object |     |     |
| EnvId | string | 事件 ID | 600000xxxxxxxxxx642 |
| RequestId | string | 请求 ID | 2D086F6-xxxx-xxxx-xxxx-006DED011A85 |

## 示例

正常返回示例

`JSON`格式

```
{
  "EnvId": "600000xxxxxxxxxx642",
  "RequestId": "2D086F6-xxxx-xxxx-xxxx-006DED011A85"
}
```

## 错误码

| **HTTP status code** | **错误码** | **错误信息** | **描述** |
| --- | --- | --- | --- |
| 400 | InvalidReceiverName.Malformed | The format of the receiver name is invalid. It must contain the @ sign. The domain must only contain numbers, letters, underscores, minus signs, and periods. The account name must only contain numbers, letters, underscores, minus signs, and periods. | 收件人格式不正确，必须有@符号，域名组成为数字，字母，下划线，减号和点，账号组成为数字，字母，下划线，减号和点 |
| 404 | InvalidMailAddress.NotFound | The specified mail address is not found. | 发信地址未找到 |

访问[错误中心](https://api.aliyun.com/document/Dm/2015-11-23/errorCode)查看更多错误码。

## **变更历史**

更多信息，参考[变更详情](https://api.aliyun.com/document/Dm/2015-11-23/SingleSendMail#workbench-doc-change-demo)。