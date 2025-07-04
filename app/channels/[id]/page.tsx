import ChatPage from "@/components/ChatPage"

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ChatPage variant="channel" id={id} />
}
