import React, { useState, useEffect } from 'react';
import { Lock, Unlock, RefreshCw, Key } from 'lucide-react';

const EncryptionVisualizer: React.FC = () => {
    const [text, setText] = useState('Hello World');
    const [encrypted, setEncrypted] = useState('');
    const [key, setKey] = useState('SECRET_KEY_123');
    const [isLocked, setIsLocked] = useState(false);

    // Simple XOR cipher for visualization only
    const xorEncrypt = (input: string, k: string) => {
        let output = '';
        for (let i = 0; i < input.length; i++) {
            const charCode = input.charCodeAt(i) ^ k.charCodeAt(i % k.length);
            output += charCode.toString(16).padStart(2, '0') + ' '; 
        }
        return output.trim().toUpperCase();
    };

    useEffect(() => {
        if (isLocked) {
            setEncrypted(xorEncrypt(text, key));
        } else {
            setEncrypted(text);
        }
    }, [text, key, isLocked]);

    return (
        <div className="h-full overflow-y-auto p-6 pb-24 no-scrollbar">
            <div className="mb-10 text-center">
                <h2 className="text-4xl font-bold text-white mb-2">Encryption Lab</h2>
                <p className="text-zinc-400">Interactive visualization of the AES-256 simulation protocol.</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
                {/* Input Card M3 */}
                <div className="bg-surface-container p-6 rounded-[2rem] border border-white/5 relative group">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-3 block ml-2">Plaintext Input</label>
                    <input 
                        type="text" 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full bg-surface-dim border-none rounded-2xl px-6 py-4 text-emerald-300 font-mono text-lg focus:ring-2 focus:ring-primary transition-all shadow-inner"
                    />
                </div>

                {/* Lock Action Button */}
                <div className="flex justify-center -my-6 relative z-10">
                    <button 
                        onClick={() => setIsLocked(!isLocked)}
                        className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-2xl border-4 border-surface-dim ${isLocked ? 'bg-primary text-surface-dim rotate-0' : 'bg-surface-bright text-zinc-500 rotate-12 hover:rotate-0'}`}
                    >
                        {isLocked ? <Lock size={32} strokeWidth={2.5} /> : <Unlock size={32} strokeWidth={2.5} />}
                    </button>
                </div>

                {/* Output Card M3 */}
                <div className={`bg-surface-container p-8 rounded-[2rem] border transition-all duration-700 relative overflow-hidden ${isLocked ? 'border-primary/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]' : 'border-white/5'}`}>
                    {isLocked && (
                         <div className="absolute inset-0 bg-liquid-glow opacity-30 animate-pulse"></div>
                    )}
                    
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <label className="text-xs font-bold text-secondary uppercase tracking-wider ml-2">Network Payload</label>
                        {isLocked && <span className="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/20 font-bold">ENCRYPTED</span>}
                    </div>
                    
                    <div className={`w-full min-h-[120px] bg-surface-dim rounded-2xl px-6 py-6 font-mono text-sm break-all transition-all duration-500 leading-loose shadow-inner relative z-10 ${isLocked ? 'text-rose-400 tracking-widest' : 'text-zinc-500'}`}>
                        {isLocked ? encrypted : text}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-white/5 relative z-10">
                        <div className="flex items-center gap-3 bg-surface-dim p-2 rounded-full border border-white/5 pl-4">
                            <Key size={16} className="text-zinc-500" />
                            <input 
                                type="text" 
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                className="flex-1 bg-transparent border-none text-xs text-zinc-300 font-mono focus:outline-none"
                            />
                            <button onClick={() => setKey(Math.random().toString(36).substring(7).toUpperCase())} className="p-2 bg-surface-bright rounded-full hover:bg-primary hover:text-surface-dim transition-colors">
                                <RefreshCw size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-xs text-zinc-600 mt-8">Designed by You</p>
                </div>
            </div>
        </div>
    );
};

export default EncryptionVisualizer;