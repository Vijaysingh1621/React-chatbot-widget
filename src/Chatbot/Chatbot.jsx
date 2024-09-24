import 'regenerator-runtime/runtime'
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ChatBubbleOvalLeftIcon, XMarkIcon, PaperAirplaneIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import Markdown from 'react-markdown';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatBodyRef = useRef(null); // Ref to track the chat body container

  // Speech recognition
  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (!listening && transcript) {
      setInputMessage(transcript); // Set the voice input to input field
    }
  }, [transcript, listening]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const addResponseMessage = (message, sender = 'bot') => {
    setMessages((prevMessages) => [...prevMessages, { text: message, sender }]);
  };

  const addTypingMessage = () => {
    setMessages((prevMessages) => [...prevMessages, { text: 'Typing...', sender: 'bot', isTyping: true }]);
  };

  const removeTypingMessage = () => {
    setMessages((prevMessages) => prevMessages.filter((message) => !message.isTyping));
  };

  const handleNewUserMessage = async (newMessage) => {
    try {
      setIsTyping(true);
      addTypingMessage();

      const response = await axios({
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyDpD_Nbn101S4lRcggObsGv7zmqFjCvAwg`,
        method: 'POST',
        data: {
          contents: [
            {
              parts: [{ text: newMessage }],
            },
          ],
        },
      });

      const generatedContent = response.data.candidates[0].content.parts[0].text;

      removeTypingMessage();
      addResponseMessage(generatedContent, 'bot');
    } catch (error) {
      console.error('Error fetching chatbot response:', error);
      removeTypingMessage();
      addResponseMessage('Oops! Something went wrong.', 'bot');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() !== '') {
      addResponseMessage(inputMessage, 'user');
      await handleNewUserMessage(inputMessage);
      setInputMessage(''); // Clear input after sending
      resetTranscript(); // Clear voice transcript
    }
  };

  // Auto-scroll to the bottom whenever a new message is added
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return <span>Browser does not support speech recognition.</span>;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen ? (
        <button
          onClick={toggleChat}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-blue-600 transition ease-in-out duration-300"
        >
          <ChatBubbleOvalLeftIcon className="h-6 w-6" />
        </button>
      ) : (
        <div className="fixed bottom-5 right-5 w-80 bg-white rounded-lg shadow-xl border border-gray-300 transform transition-all ease-in-out duration-300">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 flex justify-between items-center rounded-t-lg">
            <span className="text-lg">Chat with us!</span>
            <button onClick={toggleChat}>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Chat Body */}
          <div
            ref={chatBodyRef} // Attach the ref to the chat body container
            className="p-3 h-64 overflow-y-auto flex flex-col space-y-2"
          >
            {messages.length > 0 ? (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-md ${
                    message.sender === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'
                  }`}
                >
                  <Markdown>{message.text}</Markdown>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">Start a conversation...</p>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-gray-300 flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} // Send on Enter key
            />
            <button
              onClick={SpeechRecognition.startListening}
              className={`p-2 ${listening ? 'bg-green-500' : 'bg-gray-300'} text-white rounded-full`}
            >
              <MicrophoneIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleSendMessage}
              className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition ease-in-out duration-300"
            >
              <PaperAirplaneIcon className="h-5 w-5 transform rotate-45" />
            </button>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
