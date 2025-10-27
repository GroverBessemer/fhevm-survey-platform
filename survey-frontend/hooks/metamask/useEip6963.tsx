"use client";

import { useState, useEffect } from "react";
import type { EIP6963ProviderDetail } from "./Eip6963Types";

export function useEip6963() {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);

  useEffect(() => {
    const providerMap = new Map<string, EIP6963ProviderDetail>();

    const handleAnnouncement = (event: any) => {
      const detail = event.detail as EIP6963ProviderDetail;
      
      if (detail?.info?.uuid && detail?.provider) {
        providerMap.set(detail.info.uuid, detail);
        setProviders(Array.from(providerMap.values()));
        console.log("[EIP6963] Provider announced:", detail.info.name);
      }
    };

    window.addEventListener("eip6963:announceProvider", handleAnnouncement);

    // Request providers
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener("eip6963:announceProvider", handleAnnouncement);
    };
  }, []);

  return providers;
}

