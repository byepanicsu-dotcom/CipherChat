import React, { useState, useRef, useEffect } from 'react';
import { Camera, User, Save, Download } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileSettingsProps {
    profile: UserProfile;
    onSave: (profile: UserProfile) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ profile, onSave }) => {
    const [username, setUsername] = useState(profile.username);
    const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
    const [isSaving, setIsSaving] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setInstallPrompt(null);
        }
    };

    // Helper to convert file to Base64 string for P2P transmission
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // Convert to Base64 immediately so it's ready for P2P
                const base64 = await fileToBase64(file);
                setAvatarUrl(base64);
            } catch (err) {
                console.error("Error reading file", err);
            }
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        // Simulate a brief save delay for UX
        setTimeout(() => {
            onSave({ username, avatarUrl });
            setIsSaving(false);
        }, 500);
    };

    return (
        <div className="h-full overflow-y-auto p-6 flex flex-col items-center pt-16 no-scrollbar pb-32">
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-white tracking-tight mb-2">Identity</h2>
                    <p className="text-zinc-400">Manage your public digital persona.</p>
                </div>

                <div className="flex flex-col items-center space-y-6 mb-10">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-surface-container bg-surface-bright flex items-center justify-center shadow-2xl group-hover:border-primary transition-all duration-300">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={64} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 p-4 bg-primary rounded-2xl text-surface-dim shadow-xl border-4 border-surface-dim group-hover:scale-110 transition-transform">
                            <Camera size={20} />
                        </div>
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                <div className="bg-surface-container/50 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-xl">
                    {/* M3 Filled Text Field */}
                    <div className="group relative bg-surface-bright rounded-t-xl rounded-b-none border-b border-zinc-500 focus-within:border-primary transition-colors px-4 pt-6 pb-2">
                        <label className="absolute top-2 left-4 text-xs text-primary font-bold uppercase tracking-wider">Display Name</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-transparent text-xl text-white focus:outline-none placeholder-transparent"
                            placeholder="Enter your alias..."
                        />
                    </div>
                    
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full py-4 bg-primary hover:bg-primary-dark text-surface-dim text-lg font-bold rounded-full shadow-[0_4px_20px_rgba(52,211,153,0.3)] hover:shadow-[0_6px_25px_rgba(52,211,153,0.5)] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:scale-100"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-surface-dim border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Save size={20} />
                                Save Changes
                            </>
                        )}
                    </button>
                    
                    {installPrompt && (
                        <button 
                            onClick={handleInstall}
                            className="w-full py-4 bg-surface-bright hover:bg-surface-container text-white text-lg font-bold rounded-full border border-white/10 transition-all flex items-center justify-center gap-3"
                        >
                            <Download size={20} className="text-primary" />
                            Install App (APK Mode)
                        </button>
                    )}

                    <div className="text-center pt-2">
                        <p className="text-xs text-zinc-600">Your Identity Key: Local Device Only</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;