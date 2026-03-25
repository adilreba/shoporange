import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, TrendingUp, Clock, ArrowRight, Mic, MicOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { products } from '@/data/mockData';
import type { Product } from '@/types';

// Speech Recognition types
interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

interface LiveSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LiveSearch({ isOpen, onClose }: LiveSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches] = useState([
    'iPhone 15', 'Samsung', 'Nike Air Max', 'Laptop', 'Kulaklık'
  ]);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Cleanup voice recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Search function
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const normalizedQuery = searchQuery.toLowerCase().trim();
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.brand.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery) ||
      product.description.toLowerCase().includes(normalizedQuery) ||
      (product.tags && product.tags.some(tag => tag.toLowerCase().includes(normalizedQuery)))
    );

    setResults(filtered.slice(0, 8)); // Limit to 8 results
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Save search to recent
  const saveSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Handle search submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveSearch(query);
      navigate(`/products?search=${encodeURIComponent(query)}`);
      onClose();
      setQuery('');
    }
  };

  // Handle result click
  const handleResultClick = (product: Product) => {
    saveSearch(query || product.name);
    navigate(`/product/${product.id}`);
    onClose();
    setQuery('');
  };

  // Handle recent/trending search click
  const handleSuggestedClick = (term: string) => {
    setQuery(term);
    saveSearch(term);
    navigate(`/products?search=${encodeURIComponent(term)}`);
    onClose();
  };

  // Clear recent searches
  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Remove single recent search
  const removeRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Voice Search
  const startVoiceSearch = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setVoiceError('Tarayıcınız sesli aramayı desteklemiyor');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.lang = 'tr-TR';
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setVoiceError(null);
    };

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      performSearch(transcript);
    };

    recognitionRef.current.onerror = (_event: SpeechRecognitionErrorEvent) => {
      setVoiceError('Ses algılanamadı, tekrar deneyin');
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  }, []);

  const stopVoiceSearch = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Search Container */}
      <div className="absolute top-0 left-0 right-0 bg-card shadow-2xl">
        <div className="max-w-3xl mx-auto p-4">
          {/* Search Input */}
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Ürün, kategori veya marka ara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-24 py-4 text-lg border-2 border-orange-100 focus:border-orange-500 rounded-xl"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {/* Voice Search Button */}
              <button
                type="button"
                onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                className={`p-2 rounded-full transition-colors ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'hover:bg-muted text-muted-foreground'
                }`}
                title={isListening ? 'Dinleniyor...' : 'Sesli ara'}
              >
                {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              
              {/* Clear Button */}
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-muted rounded-full"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
          </form>
          
          {/* Voice Error */}
          {voiceError && (
            <p className="text-sm text-red-500 mt-2 text-center">{voiceError}</p>
          )}

          {/* Results Area */}
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {/* Live Results */}
            {query.trim() && results.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <p className="text-sm text-muted-foreground">
                    {results.length} sonuç bulundu
                  </p>
                  <button
                    onClick={handleSubmit}
                    className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    Tümünü Gör <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                
                {results.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleResultClick(product)}
                    className="flex items-center gap-4 p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{product.brand}</p>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-orange-600">
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    {product.isNew && (
                      <Badge className="bg-green-500">YENİ</Badge>
                    )}
                    {product.discount && product.discount > 0 && (
                      <Badge className="bg-red-500">%{product.discount}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {query.trim() && results.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground">"{query}" için sonuç bulunamadı</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Farklı bir arama terimi deneyin
                </p>
              </div>
            )}

            {/* Suggestions (when no query) */}
            {!query.trim() && (
              <div className="space-y-6">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Son Aramalar</span>
                      </div>
                      <button
                        onClick={clearRecent}
                        className="text-sm text-muted-foreground hover:text-muted-foreground"
                      >
                        Temizle
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleSuggestedClick(term)}
                          className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted rounded-full text-sm transition-colors"
                        >
                          {term}
                          <span
                            onClick={(e) => removeRecent(term, e)}
                            className="hover:bg-gray-300 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div>
                  <div className="flex items-center gap-2 text-foreground mb-3">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">Popüler Aramalar</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSuggestedClick(term)}
                        className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-full text-sm transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Categories */}
                <div>
                  <p className="font-medium text-foreground mb-3">Popüler Kategoriler</p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { name: 'Elektronik', icon: '💻' },
                      { name: 'Moda', icon: '👕' },
                      { name: 'Ev & Yaşam', icon: '🏠' },
                      { name: 'Kozmetik', icon: '💄' },
                    ].map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => handleSuggestedClick(cat.name)}
                        className="flex flex-col items-center gap-2 p-4 bg-muted hover:bg-orange-50 rounded-xl transition-colors"
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-sm font-medium">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
