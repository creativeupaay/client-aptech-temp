export interface ISmsProvider {
  readonly name: string;
  sendOtp(mobile: string, otp: string): Promise<boolean>;
}
