/**
 * 解析 AI 返回的消息内容
 * 支持 JSON 格式：{ "type": "image", "content": "url" }
 * 支持特定文本格式：[类型：内容]，例如 [向你转账：100元]
 * 默认为 text 类型
 */
export function parseAiResponse(response) {
  if (!response || typeof response !== 'string') {
    return { type: 'text', content: '' };
  }

  const trimmed = response.trim();

  // 1. 尝试解析 JSON
  try {
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const data = JSON.parse(trimmed);
      if (data.type && data.content) {
        // 允许的类型列表，防止注入非法类型
        const allowedTypes = ['text', 'image', 'voice', 'sticker', 'location', 'transfer'];
        if (allowedTypes.includes(data.type)) {
            return { type: data.type, content: data.content };
        }
      }
    }
  } catch (e) {
    // JSON 解析失败，继续尝试正则匹配
  }

  // 2. 尝试正则匹配特殊格式
  // 格式：[类型：内容] 或 [动作：内容]
  const patterns = [
    { regex: /^\[(图片|发送了一张图片|分享了一张图片)[：:]\s*(.+?)\]$/i, type: 'image' },
    { regex: /^\[(表情包|发送了一个表情包|emoji)[：:]\s*(.+?)\]$/i, type: 'sticker' },
    { regex: /^\[(语音|发送了一条语音|语音消息)[：:]\s*(.+?)\]$/i, type: 'voice' },
    { regex: /^\[(位置|分享了一个位置|定位)[：:]\s*(.+?)\]$/i, type: 'location' },
    { regex: /^\[(转账|向你转账)[：:]\s*(.+?)\]$/i, type: 'transfer' },
    { regex: /^\[角色收取了用户的转账[：:]\s*(.+?)\]$/i, type: 'transfer_accepted' },
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern.regex);
    if (match) {
      return { type: pattern.type, content: match[2].trim() };
    }
  }

  // 3. 默认作为文本处理
  return { type: 'text', content: response };
}
