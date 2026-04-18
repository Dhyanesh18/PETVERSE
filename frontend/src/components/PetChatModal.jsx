import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './ChatModal.css';

const PetChatModal = ({ isOpen, onClose, pet, seller, user }) => {
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
        if (isOpen && pet && seller && user) {
            // Connect to socket
            const socketInstance = io('', {
                withCredentials: true
            });

            socketInstance.on('connect', () => {
                console.log('Socket connected for pet inquiry');
                setIsConnected(true);
                
                // Join pet chat room
                socketInstance.emit('joinPetChat', {
                    petId: pet._id,
                    customerId: user.id || user._id,
                    sellerId: seller._id || seller
                });
            });

            socketInstance.on('chatHistory', (history) => {
                setMessages(history);
                
                // Mark messages as read when customer opens the chat
                setTimeout(() => {
                    socketInstance.emit('markPetInquiryAsRead', {
                        petId: pet._id,
                        customerId: user.id || user._id,
                        sellerId: seller._id || seller,
                        userId: user.id || user._id
                    });
                }, 500);
            });

            socketInstance.on('newMessage', (message) => {
                setMessages(prev => [...prev, message]);
                
                // Mark as read if message is from seller (not from customer)
                const currentUserId = user.id || user._id;
                if (message.sender?._id !== currentUserId && message.sender !== currentUserId) {
                    setTimeout(() => {
                        socketInstance.emit('markPetInquiryAsRead', {
                            petId: pet._id,
                            customerId: user.id || user._id,
                            sellerId: seller._id || seller,
                            userId: user.id || user._id
                        });
                    }, 300);
                }
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
    }, [isOpen, pet, seller, user]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        
        if (!newMessage.trim() || !socket || !isConnected) return;

        socket.emit('sendPetMessage', {
            petId: pet._id,
            customerId: user.id || user._id,
            sellerId: seller._id || seller,
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

    const sellerName = seller?.businessName || seller?.fullName || seller?.username || 'Seller';
    const petName = pet?.name || 'Pet';

    return (
        <div className="chat-modal-overlay" onClick={onClose}>
            <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
                <div className="chat-header">
                    <div className="chat-header-info">
                        <h3>
                            <i className="fas fa-comments"></i>
                            Chat with {sellerName}
                        </h3>
                        <p className="chat-order-info">
                            About: {petName}
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
                            <p>No messages yet. Ask the seller about {petName}!</p>
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
                                        {isOwnMessage ? 'You' : (msg.sender?.name || sellerName)}
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
                        placeholder={`Ask about ${petName}...`}
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

export default PetChatModal;
