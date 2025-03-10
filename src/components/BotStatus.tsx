
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { toast } from '@/hooks/use-toast';

// This is a simplified status check component 
const BotStatus = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkBotStatus = async () => {
    setStatus('checking');
    
    try {
      // In a real implementation, this would be an API call to your backend
      // that checks if the Telegram bot is running
      // For now, we'll simulate a check with a timeout
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demonstration purposes - in a real app you would call an actual endpoint
      // that verifies the bot is running on your server
      const isOnline = true; // This should be the result of your actual API call
      
      setStatus(isOnline ? 'online' : 'offline');
      setLastChecked(new Date());
      
      toast({
        title: "Status Check Complete",
        description: isOnline 
          ? "Your Telegram bot appears to be online!" 
          : "Your Telegram bot appears to be offline.",
        variant: isOnline ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Error checking bot status:", error);
      setStatus('offline');
      setLastChecked(new Date());
      
      toast({
        title: "Status Check Failed",
        description: "Could not determine bot status. Check console for details.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Check status when component mounts
    checkBotStatus();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Telegram Bot Status</CardTitle>
        <CardDescription>
          Check if your VPN Telegram bot is currently running
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div 
            className={`w-4 h-4 rounded-full ${
              status === 'online' ? 'bg-green-500' : 
              status === 'offline' ? 'bg-red-500' : 
              'bg-yellow-500 animate-pulse'
            }`} 
          />
          <div>
            <p className="font-medium">
              {status === 'online' ? 'Bot is Online' : 
               status === 'offline' ? 'Bot is Offline' : 
               'Checking Status...'}
            </p>
            {lastChecked && (
              <p className="text-sm text-muted-foreground">
                Last checked: {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={checkBotStatus} 
          disabled={status === 'checking'}
        >
          {status === 'checking' ? 'Checking...' : 'Check Again'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BotStatus;
