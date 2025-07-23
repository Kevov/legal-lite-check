import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-2xl">
        <div className="flex justify-center mb-6">
          <Scale className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Small Claims Helper</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Check your eligibility for small claims court and get helpful resources
        </p>
        
        <Card className="text-left">
          <CardHeader>
            <CardTitle>Eligibility Checker</CardTitle>
            <CardDescription>
              Answer a few questions to determine if your case is suitable for small claims court
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Our questionnaire will help you understand:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 mb-6">
              <li>• Whether your claim meets court requirements</li>
              <li>• If you have the necessary information to proceed</li>
              <li>• Resources and next steps for your situation</li>
            </ul>
            <Link to="/legal-lite-check/eligibility">
              <Button className="w-full">
                Start Eligibility Check
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
