import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from 'react-calendar'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, MapPin, CalendarIcon, DollarSign, Send } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { EligibilityForm, Ethnicity } from "@/logic/EligibilityLogic";
import { ClaimType } from "@/logic/EligibilityLogic";
import 'react-calendar/dist/Calendar.css';
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
  settlementAttempts: boolean;
  canPayFee: boolean;
  zipCode: string;
  incidentZipCode: string;
  defendantZipCode: string;
  selfRepresentation: boolean;
  hasGuardian: boolean;
  hasDefendantInfo: boolean;
  defendantInBankruptcy: boolean;
  firstClaimAgainstDefendant: boolean;
  hasMoreThan12Claims: boolean;
  understandsCourtAttendance: boolean;
}

const EligibilityChecker = ({ onBackToHome }: { onBackToHome?: () => void }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<boolean | null>(null);
  const [ineligibleMessages, setIneligibleMessages] = useState<string[]>([]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
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
    settlementAttempts: false,
    canPayFee: false,
    zipCode: "",
    incidentZipCode: "",
    defendantZipCode: "",
    selfRepresentation: false,
    hasGuardian: false,
    hasDefendantInfo: false,
    defendantInBankruptcy: false,
    firstClaimAgainstDefendant: false,
    hasMoreThan12Claims: false,
    understandsCourtAttendance: false
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

  const validateCurrentStep = (): string[] => {
    const enableErrors: boolean = true
    const errors: string[] = [];
    
    if (!enableErrors) return errors;

    switch (currentStep) {
      case 1:
        if (!formData.claimNature) errors.push("Nature of your claim");
        if (!formData.claimAmount) errors.push("Claim amount");
        if (!formData.claimType) errors.push("Claim type");
        if (!formData.incidentDate) errors.push("Incident date");
        if (!formData.incidentZipCode) errors.push("Incident ZIP code");
        break;
      case 2:
        if (!formData.defendantType) errors.push("Defendant type");
        if (!formData.defendantEthnicity) errors.push("Defendant's ethnicity");
        if (!formData.defendantIncome) errors.push("Defendant's income range");
        if (!formData.defendantZipCode) errors.push("Defendant's ZIP code");
        break;
      case 3:
        if (!formData.plaintiffType) errors.push("Plaintiff type");
        if (!formData.age) errors.push("Plaintiff age");
        if (!formData.plaintiffEthnicity) errors.push("Plaintiff ethnicity");
        if (!formData.plaintiffIncome) errors.push("Plaintiff income range");
        break;
      case 4:
        if (!formData.zipCode) errors.push("Filing location ZIP code");
        break;
    }
    
    return errors;
  };

  const nextStep = () => {
    const errors = validateCurrentStep();
    
    if (errors.length > 0) {
      toast({
        title: "Please complete all required fields",
        description: errors.join(" | "),
        variant: "destructive",
      });
      return;
    }
    
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
    const errors = validateCurrentStep();
    
    if (errors.length > 0) {
      toast({
        title: "Please complete all required fields",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }
    
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

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Please enter your feedback",
        variant: "destructive",
      });
      return;
    }

    setIsSendingFeedback(true);
    
    try {
      // Simulate sending to placeholder email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Feedback sent successfully!",
        description: "Thank you for your feedback. We'll review it and get back to you soon.",
      });
      
      setFeedback("");
      setFeedbackOpen(false);
    } catch (error) {
      toast({
        title: "Failed to send feedback",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSendingFeedback(false);
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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Claim Details & Type</h3>
            <div>
              <Label className="pb-2">Nature of Claim <b style={{color: "red"}}>*</b></Label>
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
              <Label htmlFor="amount">Claim Amount ($) <b style={{color: "red"}}>*</b></Label>
              <Input
                id="amount"
                type="number"
                value={formData.claimAmount}
                onChange={(e) => updateFormData("claimAmount", e.target.value)}
                placeholder="Enter claim amount"
              />
            </div>
            <div>
              <Label>Select Claim Type <b style={{color: "red"}}>*</b></Label>
              <Select value={formData.claimType} onValueChange={(value) => updateFormData("claimType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose claim type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ClaimType).map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>When did the incident occur? <b style={{color: "red"}}>*</b></Label>
              <div className="flex gap-2">
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
                      {formData.incidentDate ? format(formData.incidentDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        minDate={new Date(2000, 0, 1)}
                        value={formData.incidentDate}
                        onChange={(date) => updateFormData("incidentDate", date as Date)}
                        tileDisabled={({ date }) => date > new Date()}
                      />
                    </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label htmlFor="incidentZipCode">ZIP Code of Incident Location <b style={{color: "red"}}>*</b></Label>
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="settlement-attempts"
                checked={formData.settlementAttempts}
                onCheckedChange={(checked) => updateFormData("settlementAttempts", checked)}
              />
              <Label htmlFor="settlement-attempts">The claimant has attempted to settle this matter outside of court <b style={{color: "red"}}>*</b></Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="first-claim"
                checked={formData.firstClaimAgainstDefendant}
                onCheckedChange={(checked) => updateFormData("firstClaimAgainstDefendant", checked)}
              />
              <Label htmlFor="first-claim">This is the claimant's first claim against the defendant on this issue <b style={{color: "red"}}>*</b></Label>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Defendant Information</h3>
            <div>
              <Label className="pb-2">Defendant Type <b style={{color: "red"}}>*</b></Label>
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
              <Label>Defendant's Ethnicity <b style={{color: "red"}}>*</b></Label>
              <Select value={formData.defendantEthnicity} onValueChange={(value) => updateFormData("defendantEthnicity", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ethnicity" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Ethnicity).map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="defendantZipCode">Defendant's ZIP Code <b style={{color: "red"}}>*</b></Label>
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-defendant-info"
                checked={formData.hasDefendantInfo}
                onCheckedChange={(checked) => updateFormData("hasDefendantInfo", checked)}
              />
              <Label htmlFor="has-defendant-info">The claimant has the defendant's legal name and valid residential address <b style={{color: "red"}}>*</b></Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="defendant-bankruptcy"
                checked={formData.defendantInBankruptcy}
                onCheckedChange={(checked) => updateFormData("defendantInBankruptcy", checked)}
              />
              <Label htmlFor="defendant-bankruptcy">The defendant is not currently in bankruptcy <b style={{color: "red"}}>*</b></Label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Claimant Information</h3>
            <div>
              <Label className="pb-2">Claimant Type <b style={{color: "red"}}>*</b></Label>
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
              <Label htmlFor="age">Claimant Age <b style={{color: "red"}}>*</b></Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => updateFormData("age", e.target.value)}
                placeholder="Enter your age"
              />
            </div>
            {parseInt(formData.age) < 18 && formData.age && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-guardian"
                  checked={formData.hasGuardian}
                  onCheckedChange={(checked) => updateFormData("hasGuardian", checked)}
                />
                <Label htmlFor="has-guardian">If the claimant is under 18, they have a guardian appointed <b style={{color: "red"}}>*</b></Label>
              </div>
            )}
            <div>
              <Label>Claimant Ethnicity <b style={{color: "red"}}>*</b></Label>
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="self-representation"
                checked={formData.selfRepresentation}
                onCheckedChange={(checked) => updateFormData("selfRepresentation", checked)}
              />
              <Label htmlFor="self-representation">The claimant will represent themselves in court <b style={{color: "red"}}>*</b></Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="more-than-12-claims"
                checked={formData.hasMoreThan12Claims}
                onCheckedChange={(checked) => updateFormData("hasMoreThan12Claims", checked)}
              />
              <Label htmlFor="more-than-12-claims">The claimant has not made more than 12 claims in the past year at this court <b style={{color: "red"}}>*</b></Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="understands-court-attendance"
                checked={formData.understandsCourtAttendance}
                onCheckedChange={(checked) => updateFormData("understandsCourtAttendance", checked)}
              />
              <Label htmlFor="understands-court-attendance">The claimant understand that they HAVE TO attend scheduled court hearings <b style={{color: "red"}}>*</b></Label>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Final Details & Filing Location</h3>
            <div>
              <Label htmlFor="zip-code">Zip Code of Filing Location <b style={{color: "red"}}>*</b></Label>
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
              <Label htmlFor="filing-fee">The claimant can afford the $50 filing fee <b style={{color: "red"}}>*</b></Label>
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
              {eligibilityResult && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" strokeWidth={3} />
                    <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">Potential Savings</h3>
                  </div>
                  <p className="text-green-600 dark:text-green-400 text-sm mb-2">
                    You can save between $300-800 by representing yourself in small claims court instead of hiring an attorney.
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mb-3">
                    *Estimated based on typical attorney fees. Actual savings may vary.
                  </p>
                </div>
              )}
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

              {/* Newsletter/Demo Signup Section */}
              <div className="mt-8 p-6 border rounded-lg bg-card">
                <h3 className="text-lg font-semibold mb-3">Stay Updated & Get Expert Help</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Book a Demo with us and learn how to best use our tool, or contact us for any questions, comments or feedback!
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newsletter-name">Full Name</Label>
                      <Input
                        id="newsletter-name"
                        type="text"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newsletter-email">Email Address</Label>
                      <Input
                        id="newsletter-email"
                        type="email"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          Send Us Your Feedback
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Send Us Your Feedback</DialogTitle>
                          <DialogDescription>
                            We'd love to hear your thoughts about our eligibility checker. Your feedback helps us improve!
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Please share your feedback, suggestions, or any issues you encountered..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={4}
                            className="resize-none"
                          />
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2">
                          <Button variant="outline" onClick={() => setFeedbackOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleFeedbackSubmit} 
                            disabled={isSendingFeedback}
                            className="flex items-center gap-2"
                          >
                            {isSendingFeedback ? (
                              "Sending..."
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Send Feedback
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                      Book a Demo
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={() => {
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
                    settlementAttempts: false,
                    canPayFee: false,
                    zipCode: "",
                    incidentZipCode: "",
                    defendantZipCode: "",
                    selfRepresentation: false,
                    hasGuardian: false,
                    hasDefendantInfo: false,
                    defendantInBankruptcy: false,
                    firstClaimAgainstDefendant: false,
                    hasMoreThan12Claims: false,
                    understandsCourtAttendance: false
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
                <Button onClick={onBackToHome}>
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
                className="bg-primary h-2 rounded-full transition-all duration-300 track-loading"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="min-h-[300px]">
              {renderStep()}
            </div>
            <div className="flex justify-between mt-6">
              {onBackToHome && currentStep === 1 ? (
                <Button 
                  variant="outline" 
                  onClick={onBackToHome}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
              
              {currentStep === totalSteps ? (
                <Button
                  className="btn-primary"
                  onClick={submitForm}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Checking..." : "Check Eligibility"}
                </Button>
              ) : (
                <Button className="btn-primary" onClick={nextStep}>
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