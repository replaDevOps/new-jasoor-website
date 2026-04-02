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

// ── Read-time estimator ───────────────────────────────────────────────────────
// Walks every block in the rich-text body, pulls all plain text, and divides
// by the average adult reading speed (200 words per minute).
function extractTextFromBody(raw: unknown): string {
  if (!raw) return '';
  let data: unknown;
  if (typeof raw === 'string') {
    try { data = JSON.parse(raw); } catch { return raw; }
  } else {
    data = raw;
  }
  const blocks: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as Record<string, unknown>).blocks)
      ? ((data as Record<string, unknown>).blocks as unknown[])
      : [];

  return blocks.map((block) => {
    const b = block as Record<string, unknown>;
    const type = (b.type ?? '') as string;

    // Images have no readable text — skip them for word count
    if (type === 'image') {
      const caption = (b.caption ?? '') as string;
      return caption; // only count caption words if any
    }

    // Main text field (paragraph, heading, blockquote)
    const text = (b.text ?? b.content ?? b.data ?? '') as string;

    // List items — can be plain strings OR objects like { text: '...' }
    const rawItems = Array.isArray(b.items) ? b.items : [];
    const items = rawItems.map((item: unknown) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        return ((item as Record<string, unknown>).text ?? '') as string;
      }
      return '';
    }).join(' ');

    return [text, items].filter(Boolean).join(' ');
  }).join(' ');
}

export function estimateReadTime(raw: unknown): number {
  const text = extractTextFromBody(raw);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export const Articles = ({ onNavigate }: { onNavigate?: (page: string) => void }) => {
  const { direction, language } = useApp();
  const isAr = language === 'ar';
  const [view, setView] = useState<'list' | 'details'>('list');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder]     = useState<'newest' | 'oldest'>('newest');
  const [sortOpen,  setSortOpen]      = useState(false);

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

  // Sort articles client-side (backend only supports search filter)
  const sortedArticles = [...articles].sort((a: any, b: any) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    return sortOrder === 'newest' ? tb - ta : ta - tb;
  });
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
    noArticles:  isAr ? 'لا توجد مقالات'    : 'No articles found',
    newest:      isAr ? 'الأحدث'            : 'Newest',
    oldest:      isAr ? 'الأقدم'            : 'Oldest',
    sortBy:      isAr ? 'ترتيب حسب'         : 'Sort by',
    filterLabel: isAr ? 'تصفية'             : 'Filter',
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
    const date = articleDetail.createdAt ? new Date(articleDetail.createdAt).toLocaleDateString('en-GB') : '';
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
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-8">
            <span className="flex items-center gap-1.5 dir-ltr"><Calendar size={14} />{t.publishedOn} {date}</span>
            <span className="flex items-center gap-1.5"><Clock size={14} />{estimateReadTime(rawBody)} {t.minsRead}</span>
          </div>
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </div>
      </div>
    );
  }

  // ── List View ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F3F4F6] pb-16" dir={direction} onClick={() => sortOpen && setSortOpen(false)}>

      {/* ── Dark green header ── */}
      <div className="bg-[#0A1F13] text-white pt-32 pb-24 relative">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{t.title}</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">{t.subtitle}</p>
        </div>
      </div>

      {/* ── Floating search + sort bar (overlaps header) ── */}
      <div className="container mx-auto px-4 lg:px-20 max-w-5xl -mt-8 relative z-10 mb-10">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-3">

          {/* Sort dropdown */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSortOpen(prev => !prev)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm font-bold text-[#111827] transition-colors whitespace-nowrap"
            >
              <SlidersHorizontal size={15} className="text-[#008A66]" />
              {sortOrder === 'newest' ? t.newest : t.oldest}
              <ChevronDown size={14} className={cn('transition-transform', sortOpen ? 'rotate-180' : '')} />
            </button>
            {sortOpen && (
              <div className="absolute top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 min-w-[130px]">
                {(['newest', 'oldest'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setSortOrder(opt); setSortOpen(false); }}
                    className={cn(
                      'w-full text-start px-4 py-2.5 text-sm font-medium transition-colors',
                      sortOrder === opt
                        ? 'bg-[#E6F3EF] text-[#008A66] font-bold'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {opt === 'newest' ? t.newest : t.oldest}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200" />

          {/* Search input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full px-4 py-2 rounded-xl bg-transparent focus:outline-none text-sm text-gray-700 placeholder:text-gray-400"
              dir={direction}
            />
            <Search size={16} className={cn('absolute top-2.5 text-gray-400 pointer-events-none', direction === 'rtl' ? 'left-2' : 'right-2')} />
          </div>
        </div>
      </div>

      {/* ── Articles grid ── */}
      <div className="container mx-auto px-4 lg:px-20 max-w-7xl">

        {articlesLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#008A66] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!articlesLoading && sortedArticles.length === 0 && (
          <div className="text-center text-gray-400 py-16">{t.noArticles}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedArticles.map((article: any) => {
            const title = isAr ? article.arabicTitle : article.title;
            const date = article.createdAt
              ? new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
              : '';
            const readTime = estimateReadTime(isAr ? article.arabicBody : article.body);
            return (
              <div
                key={article.id}
                onClick={() => handleArticleClick(article.id)}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                {/* Image */}
                {article.image ? (
                  <img src={article.image} alt={title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-black text-[#111827] mb-3 line-clamp-2 group-hover:text-[#008A66] transition-colors">{title}</h3>

                  {/* Meta row: date + read time on left, Read More on right */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1 dir-ltr">
                        <Calendar size={12} />
                        {date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {readTime} {t.minsRead}
                      </span>
                    </div>
                    <span className="text-[#008A66] font-bold text-sm flex items-center gap-1 shrink-0">
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

