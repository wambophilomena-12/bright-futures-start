import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface HostVerificationStatus {
  isVerifiedHost: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'none';
  loading: boolean;
}

export const useHostVerificationStatus = (): HostVerificationStatus => {
  const { user } = useAuth();
  const [status, setStatus] = useState<HostVerificationStatus>({
    isVerifiedHost: false,
    status: 'none',
    loading: true,
  });

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user) {
        setStatus({ isVerifiedHost: false, status: 'none', loading: false });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('host_verifications')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking host verification:', error);
          setStatus({ isVerifiedHost: false, status: 'none', loading: false });
          return;
        }

        if (!data) {
          setStatus({ isVerifiedHost: false, status: 'none', loading: false });
          return;
        }

        const verificationStatus = data.status as 'pending' | 'approved' | 'rejected';
        setStatus({
          isVerifiedHost: verificationStatus === 'approved',
          status: verificationStatus,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking host verification:', error);
        setStatus({ isVerifiedHost: false, status: 'none', loading: false });
      }
    };

    checkVerificationStatus();
  }, [user]);

  return status;
};
