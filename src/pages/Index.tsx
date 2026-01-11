import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Scissors } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center mb-4">
          <Scissors className="h-20 w-20 text-primary" />
        </div>
        <h1 className="text-5xl font-bold text-foreground">SFA Tailoring</h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Tikuvchilik ustaxonasi boshqaruv tizimi
        </p>
        <div className="pt-4">
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="px-8"
          >
            Tizimga kirish
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
