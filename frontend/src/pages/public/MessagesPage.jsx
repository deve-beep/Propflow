import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { messageService } from '../../services/resources';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/format';
import { EmptyState, PageLoader } from '../../components/ui/Primitives';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    messageService
      .listConversations()
      .then(({ data }) => {
        setConversations(data.data);
        if (data.data.length > 0) setActiveId(data.data[0]._id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeId) return;
    messageService.getMessages(activeId).then(({ data }) => setMessages(data.data));

    socket?.emit('conversation:join', activeId);
    return () => socket?.emit('conversation:leave', activeId);
  }, [activeId, socket]);

  useEffect(() => {
    if (!socket) return;
    const handleNew = (message) => {
      if (message.conversation === activeId) {
        setMessages((prev) => [...prev, message]);
      }
      setConversations((prev) =>
        prev.map((c) => (c._id === message.conversation ? { ...c, lastMessage: { text: message.text, sentAt: message.createdAt } } : c))
      );
    };
    socket.on('message:new', handleNew);
    return () => socket.off('message:new', handleNew);
  }, [socket, activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim() || !socket || !activeId) return;
    socket.emit('message:send', { conversationId: activeId, text: draft }, (ack) => {
      if (ack?.error) console.error(ack.error);
    });
    setDraft('');
  };

  const activeConversation = conversations.find((c) => c._id === activeId);
  const otherParticipant = activeConversation?.participants?.find((p) => p._id !== user._id);

  if (loading) return <PageLoader />;

  if (conversations.length === 0) {
    return <EmptyState icon={MessageSquare} title="No conversations yet" description="Messages from property enquiries will appear here." />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-[70vh] bg-white border border-stone-100">
      <div className="border-r border-stone-100 overflow-y-auto">
        {conversations.map((c) => {
          const other = c.participants?.find((p) => p._id !== user._id);
          return (
            <button
              key={c._id}
              onClick={() => setActiveId(c._id)}
              className={`w-full text-left px-4 py-3 border-b border-stone-50 flex items-center gap-3 ${activeId === c._id ? 'bg-ivory-100' : 'hover:bg-ivory-50'}`}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-charcoal-900 text-white flex items-center justify-center text-xs">
                  {other?.name?.charAt(0)}
                </div>
                {onlineUsers.has(other?._id) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-olive-500 border-2 border-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-charcoal-900 truncate">{other?.name}</p>
                <p className="text-xs text-charcoal-500 truncate">{c.lastMessage?.text}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="md:col-span-2 flex flex-col">
        <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
          <p className="text-sm font-medium text-charcoal-900">{otherParticipant?.name}</p>
          {onlineUsers.has(otherParticipant?._id) && <span className="text-xs text-olive-600">Online</span>}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.map((m) => (
            <div key={m._id} className={`flex ${m.sender._id === user._id ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] px-4 py-2 text-sm ${
                  m.sender._id === user._id ? 'bg-charcoal-900 text-white' : 'bg-ivory-100 text-charcoal-800'
                }`}
              >
                {m.text}
                <p className={`text-[10px] mt-1 ${m.sender._id === user._id ? 'text-charcoal-300' : 'text-charcoal-400'}`}>
                  {formatDate(m.createdAt)}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-stone-100 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message..."
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary px-4">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
