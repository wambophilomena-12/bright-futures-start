import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Payment {
  id: string;
  checkout_request_id: string;
  phone_number: string;
  amount: number;
  account_reference: string;
  transaction_desc: string;
  payment_status: string;
  mpesa_receipt_number: string | null;
  result_desc: string | null;
  created_at: string;
  updated_at: string;
}

export default function PaymentHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);

  const fetchPayments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .eq("payment_status", "completed") // Only fetch completed payments
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPayments((data as unknown as Payment[]) || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchPayments();

    // Realtime subscription specifically for new completed payments
    const channel = supabase
      .channel('completed-payment-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // Only refresh if the update involves a 'completed' status
          if ((payload.new as Payment)?.payment_status === 'completed') {
            fetchPayments();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="max-w-4xl mx-auto space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </main>
        <Footer />
        <MobileBottomBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <h1 className="text-3xl font-bold mb-2 text-foreground">Payment History</h1>
          <p className="text-muted-foreground mb-8">View your successful M-Pesa transactions</p>

          {payments.length === 0 ? (
            <Card className="p-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">No completed payments found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Once your M-Pesa transactions are successful, they will appear here.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <Card key={payment.id} className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-foreground">
                          {payment.transaction_desc || payment.account_reference}
                        </h3>
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          <span className="font-medium text-foreground">Amount:</span> KSh {payment.amount.toLocaleString()}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Phone:</span> +{payment.phone_number}
                        </p>
                        {payment.mpesa_receipt_number && (
                          <p className="flex items-center gap-1">
                            <Receipt className="h-4 w-4" />
                            <span className="font-medium text-foreground">Receipt:</span> {payment.mpesa_receipt_number}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <p className="text-sm font-medium text-foreground">
                        {formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <MobileBottomBar />
    </div>
  );
}