import { env } from "../../env.config.js";
import type { IProconnectService } from "./proconnect.interface.js";
import { MockProconnectProvider } from "./providers/mock.provider.js";
import { HttpProconnectProvider } from "./providers/http.provider.js";

export class ProconnectFactory {
  private static instance: IProconnectService | null = null;

  public static getProvider(): IProconnectService {
    if (this.instance) {
      return this.instance;
    }

    if (env.PROCONNECT_PROVIDER === "http") {
      this.instance = new HttpProconnectProvider();
    } else {
      this.instance = MockProconnectProvider.getInstance();
    }

    return this.instance;
  }

  public static setProvider(provider: IProconnectService | null): void {
    this.instance = provider;
  }

  public static reset(): void {
    this.instance = null;
  }
}
