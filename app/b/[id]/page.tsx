import { notFound } from "next/navigation";
import { BoardView } from "@/components/BoardView";
import { getBoard, listQuestionsWithAgreements } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const board = await getBoard(id);
  if (!board) notFound();

  const questions = await listQuestionsWithAgreements(id);

  return (
    <BoardView
      initial={{
        board,
        questions,
        isAdmin: false,
      }}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const board = await getBoard(id);
  if (!board) return { title: "Board not found" };
  return {
    title: `${board.title} · CrowdSurvey`,
    description:
      board.description ?? "Add questions and see who agrees.",
  };
}
