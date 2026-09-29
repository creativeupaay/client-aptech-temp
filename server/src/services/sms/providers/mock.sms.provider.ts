import type { ISmsProvider } from "../sms.interface.js";

export class MockSmsProvider implements ISmsProvider {
  public readonly name = "mock";

  async sendOtp(mobile: string, otp: string): Promise<boolean> {
    console.log(`\n=================================================`);
    console.log(`[MOCK SMS SERVICE] Sending OTP to mobile: ${mobile}`);
    console.log(`[MOCK SMS SERVICE] Your TBX verification code is: ${otp}`);
    console.log(`=================================================\n`);
    return true;
  }
}
