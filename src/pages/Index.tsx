
import BotStatus from '@/components/BotStatus';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Mr.Gnome VPN Telegram Bot</h1>
        <p className="text-xl text-gray-600 mb-6">Your VPN shop Telegram bot service status</p>
      </div>
      
      <BotStatus />
      
      <div className="mt-8 max-w-md text-center">
        <p className="mb-4">
          This page monitors your Telegram bot that should be running as a background service on Vercel.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          For the bot to work properly, you must set these environment variables in your Vercel project:
        </p>
        <ul className="text-left text-sm text-gray-700 mb-4 mx-auto w-fit">
          <li>• TELEGRAM_BOT_TOKEN</li>
          <li>• ADMIN_USER_ID</li>
          <li>• SUPABASE_URL</li>
          <li>• SUPABASE_SERVICE_ROLE_KEY</li>
        </ul>
        <p className="text-xs text-gray-500">
          The bot uses Vercel Cron Jobs to stay alive. Check your Vercel logs if the bot is offline.
        </p>
      </div>
    </div>
  );
};

export default Index;
