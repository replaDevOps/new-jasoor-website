import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, ArrowRight, ArrowLeft, Calendar, User, Clock, ChevronDown, Share2, Facebook, Twitter, Linkedin, Copy, Bookmark } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useQuery } from '@apollo/client';
import { GET_ARTICLES, GET_ARTICLE } from '../../graphql/queries/business';

/**
 * P3-FIX-BUG10: article body/arabicBody are JSON scalar (rich text block format).
 * This helper converts common block types to safe HTML for display.
 * Handles: paragraph, heading, list, image, quote blocks.
 * Falls back gracefully if the value is already a plain string or null.
 */
function renderArticleBody(raw: unknown): string {
  if (!raw) return '';
  // If it's already a plain string (future-proofing), return as-is
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return renderBlocks(parsed);
    } catch {
      return raw; // plain string — use directly
    }
  }
  // If already a JS object/array (Apollo may auto-parse JSON scalars)
  if (typeof raw === 'object') {
    return renderBlocks(raw as Record<string, unknown> | unknown[]);
  }
  return '';
}

function renderBlocks(data: Record<string, unknown> | unknown[]): string {
  // Support both array of blocks or { blocks: [...] } wrapper
  const blocks: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as Record<string, unknown>).blocks)
      ? ((data as Record<string, unknown>).blocks as unknown[])
      : [];

  return blocks.map((block) => {
    const b = block as Record<string, unknown>;
    const type = b.type as string;
    const text = (b.text ?? b.content ?? b.data ?? '') as string;

    switch (type) {
      case 'header':
      case 'heading': {
        const level = (b.level as number) ?? 2;
        const h = Math.min(Math.max(level, 1), 6);
        return `<h${h} class="font-bold mt-6 mb-2">${text}</h${h}>`;
      }
      case 'paragraph':
        return `<p class="mb-4">${text}</p>`;
      case 'list': {
        const items = (b.items as string[]) ?? [];
        const tag = b.style === 'ordered' ? 'ol' : 'ul';
        const liItems = items.map(i => `<li>${i}</li>`).join('');
        return `<${tag} class="my-4 ps-6 space-y-1">${liItems}</${tag}>`;
      }
      case 'image': {
        const url = (b.url ?? b.src ?? b.file as Record<string, unknown>)?.url ?? b.file ?? '';
        const caption = (b.caption ?? '') as string;
        return `<figure class="my-6"><img src="${url}" alt="${caption}" class="w-full rounded-2xl" />${caption ? `<figcaption class="text-sm text-gray-400 mt-2 text-center">${caption}</figcaption>` : ''}</figure>`;
      }
      case 'quote':
      case 'blockquote':
        return `<blockquote class="border-s-4 border-[#008A66] ps-4 italic text-gray-500 my-4">${text}</blockquote>`;
      default:
        // Fallback: render any text content we can find
        if (text) return `<p class="mb-4">${text}</p>`;
        return '';
    }
  }).join('\n');
}

export const Articles = ({ onNavigate }: { onNavigate?: (page: string) => void }) => {
  const { direction, language } = useApp();
  const isAr = language === 'ar';
  const [view, setView] = useState<'list' | 'details'>('list');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view, selectedArticleId]);

  const { data: articlesData, loading: articlesLoading } = useQuery(GET_ARTICLES, {
    variables: { search: searchQuery || undefined },
    fetchPolicy: 'cache-and-network',
  });
  const { data: articleDetailData, loading: articleDetailLoading } = useQuery(GET_ARTICLE, {
    variables: { getArticleId: selectedArticleId },
    skip: !selectedArticleId,
    fetchPolicy: 'cache-and-network',
  });

  const articles = articlesData?.getArticles?.articles || [];
  const articleDetail = articleDetailData?.getArticle;

  const t = {
    title: isAr ? 'المقالات والأخبار' : 'Articles & News',
    subtitle: isAr ? 'اكتشف أحدث الرؤى والنصائح حول ريادة الأعمال والاستثمار في السعودية.' : 'Discover the latest insights and tips on entrepreneurship and investment in Saudi Arabia.',
    searchPlaceholder: isAr ? 'ابحث عن مقال...' : 'Search for an article...',
    loadMore: isAr ? 'عرض المزيد' : 'Load More Articles',
    readMore: isAr ? 'اقرأ المزيد' : 'Read More',
    minsRead: isAr ? 'دقيقة قراءة' : 'min read',
    back: isAr ? 'العودة للمقالات' : 'Back to Articles',
    share: isAr ? 'مشاركة' : 'Share',
    publishedOn: isAr ? 'نشر في' : 'Published on',
    noArticles: isAr ? 'لا توجد مقالات' : 'No articles found',
  };

  const handleArticleClick = (id: string) => {
    setSelectedArticleId(id);
    setView('details');
  };

  const handleBack = () => {
    setView('list');
    setSelectedArticleId(null);
  };

  // ── Detail View ────────────────────────────────────────────────────────────
  if (view === 'details') {
    if (articleDetailLoading) return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="w-8 h-8 border-2 border-[#008A66] border-t-transparent rounded-full animate-spin" />
      </div>
    );
    if (!articleDetail) return null;
    const title = isAr ? articleDetail.arabicTitle : articleDetail.title;
    // P3-FIX-BUG10: body/arabicBody are JSON scalar (rich text blocks), not plain strings.
    // Parse the JSON and convert blocks to plain readable HTML for display.
    const rawBody = isAr ? articleDetail.arabicBody : articleDetail.body;
    const bodyHtml = renderArticleBody(rawBody);
    const date = articleDetail.createdAt ? new Date(articleDetail.createdAt).toLocaleDateString() : '';
    return (
      <div className="min-h-screen bg-white pb-24 pt-24" dir={direction}>
        <div className="container mx-auto px-4 lg:px-20 max-w-4xl">
          <button onClick={handleBack} className="flex items-center gap-2 text-gray-500 hover:text-[#008A66] font-bold mb-8">
            {direction === 'rtl' ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
            {t.back}
          </button>
          {articleDetail.image && (
            <img src={articleDetail.image} alt={title} className="w-full h-64 md:h-96 object-cover rounded-3xl mb-8" />
          )}
          <h1 className="text-3xl md:text-4xl font-black text-[#111827] mb-4">{title}</h1>
          <p className="text-sm text-gray-400 mb-8 dir-ltr">{t.publishedOn} {date}</p>
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </div>
      </div>
    );
  }

  // ── List View ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-16" dir={direction}>
      {/* Dark green header */}
      <div className="bg-[#0A1F13] text-white pt-32 pb-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{isAr ? 'المقالات' : 'Articles'}</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">{isAr ? 'آخر المقالات والأخبار من منصة جسور' : 'Latest articles and news from Jusoor platform'}</p>
        </div>
      </div>
      <div className="container mx-auto px-4 lg:px-20 max-w-7xl mt-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-[#111827] mb-4">{t.title}</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="relative max-w-lg mx-auto mb-10">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full px-5 py-3 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:border-[#008A66] pr-12"
          />
          <Search size={18} className="absolute top-3.5 right-4 text-gray-400" />
        </div>

        {articlesLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#008A66] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!articlesLoading && articles.length === 0 && (
          <div className="text-center text-gray-400 py-16">{t.noArticles}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article: any) => {
            const title = isAr ? article.arabicTitle : article.title;
            const date = article.createdAt ? new Date(article.createdAt).toLocaleDateString() : '';
            return (
              <div
                key={article.id}
                onClick={() => handleArticleClick(article.id)}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                {article.image ? (
                  <img src={article.image} alt={title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-300">
                    <Bookmark size={40} />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-black text-[#111827] mb-3 line-clamp-2 group-hover:text-[#008A66] transition-colors">{title}</h3>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-400 dir-ltr">{date}</span>
                    <span className="text-[#008A66] font-bold text-sm flex items-center gap-1">
                      {t.readMore}
                      {direction === 'rtl' ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

