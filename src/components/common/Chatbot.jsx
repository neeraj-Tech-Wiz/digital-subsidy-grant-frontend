import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import './Chatbot.css';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hello! I am your beneficiary assistant. I can help you with schemes, applications, eligibility, and grant milestones. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const toggleChat = () => setIsOpen(!isOpen);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userText = input.trim();
        setInput('');
        setMessages(prev => [...prev, { sender: 'user', text: userText }]);
        setLoading(true);

        try {
            const response = await axiosInstance.post('/api/beneficiary/chatbot/message', {
                message: userText
            });
            const { reply } = response.data;
            setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
        } catch (error) {
            console.error('Chatbot error:', error);
            const errorMsg = error.response?.status === 401 
                ? "Your session has expired. Please log in again."
                : "Sorry, I am facing technical difficulties right now. Please try again later.";
            setMessages(prev => [...prev, { sender: 'bot', text: errorMsg, isError: true }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        }
    };

    const handleSuggested = (question) => {
        setInput(question);
    };

    const renderFormattedText = (text) => {
        if (!text) return null;
        // Split by **text**
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index}>{part.slice(2, -2)}</strong>;
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <div className="chatbot-container">
            {!isOpen && (
                <button className="chatbot-toggle-btn" onClick={toggleChat} aria-label="Open Chat">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </button>
            )}

            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <div className="chatbot-header-title">
                            <span className="chatbot-avatar">🤖</span>
                            Assistance
                        </div>
                        <button className="chatbot-close-btn" onClick={toggleChat}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`chatbot-message ${msg.sender === 'user' ? 'user-msg' : 'bot-msg'} ${msg.isError ? 'error-msg' : ''}`}>
                                <div className="message-content">{renderFormattedText(msg.text)}</div>
                            </div>
                        ))}
                        {loading && (
                            <div className="chatbot-message bot-msg">
                                <div className="message-content loading-dots">
                                    <span>.</span><span>.</span><span>.</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chatbot-suggestions">
                        <span onClick={() => handleSuggested("What are the available schemes?")}>Schemes</span>
                        <span onClick={() => handleSuggested("What is my application status?")}>My Status</span>
                        <span onClick={() => handleSuggested("What are my grant milestones?")}>Milestones</span>
                    </div>

                    <div className="chatbot-input-area">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your question..."
                            rows={1}
                            maxLength={500}
                        />
                        <button onClick={handleSend} disabled={loading || !input.trim()}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
