const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const EXPECTED_STATIC_ASSET_CACHE_CONTROL = "public,max-age=31536000,immutable";
const EXPECTED_DOWNLOADS_NOINDEX = "X-Robots-Tag: noindex";
// 两类被证明的资源：源目录 → 它们最终的 URL 前缀。写死一条探针路径证明不了什么，
// 以前那条 `/_next/static/chunks/main.js` 在构建产物里根本不存在，真实文件名全带
// 内容哈希；只要撤销精确落在某个真实哈希文件上，那条虚构探针毫无反应。
const PUBLIC_SOURCE_DIR = "public";
const DOWNLOADS_SOURCE_DIR = "public/downloads";
const DOWNLOADS_ASSET_SUBDIR = "downloads";
const STATIC_ASSET_SUBDIR = "_next/static";
const SOURCE_HEADERS_PATH = "public/_headers";
const ASSET_HEADERS_FILENAME = "_headers";
const ASSET_REDIRECTS_FILENAME = "_redirects";
const ASSET_ASSETSIGNORE_FILENAME = ".assetsignore";
const WRANGLER_CONFIG_PATH = "wrangler.jsonc";
// 「先跑构建」这句提示只能跟着**构建产物**那一侧的失败走。判据是路径，不是措辞：
// 同一句「里面没文件」既会说 `public/downloads`（git 跟踪的源目录，构建一万次也是
// 同一条红），也会说 `.open-next/assets/downloads`。所以两侧各用各的措辞，提示认
// 构建产物那两句。业主不懂技术，判红时唯一那句行动建议要是不成立，他就只能去做
// 一件毫无效果的事。
const MISSING_SOURCE_HEADER_FILE = "missing source header file";
const MISSING_BUILT_HEADER_FILE = "missing Cloudflare build output header file";
const HOLDS_NO_FILES = "holds no files";
const HOLDS_NO_BUILT_FILES = "holds no built files";

function readRepoFile(context, relativePath) {
  return context.readFileSync(path.join(context.rootDir, relativePath), "utf8");
}

function repoFileExists(context, relativePath) {
  return context.existsSync(path.join(context.rootDir, relativePath));
}

/* ------------------------------------------------------------------ *
 * 以下这一段是 wrangler 4.100.0 解析 `_headers` 的移植，不是自己的设计。
 *
 * 前三轮的每一个缺陷都是同一个根因：凭理解近似 wrangler 的语义，近似一次就漏一
 * 处。逐条打补丁只会一直漏下去——占位符正则、路径归一化、非法规则、行长上限、
 * 规则条数上限，每一条都能单独造出一个假绿。所以这里不再近似，直接照抄锁定版本
 * 的实现，来源标在每个常量后面（行号是 node_modules/wrangler/wrangler-dist/cli.js）。
 *
 * wrangler 的 parser 不能直接 import：它被打进了 cli.js 这个 bundle，
 * `@cloudflare/workers-shared` 和 miniflare 都取不到这个模块。移植是唯一的路。
 * ------------------------------------------------------------------ */

// constants.ts（cli.js:128970 附近）
const MAX_LINE_LENGTH = 2000;
const MAX_HEADER_RULES = 100;
const HEADER_SEPARATOR = ":";
const UNSET_OPERATOR = "! ";
const SPLAT_PATTERN = /\*/gu;
const NAMED_PLACEHOLDER_PATTERN = /:([A-Za-z]\w*)/gu;

// parseHeaders.ts（cli.js:129213）
const LINE_IS_PROBABLY_A_PATH = /^([^\s]+:\/\/|^\/)/u;

// validateURL.ts（cli.js:128996）
const URL_REGEX = /^https:\/\/+(?<host>[^/]+)\/?(?<path>.*)/u;
const HOST_WITH_PORT_REGEX = /.*:\d+$/u;

// rules-engine.ts（cli.js:336432）。域名占位符那条作用在**已转义**的规则串上，所以
// 它找的是 `https:\/\/` 而不是 `https://`，后面跟着一个反斜杠（`\.` 那种转义）。
const ESCAPE_REGEX_CHARACTERS = /[-/\\^$*+?.()|[\]{}]/gu;
const HOST_PLACEHOLDER_PATTERN =
  /(?<=^https:\\\/\\\/[^/]*?):([A-Za-z]\w*)(?=\\)/gu;

function escapeRegex(value) {
  return value.replace(ESCAPE_REGEX_CHARACTERS, "\\$&");
}

/** validateURL.ts 的 `extractPathname`：`/downloads/./*` 归一成 `/downloads/*`。 */
function extractPathname(value) {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return new URL(`//${withLeadingSlash}`, "relative://").pathname;
}

/**
 * validateURL.ts 的 `validateUrl(token, false, true)`。返回归一化后的规则路径，
 * wrangler 会丢弃的写法返回 null。
 *
 * 三条判据都不是可选的：绝对 URL 只认 https（`ftp://` 会被丢）、带端口的域名会被
 * 丢、其余必须以 `/` 开头。
 */
function validateRulePath(token) {
  const absolute = URL_REGEX.exec(token);
  if (absolute?.groups?.host) {
    if (HOST_WITH_PORT_REGEX.test(absolute.groups.host)) return null;
    return `https://${absolute.groups.host}${extractPathname(absolute.groups.path ?? "")}`;
  }

  if (!token.startsWith("/")) return null;
  try {
    return extractPathname(token);
  } catch {
    return null;
  }
}

/** parseHeaders.ts 的 `validateNoMultipleWildcards`：违规返回 true。 */
function hasInvalidWildcards(rulePath) {
  const wildcardCount = (rulePath.match(SPLAT_PATTERN) ?? []).length;
  if (wildcardCount > 1) return true;
  return wildcardCount > 0 && /:splat(?!\w)/u.test(rulePath);
}

/** parseHeaders.ts 的 `isValidRule`：一条头都没有的规则整条不生效。 */
function isValidRule(rule) {
  return Object.keys(rule.headers).length > 0 || rule.unsetHeaders.length > 0;
}

/**
 * parseHeaders.ts 的 `parseHeaders`，只保留生效规则（wrangler 的 `invalid` 那半边
 * 这里不需要，被丢弃就等于不生效）。
 *
 * 按块解析而不是全文件查字符串：noindex 写在 `/images/*` 底下、`/downloads/*` 底下
 * 一条都没有时，两个子串都还在文件里，查字符串照样绿，而 PDF 已经能被收录。
 *
 * 最容易漏的一处：一条被丢弃的路由行会把它**底下的响应头一起吃掉**，而不是让那些
 * 头挂到上一个块名下。`/downloads/*` 后面紧跟一行 `ftp://bad.example/downloads/*`
 * 再跟一行 noindex，wrangler 的结果是 downloads 块没有任何头；把那两行并进
 * downloads 块，门禁就会说 PDF 有 noindex。承担这件事的是路由行分支里那句
 * `rule = null`。
 *
 * wrangler 在同一处还维护了一个 `skipUntilNextPath` 标志，这里没有移植：它所有的
 * 分支在 `rule` 为空时都只往 `invalid` 诊断列表里记一笔，不改变生效规则。移植进来
 * 是一段永远改变不了结果的装饰代码，反而让人以为它在守什么。
 */
function parseWranglerHeaderRules(input) {
  const rules = [];
  let rule = null;

  const commitPendingRule = () => {
    if (rule && isValidRule(rule)) rules.push(rule);
  };

  for (const rawLine of input.split("\n")) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) continue;
    // 超长行被整行忽略。一条 2062 字符、归一化后是 `/downloads/*` 的规则，
    // wrangler 根本不看，门禁若认它就是假绿。
    if (line.length > MAX_LINE_LENGTH) continue;

    if (LINE_IS_PROBABLY_A_PATH.test(line)) {
      // 第 101 条规则以及之后的整段文件都不生效。wrangler 在这里 break，未提交的
      // 那条规则仍会在循环结束后补上，所以这里也照做。
      if (rules.length >= MAX_HEADER_RULES) break;
      commitPendingRule();
      // 必须清掉。不清的话，被丢弃的路由行底下那些头会继续挂在上一个块名下。
      rule = null;

      const rulePath = validateRulePath(line);
      if (rulePath === null || hasInvalidWildcards(rulePath)) continue;
      rule = { path: rulePath, headers: {}, unsetHeaders: [] };
      continue;
    }

    if (!line.includes(HEADER_SEPARATOR)) {
      // 撤销行必须是 `! ` 带空格开头，且整行不含冒号——`!X-Robots-Tag` 和
      // `! X-Robots-Tag:` 在 wrangler 眼里都不是撤销。
      if (rule && line.startsWith(UNSET_OPERATOR)) {
        // 不 trim。wrangler 写的是 `line.trim().replace("! ", "")`，只吃掉第一个
        // `"! "`，多出来的空格原样留在头名里。`!  X-Cache` 在它那里撤销的是
        // `" X-Cache"`——一个非法头名，运行时 `headers.delete()` 抛异常，整个响应
        // 500。这里替它 trim 掉就成了假绿：门禁拿干净名字去探，什么都探不出来。
        rule.unsetHeaders.push(line.replace(UNSET_OPERATOR, ""));
      }
      continue;
    }

    const [rawName, ...rawValue] = line.split(HEADER_SEPARATOR);
    const name = (rawName ?? "").trim().toLowerCase();
    if (name === "" || name.includes(" ")) continue;
    const value = rawValue.join(HEADER_SEPARATOR).trim();
    if (value === "" || !rule) continue;

    rule.headers[name] = rule.headers[name]
      ? `${rule.headers[name]}, ${value}`
      : value;
  }

  commitPendingRule();
  return rules;
}

/**
 * rules-engine.ts 的 `generateRuleRegExp`（cli.js:336445）。逐行照抄，包括那两个
 * `matchAll` + `split/join` 的写法——它不是「把每个占位符各自换掉」的等价写法。
 *
 * `matchAll` 拿到的是**替换开始之前**那份字符串的匹配列表，而每一轮 `split/join`
 * 会改写整条规则。名字互为前缀时这两件事会撞上：`/:x/:xfoo` 的匹配列表是
 * `[":x", ":xfoo"]`，处理 `:x` 时连 `:xfoo` 的前缀一起换掉，得到两个同名捕获组，
 * `RegExp` 抛 `SyntaxError`，`generateRulesMatcher` 的 catch 把整条规则丢掉。
 * 用一次 `.replace()` 各换各的就编译成功了——于是一条线上根本不存在的规则被算作
 * 生效，它「补回」的 noindex 或缓存全是假的。
 *
 * 占位符语法必须照抄：自己按感觉写成 `/:[a-z_]+/gi` 会漏，`\w` 含数字，
 * `:section2` 在 wrangler 眼里是一个完整占位符，会命中 `/downloads/catalog.pdf`。
 *
 * 名字也必须照抄，不能图省事换成匿名分组：`/:x/:x` 会生成两个同名捕获组，同样被
 * 整条丢掉；换成匿名分组它就成了一条正常规则——假绿。
 *
 * 正则不加 `u` 标志，wrangler 也没加（`RegExp(rule)`）。加了反而更严：它转义出来的
 * `\-` 在 unicode 模式下是非法转义，`/downloads-archive/*` 这种正当规则会直接抛
 * 异常，把门禁变成崩溃而不是判断。
 *
 * 编译不出来返回 null，和 `generateRulesMatcher` 的 try/catch 一致，整条丢弃。
 */
function compileRulePattern(rulePath) {
  let source = rulePath.split("*").map(escapeRegex).join("(?<splat>.*)");

  for (const hostMatch of source.matchAll(HOST_PLACEHOLDER_PATTERN)) {
    source = source.split(hostMatch[0]).join(`(?<${hostMatch[1]}>[^/.]+)`);
  }
  for (const pathMatch of source.matchAll(NAMED_PLACEHOLDER_PATTERN)) {
    source = source.split(pathMatch[0]).join(`(?<${pathMatch[1]}>[^/]+)`);
  }

  try {
    return new RegExp(`^${source}$`);
  } catch {
    return null;
  }
}

/**
 * 一条规则怎么被拿去比对，照 `generateRulesMatcher`：`https://` 开头的规则比的是
 * `https://<域名><路径>`，其余规则只比路径。
 *
 * 只按规范路径匹配，不再另外算一套「编码别名」。曾经加过：`_headers` 是按请求里的
 * 原始编码路径匹配的，而 `cli.js` 里 Pages 的 asset-server 解码之后才去找文件，看
 * 起来 `/downloads/%63atalog.pdf` 这类规则能撤掉真实 PDF 的头。那是读错了子系统
 * ——这个仓库走的是 Workers Assets（`wrangler.jsonc` 的 `assets` 绑定），不是 Pages。
 * 2026-07-28 用锁定的 wrangler 4.100.0 起本地服务实测：`/downloads%2Fproduct-catalog.pdf`
 * 和 `/downloads/%70roduct-catalog.pdf` 都返回 307 跳到规范路径，文件根本不会在别名
 * 路径上被发出去。别再照着那段 Pages 代码把这套加回来。
 */
function ruleToMatcher(rulePath) {
  const pattern = compileRulePattern(rulePath);
  if (pattern === null) return null;

  const absolute = /^https:\/\/([^/]+)(\/.*)?$/u.exec(rulePath);
  const hostPart = absolute ? (absolute[1] ?? "") : null;

  return {
    host: hostPart,
    // 域名段里的占位符名字。它们的值只有知道真实域名才能算出来，而这里不知道
    // 线上会用哪个域名，所以拿它们拼出来的响应头是证明不了的（见
    // collectUnprovableHostFailures）。
    hostPlaceholders: hostPart === null ? [] : listPlaceholderNames(hostPart),
    pattern,
  };
}

/** `generateRulesMatcher` 里的 `test` 串：带域名的规则连域名一起比。 */
function toMatchTarget(host, targetPath, scopeHost) {
  if (host === null) return targetPath;
  return `https://${scopeHost}${targetPath}`;
}

function listPlaceholderNames(segment) {
  return [...segment.matchAll(NAMED_PLACEHOLDER_PATTERN)].map(
    (match) => match[1],
  );
}

/**
 * rules-engine.ts 的 `replacer`（cli.js:336439）：命中的捕获值会被替换进响应头的
 * **值**里，不只是用来判断命中。
 *
 * 漏掉这一步就有假绿：`/_next/static/:directive` 底下写 `Cache-Control: :directive`，
 * 构建产物里只要有一个文件叫 `no-store`，线上那条头就真的变成 `no-store`，一年缓存
 * 当场作废；而只看字面量 `:directive` 的话，它不在任何冲突指令名单里，检查全绿。
 */
function replacePlaceholders(value, replacements) {
  let result = value;
  for (const [name, captured] of Object.entries(replacements)) {
    result = result.replaceAll(`:${name}`, captured);
  }
  return result;
}

/**
 * 比较响应头时把空格抹平。
 *
 * `public,max-age=86400` 和 `public, max-age=86400` 是同一条头，HTTP 规范两种都
 * 合法。逐字符全等会在业主重排一次格式时变红，而意图完全没坏。
 *
 * 只抹分隔符两侧的空格，不抹 token 内部的。全删会让 `X-Robots-Tag: no index`
 * 判绿——Google 不认 `no index`，PDF 照样被收录，而门禁说没事。
 *
 * `=` 也算分隔符。真实客户端解析 Cache-Control 时按 name=value 取名字并 trim 掉
 * 两侧空白，`max-age = 0` 就是 `max-age=0`。不抹的话它变成一个前缀对不上的 token，
 * 「同时挂着第二个更短时长」那条冲突检测直接失明——换个写法就绿了。
 */
function normalizeHeaderValue(value) {
  return value.replace(/\s*([:,=])\s*/gu, "$1").toLowerCase();
}

/**
 * `X-Robots-Tag: none` 在 Google 的定义里等于 `noindex, nofollow`，比只写
 * noindex 更严。不展开就会把它判红，等于逼着业主把防护改弱。
 */
const ROBOTS_DIRECTIVE_ALIASES = new Map([["none", ["noindex", "nofollow"]]]);

function expandDirectives(name, directives) {
  if (name !== "x-robots-tag") return directives;

  const expanded = new Set();
  for (const directive of directives) {
    for (const alias of ROBOTS_DIRECTIVE_ALIASES.get(directive) ?? [
      directive,
    ]) {
      expanded.add(alias);
    }
  }
  return expanded;
}

/**
 * 拆成指令集合。
 *
 * 整行全等会把更强的写法判红：`X-Robots-Tag: noindex, nofollow` 比只写 noindex
 * 更严，门禁却拦下来，还报「does not carry X-Robots-Tag: noindex」——它明明带了。
 * 一个逼着业主不许加强防护的检查，该改的是检查。所以只要求「要的指令都在」，
 * 多出来的不管。
 */
function toDirectiveSet(name, value) {
  const tokens = splitOutsideQuotes(normalizeHeaderValue(value))
    .map((directive) => directive.trim())
    .filter(Boolean);
  return expandDirectives(name, new Set(takeGlobalDirectives(name, tokens)));
}

// `unavailable_after` 的值里就带冒号（日期时间），它是指令不是爬虫名。
const ROBOTS_DIRECTIVE_WITH_VALUE = "unavailable_after";

/**
 * `X-Robots-Tag` 可以按爬虫分别下指令，写法是 `<爬虫名>: <指令>[, <指令>…]`。
 * 关键在于：**爬虫名后面那一整串逗号分隔的指令都只属于那个爬虫**（Google 文档里
 * 的例子就是 `X-Robots-Tag: otherbot: noindex, nofollow`）。
 *
 * 只按逗号拆 token 会把 `bingbot: nosnippet, noindex` 里的 `noindex` 当成全局指令，
 * 门禁于是认为这份 PDF 带着 noindex；而 Googlebot 收到的那一行里没有一条对它生效，
 * PDF 照样被收录。所以碰到第一个带爬虫前缀的 token 就停，它和它后面的都不算数。
 */
function takeGlobalDirectives(name, tokens) {
  if (name !== "x-robots-tag") return tokens;

  const scopedIndex = tokens.findIndex((token) => {
    const separator = token.indexOf(HEADER_SEPARATOR);
    return (
      separator > 0 && token.slice(0, separator) !== ROBOTS_DIRECTIVE_WITH_VALUE
    );
  });
  return scopedIndex === -1 ? tokens : tokens.slice(0, scopedIndex);
}

/**
 * 引号没配对的头值没法可靠地拆，直接判「算不出来」。
 *
 * 拆分器碰到不闭合的引号会把后面所有内容吞进一个 token，`no-store` 就查不出来了，
 * 而线上那条头是真的带着它。畸形头各家客户端行为未定义，这里不猜，判红。
 */
function hasUnbalancedQuotes(value) {
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    if (quoted && value[index] === "\\") {
      index += 1;
      continue;
    }
    if (value[index] === '"') quoted = !quoted;
  }
  return quoted;
}

/**
 * 按逗号拆，但引号里的逗号不算分隔符。
 *
 * HTTP 的字段值允许 quoted-string，里面的逗号是内容而不是分隔符。直接
 * `split(",")` 会把 `foo="x,public,max-age=31536000,immutable,y"` 拆成一堆看起来
 * 正好凑齐期望的 token，而线上那条头只有 `foo=...` 一个扩展指令，一年缓存根本
 * 不存在——每个真实 bundle 都会假绿。反斜杠在引号内是转义，跳过它后面那个字符。
 */
function splitOutsideQuotes(value) {
  const parts = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quoted && character === "\\") {
      current += character + (value[index + 1] ?? "");
      index += 1;
      continue;
    }
    if (character === '"') {
      quoted = !quoted;
      current += character;
      continue;
    }
    if (character === "," && !quoted) {
      parts.push(current);
      current = "";
      continue;
    }
    current += character;
  }

  parts.push(current);
  return parts;
}

/** 把 `X-Robots-Tag: noindex` 这种期望写法拆成「头名 + 指令集合」。 */
function parseExpectedHeader(line) {
  const [rawName, ...rest] = line.split(HEADER_SEPARATOR);
  const name = (rawName ?? "").trim().toLowerCase();
  return {
    name,
    directives: toDirectiveSet(name, rest.join(HEADER_SEPARATOR)),
  };
}

/**
 * 算出某个路径最终真正拿到的响应头，照 rules-engine.ts 的 `attachHeaders`：
 * 所有命中的规则按声明顺序依次作用，每条规则先撤销再设置，同名头的指令并起来。
 *
 * 只比对「路由字符串完全相等」的块会同时错两个方向：
 *
 * - 假绿：`/downloads/*` 底下写着 noindex，但下面再写一个更具体的
 *   `/downloads/private.pdf` 加一行 `! X-Robots-Tag`，就能把它撤掉。
 * - 假红：同一条头被拆到两个块里（`Cache-Control: public, max-age=…` 一块、
 *   `Cache-Control: immutable` 另一块），线上会合并成完整的一条。
 *
 * 带域名的规则要**按域名分场景算**，不能和无域名规则拌在一锅里。一次请求只落在
 * 一个域名上，`https://a.example/...` 和 `https://b.example/...` 的规则在线上永远
 * 不会同时生效。拌在一起就会互相抵消：a 那条追加 `no-store`、b 那条把
 * `Cache-Control` 整个撤掉、后面再有一条无域名规则补回期望值，合起来看毫无问题，
 * 而 a.example 上那次响应实际带着 no-store，一年缓存的保证是假的。
 *
 * 所以场景 = 一个「没有域名」的场景，加上文件里出现过的每一个域名各一个场景。
 * 每个场景独立算一遍，任何一个场景没达到期望，整体就算失败。「没有域名」那个场景
 * 顺带把「只在某个域名下写了 noindex」挡掉：那个场景里它根本不存在。
 *
 * 场景只按**纯字面量**的域名分。带占位符或通配符的域名段在别处被整条判红（见
 * `collectUnprovableHostFailures`），不会走到这里——它们的字面量本身能被别的规则
 * 的域名模式吃掉（`":h"` 不含点，`(?<h>[^/.]+)` 一口吞下），那样算出来的场景在
 * 线上根本不存在。
 *
 * 攒的是**拼接后的原始头值**，不是各自拆好的指令集合。wrangler 用
 * `Headers.append` 把多条命中规则的同名头拼成一条 `A, B`，客户端只解析一次；
 * 逐条各拆各的会和它对不上——比如前一条留一个不闭合的引号、后一条把它关掉，拼起来
 * `no-store` 在引号外是真指令，分开看却被吞进 token 里。
 */
function resolveEffectiveHeaders(rules, targetPath, scopeHost) {
  const effective = new Map();

  for (const rule of rules) {
    const matcher = ruleToMatcher(rule.path);
    if (matcher === null) continue;
    const { host, pattern } = matcher;
    if (host !== null && scopeHost === null) continue;
    const match = pattern.exec(toMatchTarget(host, targetPath, scopeHost));
    if (match === null) continue;

    for (const unsetName of rule.unsetHeaders) {
      effective.delete(unsetName.toLowerCase());
    }

    for (const [name, value] of Object.entries(rule.headers)) {
      const resolved = replacePlaceholders(value, match.groups ?? {});
      const existing = effective.get(name);
      effective.set(
        name,
        existing === undefined ? resolved : `${existing}, ${resolved}`,
      );
    }
  }

  return effective;
}

/**
 * 文件里出现过的域名，加上「没有域名」那个场景（用 null 表示）。
 *
 * 域名要按 URL 的规矩归一化之后才能当场景用。wrangler 比对的是
 * `new URL(request.url).hostname`（cli.js:336471）——那个值一定是小写的，IDN 也已经
 * 转成 punycode；规则那一侧却原样保留（cli.js:129014），编译出来的正则又不带 `i`
 * （cli.js:336456）。所以 `https://TUCSENBERG.example/downloads/*` 这条规则线上永远
 * 命中不了任何请求。
 *
 * 拿字面量当场景的话，它在门禁眼里反倒是生效的：一条写在里面的 `! X-Robots-Tag`
 * 会让门禁判红，并打印一句不成立的话——那份 PDF 在任何真实域名上都带着 noindex。
 */
function listHeaderScopes(rules) {
  const hosts = new Set();
  for (const rule of rules) {
    const matcher = ruleToMatcher(rule.path);
    if (matcher === null || matcher.host === null) continue;
    const hostname = toHostname(matcher.host);
    // 取不出域名的不造场景（`:host` 这类占位符会让 URL 解析直接抛异常）。它们
    // 已经被 collectUnprovableHostFailures 无条件判红，这里再猜一个场景只会多一句
    // 废话。通配符 `*.example.com` 是能解析的，照常造场景——反正也是无条件判红。
    if (hostname !== null) hosts.add(hostname);
  }
  return [null, ...hosts];
}

function toHostname(host) {
  try {
    return new URL(`https://${host}`).hostname;
  } catch {
    return null;
  }
}

/**
 * 磁盘文件名要转义之后，才是线上真正被请求的路径。
 *
 * 直接拼文件名会漏：`catalog copy.pdf` 在线上是 `/downloads/catalog%20copy.pdf`，
 * 一条写成 `%20` 的撤销规则会命中它，而门禁拿着带空格的原名去比，什么都没匹配上，
 * 于是 PDF 能被收录而门禁全绿。
 *
 * 转义规则照抄 asset worker 的 `encodePath`（assets.worker.js:8796）：按 `/` 切段，
 * 每段各自 `encodeURIComponent`。这不是 `new URL().pathname`——那一版曾经用过，
 * 但两者对 12 个字符不一致（`, ; : @ & = + $ [ ] |`）。asset worker 只在
 * `encodePath(路径)` 上返 200，别的形式一律 307 跳过去（assets.worker.js:8271），
 * 所以那 12 个字符里只要有一个出现在文件名里，门禁算出来的就不是那条真正会发文件的
 * URL，落在真 URL 上的撤销它完全看不见。2026-07-28 实测：文件名 `spec,rev2.pdf`，
 * `/downloads/spec,rev2.pdf` 返 307，`/downloads/spec%2Crev2.pdf` 返 200 且没有
 * `x-robots-tag`，而门禁全绿。
 */
function toServedPath(urlPrefix, relativePath) {
  return [urlPrefix, ...relativePath.split("/")]
    .map((segment, index) =>
      index === 0 ? segment : encodeURIComponent(segment),
    )
    .join("/");
}

/**
 * 列出真实发布出去的文件。
 *
 * 探一条写死的路径只能证明那一条路径，而撤销可以精确落在某个真实文件上
 * （`/downloads/supplier-checklist.pdf` 加一行 `! X-Robots-Tag`），也可以用占位符
 * 绕开（`/:section/private.pdf`）。所以逐个真实文件算它最终拿到的头，规则会不会
 * 命中交给同一套匹配逻辑判断，不靠字符串前缀猜。
 *
 * 点号开头的文件也要算。Workers Assets 只在资产根目录排除 `.assetsignore`、
 * `_redirects`、`_headers` 三个（wrangler 4.100.0 cli.js:124017），别的点号文件照
 * 常上传。2026-07-28 实测：把一份 PDF 复制成 `.open-next/assets/downloads/
 * .secret-probe.pdf` 后 `wrangler dev --local` 起服务，请求
 * `/downloads/.secret-probe.pdf` 返回 200 和完整 PDF。过滤掉它们等于放过一份
 * 能被搜索引擎抓到、却没人证明带 noindex 的下载。
 *
 * 符号链接也要算，**文件和目录都算**。wrangler 建上传清单时是
 * `fs.readdir(dir, { recursive: true })` 加 `fs.stat(filepath)`（cli.js:137571）：
 * 递归枚举会走进符号链接目录，`stat` 又会跟随链接，所以链接背后是普通文件就照传，
 * 那句 `filestat.isSymbolicLink()` 对 `stat` 来说永远为假。
 *
 * 所以「是不是目录」必须问 `statSync`，不能问 `Dirent`：`Dirent.isDirectory()` 对
 * 「指向目录的符号链接」是 false，整棵子树会被静默跳过。2026-07-28 实测：
 * `.open-next/assets/downloads/linked` 链到另一个目录，里面的 PDF 从
 * `/downloads/linked/inside.pdf` 返回 200 且没有 `x-robots-tag`，门禁全绿。
 */
function listServedPaths(context, sourceDir, urlPrefix, relative = "") {
  const absolute = path.join(context.rootDir, sourceDir, relative);
  // 列不出来就没有可证明的路径。这里不能直接 readdirSync：`public/downloads` 要是
  // 一个普通文件，它抛 ENOTDIR，门禁变成崩溃而不是判断。
  const entries = readdirOrNull(context, absolute);
  if (entries === null) return [];

  return entries
    .flatMap((entry) => {
      const next = relative ? `${relative}/${entry.name}` : entry.name;
      const resolved = statOrNull(context, path.join(absolute, entry.name));
      // 目录本身不是可证明的东西。不递归的话 `/downloads/nested` 会被当成一个
      // 文件去探，它底下真实的 PDF 一个都没查，而门禁看起来在干活。
      if (resolved?.isDirectory()) {
        return listServedPaths(context, sourceDir, urlPrefix, next);
      }
      // 跟随之后还是普通文件才算数；FIFO、断链都不算。
      if (!resolved?.isFile()) return [];
      return [toServedPath(urlPrefix, next)];
    })
    .sort();
}

/**
 * 受保护目录在磁盘上的真名，以及由真名算出来的 URL 前缀。
 *
 * 目录名不能用写死的字面量。macOS 默认的 APFS 不区分大小写：磁盘上是 `Downloads/`
 * 时，`existsSync(".open-next/assets/downloads")` 照样返回 true，门禁于是按
 * `/downloads/x.pdf` 求响应头、全绿。而 wrangler 建上传清单拿的是 readdir 给出的
 * 原始条目名（cli.js:137571），线上那条 URL 是 `/Downloads/x.pdf`，`/downloads/*`
 * 那条规则匹配不上它（正则不带 `i`）。2026-07-28 实测：`wrangler dev --local` 下
 * `/Downloads/secret.pdf` 返回 200 且没有 `x-robots-tag`，`/downloads/secret.pdf`
 * 是 404。六份询盘 PDF 会全部裸奔，而业主本机上门禁一片绿。
 *
 * 判据只能是「readdir 里有没有一模一样的名字」，不能拿 `toLowerCase()` 比。磁盘的
 * 折叠表比 JS 的大小写表大：本机实测 `ſ`（U+017F）在磁盘上等于 `s`，而
 * `"downloadſ".toLowerCase()` 还是它自己。
 *
 * 名字对不上时不去猜磁盘上那个真名是谁——猜错了后面每一条证明说的都是另一条 URL。
 * 直接返回 folded，那个目录一条路径都不列，由调用方打印一句成立的话。上一版是判红
 * 之后照旧按写死的前缀逐文件证明，于是同一次运行里前两行说「这条 URL 我算不出来」，
 * 后几行接着拿那条算不出来的 URL 下结论，而那些结论两个方向都不成立。
 *
 * 「列不出来」必须和「名字被折叠了」分开。上一版把 readdir 的任何失败（权限、
 * EMFILE、EIO）都当成折叠，于是一个只是不可列的目录会被说成「名字不对」，而它底下
 * 那份被撤销了 noindex 的 PDF 一个字都不打印——正好是这段代码要修的那个毛病换了个
 * 触发条件。列不出来时名字本身没有可疑之处，逐文件证明照常跑。
 *
 * 只解析会进 URL 的那几段。`public`、`.open-next`、`assets` 被 wrangler 完全剥掉
 * （清单路径是相对资产根算的），它们叫什么都不改变任何一条 URL。
 */
function resolveServedDir(context, baseDir, urlSubdir) {
  let parent = path.join(context.rootDir, baseDir);

  for (const segment of urlSubdir.split("/")) {
    const entries = readdirOrNull(context, parent);
    const next = path.join(parent, segment);
    if (entries === null) return "unlistable";
    if (!entries.some((entry) => entry.name === segment)) {
      // 一模一样的名字找不到、路径却又「存在」，说明是文件系统替我们折叠了名字。
      // 目录压根不在时返回 missing，由「目录里没东西」那条去报。
      return context.existsSync(next) ? "folded" : "missing";
    }
    parent = next;
  }

  return "exact";
}

function collectUnresolvableDirectoryFailures(context, baseDir, urlSubdir) {
  const sourceDir = `${baseDir}/${urlSubdir}`;
  const resolution = resolveServedDir(context, baseDir, urlSubdir);
  // 「算不出来」是这个检查的选择，不是世界的性质：真名在磁盘上，比对 inode 就能拿到。
  // 所以话要说成「这个检查算不出来」，不能说成「没人算得出来」。
  if (resolution === "folded") {
    return [
      `${sourceDir} is not on disk under that exact name, so this check cannot work out which URL its files are served from`,
    ];
  }
  if (resolution === "unlistable") {
    return [
      `${sourceDir} could not be listed, so this check cannot confirm it is spelled the same on disk as in the URL`,
    ];
  }
  return [];
}

function readdirOrNull(context, absolutePath) {
  try {
    return context.readdirSync(absolutePath, { withFileTypes: true });
  } catch {
    return null;
  }
}

function statOrNull(context, absolutePath) {
  try {
    return context.statSync(absolutePath);
  } catch {
    return null;
  }
}

/**
 * 同一条路由写两个块，不是「合并」，是「后一个整块盖掉前一个」。
 *
 * 锁定的 wrangler 4.100.0 在构造静态资源 header metadata 时写的是
 * `rules[rule.path] = configuredRule`（cli.js:335300），后写的整块覆盖先写的，
 * 先写的那些头就此消失。把它们合起来是门禁在替线上做主，结果是假绿。
 *
 * 这里不替它猜哪个是本意，直接判红。比的是 wrangler 归一化之后的键，
 * `/downloads/*` 和 `/downloads/./*` 在它那里是同一个键。
 */
function collectDuplicateRouteFailures(rules, relativePath) {
  const seen = new Set();
  const duplicated = new Set();

  for (const rule of rules) {
    if (seen.has(rule.path)) duplicated.add(rule.path);
    seen.add(rule.path);
  }

  return [...duplicated].map(
    (rulePath) =>
      `"${rulePath}" is declared twice in ${relativePath}; wrangler keeps only the last block and silently drops the earlier headers`,
  );
}

/**
 * 「要的指令都在」对 Cache-Control 不够，它还得没被别的指令推翻。
 *
 * 多条规则命中同一条头时 wrangler 用 `Headers.append` 拼接，指令是并起来而不是
 * 覆盖。通配块给了一年 immutable，再给某个真实 bundle 追加一行
 * `Cache-Control: no-store`，三个期望 token 一个不少，而那个文件线上一秒都不会被
 * 缓存——门禁却说缓存到位。
 *
 * X-Robots-Tag 不需要这一层：多一条 nofollow 只会更严，Google 也取最严的那条。
 * Cache-Control 相反，最严的那条会把期望整个作废。
 */
const CACHE_CONTROL_CONTRADICTIONS = new Set([
  "no-store",
  "no-cache",
  "private",
]);
const CACHE_CONTROL_AGE_DIRECTIVES = ["max-age", "s-maxage"];

function findContradictingDirectives(name, expected, actual) {
  if (name !== "cache-control") return [];

  // 比的是 `=` 前面那个名字。客户端按 name=value 取名字，`no-store=1` 的名字就是
  // no-store，真实浏览器照样不缓存；只比整词的话加个 `=1` 就绕过去了。
  const contradictions = [...actual].filter((directive) =>
    CACHE_CONTROL_CONTRADICTIONS.has(directive.split("=")[0] ?? directive),
  );

  // 期望里写了 max-age=31536000，实际却同时挂着另一个时长（或者 s-maxage=0），
  // 线上按哪个算是不确定的，同样不能算证明。
  for (const ageDirective of CACHE_CONTROL_AGE_DIRECTIVES) {
    const prefix = `${ageDirective}=`;
    for (const directive of actual) {
      if (directive.startsWith(prefix) && !expected.has(directive)) {
        contradictions.push(directive);
      }
    }
  }

  return contradictions;
}

function collectScopeFailures(
  rules,
  relativePath,
  targetPath,
  expectedHeader,
  scopeHost,
) {
  const wanted = parseExpectedHeader(expectedHeader);
  const served = resolveEffectiveHeaders(rules, targetPath, scopeHost).get(
    wanted.name,
  );
  // 无域名场景不加后缀，报错信息保持原样；域名场景点出是哪个域名，否则业主看到
  // 一条红字却不知道该去改哪一块。
  const where = scopeHost === null ? "" : ` on https://${scopeHost}`;

  if (served === undefined) {
    return [
      `${targetPath} in ${relativePath} is served without "${wanted.name}"${where}`,
    ];
  }

  if (hasUnbalancedQuotes(served)) {
    return [
      `${targetPath} in ${relativePath} is served "${wanted.name}: ${served}"${where}, whose quotes do not close, so what it actually means cannot be proven`,
    ];
  }

  const actual = toDirectiveSet(wanted.name, served);
  const missing = [...wanted.directives].filter(
    (directive) => !actual.has(directive),
  );
  if (missing.length > 0) {
    return [
      `${targetPath} in ${relativePath} does not carry "${expectedHeader}"${where}`,
    ];
  }

  const contradictions = findContradictingDirectives(
    wanted.name,
    wanted.directives,
    actual,
  );
  if (contradictions.length > 0) {
    return [
      `${targetPath} in ${relativePath} carries "${expectedHeader}" but ${contradictions.join(", ")} overrides it${where}`,
    ];
  }

  return [];
}

function collectServedPathFailures(
  rules,
  relativePath,
  targetPath,
  expectedHeader,
) {
  return listHeaderScopes(rules).flatMap((scopeHost) =>
    collectScopeFailures(
      rules,
      relativePath,
      targetPath,
      expectedHeader,
      scopeHost,
    ),
  );
}

/**
 * 域名段不是纯字面量的规则一律判红。
 *
 * 这里按域名分场景算，而场景就是规则里那串域名的**字面量**。域名段一旦含占位符或
 * 通配符，这个模型就塌了：`https://:h/downloads/*` 编译成 `(?<h>[^/.]+)`，只能匹配
 * 不带点的域名，真实域名全带点，所以它线上永远不生效；可场景串本身就是 `":h"`，
 * 不含点，被自己的模式一口吃下，于是它在每个场景里都把 noindex「补」了回来——三个
 * 场景全绿，而线上那份 PDF 一条 `X-Robots-Tag` 都没有。域名段带通配符的同理。
 *
 * 拿它拼响应头的值更是无从算起：`Cache-Control: :env` 的真实值等于真实域名的第一
 * 段，可能就是 `no-store`。
 *
 * 所以不猜，判红。当前 `public/_headers` 一条带域名的规则都没有，代价为零。
 */
function collectUnprovableHostFailures(rules, relativePath) {
  return rules
    .filter((rule) => {
      const matcher = ruleToMatcher(rule.path);
      if (matcher === null || matcher.host === null) return false;
      return matcher.hostPlaceholders.length > 0 || matcher.host.includes("*");
    })
    .map(
      (rule) =>
        `"${rule.path}" in ${relativePath} does not name one exact host, so which responses it reaches cannot be proven; write the host out in full`,
    );
}

/**
 * wrangler 的文本解析器接受的头名，运行时的 `Headers` 不一定接受。
 *
 * 它只拦下带空格的头名，`Bad@Name` 照样进 metadata；真正发资产时那句
 * `response.headers.set()` 抛异常，整个响应变成 500。2026-07-28 实测：给
 * `/downloads/*` 加一行 `Bad@Name: value` 之后，`wrangler dev --local` 上
 * `/downloads/spec-sheet-tb-bw.pdf` 返回 `500 Internal Server Error`。门禁却说这份
 * PDF 已经证明带着 noindex——它根本发不出来。撤销行同理，`headers.delete()` 也验名。
 */
function collectInvalidHeaderFailures(rules, relativePath) {
  const failures = [];
  const probe = new Headers();

  for (const rule of rules) {
    for (const [name, value] of Object.entries(rule.headers)) {
      try {
        probe.set(name, value);
        probe.delete(name);
      } catch {
        failures.push(
          `"${name}" under "${rule.path}" in ${relativePath} is not a header the runtime accepts, so every matching asset answers 500`,
        );
      }
    }
    for (const unsetName of rule.unsetHeaders) {
      try {
        probe.delete(unsetName);
      } catch {
        failures.push(
          `"! ${unsetName}" under "${rule.path}" in ${relativePath} is not a header the runtime accepts, so every matching asset answers 500`,
        );
      }
    }
  }

  return failures;
}

function collectHeaderFileFailures(
  context,
  relativePath,
  { downloadPaths, staticAssetPaths },
  isBuildOutput = false,
) {
  if (!repoFileExists(context, relativePath)) {
    const missing = isBuildOutput
      ? MISSING_BUILT_HEADER_FILE
      : MISSING_SOURCE_HEADER_FILE;
    return [`${missing}: ${relativePath}`];
  }

  const rules = parseWranglerHeaderRules(readRepoFile(context, relativePath));

  // 查的是「一个真实路径最终被怎样服务」，不是「文件里有没有某一行」。
  //
  // 构建产物的缓存时长确实钉死在一年 immutable：那些文件名带内容哈希，改内容就
  // 换文件名，业主没有理由去调它。`/downloads/*` 和 `/images/*` 的缓存秒数不查
  // ——那两个是业主可调参数，钉死数字会让他一改就红而意图完全没坏。
  return [
    ...collectDuplicateRouteFailures(rules, relativePath),
    ...collectUnprovableHostFailures(rules, relativePath),
    ...collectInvalidHeaderFailures(rules, relativePath),
    ...staticAssetPaths.flatMap((assetPath) =>
      collectServedPathFailures(
        rules,
        relativePath,
        assetPath,
        `Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      ),
    ),
    ...downloadPaths.flatMap((downloadPath) =>
      collectServedPathFailures(
        rules,
        relativePath,
        downloadPath,
        EXPECTED_DOWNLOADS_NOINDEX,
      ),
    ),
  ];
}

function createCloudflareStaticAssetHeaderContext({
  rootDir = process.cwd(),
  existsSync = fs.existsSync,
  readFileSync = fs.readFileSync,
  readdirSync = fs.readdirSync,
  statSync = fs.statSync,
} = {}) {
  return {
    rootDir,
    existsSync,
    readFileSync,
    readdirSync,
    statSync,
  };
}

/**
 * 读出 wrangler 真正会发布哪个目录。
 *
 * 以前这里查的是 `wrangler.jsonc` 里有没有出现 `".open-next/assets"` 这串字符。
 * 那证明不了任何事：一条 `// old: ".open-next/assets"` 的注释就能让它过，而
 * `"directory"` 早就改成了别的目录——门禁去证明一个根本不会被发布的目录，线上那份
 * 真资产一个文件都没查。所以按 JSONC 解析取真实值，注释既满足不了它也绊不倒它。
 */
function readAssetsDirectories(context) {
  if (!repoFileExists(context, WRANGLER_CONFIG_PATH)) {
    return { error: `missing ${WRANGLER_CONFIG_PATH}` };
  }

  const { config, error } = ts.parseConfigFileTextToJson(
    WRANGLER_CONFIG_PATH,
    readRepoFile(context, WRANGLER_CONFIG_PATH),
  );
  if (error) {
    return { error: `${WRANGLER_CONFIG_PATH} could not be parsed` };
  }

  // 命名环境可以覆盖 assets，而线上就是 `--env production` 发的
  // （.github/workflows/cloudflare-deploy.yml）。wrangler 的 `inheritable`
  // 是 `rawEnv[field] ?? topLevelEnv[field]`（cli.js:29494），环境里写了就以它为准。
  // 只读顶层的话，只要有人给 env.production 换个目录，门禁就在证明一个不会上线的
  // 目录。所有会被发布的目录逐个证明，一个都不放过。
  const directories = new Set();
  for (const scope of [config, ...Object.values(config?.env ?? {})]) {
    const directory = scope?.assets?.directory;
    if (typeof directory === "string" && directory !== "") {
      directories.add(directory);
    }
  }

  if (directories.size === 0) {
    return {
      error: `${WRANGLER_CONFIG_PATH} has no assets.directory, so there is no way to tell which files get published`,
    };
  }

  return { directories: [...directories] };
}

/**
 * `.html` 文件在 Workers Assets 上是从**去掉扩展名**的那条 URL 发出去的。
 *
 * 默认 `html_handling` 是 `auto-trailing-slash`：请求 `/downloads/x` 会直接返回
 * `/downloads/x.html` 的内容，而请求真实文件名 `/downloads/x.html` 反倒 307 跳到
 * `/downloads/x`。响应头按**请求里的原始路径**匹配，所以真正需要被证明的是
 * `/downloads/x`，而按磁盘文件名枚举出来的是 `/downloads/x.html`——两条不同的路径，
 * 一条落在别名上的撤销规则门禁完全看不见。
 *
 * 2026-07-28 实测：`.open-next/assets/downloads/alias-probe.pdf.html` 加上
 * `/downloads/alias-probe.pdf` + `! X-Robots-Tag` 之后，`/downloads/alias-probe.pdf`
 * 返回 200 和文件内容，响应里没有 `x-robots-tag`。
 *
 * 这里不去移植整套 `html_handling`（还有 `index.html`、结尾斜杠等好几种情形，而且
 * 它在 `wrangler.jsonc` 里可配）。受保护目录里今天一个 `.html` 都没有，所以直接判红
 * 并说清原因：真要发 HTML 下载，那时候再把这套别名规则老老实实移植进来。
 */
function collectHtmlAliasFailures(servedPaths, sourceDir) {
  return servedPaths
    .filter((servedPath) => servedPath.endsWith(".html"))
    .map(
      (servedPath) =>
        `${servedPath} in ${sourceDir} is served from its extensionless alias instead, and this check cannot prove that alias`,
    );
}

/**
 * 两个会改变「哪些文件、在哪条 URL 上被发出去」的资产根文件。有就判红。
 *
 * `_redirects` 里的 `200` 是重写不是跳转：另一条 URL 直接把受保护的文件发出去，
 * 而响应头按那条 URL 匹配，`/downloads/*` 底下的 noindex 根本不参与。2026-07-28
 * 实测：`/catalog-probe /downloads/spec-sheet-tb-bw.pdf 200` 之后，`/catalog-probe`
 * 返回 200 和真实 PDF，响应里没有 `x-robots-tag`。
 *
 * `.assetsignore` 决定哪些文件根本不上传（cli.js:124017）。整段 `/downloads/**`
 * 忽略掉之后，磁盘上 PDF 一个不少、门禁全绿，线上却全部 404。
 *
 * 这里不去半懂不懂地解析它们——占位符目标、百分号编码的目标、gitignore 通配，
 * 每一种都能绕开一个字符串扫描，上一版就是这么漏的。仓库当前两个文件都没有，
 * 所以直接判红并说清原因：真要用，那时候再把对应的解析器老老实实移植进来。
 */
function collectUnmodelledAssetFileFailures(context, directory) {
  return [ASSET_REDIRECTS_FILENAME, ASSET_ASSETSIGNORE_FILENAME]
    .map((filename) => `${directory}/${filename}`)
    .filter((relativePath) => repoFileExists(context, relativePath))
    .map(
      (relativePath) =>
        `${relativePath} changes which files are published and on which URLs, and this check cannot model it`,
    );
}

function collectEmptyDirectoryFailure(
  paths,
  sourceDir,
  expectedHeader,
  isBuildOutput = false,
) {
  // null 表示目录名算不出来。那不是「空」，由 collectUnresolvableDirectoryFailures
  // 去说清是什么问题——在这里再说一句「里面没文件」是不成立的。
  if (paths === null || paths.length > 0) return [];
  return [
    `${sourceDir} ${isBuildOutput ? HOLDS_NO_BUILT_FILES : HOLDS_NO_FILES}, so nothing proves "${expectedHeader}" reaches a real file`,
  ];
}

function collectPublishedDirectoryFailures(context, directory) {
  const assetHeadersPath = `${directory}/${ASSET_HEADERS_FILENAME}`;
  const assetDownloadsDir = `${directory}/${DOWNLOADS_ASSET_SUBDIR}`;
  const assetStaticDir = `${directory}/${STATIC_ASSET_SUBDIR}`;

  // 源目录和发布目录都要枚举。只查 `public/downloads` 的话，构建时才生成、只存在
  // 于发布目录里的 PDF 一份都没查过；只查发布目录的话，源码里新加的 PDF 要等下次
  // 构建才有人管。两边并起来，谁多出一份都得有人证明它带着 noindex。
  //
  // 目录名算不出来时一条路径都不列：拿写死的前缀继续算，出来的每一条结论说的都是
  // 一条线上不存在的 URL。这三个目录各判各的，一个算不出来不影响另外两个照常证明。
  const listResolved = (baseDir, urlSubdir) => {
    const resolution = resolveServedDir(context, baseDir, urlSubdir);
    // 只有「名字被折叠了」才不列——那时按写死的前缀算出来的每一条 URL 都不存在。
    // 目录不在是「一条都证明不了」，照常报空目录；上层列不出来时名字本身没问题，
    // 逐文件证明照常跑，那份被撤销了 noindex 的 PDF 不能因此消音。
    if (resolution === "folded") return null;
    if (resolution === "missing") return [];
    return listServedPaths(context, `${baseDir}/${urlSubdir}`, `/${urlSubdir}`);
  };
  const sourceDownloadPaths = listResolved(
    PUBLIC_SOURCE_DIR,
    DOWNLOADS_ASSET_SUBDIR,
  );
  const assetDownloadPaths = listResolved(directory, DOWNLOADS_ASSET_SUBDIR);
  const staticAssetPaths = listResolved(directory, STATIC_ASSET_SUBDIR);

  // 目录空了或者被改了名，逐文件证明就一条都不剩，而门禁会安安静静地全绿。
  // 这个仓库靠 PDF 接询盘，「没有可证明的东西」在这里就是失败。
  const failures = [
    ...collectEmptyDirectoryFailure(
      sourceDownloadPaths,
      DOWNLOADS_SOURCE_DIR,
      EXPECTED_DOWNLOADS_NOINDEX,
    ),
    ...collectEmptyDirectoryFailure(
      assetDownloadPaths,
      assetDownloadsDir,
      EXPECTED_DOWNLOADS_NOINDEX,
      true,
    ),
    ...collectEmptyDirectoryFailure(
      staticAssetPaths,
      assetStaticDir,
      `Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      true,
    ),
    ...collectUnresolvableDirectoryFailures(
      context,
      PUBLIC_SOURCE_DIR,
      DOWNLOADS_ASSET_SUBDIR,
    ),
    ...collectUnresolvableDirectoryFailures(
      context,
      directory,
      DOWNLOADS_ASSET_SUBDIR,
    ),
    ...collectUnresolvableDirectoryFailures(
      context,
      directory,
      STATIC_ASSET_SUBDIR,
    ),
    // 一个磁盘文件被发出去的 URL 不一定只有它自己那条。这两类别名会让被证明的
    // 路径和实际被请求的路径对不上，所以直接判红。
    ...collectHtmlAliasFailures(
      sourceDownloadPaths ?? [],
      DOWNLOADS_SOURCE_DIR,
    ),
    ...collectHtmlAliasFailures(assetDownloadPaths ?? [], assetDownloadsDir),
    ...collectHtmlAliasFailures(staticAssetPaths ?? [], assetStaticDir),
    ...collectUnmodelledAssetFileFailures(context, directory),
    ...collectUnmodelledAssetFileFailures(context, PUBLIC_SOURCE_DIR),
  ];

  const servedPaths = {
    downloadPaths: [
      ...new Set([
        ...(sourceDownloadPaths ?? []),
        ...(assetDownloadPaths ?? []),
      ]),
    ].sort(),
    staticAssetPaths: staticAssetPaths ?? [],
  };
  failures.push(
    ...collectHeaderFileFailures(context, SOURCE_HEADERS_PATH, servedPaths),
    ...collectHeaderFileFailures(context, assetHeadersPath, servedPaths, true),
  );

  return failures;
}

function collectCloudflareStaticAssetHeaderFailures(options = {}) {
  const context = createCloudflareStaticAssetHeaderContext(options);
  const { directories, error } = readAssetsDirectories(context);
  // 不知道发布哪个目录就什么都证明不了。这里直接停，不拿写死的目录顶上——那正是
  // 上一版的假绿来源。
  if (error !== undefined) return [error];

  // 同一个目录被多个环境用到时，重复的报错去掉，说的是同一件事。
  const failures = new Set();
  for (const directory of directories) {
    for (const failure of collectPublishedDirectoryFailures(
      context,
      directory,
    )) {
      failures.add(failure);
    }
  }

  return [...failures];
}

function runCloudflareStaticAssetHeaderCli(options = {}) {
  const failures = collectCloudflareStaticAssetHeaderFailures(options);

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`Cloudflare static asset header check failed: ${failure}`);
    }
    const needsBuild = failures.some(
      (failure) =>
        failure.startsWith(MISSING_BUILT_HEADER_FILE) ||
        failure.includes(` ${HOLDS_NO_BUILT_FILES},`),
    );
    if (needsBuild) {
      console.error(
        "Run `pnpm build` then `pnpm website:build:cf` before this artifact check.",
      );
    }
    return false;
  }

  console.log(
    "Cloudflare static asset headers are present in source and OpenNext output.",
  );
  return true;
}

module.exports = {
  EXPECTED_DOWNLOADS_NOINDEX,
  EXPECTED_STATIC_ASSET_CACHE_CONTROL,
  SOURCE_HEADERS_PATH,
  collectCloudflareStaticAssetHeaderFailures,
  createCloudflareStaticAssetHeaderContext,
  runCloudflareStaticAssetHeaderCli,
};
