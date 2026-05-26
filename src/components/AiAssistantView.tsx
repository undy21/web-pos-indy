import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  User, 
  Cpu, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Clock,
  X,
  Bot
} from 'lucide-react';
import { Product, Transaction, CashFlow } from '../types';

interface AiAssistantProps {
  products: Product[];
  transactions: Transaction[];
  cashflows: CashFlow[];
  currentBranchId: string;
}

interface ChatMessage {
  sender: 'USER' | 'AI';
  text: string;
  timestamp: Date;
}

// Lightweight solid Markdown parsing handler
function parseInlineStyles(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={idx} className="italic text-slate-600">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px] text-indigo-600">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function parseMarkdown(text: string) {
  const lines = text.split('\n');
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;
  
  const elements: React.ReactNode[] = [];
  let currentListItems: React.ReactNode[] = [];
  
  const flushList = (key: string | number) => {
    if (currentListItems.length > 0) {
      if (listType === 'ol') {
        elements.push(<ol key={`ol-${key}`} className="list-decimal pl-5 space-y-1 my-1">{...currentListItems}</ol>);
      } else {
        elements.push(<ul key={`ul-${key}`} className="list-disc pl-5 space-y-1 my-1">{...currentListItems}</ul>);
      }
      currentListItems = [];
      inList = false;
      listType = null;
    }
  };

  lines.forEach((line, idx) => {
    // Headings
    if (line.startsWith('### ')) {
      flushList(idx);
      elements.push(<h4 key={idx} className="text-sm font-bold text-slate-900 mt-2 mb-1">{parseInlineStyles(line.slice(4))}</h4>);
      return;
    }
    if (line.startsWith('## ')) {
      flushList(idx);
      elements.push(<h3 key={idx} className="text-base font-bold text-slate-900 mt-3 mb-1.5">{parseInlineStyles(line.slice(3))}</h3>);
      return;
    }
    if (line.startsWith('# ')) {
      flushList(idx);
      elements.push(<h2 key={idx} className="text-lg font-black text-slate-900 mt-4 mb-2">{parseInlineStyles(line.slice(2))}</h2>);
      return;
    }

    // Bullet items
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      if (!inList || listType !== 'ul') {
        flushList(idx);
        inList = true;
        listType = 'ul';
      }
      const itemContent = line.trim().slice(2);
      currentListItems.push(
        <li key={`li-${idx}`} className="text-xs text-slate-700 leading-relaxed font-medium">
          {parseInlineStyles(itemContent)}
        </li>
      );
      return;
    }

    // Numbered List
    const numMatch = line.trim().match(/^\d+\.\s(.*)/);
    if (numMatch) {
      if (!inList || listType !== 'ol') {
        flushList(idx);
        inList = true;
        listType = 'ol';
      }
      const itemContent = numMatch[1];
      currentListItems.push(
        <li key={`li-${idx}`} className="text-xs text-slate-700 leading-relaxed font-medium">
          {parseInlineStyles(itemContent)}
        </li>
      );
      return;
    }

    // Blank line
    if (!line.trim()) {
      flushList(idx);
      elements.push(<div key={idx} className="h-1.5" />);
      return;
    }

    // Paragraph
    flushList(idx);
    elements.push(
      <p key={idx} className="text-xs text-slate-700 leading-relaxed font-medium">
        {parseInlineStyles(line)}
      </p>
    );
  });

  flushList('final');
  return elements;
}

export default function AiAssistantView({
  products,
  transactions,
  cashflows,
  currentBranchId
}: AiAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'AI',
      text: 'Halo! Saya adalah **Sajian Indy AI Admin**. Saya didukung oleh modul server-side Gemini Model. Saya bisa menganalisis performa keuangan cabang Anda, merekomendasikan strategi restocking, atau memprediksi omset harian. Silahkan pilih tombol aksi cepat di bawah atau tulis pertanyaan Anda!',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Compile prompt context to send to backend to ensure AI has actual, real-time data instead of larping fake numbers!
  const getBranchContextText = () => {
    const activeProducts = products.filter(p => p.branchId === currentBranchId);
    const activeTrx = transactions.filter(t => t.branchId === currentBranchId);
    const activeCf = cashflows.filter(cf => cf.branchId === currentBranchId);

    const lowStockItems = activeProducts.filter(p => p.stock <= p.minStock).map(p => `${p.name} (Stok: ${p.stock}/${p.minStock} pcs)`);
    const totalRevenue = activeTrx.reduce((sum, t) => sum + t.finalAmount, 0);
    const bestSellingMap: Record<string, number> = {};
    
    // Simple top selling finder
    activeProducts.forEach(p => {
      bestSellingMap[p.name] = (bestSellingMap[p.name] || 0) + (100 - p.stock); // simulated momentum
    });
    const topSellers = Object.entries(bestSellingMap)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, qty]) => `${name}`);

    return {
      branchName: currentBranchId === 'b1' ? 'Cabang Jakarta Selatan' : 'Cabang Bandung',
      lowStockCount: lowStockItems.length,
      lowStockList: lowStockItems.join(', '),
      revenueToday: totalRevenue,
      topProducts: topSellers.join(', '),
      totalInventoryItems: activeProducts.length
    };
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText.trim();
    if (!textToSend) return;

    if (!customPrompt) setInputText('');

    // Append user message
    setMessages(prev => [...prev, { sender: 'USER', text: textToSend, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const activeProducts = products.filter(p => p.branchId === currentBranchId);
      const activeTrx = transactions.filter(t => t.branchId === currentBranchId);
      const activeCf = cashflows.filter(cf => cf.branchId === currentBranchId);

      const lowStockItems = activeProducts.filter(p => p.stock <= p.minStock).map(p => `${p.name} (Stok: ${p.stock}/${p.minStock} pcs)`);
      const totalRevenue = activeTrx.reduce((sum, t) => sum + t.finalAmount, 0);
      const bestSellingMap: Record<string, number> = {};
      
      activeProducts.forEach(p => {
        bestSellingMap[p.name] = (bestSellingMap[p.name] || 0) + (100 - p.stock);
      });
      const topSellers = Object.entries(bestSellingMap)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);

      const cashBalance = activeCf.reduce((sum, cf) => sum + (cf.type === 'INCOME' ? cf.amount : -cf.amount), 0);

      const response = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          context: {
            productsCount: activeProducts.length,
            transactionsCount: activeTrx.length,
            totalRevenue: totalRevenue,
            lowStockProducts: lowStockItems,
            recentTransactions: activeTrx.slice(-5),
            cashBalance: cashBalance
          }
        })
      });

      if (!response.ok) {
        throw new Error('API server busy / unavailable');
      }

      const resJson = await response.json();
      const aiReply = resJson.reply || resJson.text || 'Gagal memanggil model AI. Pastikan GEMINI_API_KEY terdaftar.';

      setMessages(prev => [...prev, { sender: 'AI', text: aiReply, timestamp: new Date() }]);
    } catch(err: any) {
      setMessages(prev => [...prev, {
        sender: 'AI',
        text: '⚠️ Maaf, gagal tersambung ke backend AI kami. Harap laporkan kendala ke Security/Audit untuk verifikasi node host server. (Detail: ' + err.message + ')',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const presetAnalyticRules = [
    {
      title: 'Analisis Penjualan & Laba Rugi',
      prompt: 'Bagaimana kondisi performa omset penjualan dan laba kotor cabang saya saat ini?',
      icon: TrendingUp,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    },
    {
      title: 'Prediksi Stok & Kebutuhan Reorder',
      prompt: 'Berdasarkan daftar stok kritis yang ada, produk mana saja yang mendesak untuk dibeli dari supplier minggu depan?',
      icon: AlertTriangle,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    },
    {
      title: 'Bundling Strategi Promosi Menu',
      prompt: 'Berikan 3 ide bundling menu promo menarik untuk meningkatkan omset kasir, koperasikan harga member dan umum kami.',
      icon: Lightbulb,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
    }
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-50 overflow-hidden h-full" id="ai_assistant_view_root">
      
      {/* Left conversation segment chat history */}
      <div className="flex-grow flex flex-col p-5 space-y-4 overflow-hidden h-full max-h-screen">
        
        {/* Chat Banner heading */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div>
            <h1 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Sajian Indy AI Admin System (Gemini)</span>
            </h1>
            <p className="text-[11px] text-slate-500">Menganalisis basis data Google Sheets milik cabang {currentBranchId === 'b1' ? 'Jakarta' : 'Bandung'} secara instan.</p>
          </div>
          <span className="text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold px-2.5 py-1 rounded">
            🤖 Model: gemini-3.5-flash
          </span>
        </div>

        {/* Scrollable message container bubble flows */}
        <div className="flex-grow overflow-y-auto space-y-4 pr-1 p-2" id="chat_messages_scroller">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 max-w-[85%] ${m.sender === 'USER' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${m.sender === 'USER' ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-teal-300'}`}>
                {m.sender === 'USER' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`rounded-3xl p-4 text-xs leading-relaxed space-y-1 shadow-xs border ${
                m.sender === 'USER' 
                  ? 'bg-slate-900 text-slate-100 border-slate-950' 
                  : 'bg-white text-slate-800 border-slate-200'
              }`}>
                {/* Custom render bolding & markdown markers simply */}
                {m.sender === 'USER' ? (
                  <p className="whitespace-pre-wrap font-medium">{m.text}</p>
                ) : (
                  <div className="space-y-1.5 leading-relaxed">{parseMarkdown(m.text)}</div>
                )}
                <div className="text-[9px] text-slate-400 font-mono text-right mt-1.5">
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 mr-auto max-w-[80%] items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-teal-300 flex items-center justify-center animate-bounce">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border rounded-2xl p-3 text-xs text-slate-400 font-bold italic animate-pulse">
                POS AI sedang memformulasikan data Google Sheets cabang Anda...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Input Form */}
        <div className="shrink-0 space-y-3.5 bg-white border border-slate-200 rounded-3xl p-3 shadow-md">
          
          {/* Preset Buttons loop */}
          <div className="flex gap-2 overflow-x-auto pb-1" id="quick_presets_scroller">
            {presetAnalyticRules.map((rule, idx) => {
              const Icon = rule.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(rule.prompt)}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border whitespace-nowrap cursor-pointer transition-all hover:bg-slate-50 disabled:opacity-50 ${rule.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{rule.title}</span>
                </button>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Tanyakan analisis profitabilitas cabang, reorder point produk, atau ide promosi..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              className="flex-grow text-xs bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 font-medium focus:outline-none"
              id="chat_keyboard_input"
            />
            
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-teal-300 disabled:opacity-40 cursor-pointer shadow-md"
              id="chat_send_trigger_btn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
