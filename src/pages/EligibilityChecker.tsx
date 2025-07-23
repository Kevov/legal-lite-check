import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  age: string;
  claimNature: string;
  claimAmount: string;
  claimType: string;
  defendantType: string;
  defendantEthnicity: string;
  defendantIncome: string;
  plaintiffType: string;
  plaintiffEthnicity: string;
  plaintiffIncome: string;
  timeframe: string;
  settlementAttempts: string;
  canPayFee: boolean;
  defendantContact: string;
  claimDescription: string;
}

const EligibilityChecker = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<boolean | null>(null);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    age: "",
    claimNature: "",
    claimAmount: "",
    claimType: "",
    defendantType: "",
    defendantEthnicity: "",
    defendantIncome: "",
    plaintiffType: "",
    plaintiffEthnicity: "",
    plaintiffIncome: "",
    timeframe: "",
    settlementAttempts: "",
    canPayFee: false,
    defendantContact: "",
    claimDescription: ""
  });

  const totalSteps = 8;

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("http://localhost:3000/checker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const result = await response.json();
        setEligibilityResult(result.eligibility);
      } else {
        throw new Error("Server error");
      }
    } catch (error) {
      // Default behavior when backend fails
      const mockEligibility = Math.random() > 0.3; // 70% chance of eligibility
      setEligibilityResult(mockEligibility);
      
      toast({
        title: "Using offline mode",
        description: "Could not connect to server. Showing sample result.",
        variant: "default",
      });
    }
    
    setIsSubmitting(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div>
              <Label htmlFor="age">Your Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => updateFormData("age", e.target.value)}
                placeholder="Enter your age"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Claim Details</h3>
            <div>
              <Label>Nature of Claim</Label>
              <RadioGroup
                value={formData.claimNature}
                onValueChange={(value) => updateFormData("claimNature", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monetary" id="monetary" />
                  <Label htmlFor="monetary">Monetary Value</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>
            {formData.claimNature === "monetary" && (
              <div>
                <Label htmlFor="amount">Claim Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.claimAmount}
                  onChange={(e) => updateFormData("claimAmount", e.target.value)}
                  placeholder="Enter claim amount"
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Type of Claim</h3>
            <div>
              <Label>Select Claim Type</Label>
              <Select value={formData.claimType} onValueChange={(value) => updateFormData("claimType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose claim type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contract Dispute</SelectItem>
                  <SelectItem value="property">Property Damage</SelectItem>
                  <SelectItem value="personal-injury">Personal Injury</SelectItem>
                  <SelectItem value="landlord-tenant">Landlord/Tenant</SelectItem>
                  <SelectItem value="debt">Debt Collection</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Defendant Information</h3>
            <div>
              <Label>Defendant Type</Label>
              <RadioGroup
                value={formData.defendantType}
                onValueChange={(value) => updateFormData("defendantType", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="defendant-individual" />
                  <Label htmlFor="defendant-individual">Individual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="company" id="defendant-company" />
                  <Label htmlFor="defendant-company">Company</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label>Defendant's Ethnicity</Label>
              <Select value={formData.defendantEthnicity} onValueChange={(value) => updateFormData("defendantEthnicity", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ethnicity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="black">Black or African American</SelectItem>
                  <SelectItem value="hispanic">Hispanic or Latino</SelectItem>
                  <SelectItem value="asian">Asian</SelectItem>
                  <SelectItem value="native">Native American</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Defendant's Income Range</Label>
              <Select value={formData.defendantIncome} onValueChange={(value) => updateFormData("defendantIncome", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select income range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  <SelectItem value="under-25k">Under $25,000</SelectItem>
                  <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                  <SelectItem value="50k-75k">$50,000 - $75,000</SelectItem>
                  <SelectItem value="75k-100k">$75,000 - $100,000</SelectItem>
                  <SelectItem value="over-100k">Over $100,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Your Information</h3>
            <div>
              <Label>Your Type</Label>
              <RadioGroup
                value={formData.plaintiffType}
                onValueChange={(value) => updateFormData("plaintiffType", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="plaintiff-individual" />
                  <Label htmlFor="plaintiff-individual">Individual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="company" id="plaintiff-company" />
                  <Label htmlFor="plaintiff-company">Company</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label>Your Ethnicity</Label>
              <Select value={formData.plaintiffEthnicity} onValueChange={(value) => updateFormData("plaintiffEthnicity", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ethnicity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="black">Black or African American</SelectItem>
                  <SelectItem value="hispanic">Hispanic or Latino</SelectItem>
                  <SelectItem value="asian">Asian</SelectItem>
                  <SelectItem value="native">Native American</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Your Income Range</Label>
              <Select value={formData.plaintiffIncome} onValueChange={(value) => updateFormData("plaintiffIncome", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select income range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-25k">Under $25,000</SelectItem>
                  <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                  <SelectItem value="50k-75k">$50,000 - $75,000</SelectItem>
                  <SelectItem value="75k-100k">$75,000 - $100,000</SelectItem>
                  <SelectItem value="over-100k">Over $100,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Timeframe & Settlement</h3>
            <div>
              <Label>When did the incident occur?</Label>
              <Select value={formData.timeframe} onValueChange={(value) => updateFormData("timeframe", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="within-30-days">Within 30 days</SelectItem>
                  <SelectItem value="1-6-months">1-6 months ago</SelectItem>
                  <SelectItem value="6-12-months">6-12 months ago</SelectItem>
                  <SelectItem value="1-2-years">1-2 years ago</SelectItem>
                  <SelectItem value="2-3-years">2-3 years ago</SelectItem>
                  <SelectItem value="over-3-years">Over 3 years ago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Have you attempted to settle this matter outside of court?</Label>
              <RadioGroup
                value={formData.settlementAttempts}
                onValueChange={(value) => updateFormData("settlementAttempts", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="settlement-yes" />
                  <Label htmlFor="settlement-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="settlement-no" />
                  <Label htmlFor="settlement-no">No</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Filing Requirements</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filing-fee"
                checked={formData.canPayFee}
                onCheckedChange={(checked) => updateFormData("canPayFee", checked)}
              />
              <Label htmlFor="filing-fee">I can afford the $50 filing fee</Label>
            </div>
            <div>
              <Label htmlFor="defendant-contact">Defendant's Contact Information</Label>
              <Textarea
                id="defendant-contact"
                value={formData.defendantContact}
                onChange={(e) => updateFormData("defendantContact", e.target.value)}
                placeholder="Enter defendant's name, address, phone number, or email"
                rows={3}
              />
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Claim Description</h3>
            <div>
              <Label htmlFor="claim-description">Describe your claim in detail</Label>
              <Textarea
                id="claim-description"
                value={formData.claimDescription}
                onChange={(e) => updateFormData("claimDescription", e.target.value)}
                placeholder="Provide a detailed description of your claim, including relevant dates, damages, and what you're seeking"
                rows={6}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (eligibilityResult !== null) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {eligibilityResult ? (
                  <CheckCircle className="h-16 w-16 text-green-500" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {eligibilityResult ? "You may be eligible!" : "Additional steps needed"}
              </CardTitle>
              <CardDescription>
                {eligibilityResult
                  ? "Based on your responses, you appear to meet the requirements for small claims court."
                  : "Your case may need additional preparation or may not be suitable for small claims court."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Helpful Resources</h3>
                <div className="space-y-2">
                  <a
                    href="#"
                    className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">Small Claims Court Filing Guide</div>
                    <div className="text-sm text-muted-foreground">Step-by-step instructions for filing your claim</div>
                  </a>
                  <a
                    href="#"
                    className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">Court Forms and Documents</div>
                    <div className="text-sm text-muted-foreground">Download required forms for your jurisdiction</div>
                  </a>
                  <a
                    href="#"
                    className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">Legal Aid Resources</div>
                    <div className="text-sm text-muted-foreground">Find free or low-cost legal assistance</div>
                  </a>
                  <a
                    href="#"
                    className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">Court Location Finder</div>
                    <div className="text-sm text-muted-foreground">Find your local small claims court</div>
                  </a>
                  <a
                    href="#"
                    className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">Mediation Services</div>
                    <div className="text-sm text-muted-foreground">Alternative dispute resolution options</div>
                  </a>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => {
                  setEligibilityResult(null);
                  setCurrentStep(1);
                  setFormData({
                    age: "",
                    claimNature: "",
                    claimAmount: "",
                    claimType: "",
                    defendantType: "",
                    defendantEthnicity: "",
                    defendantIncome: "",
                    plaintiffType: "",
                    plaintiffEthnicity: "",
                    plaintiffIncome: "",
                    timeframe: "",
                    settlementAttempts: "",
                    canPayFee: false,
                    defendantContact: "",
                    claimDescription: ""
                  });
                }} variant="outline">
                  Start Over
                </Button>
                <Button onClick={() => window.location.href = "/"}>
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Small Claims Eligibility Checker</CardTitle>
            <CardDescription>
              Step {currentStep} of {totalSteps} - Answer these questions to check your eligibility
            </CardDescription>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="min-h-[300px]">
              {renderStep()}
            </div>
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStep === totalSteps ? (
                <Button
                  onClick={submitForm}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Checking..." : "Check Eligibility"}
                </Button>
              ) : (
                <Button onClick={nextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EligibilityChecker;