'use client';

import { useEffect, useState } from 'react';

const RISK_KEYWORDS = ['wallet_risk', 'deployer', 'liquidity'];

interface ForensicAnalysisProps {
  active: boolean;
  findings: string[];
  analyzing?: boolean;
}

export default function ForensicAnalysis({ active, findings, analyzing }: ForensicAnalysisProps) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineText, setCurrentLineText] = useState('');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  useEffect(() => {
    if (!active || findings.length === 0) {
      setDisplayedLines([]);
      setCurrentLineText('');
      setCurrentLineIndex(0);
      return;
    }

    // Reset when findings change (new scan)
    setDisplayedLines([]);
    setCurrentLineText('');
    setCurrentLineIndex(0);

    let lineIdx = 0;
    let charIdx = 0;
    let timer: NodeJS.Timeout;

    const typeChar = () => {
      if (lineIdx >= findings.length) {
        return;
      }

      const fullLine = findings[lineIdx];
      if (charIdx < fullLine.length) {
        setCurrentLineText(fullLine.slice(0, charIdx + 1));
        charIdx++;
        timer = setTimeout(typeChar, 20); // 20ms per character
      } else {
        // Complete current line, add it to displayed lines
        setDisplayedLines((prev) => [...prev, fullLine]);
        setCurrentLineText('');
        charIdx = 0;
        lineIdx++;
        setCurrentLineIndex(lineIdx);
        if (lineIdx < findings.length) {
          timer = setTimeout(typeChar, 250); // Pause between lines
        }
      }
    };

    timer = setTimeout(typeChar, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [active, findings]);

  if (!active) return null;

  return (
    <div className="flex h-full flex-col border border-border bg-surface font-mono">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 bg-yellow ${analyzing || currentLineIndex < findings.length ? 'animate-pulse' : ''}`} />
          <span className="text-sm tracking-wide text-text">Agent 2 · Forensic</span>
        </div>
        <span className="text-xs text-muted">deepseek-v4-pro · via BTL</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 select-none">
        {/* Completed lines */}
        {displayedLines.map((line, i) => {
          const isRisk = RISK_KEYWORDS.some((kw) => line.toLowerCase().includes(kw));
          return (
            <div
              key={i}
              className={`py-1 text-sm ${isRisk ? 'text-yellow' : 'text-text'}`}
            >
              <span className="text-muted">→ </span>
              {line}
            </div>
          );
        })}

        {/* Currently typing line */}
        {currentLineIndex < findings.length && (
          <div
            className={`py-1 text-sm ${
              RISK_KEYWORDS.some((kw) => findings[currentLineIndex].toLowerCase().includes(kw))
                ? 'text-yellow'
                : 'text-text'
            }`}
          >
            <span className="text-muted">→ </span>
            {currentLineText}
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-yellow/80 animate-[pulse_1s_infinite] align-middle" />
          </div>
        )}
      </div>
    </div>
  );
}
