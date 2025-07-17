import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/components/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface OrderItem {
  title: string;
  count: number;
  price: number | string;
  price_promo?: number | string;
  deliveryTime?: string;
}

export interface OrderData {
  customer_email: string;
  displayName?: string;
  deliveryInfo: {
    firstName: string;
    lastName: string;
    address: string;
    postalCode: string;
    contactNumber: string;
  };
  items: OrderItem[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { customer_email, displayName, deliveryInfo, items } = req.body as OrderData;

    if (!customer_email || !deliveryInfo || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const orderData = {
      customer_email,
      displayName: displayName || "Client",
      deliveryInfo,
      items,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "orders"), orderData);
    return res.status(200).json({
      message: "Order recorded successfully",
      orderId: docRef.id,
    });
  } catch (error: any) {
    console.error("Error recording order:", error);
    return res.status(500).json({ message: "Error recording order", error: error.message });
  }
}
