import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Bell } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format, isToday, isYesterday } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

// Notification sound URL (using a free notification sound)
const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

// Custom Tailwind Classes for Teal (#008080)
const TEAL_HOVER_10 = 'hover:bg-[#008080]/10'; // Read/Bell hover (lighter)
const TEAL_BG_20_HOVER_30 = 'bg-[#008080]/20 hover:bg-[#008080]/30'; // Unread background/hover (darker)

// Utility function to categorize notifications
const categorizeNotifications = (notifications: Notification[]) => {
  const groups: Record<string, Notification[]> = {};

  notifications.forEach(notification => {
    const date = new Date(notification.created_at);
    let category: string;

    if (isToday(date)) {
      category = 'Today';
    } else if (isYesterday(date)) {
      category = 'Yesterday';
    } else {
      category = format(date, 'MMMM dd, yyyy'); // e.g., July 15, 2024
    }

    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(notification);
  });

  // Convert to an array of { title, notifications } for easier mapping
  return Object.keys(groups).map(title => ({
    title,
    notifications: groups[title],
  }));
};

export const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.5;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  }, []);

  // Show in-app toast notification
  const showInAppNotification = useCallback((notification: Notification) => {
    toast({
      title: notification.title,
      description: notification.message,
    });
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }

    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.is_read).length || 0);
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // Play sound and show toast for new notifications
          playNotificationSound();
          if (payload.new) {
            showInAppNotification(payload.new as Notification);
          }
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, playNotificationSound, showInAppNotification]);


  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return;
    }

    fetchNotifications();
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      });
      return;
    }

    fetchNotifications();
    toast({
      title: "Success",
      description: "All notifications marked as read",
    });
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    // Navigation removed as per requirements - notifications no longer navigate to pages
  };

  // Memoized categorized notifications
  const categorizedNotifications = useMemo(() => {
    return categorizeNotifications(notifications);
  }, [notifications]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className={`rounded-full h-10 w-10 flex items-center justify-center transition-colors bg-header-foreground/10 ${TEAL_HOVER_10} group relative`} aria-label="Notifications">
          <Bell className="h-5 w-5 text-header-foreground group-hover:text-header" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all as read
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Removed the unread count note/header text here */}

        <ScrollArea className="h-[calc(100vh-120px)] mt-4"> {/* Adjusted height calculation for removed element */}
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-4"> {/* Increased space for groups */}
              {categorizedNotifications.map(group => (
                <div key={group.title}>
                  <h3 className="text-sm font-semibold sticky top-0 bg-white/90 dark:bg-gray-900/90 z-10 py-1 -mt-1 backdrop-blur-sm">
                    {group.title}
                  </h3>
                  <div className="space-y-2 pt-1">
                    {group.notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full text-left p-4 rounded-lg border transition-colors ${
                          notification.is_read
                            ? `bg-background ${TEAL_HOVER_10}` // Read state: background with teal hover
                            : TEAL_BG_20_HOVER_30 // Unread state: teal background with darker teal hover
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{notification.title}</h4>
                          {!notification.is_read && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {/* Format time for Today/Yesterday/Date groups */}
                          {format(new Date(notification.created_at), group.title === 'Today' || group.title === 'Yesterday' ? 'h:mm a' : 'h:mm a')}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};