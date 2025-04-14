import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orderId = searchParams.get('order_id');
  
  // Redirect to task detail page with cancelled status if order_id is available
  if (orderId) {
    redirect(`/dashboard/task/${orderId}?payment=cancelled`);
  }
  
  // Otherwise redirect to tasks list with cancelled status
  redirect("/dashboard/buyer?payment=cancelled");
}