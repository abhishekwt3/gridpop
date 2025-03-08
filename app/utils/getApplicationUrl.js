import fs from "fs";
import path from "path";
import toml from "@iarna/toml";

export function getApplicationUrl() {
  try {
    // ✅ Read shopify.app.toml from the root directory
    const configPath = path.resolve(process.cwd(), "shopify.app.toml");
    const configFile = fs.readFileSync(configPath, "utf-8");

    // ✅ Parse TOML file
    const config = toml.parse(configFile);

    // ✅ Return application_url
    return config.application_url || "";
  } catch (error) {
    console.error("❌ [ERROR] Failed to read application_url from shopify.app.toml:", error);
    return "";
  }
}
