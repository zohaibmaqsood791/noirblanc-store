import OrderConfirmation from "./OrderConfirmation";

interface PageProps {
  searchParams: Promise<{ order?: string; payment?: string; total?: string }>;
}

export default async function OrderSuccessPage({ searchParams }: PageProps) {
  const { order, payment, total } = await searchParams;
  return (
    <OrderConfirmation
      orderParam={order}
      paymentParam={payment}
      totalParam={total}
    />
  );
}
