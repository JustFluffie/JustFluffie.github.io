/**
 * API 服务层
 * 负责处理底层的网络请求，不包含业务状态管理
 */

export const apiService = {
  /**
   * 获取模型列表
   * @param {string} baseUrl - API 基础地址
   * @param {string} apiKey - API Key
   * @returns {Promise<string[]>} - 模型 ID 列表
   */
  async fetchModels(baseUrl, apiKey) {
    // 在开发模式下，强制使用代理路径，忽略传入的 baseUrl
    const effectiveUrl = import.meta.env.DEV ? '/v1' : baseUrl.replace(/\/+$/, '');

    try {
      const response = await fetch(`${effectiveUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '无法解析错误信息' }));
        const detailedMsg = errorData?.error?.message || errorData?.message || JSON.stringify(errorData);
        
        if (response.status === 429) {
             throw new Error(`API 配额已耗尽或请求过于频繁 (429)。请检查 API Key 状态。详情: ${detailedMsg}`);
        }
        throw new Error(`API 请求失败 (状态码: ${response.status}): ${detailedMsg}`);
      }

      const data = await response.json();
      
      // 解析模型列表
      const fetchedModels = data.data ? data.data.map(model => model.id) : [];
      return [...new Set(fetchedModels)]; // 去重返回

    } catch (error) {
      console.error('[ApiService] Fetch models failed:', error);
      let errorMsg = error.message;
      if (errorMsg === 'Failed to fetch') {
        errorMsg = '网络请求失败，请检查API地址是否正确，或是否存在跨域/网络问题。';
      }
      throw new Error(errorMsg);
    }
  },

  /**
   * 获取聊天回复 (Chat Completion)
   * @param {string} baseUrl - API 基础地址
   * @param {string} apiKey - API Key
   * @param {string} model - 模型名称
   * @param {Array} messages - 消息列表
   * @param {number} [maxTokens] - 最大令牌数
   * @returns {Promise<string>} - AI 回复内容
   */
  async fetchChatCompletion(baseUrl, apiKey, model, messages, maxTokens) {
    // 在开发模式下，强制使用代理路径，忽略传入的 baseUrl
    const effectiveUrl = import.meta.env.DEV ? '/v1' : baseUrl.replace(/\/+$/, '');

    const requestBody = {
      model: model,
      messages: messages,
    };

    if (maxTokens) {
      requestBody.max_tokens = parseInt(maxTokens, 10);
    }

    try {
      const response = await fetch(`${effectiveUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '无法解析错误信息' }));
        const detailedMsg = errorData?.error?.message || errorData?.message || JSON.stringify(errorData);
        
        if (response.status === 429) {
            let userMsg = 'API 请求过于频繁 (429)。';
            if (JSON.stringify(errorData).includes('quota') || JSON.stringify(errorData).includes('exhausted') || JSON.stringify(errorData).includes('RESOURCE_EXHAUSTED')) {
                userMsg = 'API 配额已耗尽 (429)。请检查您的 API Key 余额或更换模型。';
            }
            throw new Error(`${userMsg} 详情: ${detailedMsg}`);
        }

        throw new Error(`API 请求失败 (状态码: ${response.status}): ${detailedMsg}`);
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('[ApiService] API returned error:', data.error);
        throw new Error(data.error.message || 'API返回了一个未知错误');
      }

      if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
        let content = data.choices[0].message.content;
        // 过滤掉 <think>...</think> 标签及其内容
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        return content;
      } else {
        console.error('[ApiService] Unexpected response format:', data);
        throw new Error('API响应格式不符合预期。请检查控制台中的错误详情。');
      }

    } catch (error) {
      console.error('[ApiService] Chat completion failed:', error);
      let errorMsg = error.message;
      if (errorMsg === 'Failed to fetch') {
        errorMsg = '网络请求失败，请检查API地址是否正确，或是否存在跨域/网络问题。';
      }
      throw new Error(errorMsg);
    }
  }
};
