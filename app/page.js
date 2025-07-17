"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

export default function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Format message content for better readability
  const formatMessage = (content) => {
    // Split by double newlines to create paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      // Handle code blocks (```...```)
      if (paragraph.includes('```')) {
        const parts = paragraph.split('```');
        return (
          <div key={index} className="mb-3">
            {parts.map((part, partIndex) => {
              if (partIndex % 2 === 1) {
                // This is inside code blocks
                return (
                  <pre key={partIndex} className="bg-gray-800 text-green-400 p-3 rounded-md overflow-x-auto text-sm my-2">
                    <code>{part.trim()}</code>
                  </pre>
                );
              } else {
                // Regular text
                return part.trim() && (
                  <div key={partIndex} className="whitespace-pre-wrap">
                    {formatInlineElements(part.trim())}
                  </div>
                );
              }
            })}
          </div>
        );
      }
      
      // Handle regular paragraphs
      return (
        <div key={index} className="mb-3 whitespace-pre-wrap">
          {formatInlineElements(paragraph)}
        </div>
      );
    });
  };

  // Format inline elements like bold, italic, inline code
  const formatInlineElements = (text) => {
    const parts = [];
    let currentIndex = 0;
    
    // Simple regex patterns for common markdown
    const patterns = [
      { regex: /`([^`]+)`/g, component: (match, content) => 
        <code key={currentIndex++} className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">
          {content}
        </code>
      },
      { regex: /\*\*([^*]+)\*\*/g, component: (match, content) => 
        <strong key={currentIndex++} className="font-semibold">
          {content}
        </strong>
      },
      { regex: /\*([^*]+)\*/g, component: (match, content) => 
        <em key={currentIndex++} className="italic">
          {content}
        </em>
      },
    ];

    let processedText = text;
    const elements = [];
    
    // For simple implementation, just split by newlines and preserve them
    return processedText.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < processedText.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const aiMessage = { 
        role: 'assistant', 
        content: data.content 
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">Hardass</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Start a conversation...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      {formatMessage(message.content)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSubmit(e);
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}