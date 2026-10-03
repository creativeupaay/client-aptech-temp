import { env } from "../../env.config.js";
import type { ITransbankProvider } from "./transbank.interface.js";
import { HttpTransbankProvider } from "./providers/http.provider.js";
import { MockTransbankProvider } from "./providers/mock.provider.js";

export class TransbankFactory {
  private static instance: ITransbankProvider | null = null;

  public static getProvider(): ITransbankProvider {
    if (this.instance) {
      return this.instance;
    }

    if (env.TRANSBNK_PROVIDER === "mock" || process.env.NODE_ENV === "test") {
      this.instance = new MockTransbankProvider();
    } else {
      this.instance = new HttpTransbankProvider({
        baseUrl: env.TRANSBNK_BASE_URL,
        apiKey: env.TRANSBNK_API_KEY,
        clientId: env.TRANSBNK_CLIENT_ID,
        username: env.TRANSBNK_USERNAME,
        clientPassword: env.TRANSBNK_CLIENT_PASSWORD,
      });
    }

    return this.instance;
  }

  public static setProvider(provider: ITransbankProvider | null): void {
    this.instance = provider;
  }

  public static reset(): void {
    this.instance = null;
  }
}
