import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { getCategoryQuizCount } from "@/lib/quiz-loader";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Buff Tux - Linux Mascot */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 300 340"
        className="w-36 h-36 mb-4"
        aria-label="Buff Tux the Linux penguin"
      >
        {/* Shadow under feet */}
        <ellipse cx="150" cy="330" rx="90" ry="8" fill="rgba(0,0,0,0.3)" />

        {/* Left foot */}
        <ellipse cx="110" cy="322" rx="28" ry="10" fill="#e8a735" />
        {/* Right foot */}
        <ellipse cx="190" cy="322" rx="28" ry="10" fill="#e8a735" />

        {/* Massive body / torso */}
        <ellipse cx="150" cy="220" rx="85" ry="100" fill="#2d2d2d" />

        {/* Belly with six-pack lines */}
        <ellipse cx="150" cy="230" rx="52" ry="75" fill="#e8e3d0" />
        {/* Pec line */}
        <path d="M120 185 Q150 195 180 185" stroke="#d4cdb8" strokeWidth="1.5" fill="none" />
        {/* Ab lines - horizontal */}
        <line x1="130" y1="210" x2="170" y2="210" stroke="#d4cdb8" strokeWidth="1.2" />
        <line x1="132" y1="232" x2="168" y2="232" stroke="#d4cdb8" strokeWidth="1.2" />
        <line x1="134" y1="254" x2="166" y2="254" stroke="#d4cdb8" strokeWidth="1.2" />
        {/* Ab line - vertical center */}
        <line x1="150" y1="195" x2="150" y2="270" stroke="#d4cdb8" strokeWidth="1.2" />

        {/* Left arm - muscular, flexing up */}
        <path d="M68 190 Q40 170 38 135 Q36 110 55 105 Q72 100 75 125 Q78 145 72 165 Z" fill="#2d2d2d" />
        {/* Left bicep bulge */}
        <ellipse cx="52" cy="120" rx="18" ry="14" fill="#3a3a3a" />
        {/* Left shoulder cap */}
        <ellipse cx="68" cy="170" rx="22" ry="16" fill="#2d2d2d" />

        {/* Right arm - muscular, flexing up */}
        <path d="M232 190 Q260 170 262 135 Q264 110 245 105 Q228 100 225 125 Q222 145 228 165 Z" fill="#2d2d2d" />
        {/* Right bicep bulge */}
        <ellipse cx="248" cy="120" rx="18" ry="14" fill="#3a3a3a" />
        {/* Right shoulder cap */}
        <ellipse cx="232" cy="170" rx="22" ry="16" fill="#2d2d2d" />

        {/* Head - slightly smaller relative to body for buff effect */}
        <ellipse cx="150" cy="108" rx="44" ry="42" fill="#2d2d2d" />

        {/* Headband */}
        <path d="M106 100 Q150 85 194 100" stroke="#e53e3e" strokeWidth="5" fill="none" />
        <path d="M194 100 L210 92 L205 105 Z" fill="#e53e3e" />
        <path d="M210 92 L222 88 L218 100 Z" fill="#c53030" />

        {/* Left eye white - angry slant */}
        <ellipse cx="135" cy="105" rx="13" ry="14" fill="white" />
        {/* Right eye white - angry slant */}
        <ellipse cx="165" cy="105" rx="13" ry="14" fill="white" />
        {/* Angry eyebrow left */}
        <line x1="120" y1="88" x2="145" y2="93" stroke="#2d2d2d" strokeWidth="4" strokeLinecap="round" />
        {/* Angry eyebrow right */}
        <line x1="180" y1="88" x2="155" y2="93" stroke="#2d2d2d" strokeWidth="4" strokeLinecap="round" />
        {/* Left pupil - determined look */}
        <ellipse cx="138" cy="107" rx="6" ry="8" fill="#1a1a1a" />
        {/* Right pupil */}
        <ellipse cx="162" cy="107" rx="6" ry="8" fill="#1a1a1a" />
        {/* Eye shine */}
        <circle cx="140" cy="104" r="2.5" fill="white" />
        <circle cx="164" cy="104" r="2.5" fill="white" />

        {/* Beak - smirking */}
        <ellipse cx="150" cy="124" rx="14" ry="6" fill="#e8a735" />
        <path d="M138 124 Q150 132 162 124" fill="#d4922a" />
        {/* Smirk line */}
        <path d="M158 126 Q164 128 166 125" stroke="#c4820a" strokeWidth="1.2" fill="none" />

        {/* Sweat drop - quiz is tough! */}
        <path d="M190 95 Q192 105 190 112 Q188 105 190 95" fill="#63b3ed" opacity="0.8" />
      </svg>

      <h1 className="text-4xl font-bold mb-2 text-center">
        Linux &amp; Android 퀴즈
      </h1>
      <p className="text-gray-400 mb-10 text-center">
        Linux Kernel과 Android System의 핵심 개념을 퀴즈로 학습하세요
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {CATEGORIES.map((cat) => {
          const count = getCategoryQuizCount(cat.id);
          return (
            <Link
              key={cat.id}
              href={`/quiz/${cat.id}`}
              className="block rounded-xl border border-gray-700 bg-gray-900 p-6 hover:border-blue-500 hover:bg-gray-800 transition-colors"
            >
              <h2 className="text-2xl font-semibold mb-2">{cat.name}</h2>
              <p className="text-gray-400 text-sm mb-4">{cat.description}</p>
              <span className="text-sm text-blue-400">{count}문제</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
