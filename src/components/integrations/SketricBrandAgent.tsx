"use client";

import { useEffect } from "react";

/**
 * Loads the exact SketricGen Brand Agent embed code supplied through
 * NEXT_PUBLIC_SKETRIC_EMBED_CODE.
 *
 * The vendor embed is intentionally optional: if no code is configured,
 * this component renders nothing and does not affect the existing app.
 */
export default function SketricBrandAgent() {
  useEffect(() => {
    const embedCode = process.env.NEXT_PUBLIC_SKETRIC_EMBED_CODE?.trim();
    if (!embedCode) return;

    const mount = document.createElement("div");
    mount.dataset.mansaSketric = "true";
    document.body.appendChild(mount);

    const template = document.createElement("template");
    template.innerHTML = embedCode;

    const appended: Node[] = [];

    for (const node of Array.from(template.content.childNodes)) {
      if (node instanceof HTMLScriptElement) {
        const script = document.createElement("script");

        for (const attr of Array.from(node.attributes)) {
          script.setAttribute(attr.name, attr.value);
        }

        if (node.textContent) script.textContent = node.textContent;
        document.body.appendChild(script);
        appended.push(script);
      } else {
        const clone = node.cloneNode(true);
        mount.appendChild(clone);
      }
    }

    return () => {
      for (const node of appended) node.parentNode?.removeChild(node);
      mount.remove();
    };
  }, []);

  return null;
}
