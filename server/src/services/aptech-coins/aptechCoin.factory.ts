import { env } from "../../env.config.js";
import type { IAptechCoinService } from "./aptechCoin.interface.js";
import { HttpAptechCoinProvider } from "./providers/http.provider.js";
import { MockAptechCoinProvider } from "./providers/mock.provider.js";

export class AptechCoinFactory {
  private static instance: IAptechCoinService | null = null;

  public static getProvider(): IAptechCoinService {
    if (this.instance) {
      return this.instance;
    }

    if (env.APTECH_COIN_PROVIDER === "mock" || process.env.NODE_ENV === "test") {
      this.instance = MockAptechCoinProvider.getInstance();
    } else {
      this.instance = new HttpAptechCoinProvider();
    }

    return this.instance;
  }

  public static setProvider(provider: IAptechCoinService | null): void {
    this.instance = provider;
  }

  public static reset(): void {
    this.instance = null;
  }
}
