// ─────────────────────────────────────────────────────────────────────────────
// Shared input CSS class strings — used across all form inputs in the app.
// Change once here → updates everywhere.
// ─────────────────────────────────────────────────────────────────────────────

// Standard single-line text input
export const inputBase =
  "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 md:py-3.5 " +
  "focus:outline-none focus:border-[#008A66] focus:ring-4 focus:ring-[#008A66]/10 " +
  "transition-all text-sm md:text-base";

// Input with red error state
export const inputError =
  "w-full bg-red-50 border border-red-400 rounded-xl px-4 py-3 md:py-3.5 " +
  "focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 " +
  "transition-all text-sm md:text-base";

// OTP / single-character box
export const inputOtp =
  "w-10 h-10 md:w-14 md:h-14 text-center text-lg md:text-2xl font-bold " +
  "bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl " +
  "focus:outline-none focus:border-[#008A66] focus:ring-4 focus:ring-[#008A66]/10 " +
  "transition-all text-[#111827]";
