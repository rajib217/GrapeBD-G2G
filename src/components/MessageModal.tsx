import { useState } from 'react';
import { Send, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: {
    id: string;
    full_name: string;
    profile_image?: string;
  };
}

const MessageModal = ({ isOpen, onClose, recipient }: MessageModalProps) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { profile, user } = useAuth();
  const { toast } = useToast();

  console.log('MessageModal - Auth state:', { profile, user });

  const handleSendMessage = async () => {
    console.log('MessageModal - Profile:', profile);
    console.log('MessageModal - Recipient:', recipient);
    console.log('MessageModal - Message:', message.trim());
    
    if (!message.trim() || !profile?.id) {
      console.log('MessageModal - Validation failed:', { 
        messageEmpty: !message.trim(), 
        noProfileId: !profile?.id,
        profile 
      });
      return;
    }

    setSending(true);
    try {
      console.log('MessageModal - Sending message data:', {
        sender_id: profile.id,
        receiver_id: recipient.id,
        content: message.trim(),
      });

      const { error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: profile.id,
            receiver_id: recipient.id,
            content: message.trim(),
          },
        ]);

      console.log('MessageModal - Insert result:', { error });

      if (error) throw error;

      toast({
        title: "সফল",
        description: "মেসেজ পাঠানো হয়েছে",
      });

      setMessage('');
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "ত্রুটি",
        description: "মেসেজ পাঠাতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={recipient.profile_image} alt={recipient.full_name} />
              <AvatarFallback>
                {recipient.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{recipient.full_name} কে মেসেজ পাঠান</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder="আপনার মেসেজ লিখুন..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none"
          />

          <div className="text-xs text-muted-foreground mb-2">
            Debug: Profile ID: {profile?.id || 'নেই'} | User ID: {user?.id || 'নেই'}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={sending}>
              বাতিল
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={!message.trim() || sending || !profile?.id}
              className="flex items-center space-x-2"
            >
              {sending ? (
                <>লোড হচ্ছে...</>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>পাঠান</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageModal;