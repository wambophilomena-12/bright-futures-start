import { supabase } from "@/integrations/supabase/client";

export const generateReferralLink = (
  itemId: string,
  itemType: string,
  referrerId: string
): string => {
  const baseUrl = window.location.origin;
  let path = "";
  
  switch (itemType) {
    case "trip":
      path = `/trips/${itemId}`;
      break;
    case "hotel":
      path = `/hotels/${itemId}`;
      break;
    case "adventure":
      path = `/adventures/${itemId}`;
      break;
    case "attraction":
      path = `/attractions/${itemId}`;
      break;
    default:
      path = `/`;
  }
  
  return `${baseUrl}${path}?ref=${referrerId}`;
};

export const trackReferralClick = async (
  referrerId: string,
  itemId?: string,
  itemType?: string,
  referralType: "booking" | "host" = "booking"
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Don't track if the referrer is clicking their own link
    if (user?.id === referrerId) {
      return null;
    }

    const { data, error } = await supabase
      .from("referral_tracking")
      .insert({
        referrer_id: referrerId,
        referred_user_id: user?.id || null,
        referral_type: referralType,
        item_id: itemId,
        item_type: itemType,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    
    // Store tracking ID in session storage for later use
    if (data) {
      sessionStorage.setItem("referral_tracking_id", data.id);
    }
    
    return data;
  } catch (error) {
    console.error("Error tracking referral:", error);
    return null;
  }
};

export const getReferralTrackingId = (): string | null => {
  return sessionStorage.getItem("referral_tracking_id");
};

export const clearReferralTracking = () => {
  sessionStorage.removeItem("referral_tracking_id");
};

export const calculateAndAwardCommission = async (
  bookingId: string,
  bookingAmount: number,
  referralTrackingId: string | null
) => {
  if (!referralTrackingId) return;

  try {
    // Get referral tracking details
    const { data: tracking, error: trackingError } = await supabase
      .from("referral_tracking")
      .select("*")
      .eq("id", referralTrackingId)
      .single();

    if (trackingError || !tracking) return;

    // Get commission settings
    const { data: settings, error: settingsError } = await supabase
      .from("referral_settings")
      .select("*")
      .single();

    if (settingsError || !settings) return;

    // Determine service fee and commission rate based on item type
    let serviceFeeRate = 20.0; // default fallback
    let commissionRate = 5.0; // default fallback
    
    if (tracking.item_type === 'trip') {
      serviceFeeRate = Number(settings.trip_service_fee);
      commissionRate = Number(settings.trip_commission_rate);
    } else if (tracking.item_type === 'event') {
      serviceFeeRate = Number(settings.event_service_fee);
      commissionRate = Number(settings.event_commission_rate);
    } else if (tracking.item_type === 'hotel') {
      serviceFeeRate = Number(settings.hotel_service_fee);
      commissionRate = Number(settings.hotel_commission_rate);
    } else if (tracking.item_type === 'attraction') {
      serviceFeeRate = Number(settings.attraction_service_fee);
      commissionRate = Number(settings.attraction_commission_rate);
    } else if (tracking.item_type === 'adventure' || tracking.item_type === 'adventure_place') {
      serviceFeeRate = Number(settings.adventure_place_service_fee);
      commissionRate = Number(settings.adventure_place_commission_rate);
    }
    
    const commissionType = "booking";

    // Calculate service fee from gross booking amount
    const serviceFeeAmount = (bookingAmount * serviceFeeRate) / 100;
    
    // Calculate commission from service fee using category-specific commission rate
    const commissionAmount = (serviceFeeAmount * commissionRate) / 100;

    // Create commission record
    const { error: commissionError } = await supabase
      .from("referral_commissions")
      .insert({
        referrer_id: tracking.referrer_id,
        referred_user_id: tracking.referred_user_id,
        booking_id: bookingId,
        referral_tracking_id: referralTrackingId,
        commission_type: commissionType,
        commission_amount: commissionAmount,
        commission_rate: commissionRate,
        booking_amount: bookingAmount,
        status: "paid",
        paid_at: new Date().toISOString(),
      });

    if (commissionError) throw commissionError;

    // Update tracking status
    await supabase
      .from("referral_tracking")
      .update({
        status: "converted",
        converted_at: new Date().toISOString(),
      })
      .eq("id", referralTrackingId);

    // Clear session storage
    clearReferralTracking();
  } catch (error) {
    console.error("Error calculating commission:", error);
  }
};
