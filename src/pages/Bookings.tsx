import { useEffect, useState, useMemo, useRef } from "react";
import { Header } from "@/components/Header";
// Removed MobileBottomBar import
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
// ... other imports

const Bookings = () => {
  // ... state and logic remain the same

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <main className="container px-4 py-8 animate-pulse space-y-6">
          <div className="h-10 bg-slate-200 rounded-full w-48" />
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white rounded-[28px] border border-slate-100" />)}
        </main>
        {/* Removed MobileBottomBar */}
      </div>
    );
  }

  return (
    // Changed pb-24 to pb-12 since we no longer need space for the fixed bottom bar
    <div className="min-h-screen bg-[#F8F9FA] pb-12">
      <Header />
      
      <main className="container px-4 py-12 max-w-4xl mx-auto">
        {/* ... Header and Offline Mode UI */}
        
        {bookings.length === 0 ? (
          <div className="bg-white rounded-[32px] p-16 text-center border border-slate-100 shadow-sm">
            <Calendar className="h-16 w-16 text-slate-200 mx-auto mb-6" />
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-400">No active bookings</h2>
          </div>
        ) : (
          <div className="space-y-12">
            {/* ... Grouped Bookings Mapping */}
          </div>
        )}
        
        {/* Load More Button */}
        {hasMore && bookings.length > 0 && (
          <div className="flex justify-center mt-10">
            <Button
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-12 px-8"
              style={{ background: COLORS.CORAL }}
            >
              {loadingMore ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...</>
              ) : (
                "Load More Bookings"
              )}
            </Button>
          </div>
        )}
      </main>

      {/* Dialogs remain the same */}
      <RescheduleBookingDialog ... />
      <AlertDialog ... />

      {/* Removed MobileBottomBar */}
    </div>
  );
};