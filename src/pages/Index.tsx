import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Scale, ArrowRight, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Index = () => {
  const [termsAccepted, setTermsAccepted] = useState(false);

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
            
            {/* Legal Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 mb-2">Important Legal Disclaimer</p>
                  <p className="text-amber-700">
                    This eligibility checker is provided for informational purposes only and does not constitute professional legal advice. 
                    The results are based on general guidelines and your specific situation may require additional legal considerations. 
                    For specific legal advice, please consult with a qualified attorney.
                  </p>
                </div>
              </div>
            </div>

            {/* Terms of Service Checkbox */}
            <div className="flex items-start space-x-3 mb-6">
              <Checkbox 
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                I have read and understand ClaimRunnerAI's{" "}
                <a href="#" className="text-primary underline hover:no-underline">
                  Terms of Service
                </a>{" "}
                and acknowledge that this tool provides general information only and is not a substitute for professional legal advice.
              </label>
            </div>

            {termsAccepted ? (
              <Link to="/legal-lite-check/eligibility">
                <Button className="w-full">
                  Start Eligibility Check
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Button className="w-full" disabled>
                Start Eligibility Check
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
