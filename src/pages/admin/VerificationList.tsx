import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, User, ArrowLeft, ShieldCheck, Clock, XCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  CORAL_LIGHT: "#FF9E7A",
  KHAKI: "#F0E68C",
  KHAKI_DARK: "#857F3E",
  RED: "#FF0000",
  SOFT_GRAY: "#F8F9FA",
};

const VerificationList = () => {
  const { status } = useParams<{ status: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const checkAdminAndFetch = async () => {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        navigate("/");
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        return;
      }

      await fetchVerifications();
    };

    checkAdminAndFetch();
  }, [user, navigate, status]);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("host_verifications")
        .select(`
          *,
          profiles!host_verifications_user_id_fkey (
            name,
            email
          )
        `)
        .eq("status", status)
        .order("submitted_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setVerifications(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch verifications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVerifications = verifications.filter((verification) =>
    verification.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    verification.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    verification.legal_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return { 
          title: "Pending Approval", 
          icon: <Clock className="h-6 w-6" />, 
          accent: COLORS.KHAKI_DARK,
          bg: "#F0E68C20" 
        };
      case "approved":
        return { 
          title: "Verified Hosts", 
          icon: <ShieldCheck className="h-6 w-6" />, 
          accent: COLORS.TEAL,
          bg: "#00808015"
        };
      case "rejected":
        return { 
          title: "Rejected Apps", 
          icon: <XCircle className="h-6 w-6" />, 
          accent: COLORS.RED,
          bg: "#FF000010" 
        };
      default:
        return { 
          title: "Verifications", 
          icon: <FileText className="h-6 w-6" />, 
          accent: COLORS.TEAL,
          bg: "#F8F9FA" 
        };
    }
  };

  const config = getStatusConfig();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-t-transparent animate-spin rounded-full" style={{ borderColor: `${COLORS.TEAL} transparent` }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <Header className="hidden md:block" />

      <main className="container px-4 max-w-4xl mx-auto pt-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/admin/verification")}
              className="rounded-full bg-white shadow-sm border-none w-10 h-10 p-0 text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Admin Dashboard</p>
                <h1 className="text-3xl font-black uppercase tracking-tighter leading-none" style={{ color: COLORS.TEAL }}>
                  {config.title}
                </h1>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#008080] transition-colors" />
            </div>
            <Input
              type="text"
              placeholder="Search by name, email, or legal name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 rounded-2xl border-none shadow-sm focus-visible:ring-2 focus-visible:ring-[#008080] bg-white font-medium"
            />
          </div>
        </div>

        {/* Content Section */}
        {filteredVerifications.length === 0 ? (
          <Card className="p-12 text-center rounded-[32px] border-dashed border-2 border-slate-200 bg-transparent">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <User className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
              {searchQuery ? "No matching records found" : "Everything clear for now"}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredVerifications.map((verification) => (
              <Card
                key={verification.id}
                className="p-5 rounded-[28px] border-none shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer bg-white group"
                onClick={() => navigate(`/admin/verification-detail/${verification.id}`)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div 
                      className="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: config.bg }}
                    >
                      <User className="h-6 w-6" style={{ color: config.accent }} />
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black uppercase tracking-tight text-slate-800 truncate">
                          {verification.profiles?.name || "Anonymous User"}
                        </h3>
                        <Badge 
                            className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-none"
                            style={{ 
                                backgroundColor: `${COLORS.KHAKI}40`, 
                                color: COLORS.KHAKI_DARK 
                            }}
                        >
                          {verification.document_type.replace("_", " ")}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-bold text-slate-500 truncate">
                          {verification.profiles?.email}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                          Legal: <span className="text-slate-600">{verification.legal_name}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Submitted</p>
                        <p className="text-xs font-black text-slate-700">
                          {new Date(verification.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </p>
                    </div>
                    <div 
                        className="p-2 rounded-xl bg-slate-50 group-hover:bg-[#FF7F50] transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 text-slate-300 group-hover:text-white rotate-180" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <MobileBottomBar />
    </div>
  );
};

export default VerificationList;