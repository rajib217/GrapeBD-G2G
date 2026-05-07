import { useEffect, useState, useCallback } from 'react';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
function timeAgoBn(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'এইমাত্র';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} মিনিট আগে`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ঘণ্টা আগে`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} দিন আগে`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} মাস আগে`;
  return `${Math.floor(months / 12)} বছর আগে`;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  type: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, body, type, link, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (!error && data) setItems(data as NotificationItem[]);
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteOne = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = async () => {
    if (!user?.id) return;
    await supabase.from('notifications').delete().eq('user_id', user.id);
    setItems([]);
  };

  const handleClick = async (n: NotificationItem) => {
    if (!n.is_read) await markAsRead(n.id);
    if (n.link) {
      setOpen(false);
      // Internal vs external
      if (n.link.startsWith('http')) {
        window.location.href = n.link;
      } else {
        navigate(n.link);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label="নোটিফিকেশন"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs rounded-full"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 bg-card"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-primary">নোটিফিকেশন</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={markAllRead}
                className="h-7 text-xs"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                সব পড়েছি
              </Button>
            )}
            {items.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearAll}
                className="h-7 text-xs text-destructive hover:text-destructive"
              >
                মুছুন
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[400px]">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              কোন নোটিফিকেশন নেই
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`group px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors ${
                    !n.is_read ? 'bg-accent/20' : ''
                  }`}
                  onClick={() => handleClick(n)}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium truncate">
                          {n.title}
                        </p>
                      </div>
                      {n.body && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), {
                          addSuffix: true,
                          locale: bn,
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.is_read && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                          }}
                          aria-label="পড়েছি"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteOne(n.id);
                        }}
                        aria-label="মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
