
import type { Timestamp } from "firebase/firestore";

// Base Menu Item
export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
};

// Item within an order, capturing details at the time of order
export type OrderItem = {
  id: string; // Unique ID for this line item in the order
  menuItemId: string;
  name: string;
  quantity: number;
  price: number; // Price per item at time of order
  paid: boolean;
};

// The main Order document
export type Order = {
  id: string;
  tableId: string;
  tableName: string;
  items: OrderItem[];
  status: 'open' | 'closed';
  total: number;
  amountPaid: number;
  createdAt: Timestamp;
  reservationId?: string;
  customerName?: string;
};

// Data for sales reports
export type SalesSummary = {
    totalSales: number;
    totalOrders: number;
    popularItems: { name: string; quantity: number }[];
};
