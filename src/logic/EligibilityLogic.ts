export const KING_COUNTY_ZIP_CODES = new Set<number>([
  98001,98002,98003,98004,98005,98006,98007,98008,98009,98010,98011,98013,98014,98015,98019,98022,98023,98024,98025,98027,98028,98029,98030,98031,98032,98033,98034,98035,98038,98039,98040,98041,98042,98045,98047,98050,98051,98052,98053,98054,98055,98056,98057,98058,98059,98062,98063,98064,98065,98070,98071,98072,98073,98074,98075,98077,98083,98089,98092,98093,98101,98102,98103,98104,98105,98106,98107,98108,98109,98111,98112,98113,98114,98115,98116,98117,98118,98119,98121,98122,98124,98125,98126,98127,98129,98131,98132,98133,98134,98136,98138,98139,98141,98144,98145,98146,98148,98151,98154,98155,98158,98160,98161,98164,98165,98166,98168,98170,98171,98174,98175,98177,98178,98181,98184,98185,98188,98190,98191,98194,98195,98198,98199,98224,98251,98288,98354
]);

export enum ClaimType {
  PropertyDamage = "Property Damage",
  PersonalInjury = "Personal Injury",
  BreachOfContract = "Breach of Contract",
  LandlordTenantDispute = "Landlord/Tenant Dispute",
  UnpaidWages = "Unpaid Wages",
  DebtCollection = "Debt Collection",
  Other = "Other"
}

export enum Ethnicity {
  Asian = "Asian",
  Black = "Black",
  Hispanic = "Hispanic",
  NativeAmerican = "Native American",
  White = "White",
  Other = "Other"
}

export class EligibilityForm {
  // Define the properties and methods for the eligibility form
  private age: number;
  private claimNature: string;
  private claimAmount: number;
  private claimType: string;
  private claimSettlementAttempted: boolean;
  private defendantType: string;
  private defendantEthnicity: string;
  private defendantIncome: number;
  private plaintiffType: string;
  private plaintiffEthnicity: string;
  private plaintiffIncome: number;
  private incidentDate: Date;
  private settlementAttempts: boolean;
  private canPayFees: boolean;
  private selfRepresentation: boolean;
  private zipCode: number;
  constructor(public input: string) {}

  public isEligible(): [boolean, string[]] {
    // Implement eligibility logic here
    let inEligibleMessages: string[] = []
    let isEligible = true
    if (this.age < 18) {
      inEligibleMessages.push("You must be at least 18 years old to file a claim.");
      isEligible = false;
    }
    if (this.claimAmount > 10000) {
      inEligibleMessages.push("The claim amount exceeds the maximum limit for small claims.");
      isEligible = false;
    }
    if (this.claimAmount > 5000 && this.defendantType !== 'individual') {
      inEligibleMessages.push("Claims over $5000 can only be filed against individuals.");
      isEligible = false;
    }
    if (this.claimAmount > 5000 && this.plaintiffType !== 'individual') {
      inEligibleMessages.push("Claims over $5000 can only be filed by individuals.");
      isEligible = false;
    }
    if (!KING_COUNTY_ZIP_CODES.has(this.zipCode)) {
      inEligibleMessages.push("You must reside in King County to file a claim.");
      isEligible = false;
    }
    if (this.claimType === 'Other') {
      inEligibleMessages.push("Not in the list of accepted claim types.");
      isEligible = false;
    }
    if (!this.selfRepresentation) {
      inEligibleMessages.push("You must represent yourself in small claims court.");
      isEligible = false;
    }
    if (this.incidentDate) {
      const today = new Date();
      const sixYearsAgo = new Date(
        today.getFullYear() - 6,
        today.getMonth(),
        today.getDate()
      );
      if (this.incidentDate < sixYearsAgo) {
        inEligibleMessages.push(`The incident date of ${this.incidentDate} is more than 6 years old to the date.`);
        isEligible = false;
      }
    }
    if (!this.settlementAttempts) {
      inEligibleMessages.push("Parties must attempt to resolve the dispute before filing. ");
      isEligible = false;
    }

    console.log("Eligibility check messages:", inEligibleMessages);

    return [isEligible, inEligibleMessages];
  }
}


export function isEligibleForSmallClaim(input: string): boolean {
//   // Define the criteria for small claim eligibility
//   const maxClaimAmount = 5000; // Example threshold for small claims
//   const claimAmount = parseFloat(input);

//   // Check if the input is a valid number and within the threshold
    console.log("Checking eligibility for small claim with input:", input);
    return true

}