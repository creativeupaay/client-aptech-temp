import { env } from "../../env.config.js";
import type { ISmsProvider } from "./sms.interface.js";
import { MockSmsProvider } from "./providers/mock.sms.provider.js";

export class SmsFactory {
  private static instance: ISmsProvider | null = null;

  public static getProvider(): ISmsProvider {
    if (this.instance) {
      return this.instance;
    }

    switch (env.SMS_PROVIDER) {
      case "mock":
        this.instance = new MockSmsProvider();
        break;
      case "twilio":
        throw new Error("Twilio SMS provider is not yet implemented");
      case "gupshup":
        throw new Error("Gupshup SMS provider is not yet implemented");
      default:
        this.instance = new MockSmsProvider();
        break;
    }

    return this.instance;
  }

  public static setProvider(provider: ISmsProvider | null): void {
    this.instance = provider;
  }
}
