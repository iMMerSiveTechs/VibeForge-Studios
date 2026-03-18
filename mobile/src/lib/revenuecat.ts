import Purchases, { type PurchasesOfferings, type PurchasesPackage, type CustomerInfo } from "react-native-purchases";
import { Platform } from "react-native";

let isInitialized = false;
let isConfigured = false;

/**
 * Initialize RevenueCat. Safe to call multiple times.
 */
export async function initRevenueCat(): Promise<boolean> {
  if (isInitialized) return isConfigured;
  isInitialized = true;

  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_KEY;
  if (!apiKey) {
    console.log("[RevenueCat] No EXPO_PUBLIC_REVENUECAT_KEY set, skipping init");
    return false;
  }

  try {
    Purchases.configure({ apiKey });
    isConfigured = true;
    console.log("[RevenueCat] Configured successfully");
    return true;
  } catch (err) {
    console.error("[RevenueCat] Failed to configure:", err);
    return false;
  }
}

export function isRevenueCatConfigured(): boolean {
  return isConfigured;
}

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!isConfigured) return null;
  try {
    return await Purchases.getOfferings();
  } catch (err) {
    console.error("[RevenueCat] getOfferings error:", err);
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  if (!isConfigured) return null;
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (err: any) {
    if (err.userCancelled) return null;
    throw err;
  }
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!isConfigured) return null;
  try {
    return await Purchases.restorePurchases();
  } catch (err) {
    console.error("[RevenueCat] restorePurchases error:", err);
    return null;
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isConfigured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (err) {
    console.error("[RevenueCat] getCustomerInfo error:", err);
    return null;
  }
}

/**
 * Map RevenueCat entitlements to plan name
 */
export function mapEntitlementsToPlan(info: CustomerInfo | null): "FREE" | "PRO" | "ENTERPRISE" {
  if (!info) return "FREE";
  const active = info.entitlements.active;
  if (active["enterprise"]?.isActive) return "ENTERPRISE";
  if (active["pro"]?.isActive) return "PRO";
  return "FREE";
}
