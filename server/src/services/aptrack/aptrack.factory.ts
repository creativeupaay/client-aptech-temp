import type { IAptrackService } from "./aptrack.interface.js";
import { MockAptrackProvider } from "./providers/mock.provider.js";
import { HttpAptrackProvider } from "./providers/http.provider.js";
import { env } from "../../env.config.js";

export class AptrackFactory {
  private static instance: IAptrackService;

  public static getProvider(): IAptrackService {
    if (!AptrackFactory.instance) {
      const providerType = (env as unknown as { APTRACK_PROVIDER?: string }).APTRACK_PROVIDER || "mock";
      if (providerType === "http") {
        AptrackFactory.instance = new HttpAptrackProvider();
      } else {
        AptrackFactory.instance = MockAptrackProvider.getInstance();
      }
    }
    return AptrackFactory.instance;
  }

  public static setProvider(provider: IAptrackService): void {
    AptrackFactory.instance = provider;
  }
}
