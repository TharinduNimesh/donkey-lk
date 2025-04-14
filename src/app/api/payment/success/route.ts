import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orderId = searchParams.get('order_id');
  
  // Redirect to task detail page if order_id is available
  if (orderId) {
    redirect(`/dashboard/task/${orderId}`);
  }
  
  // Otherwise redirect to tasks list
  redirect("/dashboard/buyer");
}