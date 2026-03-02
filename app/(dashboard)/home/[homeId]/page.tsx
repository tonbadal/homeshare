import { redirect } from "next/navigation";

export default async function HomeIndexPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  redirect(`/home/${homeId}/calendar`);
}
