import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './SellerChatModal.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const SellerChatModal = ({ isOpen, onClose, chat, seller }) => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef(null);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Socket connection
    useEffect(() => {
        if (!isOpen || !chat) return;

        const newSocket = io(API_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('Seller socket connected');
            setIsConnected(true);
            
            // Join the chat room for this order
            newSocket.emit('joinChat', {
                orderId: chat.orderId._id || chat.orderId,
                userId: seller._id,
                userRole: 'seller'
            });
        });

        newSocket.on('chatHistory', (history) => {
            console.log('Received chat history:', history);
            setMessages(history || []);
        });

        newSocket.on('newMessage', (message) => {
            console.log('Received new message:', message);
            setMessages(prev => [...prev, message]);
            
            // Mark as read if it's from customer
            if (message.sender !== seller._id) {
                newSocket.emit('markAsRead', {
                    orderId: chat.orderId._id || chat.orderId,
                    userId: seller._id
                });
            }
        });

        newSocket.on('disconnect', () => {
            console.log('Seller socket disconnected');
            setIsConnected(false);
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [isOpen, chat, seller]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        
        if (!newMessage.trim() || !socket || !isConnected) return;

        const messageData = {
            orderId: chat.orderId._id || chat.orderId,
            senderId: seller._id,
            message: newMessage.trim()
        };

        console.log('Sending message:', messageData);
        socket.emit('sendMessage', messageData);
        setNewMessage('');

        // Mark as read after seller sends a reply
        setTimeout(() => {
            socket.emit('markAsRead', {
                orderId: chat.orderId._id || chat.orderId,
                userId: seller._id
            });
        }, 300);
    };

    if (!isOpen || !chat) return null;

    const order = chat.orderId;
    const customer = chat.customer;

    return (
        <div className="seller-chat-modal-overlay" onClick={onClose}>
            <div className="seller-chat-modal" onClick={(e) => e.stopPropagation()}>
                {/* Chat Header */}
                <div className="seller-chat-header">
                    <div className="seller-chat-header-info">
                        <div className="seller-customer-avatar">
                            <i className="fas fa-user-circle"></i>
                        </div>
                        <div className="seller-chat-details">
                            <h3>{customer?.name || customer?.fullName || 'Customer'}</h3>
                            <div className="seller-order-info">
                                <span className="seller-order-id">
                                    <i className="fas fa-shopping-bag"></i>
                                    Order #{order?.orderNumber || order?._id?.slice(-6)}
                                </span>
                                <span className="seller-order-amount">
                                    ₹{order?.totalAmount?.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="seller-chat-actions">
                        <span className={`seller-connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                            <i className={`fas fa-circle ${isConnected ? 'text-green' : 'text-red'}`}></i>
                            {isConnected ? 'Connected' : 'Connecting...'}
                        </span>
                        <button onClick={onClose} className="seller-chat-close-btn">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="seller-chat-messages">
                    {messages.length === 0 ? (
                        <div className="seller-no-messages">
                            <i className="fas fa-comments"></i>
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            // Convert IDs to strings for proper comparison
                            const msgSenderId = msg.sender?._id?.toString() || msg.sender?.toString() || msg.sender;
                            const sellerId = seller._id?.toString() || seller.id?.toString();
                            const isOwnMessage = msgSenderId === sellerId;
                            
                            console.log('Message sender:', msgSenderId, 'Seller ID:', sellerId, 'Is own:', isOwnMessage);
                            
                            return (
                                <div
                                    key={index}
                                    className={`seller-message ${isOwnMessage ? 'seller-own-message' : 'seller-other-message'}`}
                                >
                                    <div className="seller-message-bubble">
                                        <p>{msg.content || msg.message}</p>
                                        <div className="seller-message-meta">
                                            <span className="seller-message-time">
                                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                            {isOwnMessage && msg.read && (
                                                <i className="fas fa-check-double seller-read-indicator"></i>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="seller-chat-input-form">
                    <div className="seller-chat-input-container">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="seller-chat-textarea"
                            rows="2"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            disabled={!isConnected}
                        />
                        <div className="seller-chat-actions">
                            {newMessage.trim() && (
                                <button
                                    type="button"
                                    className="seller-chat-clear-btn"
                                    onClick={() => setNewMessage('')}
                                    title="Clear message"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                            <button
                                type="submit"
                                className="seller-chat-send-btn"
                                disabled={!newMessage.trim() || !isConnected}
                            >
                                <i className="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SellerChatModal;
