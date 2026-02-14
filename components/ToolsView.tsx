import React from 'react';
import { ExternalLink, Shield, MessageCircle, Info, Bluetooth } from 'lucide-react';
import { PRIVACY_TOOLS } from '../constants';
import { PrivacyTool } from '../types';

const ToolCard: React.FC<{ tool: PrivacyTool }> = ({ tool }) => {
    const getIcon = (name: string) => {
        switch(name) {
            case 'signal': return <Shield className="text-blue-400" />;
            case 'message-circle': return <MessageCircle className="text-green-400" />;
            case 'bluetooth': return <Bluetooth className="text-orange-400" />;
            default: return <Shield className="text-emerald-400" />;
        }
    }

  return (
    <div className="bg-surface-container border border-white/5 rounded-[2rem] p-6 hover:bg-surface-bright hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-surface-dim rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
             {getIcon(tool.icon)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{tool.name}</h3>
            <a 
                href={tool.website} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-zinc-500 flex items-center gap-1 hover:text-primary transition-colors"
            >
                {tool.website.replace('https://', '')} <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
      
      <p className="text-zinc-300 text-sm mb-6 leading-relaxed">{tool.description}</p>
      
      <div className="grid grid-cols-2 gap-6 text-xs">
        <div className="bg-surface-dim/50 p-4 rounded-xl">
          <span className="text-primary font-bold mb-2 block uppercase tracking-wider text-[10px]">Pros</span>
          <ul className="space-y-2">
            {tool.pros.map((pro, i) => (
              <li key={i} className="flex items-start gap-2 text-zinc-300">
                <div className="w-1 h-1 bg-primary rounded-full mt-1.5 shrink-0"></div> {pro}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-surface-dim/50 p-4 rounded-xl">
          <span className="text-rose-400 font-bold mb-2 block uppercase tracking-wider text-[10px]">Cons</span>
          <ul className="space-y-2">
            {tool.cons.map((con, i) => (
              <li key={i} className="flex items-start gap-2 text-zinc-300">
                <div className="w-1 h-1 bg-rose-500 rounded-full mt-1.5 shrink-0"></div> {con}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const ToolsView: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto p-6 pb-24 no-scrollbar">
      <div className="mb-8 mt-2">
        <h2 className="text-4xl font-bold text-white mb-3">Privacy Arsenal</h2>
        <p className="text-zinc-400 max-w-2xl text-lg">
            Curated list of surveillance-resistant communication tools. Move beyond standard messengers.
        </p>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {PRIVACY_TOOLS.map((tool) => (
          <ToolCard key={tool.name} tool={tool} />
        ))}
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-primary-container/20 to-surface-container border border-primary/20 rounded-[2rem] flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
             <Info className="text-primary" size={24} />
          </div>
          <div>
              <h4 className="font-bold text-primary text-lg">Pro Tip</h4>
              <p className="text-zinc-300 text-sm mt-1 leading-relaxed">
                  For maximum anonymity, combine <span className="text-white font-medium">Tor</span> (Orbot) with any of these tools to mask your IP address completely.
              </p>
          </div>
      </div>
    </div>
  );
};

export default ToolsView;