import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, MapPin, CalendarIcon, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { EligibilityForm, Ethnicity } from "@/logic/EligibilityLogic";
import { ClaimType } from "@/logic/EligibilityLogic";

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
  incidentDate: Date | undefined;
  settlementAttempts: string;
  canPayFee: boolean;
  zipCode: string;
  incidentZipCode: string;
  defendantZipCode: string;
  selfRepresentation: string;
}

const Index = () => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showEligibilityForm, setShowEligibilityForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<boolean | null>(null);
  const [ineligibleMessages, setIneligibleMessages] = useState<string[]>([]);
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
    incidentDate: undefined,
    settlementAttempts: "",
    canPayFee: false,
    zipCode: "",
    incidentZipCode: "",
    defendantZipCode: "",
    selfRepresentation: ""
  });

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const totalSteps = 4;

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
      (window as any).gtag('event', 'form_submit', {
        form_name: 'small_claims_eligibility'
      });
    }
    
    // Create EligibilityForm object and populate with form data
    const eligibilityForm = new EligibilityForm(JSON.stringify(formData));
    
    // Set incident date from form data
    if (formData.incidentDate) {
      (eligibilityForm as any).incidentDate = formData.incidentDate;
    }
    
    // Call the eligibility check method
    const eligibility = eligibilityForm.isEligible();
    setEligibilityResult(eligibility[0]);
    setIneligibleMessages(eligibility[1]);
    
    // Track successful submission
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'form_submission_success', {
        form_name: 'small_claims_eligibility',
        eligibility_result: eligibility
      });
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'submission_info', {
          age: eligibilityForm.getAge(),
          claimType: eligibilityForm.getClaimType(),
          defendantType: eligibilityForm.getDefendantType(),
          defendantEthnicity: eligibilityForm.getDefendantEthnicity(),
          defendantIncome: eligibilityForm.getDefendantIncome(),
          plaintiffType: eligibilityForm.getPlaintiffType(),
          plaintiffEthnicity: eligibilityForm.getPlaintiffEthnicity(),
          plaintiffIncome: eligibilityForm.getPlaintiffIncome(),
          zipCode: eligibilityForm.getZipCode(),
        });
      }
    
    setIsSubmitting(false);
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
        throw new Error("Failed to get location data");
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

  const handleStartEligibilityCheck = () => {
    if (termsAccepted) {
      setShowEligibilityForm(true);
    }
  };

  const resetForm = () => {
    setShowEligibilityForm(false);
    setEligibilityResult(null);
    setIneligibleMessages([]);
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
      incidentDate: undefined,
      settlementAttempts: "",
      canPayFee: false,
      zipCode: "",
      incidentZipCode: "",
      defendantZipCode: "",
      selfRepresentation: ""
    });
    
    // Track form restart
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'form_restarted', {
        form_name: 'small_claims_eligibility'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-2xl">
        <div className="flex justify-center mb-6">
          {/* <Scale className="h-16 w-16 text-primary" /> */}
          <img src="public/logo.png" alt="Logo" className="h-32 w-32 ml-4" />
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

            <Button 
              className="w-full" 
              disabled={!termsAccepted}
              onClick={handleStartEligibilityCheck}
            >
              Start Eligibility Check
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Claim Details & Type</h3>
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
                placeholder="Enter claim amount"
              />
            </div>
            <div>
              <Label>Select Claim Type</Label>
              <Select value={formData.claimType} onValueChange={(value) => updateFormData("claimType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose claim type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ClaimType.BreachOfContract}>{ClaimType.BreachOfContract}</SelectItem>
                    <SelectItem value={ClaimType.PropertyDamage}>{ClaimType.PropertyDamage}</SelectItem>
                  <SelectItem value={ClaimType.PersonalInjury}>{ClaimType.PersonalInjury}</SelectItem>
                  <SelectItem value={ClaimType.LandlordTenantDispute}>{ClaimType.LandlordTenantDispute}</SelectItem>
                  <SelectItem value={ClaimType.DebtCollection}>{ClaimType.DebtCollection}</SelectItem>
                  <SelectItem value={ClaimType.Other}>{ClaimType.Other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>When did the incident occur?</Label>
              <div className="space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.incidentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.incidentDate ? (
                        format(formData.incidentDate, "PPP")
                      ) : (
                        <span>Select incident date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.incidentDate}
                      onSelect={(date) => updateFormData("incidentDate", date)}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={1990}
                      toYear={new Date().getFullYear()}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                
                <div className="text-sm text-muted-foreground">
                  Or enter manually:
                </div>
                <Input
                  type="date"
                  max={format(new Date(), "yyyy-MM-dd")}
                  value={formData.incidentDate ? format(formData.incidentDate, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      updateFormData("incidentDate", new Date(e.target.value));
                    } else {
                      updateFormData("incidentDate", undefined);
                    }
                  }}
                  placeholder="Enter date manually"
                  className="w-full"
                />
              </div>
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

      case 2:
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
                  <SelectItem value={Ethnicity.White}>{Ethnicity.White}</SelectItem>
                  <SelectItem value={Ethnicity.Black}>{Ethnicity.Black}</SelectItem>
                  <SelectItem value={Ethnicity.Hispanic}>{Ethnicity.Hispanic}</SelectItem>
                  <SelectItem value={Ethnicity.Asian}>{Ethnicity.Asian}</SelectItem>
                  <SelectItem value={Ethnicity.NativeAmerican}>{Ethnicity.NativeAmerican}</SelectItem>
                  <SelectItem value={Ethnicity.Other}>{Ethnicity.Other}</SelectItem>
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

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Claimant Information</h3>
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
              <Label htmlFor="age">Your Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => updateFormData("age", e.target.value)}
                placeholder="Enter your age"
              />
            </div>
            <div>
              <Label>Your Ethnicity</Label>
              <Select value={formData.plaintiffEthnicity} onValueChange={(value) => updateFormData("plaintiffEthnicity", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ethnicity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Ethnicity.White}>{Ethnicity.White}</SelectItem>
                  <SelectItem value={Ethnicity.Black}>{Ethnicity.Black}</SelectItem>
                  <SelectItem value={Ethnicity.Hispanic}>{Ethnicity.Hispanic}</SelectItem>
                  <SelectItem value={Ethnicity.Asian}>{Ethnicity.Asian}</SelectItem>
                  <SelectItem value={Ethnicity.NativeAmerican}>{Ethnicity.NativeAmerican}</SelectItem>
                  <SelectItem value={Ethnicity.Other}>{Ethnicity.Other}</SelectItem>
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
            <div>
              <Label>Will you represent yourself in court?</Label>
              <RadioGroup
                value={formData.selfRepresentation}
                onValueChange={(value) => updateFormData("selfRepresentation", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="self-rep-yes" />
                  <Label htmlFor="self-rep-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="self-rep-no" />
                  <Label htmlFor="self-rep-no">No</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 4:
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
                  onClick={() => getCurrentLocation('zipCode')}
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
              {!eligibilityResult && ineligibleMessages.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-destructive">Issues Found:</h3>
                  <ul className="space-y-3">
                    {ineligibleMessages.map((message, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mt-1">
                    DISCLAIMER: ClaimRunnerAI is not a law firm and does not provide legal advice. Our platform offers automated tools and publicly available information to help you navigate the small claims process in King County, Washington State. You are solely responsible for any actions you take. If you need legal advice, we encourage you to consult a licensed attorney
                  </p>
                </div>
                
              </div>
              <div className="flex gap-3">
                <Button onClick={resetForm} variant="outline">
                  Start Over
                </Button>
                <Button onClick={resetForm}>
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showEligibilityForm) {
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
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-2xl">
        <div className="flex justify-center mb-6">
          {/* <Scale className="h-16 w-16 text-primary" /> */}
          <img src="public/logo.png" alt="Logo" className="h-32 w-32 ml-4" />
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

            <Button 
              className="w-full" 
              disabled={!termsAccepted}
              onClick={handleStartEligibilityCheck}
            >
              Start Eligibility Check
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
