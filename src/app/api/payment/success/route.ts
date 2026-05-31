import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orderId = searchParams.get('order_id');

  // BrandSync payment — redirect back to buyer dashboard with a success flag
  if (orderId?.startsWith('BRANDSYNC:')) {
    redirect("/dashboard/buyer?payment=success");
  }

  // Regular task payment — redirect to task detail page
  if (orderId) {
    redirect(`/dashboard/task/${orderId}`);
  }
  
  // Fallback
  redirect("/dashboard/buyer");
}