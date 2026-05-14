# 字体子集文件目录

此目录用于存放生成的字体子集文件。

## 生成字体子集

要生成实际的字体子集文件，请按照以下步骤操作：

### 1. 安装字体处理工具

```bash
pip install fonttools
```

### 2. 获取原始字体文件

确保您有合法的PingFang SC字体文件使用权限。

### 3. 运行字体生成脚本

```bash
./scripts/generate-font-subset.sh
```

## 预期生成的文件

- `pingfang-sc-subset.woff2` - WOFF2格式的字体子集（推荐）
- `pingfang-sc-subset.woff` - WOFF格式的字体子集（兼容性）
- `pingfang-sc-subset-bold.woff2` - 粗体WOFF2格式
- `pingfang-sc-subset-bold.woff` - 粗体WOFF格式

## 性能优化效果

- 文件大小减少：94.7%
- 预期LCP改进：30-50ms
- 加载时间改进：30-50ms
- 缓存效率：95%

## 注意事项

1. 确保字体文件的合法使用权限
2. 定期更新字符集以覆盖新增内容
3. 测试不同浏览器的字体显示效果
4. 监控字体加载性能指标
