import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from './Button';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, User, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import logoNavbar from '../../assets/logo-navbar.svg';

interface NavbarProps {
  onNavigate?: (page: string) => void;
  useLightLogo?: boolean;
}

export const Navbar = ({ onNavigate }: NavbarProps) => {
  const { content, language, setLanguage, direction, isLoggedIn } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => setLanguage(language === 'ar' ? 'en' : 'ar');

  const handleNavClick = (page: string) => {
    if (onNavigate) onNavigate(page);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: content.nav.browse,   action: () => handleNavClick('browse'),   hasDropdown: true },
    { name: content.nav.about,    action: () => handleNavClick('about') },
    { name: content.nav.articles, action: () => handleNavClick('articles') },
    { name: content.nav.contact,  action: () => handleNavClick('support') },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center bg-[#0A1F13]">
      <div className="container mx-auto px-6 lg:px-20 flex items-center justify-between w-full">

        {/* Logo — SVG high quality */}
        <div className="flex items-center cursor-pointer shrink-0" onClick={() => handleNavClick('home')}>
          <img src={logoNavbar} alt="Jusoor" className="h-7 w-auto object-contain" />
        </div>

        {/* Desktop Nav — centered */}
        <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={link.action}
              className="font-bold text-[15px] text-white/85 hover:text-white transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 whitespace-nowrap"
            >
              {link.name}
              {link.hasDropdown && <ChevronDown size={13} className="opacity-60" />}
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            aria-label={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/30 text-white text-sm font-bold hover:bg-white/10 hover:border-white transition-all"
          >
            {language === 'ar' ? 'E' : 'ع'}
          </button>

          {isLoggedIn ? (
            <Button variant="outline" size="sm" onClick={() => handleNavClick('dashboard')}
              className="gap-2 border-white/40 text-white hover:bg-white hover:text-[#0A1F13]">
              <User size={16} />
              {content.nav.profile}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate?.('signin')}
                className="font-bold text-[15px] text-white/85 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer whitespace-nowrap"
              >
                {content.nav.signIn}
              </button>
              <Button variant="primary" size="sm" onClick={() => onNavigate?.('signup')}
                className="bg-[#008A66] text-white border-none hover:bg-[#007053] font-bold px-5 rounded-full">
                {content.nav.signUp}
              </Button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="lg:hidden text-white" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={26} />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)} />

            <motion.div
              initial={{ x: direction === 'rtl' ? 300 : -300 }}
              animate={{ x: 0 }}
              exit={{ x: direction === 'rtl' ? 300 : -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                'fixed top-0 z-50 bg-[#0A1F13] h-full w-[85%] max-w-sm shadow-2xl p-6 flex flex-col overflow-y-auto',
                direction === 'rtl' ? 'right-0' : 'left-0'
              )}
              dir={direction}
            >
              <div className="flex justify-between items-center mb-8">
                <img src={logoNavbar} alt="Jusoor" className="h-7 w-auto object-contain" />
                <button onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-white p-2">
                  <X size={26} strokeWidth={2.5} />
                </button>
              </div>

              <nav className="flex flex-col gap-2 mb-8">
                {navLinks.map((link) => (
                  <button key={link.name} onClick={() => { link.action(); setMobileMenuOpen(false); }}
                    className="text-start text-lg font-bold text-white/85 hover:text-white py-3 px-4 rounded-xl hover:bg-white/10 transition-all">
                    {link.name}
                  </button>
                ))}
              </nav>

              <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-3">
                <button onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 w-full font-bold text-white/80 hover:text-white py-3 px-4 rounded-xl hover:bg-white/10 transition-all">
                  <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-sm">
                    {language === 'ar' ? 'E' : 'ع'}
                  </div>
                  <span>{language === 'ar' ? 'English' : 'العربية'}</span>
                </button>
                {isLoggedIn ? (
                  <Button className="w-full gap-2 bg-white text-[#0A1F13] hover:bg-white/90 font-bold"
                    onClick={() => { handleNavClick('dashboard'); setMobileMenuOpen(false); }}>
                    <User size={18} />{content.nav.profile}
                  </Button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button variant="outline" className="w-full border-white/40 text-white hover:bg-white/10"
                      onClick={() => { onNavigate?.('signin'); setMobileMenuOpen(false); }}>
                      {content.nav.signIn}
                    </Button>
                    <Button className="w-full bg-[#008A66] text-white hover:bg-[#007053] font-bold"
                      onClick={() => { onNavigate?.('signup'); setMobileMenuOpen(false); }}>
                      {content.nav.signUp}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
