import React, { useState } from 'react';
import { Brain, Sparkles, Loader2, Send, MessageSquare, Lightbulb } from 'lucide-react';
import { aiAPI } from '../services/api';

const AIInsight = () => {
  const [insight, setInsight] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const generateInsight = async () => {
    setGenerating(true);
    setError('');
    setInsight(null);
    
    try {
      const res = await aiAPI.generateInsight();
      if (res.data.success) {
        setInsight(res.data);
      } else {
        setError(res.data.error || 'Tạo phân tích thất bại');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Có lỗi xảy ra');
    } finally {
      setGenerating(false);
    }
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await aiAPI.chat(userMessage);
      if (res.data.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.answer }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'error', content: res.data.error || 'Có lỗi xảy ra' }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { 
        role: 'error', 
        content: err.response?.data?.detail || 'Có lỗi xảy ra' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const suggestedQuestions = [
    'Khách hàng nào đang nợ nhiều nhất?',
    'Đơn hàng nào có lãi cao nhất tháng này?',
    'Tổng doanh thu tháng này so với tháng trước?',
    'Có bao nhiêu đơn chưa thanh toán?',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Brain className="w-8 h-8 mr-3 text-primary" />
            AI Insight
          </h1>
          <p className="text-muted-foreground mt-1">
            Phân tích kinh doanh thông minh với Gemini AI
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insight Generator */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-primary" />
              Phân tích tháng
            </h2>
            <button
              onClick={generateInsight}
              disabled={generating}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Đang phân tích...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Tạo phân tích
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {!insight && !generating && !error && (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                Nhấn "Tạo phân tích" để AI phân tích dữ liệu kinh doanh của bạn
              </p>
            </div>
          )}

          {insight && (
            <div className="space-y-4">
              <div className="bg-background rounded-lg p-4 border border-border">
                <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                  {insight.insight}
                </pre>
              </div>
              {insight.data_summary && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Xem dữ liệu phân tích
                  </summary>
                  <pre className="mt-2 p-3 bg-background rounded-lg border border-border text-xs overflow-x-auto">
                    {JSON.stringify(insight.data_summary, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Chat with AI */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-primary" />
            Hỏi AI Agent
          </h2>

          {/* Chat Messages */}
          <div className="h-80 overflow-y-auto mb-4 space-y-3 p-3 bg-background rounded-lg border border-border">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground opacity-50 mb-2" />
                <p className="text-sm text-muted-foreground mb-4">
                  Hỏi bất kỳ điều gì về dữ liệu kinh doanh của bạn
                </p>
                <div className="space-y-2 w-full">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setChatInput(q)}
                      className="block w-full text-left text-sm px-3 py-2 bg-card hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors border border-border"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : msg.role === 'error'
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : 'bg-card text-foreground border border-border'
                      }`}
                    >
                      <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-card text-foreground border border-border rounded-lg p-3 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={sendChatMessage} className="flex space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              disabled={chatLoading}
              className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIInsight;
