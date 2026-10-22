import React, { useState, useEffect } from 'react';
import { NAVTEX_SAMPLE_MESSAGES } from '../data/stations';
import { Anchor, Terminal, Bell, Download } from 'lucide-react';

interface NavtexTerminalProps {
  currentFrequency: number;
  isPowered: boolean;
  carrierStrength: number;
}

export const NavtexTerminal: React.FC<NavtexTerminalProps> = ({
  currentFrequency,
  isPowered,
  carrierStrength
}) => {
  const isNavtexBand = (Math.abs(currentFrequency - 518.0) < 1.0) || (Math.abs(currentFrequency - 490.0) < 1.0);
  const [messages, setMessages] = useState<typeof NAVTEX_SAMPLE_MESSAGES>(NAVTEX_SAMPLE_MESSAGES);
  const [selectedMessage, setSelectedMessage] = useState<typeof NAVTEX_SAMPLE_MESSAGES[0]>(NAVTEX_SAMPLE_MESSAGES[0]);
  const [typedChars, setTypedChars] = useState<number>(0);
  const [isReceivingLive, setIsReceivingLive] = useState<boolean>(false);

  // Simulate incoming teleprinter character typing when tuned into 518 kHz or 490 kHz
  useEffect(() => {
    if (!isNavtexBand || !isPowered || carrierStrength < 20) {
      setIsReceivingLive(false);
      return;
    }

    setIsReceivingLive(true);
    const interval = setInterval(() => {
      setTypedChars((prev) => {
        if (prev < selectedMessage.text.length) {
          return prev + 1;
        }
        return prev;
      });
    }, 45); // Teleprinter 100 baud speed

    return () => clearInterval(interval);
  }, [isNavtexBand, isPowered, carrierStrength, selectedMessage]);

  const handleSelectMessage = (msg: typeof NAVTEX_SAMPLE_MESSAGES[0]) => {
    setSelectedMessage(msg);
    setTypedChars(0);
  };

  const handleDownloadLog = () => {
    const content = `NAVTEX MARITIME SAFETY LOGBOOK\nFREQUENCY: ${currentFrequency.toFixed(1)} kHz\n\n` +
      messages.map(m => `--- ${m.header} ---\nSTATION: ${m.station}\nSUBJECT: ${m.subject}\n\n${m.text}\n\n`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `navtex_log_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-lg p-4 shadow-xl">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Anchor className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold font-mono text-neutral-200">
            NAVTEX SITOR-B MARITIME TELEPRINTER
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={`px-2 py-0.5 rounded text-[11px] ${
            isNavtexBand && isPowered && carrierStrength > 20
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
              : 'bg-neutral-950 text-neutral-500 border border-neutral-800'
          }`}>
            {isNavtexBand && isPowered ? 'CARRIER DETECTED (518/490 kHz)' : 'TUNER OUT OF NAVTEX BAND'}
          </span>
          <button
            type="button"
            onClick={handleDownloadLog}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] transition-colors"
          >
            <Download className="w-3 h-3" /> Export MSI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
        {/* Message Directory */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-mono text-neutral-400">
            TRANSMISSION QUEUE
          </span>
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
            {messages.map((msg) => (
              <button
                key={msg.id}
                type="button"
                onClick={() => handleSelectMessage(msg)}
                className={`text-left p-2 rounded border transition-colors ${
                  selectedMessage.id === msg.id
                    ? 'bg-neutral-800 border-cyan-600/70 text-cyan-200'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                <div className="text-[10px] font-mono text-cyan-400/90 font-semibold">
                  {msg.header}
                </div>
                <div className="text-xs font-medium line-clamp-1 mt-0.5">
                  {msg.subject}
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5">
                  {msg.station}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Paper Tape Teleprinter Screen */}
        <div className="md:col-span-2 flex flex-col bg-neutral-950 rounded border border-neutral-800 p-3 shadow-inner">
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pb-1.5 border-b border-neutral-800/80 mb-2">
            <span>SITOR-B 100 BAUD FSK TAPE</span>
            <span>{selectedMessage.header}</span>
          </div>

          <pre className="font-mono text-xs text-cyan-300/90 bg-black/60 p-3 rounded border border-neutral-900 h-44 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
            {isReceivingLive
              ? selectedMessage.text.slice(0, typedChars) + (typedChars < selectedMessage.text.length ? '█' : '')
              : selectedMessage.text}
          </pre>

          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-2">
            <span>FORWARD ERROR CORRECTION: SYNCHRONIZED</span>
            <span>CHARACTERS: {typedChars} / {selectedMessage.text.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
