import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StandardUserProfile } from "@/components/profile/StandardUserProfile";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      {/* Modified the main container to center the content.
        Added custom utility classes for 50vw and 50vh, and margin: auto.
      */}
      <main className="flex items-center justify-center h-[50vh] w-[50vw] mx-auto p-4">
        {/* Modified Card class: 
          - Removed the default 'rounded-lg' class (or equivalent) by overriding/replacing it. 
          - Tailwind's default Card component typically includes rounded corners. 
            We replace 'max-w-2xl' with 'w-full' for the card to fill the new main dimensions, 
            and explicitly use 'rounded-none' to remove the border radius.
        */}
        <Card className="w-full h-full rounded-none">
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>
              Manage your account information
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-120px)] overflow-y-auto"> {/* Added overflow for content in smaller space */}
            <StandardUserProfile />
            
            <div className="mt-6 pt-6 border-t">
              <Button onClick={signOut} variant="destructive" className="w-full">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
      <MobileBottomBar />
    </div>
  );
};

export default Profile;