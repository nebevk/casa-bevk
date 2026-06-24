import type { Metadata } from "next";
import { getShoppingItems } from "@/lib/shopping/queries";
import { ShoppingView } from "@/components/shopping/shopping-view";

export const metadata: Metadata = { title: "Shopping" };

export default async function ShoppingPage() {
  const items = await getShoppingItems();
  return <ShoppingView items={items} />;
}
