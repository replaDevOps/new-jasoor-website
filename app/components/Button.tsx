import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { COLORS } from '../../constants/theme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    const variants = {
      primary: `bg-[linear-gradient(to_right,#008A66,#00C995)] text-white hover:shadow-[0_8px_24px_rgba(0,138,102,0.3)] border-none`,
      secondary: `bg-transparent text-[#004E39] border border-[#004E39] hover:bg-[#004E39] hover:text-white`,
      destructive: `bg-red-500 text-white hover:bg-red-600 shadow-md`,
      outline: `bg-transparent text-gray-700 border border-gray-200 hover:border-[#008A66] hover:text-[#008A66] hover:bg-white shadow-sm`,
      ghost: `bg-transparent text-[#004E39] hover:bg-[#004E39]/10`,
      link: `bg-transparent text-[#004E39] underline hover:text-[#008A66] p-0 h-auto font-normal`,
    };

    const sizes = {
      sm: "text-sm px-4 py-2 rounded-full",
      md: "text-base px-8 py-3 rounded-full",
      lg: "text-lg px-12 py-4 rounded-full", // 16px horizontal x 48px vertical requested, but that's huge padding. 16px horiz is small?
      // Prompt: "Padding: 16px horizontal × 48px vertical (large and prominent)"
      // Wait, 48px vertical padding is huge. Maybe user meant 16px vertical, 48px horizontal?
      // "Padding: 16px horizontal × 48px vertical" -> usually means top/bottom 16, left/right 48.
      // Or literally top/bottom 48? That would be a 100px+ tall button.
      // Given "large and prominent", I'll assume 16px Vertical (top/bottom) and 48px Horizontal (left/right).
      // Standard CSS order is vertical, horizontal. But often people say "16x48" meaning WxH or PaddingX PaddingY.
      // Let's assume standard UI design: 16px Top/Bottom, 48px Left/Right.
      custom: "px-12 py-4 rounded-full",
    };
    
    // Applying the specific padding for 'lg' / Primary based on my assumption:
    // px-12 is 48px. py-4 is 16px. So `px-12 py-4` matches 16v x 48h.

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02, translateY: -1 }}
        whileTap={{ scale: 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 animate-spin">⏳</span>
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
