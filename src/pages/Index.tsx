import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Scale, ArrowRight, MapPin, X } from "lucide-react";
import { EligibilityForm } from "@/logic/EligibilityLogic";

const Index = () => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    claimAmount: "",
    zipCode: "",
    incidentZipCode: "",
    defendantZipCode: "",
    attemptedSettlement: "",
    claimType: "",
    hasProperNotice: "",
    hasDocumentation: "",
    defendantName: "",
    defendantAddress: "",
    withinTimeLimit: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ eligible: boolean; messages: string[] } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const { toast } = useToast();

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const formDataObj = {
        age: 18, // Assume adult for now
        claimNature: "General claim",
        claimAmount: parseFloat(formData.claimAmount),
        claimType: formData.claimType,
        defendantType: "individual",
        defendantEthnicity: "Other",
        defendantIncome: 0,
        plaintiffType: "individual", 
        plaintiffEthnicity: "Other",
        plaintiffIncome: 0,
        incidentDate: new Date().toISOString(),
        settlementAttempts: formData.attemptedSettlement === "yes",
        canPayFees: true,
        selfRepresentation: true,
        zipCode: formData.zipCode
      };

      const eligibilityForm = new EligibilityForm(JSON.stringify(formDataObj));

      const [eligible, messages] = eligibilityForm.isEligible();
      setResult({ eligible, messages });
      setCurrentStep(5);
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentLocation = async (fieldName: 'zipCode' | 'incidentZipCode' | 'defendantZipCode') => {
    setIsLoadingLocation(true);
    
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser");
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;
      
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY&no_annotations=1&limit=1`
      );
      
      if (!response.ok) {
        throw new Error("Failed to get location information");
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const zipCode = data.results[0].components?.postcode || "";
        
        if (zipCode) {
          updateFormData(fieldName, zipCode);
          const fieldLabels = {
            zipCode: "your location",
            incidentZipCode: "incident location", 
            defendantZipCode: "defendant's address"
          };
          toast({
            title: "Location found",
            description: `ZIP code ${zipCode} has been filled in for ${fieldLabels[fieldName]}.`,
          });
        } else {
          throw new Error("Could not determine zip code from location");
        }
      } else {
        throw new Error("No location data found");
      }
    } catch (error: any) {
      toast({
        title: "Location error",
        description: error.message || "Could not get your location. Please enter ZIP code manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setResult(null);
    setFormData({
      claimAmount: "",
      zipCode: "",
      incidentZipCode: "",
      defendantZipCode: "",
      attemptedSettlement: "",
      claimType: "",
      hasProperNotice: "",
      hasDocumentation: "",
      defendantName: "",
      defendantAddress: "",
      withinTimeLimit: "",
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="claimAmount">What is the dollar amount of your claim?</Label>
              <Input
                id="claimAmount"
                type="number"
                value={formData.claimAmount}
                onChange={(e) => updateFormData("claimAmount", e.target.value)}
                placeholder="Enter amount (e.g., 5000)"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="zipCode">What is your ZIP code?</Label>
              <div className="flex gap-2">
                <Input
                  id="zipCode"
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => updateFormData("zipCode", e.target.value)}
                  placeholder="Enter your ZIP code"
                  maxLength={5}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => getCurrentLocation('zipCode')}
                  disabled={isLoadingLocation}
                  className="shrink-0"
                >
                  {isLoadingLocation ? (
                    <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label>What type of claim do you have?</Label>
              <RadioGroup 
                value={formData.claimType} 
                onValueChange={(value) => updateFormData("claimType", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="contract" id="contract" />
                  <Label htmlFor="contract">Contract dispute</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="property" id="property" />
                  <Label htmlFor="property">Property damage</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="personal" id="personal" />
                  <Label htmlFor="personal">Personal injury</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="debt" id="debt" />
                  <Label htmlFor="debt">Debt collection</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="incidentZipCode">ZIP Code of Incident Location</Label>
              <div className="flex gap-2">
                <Input
                  id="incidentZipCode"
                  type="text"
                  value={formData.incidentZipCode}
                  onChange={(e) => updateFormData("incidentZipCode", e.target.value)}
                  placeholder="Enter ZIP code where incident occurred"
                  maxLength={5}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => getCurrentLocation('incidentZipCode')}
                  disabled={isLoadingLocation}
                  className="shrink-0"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>Have you attempted to settle this matter outside of court?</Label>
              <RadioGroup 
                value={formData.attemptedSettlement} 
                onValueChange={(value) => updateFormData("attemptedSettlement", value)}
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

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="defendantName">Defendant's Name</Label>
              <Input
                id="defendantName"
                type="text"
                value={formData.defendantName}
                onChange={(e) => updateFormData("defendantName", e.target.value)}
                placeholder="Enter defendant's full name"
              />
            </div>
            <div>
              <Label htmlFor="defendantAddress">Defendant's Address</Label>
              <Input
                id="defendantAddress"
                type="text"
                value={formData.defendantAddress}
                onChange={(e) => updateFormData("defendantAddress", e.target.value)}
                placeholder="Enter defendant's address"
              />
            </div>
            <div>
              <Label htmlFor="defendantZipCode">Defendant's ZIP Code</Label>
              <div className="flex gap-2">
                <Input
                  id="defendantZipCode"
                  type="text"
                  value={formData.defendantZipCode}
                  onChange={(e) => updateFormData("defendantZipCode", e.target.value)}
                  placeholder="Enter defendant's ZIP code"
                  maxLength={5}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => getCurrentLocation('defendantZipCode')}
                  disabled={isLoadingLocation}
                  className="shrink-0"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label>Do you have proper documentation for your claim?</Label>
              <RadioGroup 
                value={formData.hasDocumentation} 
                onValueChange={(value) => updateFormData("hasDocumentation", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="docs-yes" />
                  <Label htmlFor="docs-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="docs-no" />
                  <Label htmlFor="docs-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label>Have you provided proper notice to the defendant?</Label>
              <RadioGroup 
                value={formData.hasProperNotice} 
                onValueChange={(value) => updateFormData("hasProperNotice", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="notice-yes" />
                  <Label htmlFor="notice-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="notice-no" />
                  <Label htmlFor="notice-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label>Is your claim within the statute of limitations?</Label>
              <RadioGroup 
                value={formData.withinTimeLimit} 
                onValueChange={(value) => updateFormData("withinTimeLimit", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="time-yes" />
                  <Label htmlFor="time-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="time-no" />
                  <Label htmlFor="time-no">No</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 5:
        if (!result) return null;
        
        return (
          <div className="space-y-4">
            <div className={`p-4 rounded-md ${result.eligible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h3 className={`font-semibold ${result.eligible ? 'text-green-800' : 'text-red-800'}`}>
                {result.eligible ? 'Your case appears eligible for small claims court!' : 'Your case may not be eligible for small claims court'}
              </h3>
              <p className={`mt-2 ${result.eligible ? 'text-green-700' : 'text-red-700'}`}>
                {result.eligible 
                  ? 'Based on your answers, you meet the basic requirements to file in small claims court.'
                  : 'Based on your answers, there are some issues that need to be addressed:'
                }
              </p>
            </div>
            
            {!result.eligible && result.messages.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-800">Issues to address:</h4>
                <ul className="space-y-2">
                  {result.messages.map((message, index) => (
                    <li key={index} className="flex items-start gap-2 text-red-700">
                      <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="pt-4">
              <Button onClick={resetForm} variant="outline" className="w-full">
                Start New Assessment
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Claim Amount & Location";
      case 2: return "Claim Details & Type";
      case 3: return "Defendant Information";
      case 4: return "Documentation & Notice";
      case 5: return "Eligibility Results";
      default: return "";
    }
  };

  if (!showForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-2xl">
          <div className="flex justify-center mb-6">
            <Scale className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">ClaimRunnerAI Small Claims Helper</h1>
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
              <div className="space-y-6">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="font-medium text-yellow-800 mb-2">Important Disclaimer</h4>
                  <p className="text-sm text-yellow-700">
                    This eligibility checker is provided for informational purposes only and does not constitute professional legal advice. 
                    The results are based on general guidelines and may not reflect the specific requirements of your jurisdiction. 
                    For personalized legal guidance, please consult with a qualified attorney.
                  </p>
                </div>
                
                <div className="p-4 text-sm text-muted-foreground">
                  <p className="mb-4">Our questionnaire will help you understand:</p>
                  <ul className="space-y-1 mb-6">
                    <li>• Whether your claim meets court requirements</li>
                    <li>• If you have the necessary information to proceed</li>
                    <li>• Resources and next steps for your situation</li>
                  </ul>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-md">
                  <Checkbox 
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I understand and agree to ClaimRunnerAI's Terms of Service
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      I acknowledge that this tool provides general information only and is not a substitute for professional legal advice.
                    </p>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  disabled={!acceptedTerms}
                  onClick={() => setShowForm(true)}
                >
                  Start Eligibility Check
                  <ArrowRight className="h-4 w-4 ml-2" />
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
        <div className="flex items-center justify-center mb-6">
          <Scale className="h-12 w-12 text-primary mr-3" />
          <h1 className="text-3xl font-bold">ClaimRunnerAI Eligibility Checker</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Step {currentStep} of 4: {getStepTitle()}</CardTitle>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
            
            <div className="flex justify-between mt-6">
              <Button 
                onClick={prevStep} 
                disabled={currentStep === 1 || currentStep === 5}
                variant="outline"
              >
                Previous
              </Button>
              
              {currentStep < 4 ? (
                <Button onClick={nextStep}>
                  Next
                </Button>
              ) : currentStep === 4 ? (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Checking..." : "Check Eligibility"}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
