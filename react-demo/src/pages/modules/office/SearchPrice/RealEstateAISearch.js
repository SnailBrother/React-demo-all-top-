import React, { useState, useRef, useEffect } from 'react';
import styles from './RealEstateAISearch.module.css';

const RealEstateAISearch = () => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showExamples, setShowExamples] = useState(true);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    // 新增状态控制显示
    const [showSQL, setShowSQL] = useState(false);
    // 示例查询语句
    const exampleQueries = [
        "渝中区有哪些房源？",
        "找找江北区面积80-100平米的房子",
        "南岸区单价8000-10000元的房源有哪些？",
        "对比一下渝北和江北的房价",
        "最近半年重庆房价趋势如何？",
        "统计一下重庆各区房源分布",
        "找个预算150万左右房子",
        "两江新区的房子升值潜力如何？",
        "总价100-150万的房子有哪些？",
        "要三室两厅带装修的房子",
        "找带电梯的住宅",
        "找房，面积120平米以上",
        "沙坪坝区大学城附近房源"
    ];

    // 滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // 发送消息
    const sendMessage = async (message = inputText) => {
        if (!message.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);
        setShowExamples(false);

        try {
            const response = await fetch('/api/ai-query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: message,
                    history: messages.slice(-5).map(m => ({
                        role: m.type === 'user' ? 'user' : 'assistant',
                        content: m.content
                    }))
                }),
            });

            const data = await response.json();

            // 模拟AI打字效果
            setIsTyping(true);
            const aiResponse = data.response || "抱歉，我暂时无法回答这个问题。";
            let displayedText = '';

            const typingInterval = setInterval(() => {
                if (displayedText.length < aiResponse.length) {
                    displayedText = aiResponse.substring(0, displayedText.length + 1);

                    setMessages(prev => {
                        const lastMessage = prev[prev.length - 1];
                        if (lastMessage?.type === 'ai') {
                            return [
                                ...prev.slice(0, -1),
                                { ...lastMessage, content: displayedText }
                            ];
                        } else {
                            return [
                                ...prev,
                                {
                                    id: Date.now() + 1,
                                    type: 'ai',
                                    content: displayedText,
                                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    sql: data.sql,
                                    data: data.data,
                                    analysis: data.analysis
                                }
                            ];
                        }
                    });
                } else {
                    clearInterval(typingInterval);
                    setIsTyping(false);
                }
            }, 20);

            // 如果有SQL和数据，添加到消息中
            if (data.sql || data.data) {
                setTimeout(() => {
                    setMessages(prev => {
                        const lastMsg = prev[prev.length - 1];
                        if (lastMsg.type === 'ai') {
                            return [
                                ...prev.slice(0, -1),
                                {
                                    ...lastMsg,
                                    sql: data.sql,
                                    data: data.data,
                                    analysis: data.analysis
                                }
                            ];
                        }
                        return prev;
                    });
                }, 500);
            }

        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                id: Date.now() + 2,
                type: 'ai',
                content: "抱歉，网络连接出现问题，请稍后重试。",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // 处理示例点击
    const handleExampleClick = (example) => {
        setInputText(example);
    };

    // 处理键盘事件
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // 格式化SQL
    const formatSQL = (sql) => {
        if (!sql) return null;
        const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING', 'JOIN', 'LEFT JOIN', 'INNER JOIN', 'ON', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'BETWEEN', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL', 'DESC', 'ASC'];

        let formatted = sql;
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            formatted = formatted.replace(regex, `<span class="${styles.sqlKeyword}">${keyword}</span>`);
        });

        return { __html: formatted.replace(/\n/g, '<br>') };
    };

    // 格式化数据表格 - 移除reportsID，添加序号
    const formatData = (data) => {
        if (!data || !Array.isArray(data) || data.length === 0) return null;

        // 移除reportsID字段，并添加序号
        const formattedData = data.map((item, index) => {
            const { reportsID, ...rest } = item;
            return { 序号: index + 1, ...rest };
        });

        const headers = Object.keys(formattedData[0]);

        return (
            <div className={styles.dataTable}>
                <table>
                    <thead>
                        <tr>
                            {headers.map(header => (
                                <th key={header}>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {formattedData.slice(0, 10).map((row, index) => (
                            <tr key={index}>
                                {headers.map(header => (
                                    <td key={header}>
                                        {typeof row[header] === 'boolean'
                                            ? (row[header] ? '是' : '否')
                                            : row[header]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {formattedData.length > 10 && (
                    <div className={styles.tableNote}>
                        显示前10条记录，共 {formattedData.length} 条
                    </div>
                )}
            </div>
        );
    };

    // 渲染消息内容
    const renderMessageContent = (message) => {
        if (message.type === 'user') {
            return (
                <div className={styles.userMessage}>
                    <div className={styles.messageContent}>{message.content}</div>
                    <div className={styles.messageTime}>{message.timestamp}</div>
                </div>
            );
        }

        return (
            <div className={styles.aiMessage}>
                <div className={styles.aiContent}>
                    {message.content}
                </div>

                {showSQL && message.sql && (
                    <div className={styles.sqlSection}>
                        <div className={styles.sqlTitle}>
                            <span>📋 生成的SQL：</span>
                            <button
                                className={styles.copyBtn}
                                onClick={() => navigator.clipboard.writeText(message.sql)}
                            >
                                复制SQL
                            </button>
                        </div>
                        <div
                            className={styles.sqlCode}
                            dangerouslySetInnerHTML={formatSQL(message.sql)}
                        />
                    </div>
                )}

                {message.data && message.data.length > 0 && (
                    <div className={styles.dataSection}>
                        <div className={styles.dataTitle}>📊 查询结果：</div>
                        {formatData(message.data)}
                    </div>
                )}

                {message.analysis && (
                    <div className={styles.analysisSection}>
                        <div className={styles.analysisTitle}>📈 数据分析：</div>
                        <div className={styles.analysisContent}>{message.analysis}</div>
                    </div>
                )}
                
                <div className={styles.messageTime}>{message.timestamp}</div>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            {/* 聊天区域 - 使用flex布局 */}
            <div className={styles.chatArea}>
                {/* 消息容器 */}
                <div className={styles.messagesContainer} ref={chatContainerRef}>
                    {messages.length === 0 ? (
                        <div className={styles.welcomeSection}>
                            <div className={styles.tipsBox}>
                                <div className={styles.tipItem}>📍 支持重庆所有区域查询</div>
                                <div className={styles.tipItem}>💰 支持价格区间筛选</div>
                                <div className={styles.tipItem}>🏠 支持户型、面积、楼层查询</div>
                                <div className={styles.tipItem}>📊 支持统计分析</div>
                            </div>

                            {showExamples && (
                                <div className={styles.examplesSection}>
                                    <div className={styles.examplesTitle}>💡 试试这样问我：</div>
                                    <div className={styles.examplesGrid}>
                                        {exampleQueries.map((query, index) => (
                                            <button
                                                key={index}
                                                className={styles.exampleBtn}
                                                onClick={() => handleExampleClick(query)}
                                            >
                                                {query}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.messages}>
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`${styles.message} ${message.type === 'user' ? styles.user : styles.ai
                                        }`}
                                >
                                    {renderMessageContent(message)}
                                </div>
                            ))}
                            {isTyping && (
                                <div className={styles.typingIndicator}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* 输入区域 - 固定在底部 */}
                <div className={styles.inputContainer}>
                    <div className={styles.inputWrapper}>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="请输入您的问题，例如：重庆市渝中区有哪些房子？"
                            disabled={isLoading}
                            rows="3"
                            className={styles.textarea}
                        />
                    </div>

                    <div className={styles.displaySettings}>
                        {/* 显示SQL按钮 */}
                        <button
                            className={`${styles.toggleBtn} ${showSQL ? styles.active : ''}`}
                            onClick={() => setShowSQL(!showSQL)}
                            title={showSQL ? "隐藏SQL语句" : "显示SQL语句"}
                        >
                            📋 {showSQL ? '隐藏SQL' : '显示SQL'}
                        </button>

                        <button
                            onClick={() => sendMessage()}
                            disabled={!inputText.trim() || isLoading}
                            className={styles.sendBtn}
                        >
                            {isLoading ? (
                                <>
                                    <span className={styles.spinner}></span>
                                </>
                            ) : (
                                <svg className={styles.sendIcon} viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RealEstateAISearch;