
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
          Note: This is a simplified status check. For a real production environment, 
          you would need to implement an API endpoint that verifies your bot is running 
          on your server.
        </p>
        <p className="text-sm text-gray-500">
          To fully implement bot status monitoring, connect this UI to your backend API
          using environment variables and proper health check endpoints.
        </p>
      </div>
    </div>
  );
};

export default Index;
