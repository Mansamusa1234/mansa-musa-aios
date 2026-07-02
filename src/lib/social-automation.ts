/**
 * Social Media Automation
 * Auto-generates scripts, creates HeyGen videos, posts to Instagram/LinkedIn/TikTok/Twitter/Facebook/Threads/Pinterest
 */

import { createHmac } from "crypto";

export interface VideoScript {
  title: string;
  script: string;
  caption: string;
  hashtags: string[];
  platform: "instagram" | "linkedin" | "tiktok" | "youtube";
}
