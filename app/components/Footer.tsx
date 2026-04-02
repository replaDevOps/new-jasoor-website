import React from 'react';
import { useApp } from '../../context/AppContext';
import { Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import logoLight from '../../assets/logo-light.png'; // White text logo

export const Footer = ({ onNavigate }: { onNavigate?: (page: string) => void }) => {
  const { content, language } = useApp();

  const handleLinkClick = (e: React.MouseEvent, url: string, page?: string) => {
    e.preventDefault();
    if (page && onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <footer className="bg-[#0A1F13] pt-20 pb-10 border-t border-[#173401]">
      <div className="container mx-auto px-6 lg:px-20">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand & About */}
          <div className="lg:col-span-1 order-last md:order-first">
            <div className="flex items-center gap-2 mb-6">
              <img src={logoLight} alt="Jusoor" className="h-16 md:h-24 w-auto object-contain" />
            </div>
            <p className="text-gray-400 leading-relaxed text-sm mb-6">
              {content.footer.about}
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#008A66] hover:text-white transition-all duration-300"><Twitter size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#008A66] hover:text-white transition-all duration-300"><Linkedin size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#008A66] hover:text-white transition-all duration-300"><Instagram size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="mb-6">
              <h4 className="text-white font-bold text-lg mb-2">{content.footer.quickLinks.title}</h4>
              <div className="w-12 h-1 bg-[#008A66] rounded-full"></div>
            </div>
            <ul className="space-y-4">
                <li>
                  <a href="#" onClick={(e) => handleLinkClick(e, '#', 'browse')} className="text-gray-400 hover:text-[#00C995] transition-colors text-sm font-medium">
                    {content.nav.browse}
                  </a>
                </li>
                {/* P2-FIX-BUG2: 'List Your Business' now navigates to list-business instead of doing nothing */}
                <li>
                  <a href="#" onClick={(e) => handleLinkClick(e, '#', 'list-business')} className="text-gray-400 hover:text-[#00C995] transition-colors text-sm font-medium">
                    {content.footer.quickLinks.links[1].label}
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => handleLinkClick(e, '#', 'about')} className="text-gray-400 hover:text-[#00C995] transition-colors text-sm font-medium">
                    {content.nav.about}
                  </a>
                </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <div className="mb-6">
              <h4 className="text-white font-bold text-lg mb-2">{content.footer.resources.title}</h4>
              <div className="w-12 h-1 bg-[#008A66] rounded-full"></div>
            </div>
            <ul className="space-y-4">
                <li>
                  <a href="#" onClick={(e) => handleLinkClick(e, '#', 'articles')} className="text-gray-400 hover:text-[#00C995] transition-colors text-sm font-medium">
                    {content.nav.articles}
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => handleLinkClick(e, '#', 'terms')} className="text-gray-400 hover:text-[#00C995] transition-colors text-sm font-medium">
                    {content.footer.resources.links[3].label}
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => handleLinkClick(e, '#', 'support')} className="text-gray-400 hover:text-[#00C995] transition-colors text-sm font-medium">
                    {content.footer.supportHeader}
                  </a>
                </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="mb-6">
              <h4 className="text-white font-bold text-lg mb-2">{content.footer.contact.title}</h4>
              <div className="w-12 h-1 bg-[#008A66] rounded-full"></div>
            </div>
            <ul className="space-y-5">
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                 <Mail size={18} className="text-[#008A66] mt-0.5" />
                 <span>{content.footer.contact.email}</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                 <Phone size={18} className="text-[#008A66] mt-0.5" />
                 <span className="dir-ltr">{content.footer.contact.phone}</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                 <MapPin size={18} className="text-[#008A66] mt-0.5" />
                 <span>{content.footer.contact.address}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            {content.footer.rights}
          </p>
          
          <div className="flex items-center gap-6">
             <a href="#" onClick={(e) => handleLinkClick(e, '#', 'terms')} className="text-gray-500 hover:text-white text-xs transition-colors">{language === 'ar' ? 'شروط الاستخدام' : 'Terms of Use'}</a>
             <a href="#" onClick={(e) => handleLinkClick(e, '#', 'privacy')} className="text-gray-500 hover:text-white text-xs transition-colors">{language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
