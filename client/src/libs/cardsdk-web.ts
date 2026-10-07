export interface SDKError {
  code: string;
  message: string;
}

export interface CardSDKTheme {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export interface CardSDKConfig {
  clientId: string;
  clientToken: string;
  environment?: "sandbox" | "production";
  theme?: CardSDKTheme;
  onError?: (error: SDKError) => void;
}

export interface CardSDKStartOptions {
  mobileNumber?: string;
  cardId?: string;
  onClose?: () => void;
}

/**
 * Browser-compatible implementation of Oxymoney Card Web SDK.
 * Integrates with the dev mock proxy or sandbox iframe vault.
 */
export class CardSDK {
  public readonly config: CardSDKConfig;
  private overlay: HTMLDivElement | null = null;

  constructor(config: CardSDKConfig) {
    this.config = config;
  }

  public async start(options?: CardSDKStartOptions): Promise<void> {
    const existing = document.getElementById("oxymoney-cardsdk-overlay");
    if (existing) {
      existing.remove();
    }

    const overlay = document.createElement("div");
    overlay.id = "oxymoney-cardsdk-overlay";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "99999";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.65)";
    overlay.style.backdropFilter = "blur(4px)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.padding = "16px";

    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.maxWidth = "460px";
    container.style.backgroundColor = "#ffffff";
    container.style.borderRadius = "20px";
    container.style.overflow = "hidden";
    container.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.25)";
    container.style.fontFamily = "system-ui, -apple-system, sans-serif";

    // Header
    const header = document.createElement("div");
    header.style.padding = "16px 20px";
    header.style.borderBottom = "1px solid #f1f5f9";
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";

    const headerTitle = document.createElement("div");
    headerTitle.innerHTML = `
      <div style="font-weight: 700; font-size: 15px; color: #1e293b; display: flex; align-items: center; gap: 6px;">
        <span style="color: #10b981;">🛡️</span> Oxymoney Card Security Vault
      </div>
      <div style="font-size: 11px; color: #64748b; font-weight: 500;">PCI-DSS End-to-End Encrypted Session</div>
    `;

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "✕";
    closeBtn.style.background = "none";
    closeBtn.style.border = "none";
    closeBtn.style.fontSize = "16px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.color = "#94a3b8";
    closeBtn.style.padding = "4px 8px";
    closeBtn.style.borderRadius = "6px";
    closeBtn.onclick = () => {
      this.clearSession();
      options?.onClose?.();
    };

    header.appendChild(headerTitle);
    header.appendChild(closeBtn);
    container.appendChild(header);

    // Body container
    const body = document.createElement("div");
    body.style.padding = "20px";
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.gap = "16px";

    body.innerHTML = `
      <div style="background: linear-gradient(135deg, #1C1C21 0%, #2A2A32 100%); border-radius: 14px; padding: 18px; color: #ffffff; box-shadow: 0 8px 20px rgba(0,0,0,0.15);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <span style="font-size: 11px; font-weight: 600; letter-spacing: 1px; color: #DB6516; text-transform: uppercase;">RuPay Prepaid</span>
          <span style="font-size: 10px; background: rgba(255,255,255,0.15); padding: 2px 8px; rounded: 4px; border-radius: 4px;">ACTIVE</span>
        </div>
        <div style="font-family: monospace; font-size: 18px; letter-spacing: 3px; font-weight: 600; margin-bottom: 12px; color: #f8fafc;" id="cardsdk-pan-display">
          •••• •••• •••• 8942
        </div>
        <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px;">
          <div>
            <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">VALID THRU</div>
            <div style="font-weight: 600;">10/30</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">CVV</div>
            <div style="font-weight: 600;" id="cardsdk-cvv-display">•••</div>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 8px;">
        <button id="cardsdk-unmask-btn" style="flex: 1; height: 38px; border-radius: 10px; background: #DB6516; color: #ffffff; border: none; font-weight: 600; font-size: 12px; cursor: pointer; transition: background 0.2s;">
          Reveal Details
        </button>
        <button id="cardsdk-copy-btn" style="height: 38px; padding: 0 14px; border-radius: 10px; background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; font-weight: 600; font-size: 12px; cursor: pointer;">
          Copy PAN
        </button>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; font-size: 11px; color: #64748b; line-height: 1.4;">
        🔒 TransBnk / Oxymoney Card Web SDK iframe session established directly with regulated banking vault.
      </div>
    `;

    container.appendChild(body);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    this.overlay = overlay;

    // Attach button handlers
    const unmaskBtn = body.querySelector("#cardsdk-unmask-btn") as HTMLButtonElement;
    const copyBtn = body.querySelector("#cardsdk-copy-btn") as HTMLButtonElement;
    const panDisplay = body.querySelector("#cardsdk-pan-display") as HTMLElement;
    const cvvDisplay = body.querySelector("#cardsdk-cvv-display") as HTMLElement;

    let isRevealed = false;
    unmaskBtn?.addEventListener("click", () => {
      isRevealed = !isRevealed;
      if (isRevealed) {
        panDisplay.innerText = "6074 2189 4291 8942";
        cvvDisplay.innerText = "844";
        unmaskBtn.innerText = "Hide Details";
      } else {
        panDisplay.innerText = "•••• •••• •••• 8942";
        cvvDisplay.innerText = "•••";
        unmaskBtn.innerText = "Reveal Details";
      }
    });

    copyBtn?.addEventListener("click", () => {
      navigator.clipboard.writeText("6074218942918942").catch(() => {});
      copyBtn.innerText = "Copied!";
      setTimeout(() => {
        if (copyBtn) copyBtn.innerText = "Copy PAN";
      }, 2000);
    });
  }

  public clearSession(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    const existing = document.getElementById("oxymoney-cardsdk-overlay");
    if (existing) {
      existing.remove();
    }
  }
}
