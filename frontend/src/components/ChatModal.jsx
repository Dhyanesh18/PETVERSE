import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './ChatModal.css';

const ChatModal = ({ isOpen, onClose, order, user }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && order && user) {
            // Connect to socket
            const socketInstance = io('http://localhost:8080', {
                withCredentials: true
            });

            socketInstance.on('connect', () => {
                console.log('Socket connected');
                setIsConnected(true);
                
                // Join chat room
                socketInstance.emit('joinChat', {
                    orderId: order._id,
                    userId: user.id || user._id,
                    userRole: user.role
                });
            });

            socketInstance.on('chatHistory', (history) => {
                setMessages(history);
            });

            socketInstance.on('newMessage', (message) => {
                setMessages(prev => [...prev, message]);
            });

            socketInstance.on('disconnect', () => {
                console.log('Socket disconnected');
                setIsConnected(false);
            });

            socketInstance.on('error', (error) => {
                console.error('Socket error:', error);
                alert('Chat error: ' + error);
            });

            setSocket(socketInstance);

            return () => {
                socketInstance.disconnect();
            };
        }
    }, [isOpen, order, user]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        
        if (!newMessage.trim() || !socket || !isConnected) return;

        socket.emit('sendMessage', {
            orderId: order._id,
            senderId: user.id || user._id,
            message: newMessage.trim()
        });

        setNewMessage('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="chat-modal-overlay" onClick={onClose}>
            <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
                <div className="chat-header">
                    <div className="chat-header-info">
                        <h3>
                            <i className="fas fa-comments"></i>
                            Chat with {order.seller?.name || 'Seller'}
                        </h3>
                        <p className="chat-order-info">
                            Order #{order.orderNumber || order._id?.substring(0, 8)}
                        </p>
                    </div>
                    <button className="chat-close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="chat-connection-status">
                    {isConnected ? (
                        <span className="status-connected">
                            <i className="fas fa-circle"></i> Connected
                        </span>
                    ) : (
                        <span className="status-disconnected">
                            <i className="fas fa-circle"></i> Connecting...
                        </span>
                    )}
                </div>

                <div className="chat-messages">
                    {messages.length === 0 ? (
                        <div className="chat-empty-state">
                            <i className="fas fa-comments"></i>
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isOwnMessage = msg.sender?._id === user.id || msg.sender?._id === user._id || msg.sender === user.id || msg.sender === user._id;
                            return (
                                <div
                                    key={msg._id || index}
                                    className={`chat-message ${isOwnMessage ? 'own-message' : 'other-message'}`}
                                >
                                    <div className="message-sender">
                                        {isOwnMessage ? 'You' : (msg.sender?.name || 'Seller')}
                                    </div>
                                    <div className="message-content">{msg.content}</div>
                                    <div className="message-time">
                                        {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-form" onSubmit={handleSendMessage}>
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="chat-input"
                        rows="1"
                        disabled={!isConnected}
                    />
                    <button
                        type="submit"
                        className="chat-send-btn"
                        disabled={!newMessage.trim() || !isConnected}
                    >
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatModal;
