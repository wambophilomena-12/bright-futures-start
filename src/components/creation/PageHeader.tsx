import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export const PageHeader = ({ 
  title, 
  showBackButton = true, 
  showHomeButton = true 
}: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="hidden md:flex items-center justify-between mb-6 pb-4 border-b border-border">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>
      {showHomeButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          Home
        </Button>
      )}
    </div>
  );
};
