import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isEligibleForSmallClaim } from "@/logic/EligibilityLogic";

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
  claimDescription: string;
  zipCode: string;
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
    claimDescription: "",
    zipCode: ""
  });

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const totalSteps = 6;

  // Google Analytics tracking function
  const trackFieldInteraction = (fieldName: string, value: any, step: number) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'form_field_interaction', {
        field_name: fieldName,
        field_value: value,
        form_step: step,
        form_name: 'small_claims_eligibility'
      });
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    trackFieldInteraction(field, value, currentStep);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'form_step_completed', {
          step_number: currentStep,
          form_name: 'small_claims_eligibility'
        });
      }
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
    
    // Track form submission attempt
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'form_submission_started', {
        form_name: 'small_claims_eligibility'
      });
    }
    
    // Call the local eligibility logic function
    const formDataJson = JSON.stringify(formData);
    const eligibility = isEligibleForSmallClaim(formDataJson);
    setEligibilityResult(eligibility);
    
    // Track successful submission
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'form_submission_success', {
        form_name: 'small_claims_eligibility',
        eligibility_result: eligibility
      });
    }
    
    setIsSubmitting(false);
  };

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser");
      }
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const { latitude, longitude } = position.coords;
      
      // Use Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const zipCode = data.address?.postcode || "";
        
        if (zipCode) {
          updateFormData("zipCode", zipCode);
          toast({
            title: "Location found",
            description: `Zip code ${zipCode} has been filled in automatically.`,
          });
        } else {
          throw new Error("Could not determine zip code from location");
        }
      } else {
        throw new Error("Failed to get location data");
      }
    } catch (error: any) {
      toast({
        title: "Location error",
        description: error.message || "Could not get your location. Please enter zip code manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLocation(false);
    }
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
            <div>
              <Label htmlFor="amount">Claim Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.claimAmount}
                onChange={(e) => updateFormData("claimAmount", e.target.value)}
                placeholder="Enter claim amount (if applicable)"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Type of Claim & Timeframe</h3>
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
            <h3 className="text-lg font-medium">Final Details & Filing Location</h3>
            <div>
              <Label htmlFor="zip-code">Zip Code of Filing Location</Label>
              <div className="flex gap-2">
                <Input
                  id="zip-code"
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => updateFormData("zipCode", e.target.value)}
                  placeholder="Enter zip code (e.g., 90210)"
                  maxLength={5}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={isLoadingLocation}
                  className="shrink-0"
                >
                  {isLoadingLocation ? (
                    <>Loading...</>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Use Location
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the zip code where you plan to file your small claims case, or use your current location.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filing-fee"
                checked={formData.canPayFee}
                onCheckedChange={(checked) => updateFormData("canPayFee", checked)}
              />
              <Label htmlFor="filing-fee">I can afford the $50 filing fee</Label>
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
                    href="https://www.courts.wa.gov/newsinfo/resources/?altMenu=smal&fa=newsinfo_jury.scc"
                    className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">Washington State Small Claims Info Page</div>
                    <div className="text-sm text-muted-foreground">General information on small claims in Washington State</div>
                  </a>
                  <a
                    href="https://app.leg.wa.gov/RCW/default.aspx?cite=12.40"
                    className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">WA State Small Claims Statutes (RCW)</div>
                    <div className="text-sm text-muted-foreground">Check you small claim case status</div>
                  </a>
                  <a
                    href="https://kingcounty.gov/en/court/district-court/courts-jails-legal-system/small-claims"
                    className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">Small Claim Guide for King County</div>
                    <div className="text-sm text-muted-foreground">Step-by-step guide for small claims in King County, WA</div>
                  </a>
                  <a
                    href="https://www.courts.wa.gov/forms/?fa=forms.contribute&formID=33"
                    className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">Useful PDFs of General Guides</div>
                    <div className="text-sm text-muted-foreground">Guides in PDF format for Washington State</div>
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
                    claimDescription: "",
                    zipCode: ""
                  });
                  
                  // Track form restart
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'form_restarted', {
                      form_name: 'small_claims_eligibility'
                    });
                  }
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