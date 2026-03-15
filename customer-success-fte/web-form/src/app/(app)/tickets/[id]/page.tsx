import { TicketViewer } from "@/components/organisms/TicketViewer";

interface Props {
  params: { id: string };
}

export default function TicketDetailPage({ params }: Props) {
  return (
    <div className="p-6 md:p-8">
      <TicketViewer ticketId={params.id} />
    </div>
  );
}
