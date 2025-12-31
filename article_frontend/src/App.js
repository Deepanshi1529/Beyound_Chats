import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, Tag, ExternalLink, Zap, BookOpen, TrendingUp } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000/api';

export default function ArticleViewer() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/articles`);
      const data = await response.json();
      
      if (data.success) {
        setArticles(data.data || []);
      } else {
        setError('Failed to fetch articles');
      }
    } catch (err) {
      setError('Error connecting to API: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = filterTag === 'all' || article.tags?.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const allTags = [...new Set(articles.flatMap(a => a.tags || []))];

  const isOptimized = (article) => article.tags?.includes('optimized');


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-medium">Loading articles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchArticles}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-indigo-600">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <BookOpen className="text-indigo-600" size={40} />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Article Optimizer</h1>
                <p className="text-gray-600">AI-Powered Content Enhancement</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-indigo-100 px-4 py-2 rounded-full">
              <Zap className="text-indigo-600" size={20} />
              <span className="font-semibold text-indigo-900">{articles.length} Articles</span>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No articles found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredArticles.map(article => (
              <ArticleCard 
                key={article.id} 
                article={article} 
                
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            Powered by Groq LLM • DuckDuckGo Search • Node.js
          </p>
          <p className="text-gray-500 text-sm mt-2">
            © 2025 Article Optimizer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function ArticleCard({ article}) {
  const isOptimized = article.tags?.includes('optimized');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100">
      {/* Article Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex-1 pr-4">
            {article.title}
          </h2>
          {isOptimized && (
            <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              <TrendingUp size={16} />
              <span>AI Enhanced</span>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {article.author && (
            <div className="flex items-center space-x-1">
              <User size={16} />
              <span>{article.author}</span>
            </div>
          )}
          {article.publish_date && (
            <div className="flex items-center space-x-1">
              <Calendar size={16} />
              <span>{new Date(article.publish_date).toLocaleDateString()}</span>
            </div>
          )}
          {article.url && (
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800"
            >
              <ExternalLink size={16} />
              <span>View Original</span>
            </a>
          )}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {article.tags.map(tag => (
              <span 
                key={tag}
                className="inline-flex items-center space-x-1 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium"
              >
                <Tag size={12} />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Article Content */}
      <div className="p-6">
        {article.excerpt && (
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            {article.excerpt}
          </p>
        )}

        {expanded && article.content && (
          <div className="mt-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {article.content}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-2"
        >
          <span>{expanded ? 'Show Less' : 'Read Full Article'}</span>
          <span>{expanded ? '↑' : '↓'}</span>
        </button>
      </div>

      {/* Removed the Article Stats section completely */}
    </div>
  );
}