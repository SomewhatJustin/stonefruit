import ChatPage from "@/components/ChatPage"

export default async function DmPage({
  params,
}: {
  params: Promise<{ uid: string }>
}) {
  const { uid } = await params
  return <ChatPage variant="dm" uid={uid} />
}
